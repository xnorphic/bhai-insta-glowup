import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionnaireData, userId } = await req.json();
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Format questionnaire data for the prompt
    const formattedQuestions = Object.entries(questionnaireData)
      .map(([key, value]) => {
        const readableKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `${readableKey}: ${value}`;
      })
      .join('\n\n');

    const systemPrompt = `You are an expert copywriter for a top internet company. Use the questions and answers in the questionnaire to create a detailed brand book. 

The brand book should be comprehensive and include the following sections:
1. Brand Overview & Mission
2. Brand Values & Personality
3. Tonality & Voice Guidelines
4. Strategy Pillars
5. Target Audience & Demographics
6. Content Strategy & IPs
7. Do's and Don'ts
8. Competitive Positioning
9. Content Guidelines
10. Brand Application Guidelines

Format the response as a well-structured, professional brand book that can be used to guide all future content creation and brand communications.`;

    const userPrompt = `Based on the following questionnaire responses, create a comprehensive brand book:

${formattedQuestions}

Please create a detailed, actionable brand book that covers all aspects of brand communication, content strategy, and brand application.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedBrandBook = data.choices[0].message.content;

    // Get the next version number for this user
    const { data: existingBooks } = await supabase
      .from('brand_books')
      .select('version')
      .eq('user_id', userId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingBooks?.[0]?.version || 0) + 1;

    // Save to database
    const { data: brandBookData, error: dbError } = await supabase
      .from('brand_books')
      .insert({
        user_id: userId,
        original_filename: `Generated Brand Book v${nextVersion}`,
        file_url: `generated/${userId}/${Date.now()}_brandbook.md`,
        uploaded_by_username: 'AI Generated',
        version: nextVersion,
        posts_scanned_for_playbook: 0,
        ai_generated_playbook: generatedBrandBook,
        what_we_do: questionnaireData.whatWeDo,
        tonality: questionnaireData.tonality,
        strategy_pillars: questionnaireData.strategyPillars,
        content_ips: questionnaireData.contentIPs,
        what_not_to_do: questionnaireData.whatNotToDo,
        customer_personas: questionnaireData.audienceDemographics,
        aspiration_market: questionnaireData.aspirationMarket,
        is_analysis_complete: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Brand book generated successfully for user:', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      brandBook: generatedBrandBook,
      brandBookId: brandBookData.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-brandbook function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate brand book' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});