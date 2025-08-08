import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CSVImportRequest {
  file: string; // Base64 encoded CSV content
  filename: string;
  profile_id?: string; // Optional for multi-profile uploads
  field_mapping: Record<string, string>;
  import_settings?: {
    skip_header: boolean;
    delimiter: string;
    update_existing: boolean;
    multi_profile?: boolean; // Flag to indicate multi-profile upload
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestData: CSVImportRequest = await req.json();
    
    console.log('Starting CSV import for user:', user.id);
    console.log('File:', requestData.filename);
    console.log('Profile ID:', requestData.profile_id);

    // For single profile mode, verify user owns the profile
    if (requestData.profile_id && !requestData.import_settings?.multi_profile) {
      const { data: profile, error: profileError } = await supabase
        .from('instagram_profiles')
        .select('id, username')
        .eq('profile_id', requestData.profile_id)
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Profile verification error:', profileError);
        return new Response(
          JSON.stringify({ error: 'Profile not found or access denied' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Decode and parse CSV
    const csvContent = atob(requestData.file);
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty CSV file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const settings = {
      skip_header: true,
      delimiter: ',',
      update_existing: true,
      ...requestData.import_settings
    };

    // Parse CSV headers
    const headerLine = lines[0];
    const headers = headerLine.split(settings.delimiter).map(h => h.trim().replace(/"/g, ''));
    
    // Validate required fields are mapped for new CSV structure
    const requiredFields = ['post_url', 'post_date', 'post_type', 'caption'];
    const mappedFields = Object.keys(requestData.field_mapping);
    const missingRequired = requiredFields.filter(field => 
      !mappedFields.some(mapped => requestData.field_mapping[mapped] === field)
    );

    if (missingRequired.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field mappings', 
          missing_fields: missingRequired 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('instagram_csv_imports')
      .insert({
        user_id: user.id,
        filename: requestData.filename,
        file_size: csvContent.length,
        total_rows: settings.skip_header ? lines.length - 1 : lines.length,
        field_mapping: requestData.field_mapping,
        import_settings: settings
      })
      .select()
      .single();

    if (importError) {
      console.error('Import record creation error:', importError);
      return new Response(
        JSON.stringify({ error: 'Failed to create import record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created import record:', importRecord.id);

    // Parse and validate CSV data
    const dataLines = settings.skip_header ? lines.slice(1) : lines;
    const validationErrors: any[] = [];
    const stagingData: any[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const values = line.split(settings.delimiter).map(v => v.trim().replace(/"/g, ''));
      
      if (values.length !== headers.length) {
        validationErrors.push({
          row: i + (settings.skip_header ? 2 : 1),
          error: `Column count mismatch. Expected ${headers.length}, got ${values.length}`
        });
        continue;
      }

      // Create row object
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        const mappedField = requestData.field_mapping[header];
        if (mappedField && mappedField !== 'skip') {
          rowData[mappedField] = values[index];
        }
      });

      // For multi-profile uploads, determine the profile_id for this row
      let currentProfileId = requestData.profile_id;
      let hasErrors = false;
      
      if (requestData.import_settings?.multi_profile) {
        if (rowData.profile_id) {
          currentProfileId = rowData.profile_id;
        } else if (rowData.username) {
          // Look up profile_id by username for user's profiles
          const { data: userProfiles } = await supabase
            .from('instagram_profiles')
            .select('profile_id, username')
            .eq('user_id', user.id)
            .eq('username', rowData.username);
          
          if (userProfiles && userProfiles.length > 0) {
            currentProfileId = userProfiles[0].profile_id;
          } else {
            validationErrors.push({
              row: i + (settings.skip_header ? 2 : 1),
              field: 'username',
              error: `Username '${rowData.username}' not found in connected profiles`
            });
            hasErrors = true;
          }
        } else {
          validationErrors.push({
            row: i + (settings.skip_header ? 2 : 1),
            error: 'Missing profile identification (profile_id or username required for multi-profile CSV)'
          });
          hasErrors = true;
        }
      }

      // Add the determined profile_id to row data
      if (currentProfileId) {
        rowData.target_profile_id = currentProfileId;
      }

      // Validate required fields
      for (const required of requiredFields) {
        if (!rowData[required] || rowData[required].trim() === '') {
          validationErrors.push({
            row: i + (settings.skip_header ? 2 : 1),
            field: required,
            error: `Required field is empty`
          });
          hasErrors = true;
        }
      }

      // Validate post_date format
      if (rowData.post_date && !hasErrors) {
        try {
          // Try multiple date formats
          const dateStr = rowData.post_date.trim();
          let parsedDate;
          
          // Check if it's in YYYY-MM-DD format
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            parsedDate = new Date(dateStr + 'T00:00:00Z');
          } else {
            parsedDate = new Date(dateStr);
          }
          
          if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch {
          validationErrors.push({
            row: i + (settings.skip_header ? 2 : 1),
            field: 'post_date',
            error: 'Invalid date format (expected YYYY-MM-DD or ISO format)'
          });
          hasErrors = true;
        }
      }

      // Validate numeric fields
      const numericFields = ['likes', 'comments', 'shares', 'saves', 'views', 'reach', 'impressions', 'follower_count'];
      for (const field of numericFields) {
        if (rowData[field] && rowData[field].trim() !== '') {
          const value = rowData[field].replace(/,/g, ''); // Remove commas
          if (isNaN(Number(value))) {
            validationErrors.push({
              row: i + (settings.skip_header ? 2 : 1),
              field: field,
              error: `Invalid numeric value: ${rowData[field]}`
            });
            hasErrors = true;
          }
        }
      }

      // Validate engagement_rate if present
      if (rowData.engagement_rate && rowData.engagement_rate.trim() !== '') {
        const value = rowData.engagement_rate.replace(/%/g, ''); // Remove % sign
        if (isNaN(Number(value))) {
          validationErrors.push({
            row: i + (settings.skip_header ? 2 : 1),
            field: 'engagement_rate',
            error: `Invalid engagement rate: ${rowData.engagement_rate}`
          });
          hasErrors = true;
        }
      }

      // Validate post_url format
      if (rowData.post_url && !hasErrors) {
        try {
          new URL(rowData.post_url);
          // Check if it's an Instagram URL
          if (!rowData.post_url.includes('instagram.com')) {
            validationErrors.push({
              row: i + (settings.skip_header ? 2 : 1),
              field: 'post_url',
              error: 'URL must be an Instagram URL'
            });
            hasErrors = true;
          }
        } catch {
          validationErrors.push({
            row: i + (settings.skip_header ? 2 : 1),
            field: 'post_url',
            error: 'Invalid URL format'
          });
          hasErrors = true;
        }
      }

      if (!hasErrors) {
        stagingData.push({
          import_id: importRecord.id,
          row_number: i + (settings.skip_header ? 2 : 1),
          raw_data: rowData
        });
      }
    }

    console.log(`Validated ${dataLines.length} rows, ${validationErrors.length} errors, ${stagingData.length} valid`);

    // Insert staging data in batches
    if (stagingData.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < stagingData.length; i += batchSize) {
        const batch = stagingData.slice(i, i + batchSize);
        const { error: stagingError } = await supabase
          .from('instagram_csv_staging')
          .insert(batch);

        if (stagingError) {
          console.error('Staging insert error:', stagingError);
          // Continue with other batches
        }
      }
    }

    // Update import record with validation results
    await supabase
      .from('instagram_csv_imports')
      .update({
        validation_errors: validationErrors,
        status: validationErrors.length > 0 ? 'validation_failed' : 'validated'
      })
      .eq('id', importRecord.id);

    // If validation passed, start processing
    if (validationErrors.length === 0 && stagingData.length > 0) {
      // For multi-profile uploads, we don't specify a single profile_id
      const targetProfileId = requestData.import_settings?.multi_profile ? null : requestData.profile_id;
      EdgeRuntime.waitUntil(processImportData(supabase, importRecord.id, targetProfileId));
    }

    return new Response(
      JSON.stringify({
        import_id: importRecord.id,
        total_rows: dataLines.length,
        valid_rows: stagingData.length,
        validation_errors: validationErrors,
        status: validationErrors.length > 0 ? 'validation_failed' : 'processing'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('CSV import error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processImportData(supabase: any, importId: string, profileId: string | null) {
  try {
    console.log('Starting data transformation for import:', importId);
    
    // Call the transformation function
    const { data: result, error } = await supabase.rpc('transform_csv_to_instagram_media', {
      import_id_param: importId,
      profile_id_param: profileId // Can be null for multi-profile uploads
    });

    if (error) {
      console.error('Transformation error:', error);
      await supabase
        .from('instagram_csv_imports')
        .update({
          status: 'failed',
          processing_errors: [{ error: error.message }],
          completed_at: new Date().toISOString()
        })
        .eq('id', importId);
      return;
    }

    console.log('Transformation result:', result);

    // Update import record with final results
    await supabase
      .from('instagram_csv_imports')
      .update({
        status: 'completed',
        processed_rows: result.processed || 0,
        successful_rows: result.successful || 0,
        failed_rows: result.failed || 0,
        processing_errors: result.errors || [],
        completed_at: new Date().toISOString()
      })
      .eq('id', importId);

    console.log('Import processing completed:', importId);

  } catch (error) {
    console.error('Processing error:', error);
    await supabase
      .from('instagram_csv_imports')
      .update({
        status: 'failed',
        processing_errors: [{ error: error.message }],
        completed_at: new Date().toISOString()
      })
      .eq('id', importId);
  }
}