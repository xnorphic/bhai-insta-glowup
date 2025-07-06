
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyze brandbook function started');
    
    const { brandBookId, extractedText } = await req.json();
    console.log('Request data:', { brandBookId, extractedTextPreview: extractedText?.substring(0, 100) });

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
    You are a brand strategy expert. Analyze the following brand book content and extract key information. 
    
    IMPORTANT: You MUST respond with valid JSON only. Do not include any explanations, markdown, or other text outside the JSON structure.
    
    Required JSON structure:
    {
      "what_we_do": "Brief description of what the company does",
      "strategy_pillars": "Main strategic pillars or values",
      "brand_colors_fonts": "Brand colors and fonts information",
      "addressed_market": "Current target market",
      "aspiration_market": "Aspirational or future target market",
      "content_ips": "Content intellectual properties or themes",
      "tonality": "Brand voice and tonality",
      "what_not_to_do": "Brand guidelines on what to avoid",
      "customer_personas": "Target customer personas",
      "customer_strengths": "Customer strengths and positive attributes",
      "customer_weaknesses": "Customer pain points or weaknesses",
      "missing_information": ["Array of missing information that would be helpful"],
      "ai_generated_playbook": "A comprehensive content strategy playbook based on the brand analysis"
    }

    Brand book content:
    ${extractedText}
    `;

    console.log('Making OpenAI API request');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a brand strategy expert. Always respond with valid JSON only, no explanations or markdown.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    const analysisResult = data.choices[0].message.content;
    console.log('AI response preview:', analysisResult?.substring(0, 200));

    // Parse the JSON response with better error handling
    let parsedAnalysis;
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = analysisResult.trim();
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
      
      parsedAnalysis = JSON.parse(jsonString);
      console.log('Successfully parsed AI response');
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', analysisResult);
      console.error('Parse error:', parseError);
      
      // Fallback: create a basic analysis structure
      parsedAnalysis = {
        what_we_do: "Analysis could not be completed due to parsing error",
        strategy_pillars: "Please re-upload the brand book for analysis",
        brand_colors_fonts: "Not available",
        addressed_market: "Not available",
        aspiration_market: "Not available",
        content_ips: "Not available",
        tonality: "Not available",
        what_not_to_do: "Not available",
        customer_personas: "Not available",
        customer_strengths: "Not available",
        customer_weaknesses: "Not available",
        missing_information: ["Complete brand book analysis due to parsing error"],
        ai_generated_playbook: "Analysis incomplete. Please try re-uploading your brand book."
      };
    }

    // Update the brand book in the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Updating database with analysis results');
    const { error: updateError } = await supabase
      .from('brand_books')
      .update({
        what_we_do: parsedAnalysis.what_we_do,
        strategy_pillars: parsedAnalysis.strategy_pillars,
        brand_colors_fonts: parsedAnalysis.brand_colors_fonts,
        addressed_market: parsedAnalysis.addressed_market,
        aspiration_market: parsedAnalysis.aspiration_market,
        content_ips: parsedAnalysis.content_ips,
        tonality: parsedAnalysis.tonality,
        what_not_to_do: parsedAnalysis.what_not_to_do,
        customer_personas: parsedAnalysis.customer_personas,
        customer_strengths: parsedAnalysis.customer_strengths,
        customer_weaknesses: parsedAnalysis.customer_weaknesses,
        missing_information: parsedAnalysis.missing_information,
        ai_generated_playbook: parsedAnalysis.ai_generated_playbook,
        is_analysis_complete: true
      })
      .eq('id', brandBookId);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    console.log('Analysis completed successfully');
    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-brandbook function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
