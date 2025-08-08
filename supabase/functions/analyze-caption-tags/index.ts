import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CaptionAnalysisRequest {
  caption: string;
  existing_tags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { caption, existing_tags = [] }: CaptionAnalysisRequest = await req.json();

    if (!caption || caption.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Caption is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing caption:', caption.substring(0, 100) + '...');

    // Analyze caption with OpenAI
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
            content: `You are an expert Instagram content analyzer. Your task is to analyze Instagram captions and extract relevant tags for content categorization and insights.

Extract tags in these categories:
1. Content Theme (e.g., lifestyle, business, education, entertainment)
2. Industry/Niche (e.g., fashion, tech, food, fitness)
3. Post Purpose (e.g., promotional, educational, engaging, behind-the-scenes)
4. Tone/Mood (e.g., inspirational, humorous, professional, casual)
5. Target Audience (e.g., professionals, millennials, parents, entrepreneurs)
6. Product/Service mentions (if any)
7. Key Topics/Subjects mentioned

Return ONLY a JSON object with this structure:
{
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 0.95,
  "analysis": "Brief explanation of why these tags were chosen"
}

Keep tags concise (1-3 words), relevant, and specific. Aim for 5-15 tags total.`
          },
          {
            role: 'user',
            content: `Analyze this Instagram caption and extract relevant tags:

Caption: "${caption}"

${existing_tags.length > 0 ? `Existing tags: ${existing_tags.join(', ')}` : ''}

Please provide new and relevant tags based on the content analysis.`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback: extract tags from content if JSON parsing fails
      const tags = content.match(/["']([^"']+)["']/g)?.map((tag: string) => tag.replace(/["']/g, '')) || [];
      analysisResult = {
        tags: tags.slice(0, 10),
        confidence: 0.7,
        analysis: 'Extracted tags from response text'
      };
    }

    // Ensure we have valid tags array
    if (!Array.isArray(analysisResult.tags)) {
      analysisResult.tags = [];
    }

    // Clean and deduplicate tags
    const cleanTags = analysisResult.tags
      .filter((tag: string) => tag && typeof tag === 'string')
      .map((tag: string) => tag.toLowerCase().trim())
      .filter((tag: string) => tag.length > 0 && tag.length < 50)
      .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, 15); // Limit to 15 tags

    console.log('Generated tags:', cleanTags);

    return new Response(
      JSON.stringify({
        tags: cleanTags,
        confidence: analysisResult.confidence || 0.8,
        analysis: analysisResult.analysis || 'Tags generated based on caption analysis',
        original_caption: caption
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Caption analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze caption',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});