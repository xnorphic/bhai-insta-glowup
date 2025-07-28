import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.map(header => `"${header}"`).join(','));
  
  // Add data rows
  data.forEach(obj => {
    const row = headers.map(header => {
      let value = obj[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (Array.isArray(value)) {
        value = value.join('; ');
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      
      // Escape quotes and wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { export_type, profile_ids, date_range } = await req.json();

    if (!export_type) {
      return new Response(
        JSON.stringify({ error: 'Missing export_type parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let csvData = '';
    let filename = '';

    switch (export_type) {
      case 'content':
        // Export Instagram content data
        let contentQuery = supabase
          .from('instagram_content')
          .select(`
            *,
            instagram_connections!inner(username, user_id)
          `)
          .eq('instagram_connections.user_id', user.id);

        // Apply filters
        if (profile_ids && profile_ids.length > 0) {
          contentQuery = contentQuery.in('tracked_profile_id', profile_ids);
        }

        if (date_range?.start) {
          contentQuery = contentQuery.gte('post_date', date_range.start);
        }

        if (date_range?.end) {
          contentQuery = contentQuery.lte('post_date', date_range.end);
        }

        const { data: contentData, error: contentError } = await contentQuery
          .order('post_date', { ascending: false });

        if (contentError) {
          throw contentError;
        }

        // Flatten the data for CSV export
        const flattenedContent = contentData.map(item => ({
          ...item,
          profile_username: item.instagram_connections?.username,
          // Remove nested objects
          instagram_connections: undefined
        }));

        csvData = arrayToCSV(flattenedContent);
        filename = `instagram_content_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'profiles':
        // Export Instagram profile connections
        const { data: profileData, error: profileError } = await supabase
          .from('instagram_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (profileError) {
          throw profileError;
        }

        csvData = arrayToCSV(profileData);
        filename = `instagram_profiles_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'sync_logs':
        // Export sync logs for user's profiles
        const { data: userProfiles } = await supabase
          .from('instagram_connections')
          .select('username')
          .eq('user_id', user.id);

        if (userProfiles && userProfiles.length > 0) {
          const profileUsernames = userProfiles.map(p => p.username);
          
          const { data: syncData, error: syncError } = await supabase
            .from('instagram_sync_logs')
            .select('*')
            .in('profile_id', profileUsernames)
            .order('created_at', { ascending: false });

          if (syncError) {
            throw syncError;
          }

          csvData = arrayToCSV(syncData || []);
        } else {
          csvData = '';
        }
        
        filename = `instagram_sync_logs_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid export_type. Use: content, profiles, or sync_logs' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Return CSV file
    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Export failed',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});