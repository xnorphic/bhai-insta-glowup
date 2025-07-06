
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
    const { brandBookId, extractedText } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `
    Analyze the following brand book content and extract key information. Please provide a JSON response with the following structure:
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
            content: 'You are a brand strategy expert. Analyze brand books and extract structured information. Always respond with valid JSON only.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = data.choices[0].message.content;

    // Parse the JSON response
    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysisResult);
    } catch (error) {
      console.error('Failed to parse AI response as JSON:', analysisResult);
      throw new Error('Invalid AI response format');
    }

    // Update the brand book in the database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, analysis: parsedAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-brandbook function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
