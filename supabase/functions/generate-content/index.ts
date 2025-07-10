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

interface ContentGenerationRequest {
  platform: string;
  contentType: string;
  theme: string;
  tone: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, contentType, theme, tone, userId }: ContentGenerationRequest = await req.json();

    // Create Supabase client to fetch brand book data
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let brandBookContext = "";
    if (userId) {
      // Fetch the latest brand book for the user
      const { data: brandBooks } = await supabase
        .from('brand_books')
        .select('ai_generated_playbook, tonality, strategy_pillars, what_we_do, what_not_to_do, content_ips')
        .eq('user_id', userId)
        .eq('is_analysis_complete', true)
        .order('upload_timestamp', { ascending: false })
        .limit(1);

      if (brandBooks && brandBooks.length > 0) {
        const brandBook = brandBooks[0];
        brandBookContext = `
Brand Guidelines:
- What We Do: ${brandBook.what_we_do || 'Not specified'}
- Tonality: ${brandBook.tonality || 'Professional yet approachable'}
- Strategy Pillars: ${brandBook.strategy_pillars || 'Not specified'}
- Content IPs: ${brandBook.content_ips || 'Not specified'}
- What Not To Do: ${brandBook.what_not_to_do || 'Not specified'}

${brandBook.ai_generated_playbook ? `Brand Book Context: ${brandBook.ai_generated_playbook.substring(0, 1000)}...` : ''}
        `;
      }
    }

    const systemPrompt = `You are an experienced Social Media Marketer in India. Create 2-3 versions of engagement-led content based on the brand guidelines provided. 

${brandBookContext ? `IMPORTANT: Follow these brand guidelines strictly:
${brandBookContext}

Ensure all content aligns with the brand's tonality, strategy pillars, and content IPs. Avoid anything mentioned in "What Not To Do".` : 'Generate quirky and funny content mostly around office circumstances like appraisals, office politics, office friendships, boss-employee relationship, long working hours in India etc.'}

Create content that explains why your suggestions will work by clearly stating what is the target group and the intended feeling it will generate.`;

    const userPrompt = `Create content for ${platform} - ${contentType} with theme: "${theme}" and tone: "${tone}". 

    Please provide 2-3 content options in the following JSON format:
    {
      "options": [
        {
          "id": "1",
          "mainTheme": "Main theme title",
          "caption": "Full caption with hooks and engagement elements",
          "imagePrompt": "Detailed image prompt (minimum 100 words) focusing on composition, lighting, background, focus, color scheme, mood, camera angle, visual elements, setting details, character positioning, props, atmosphere, visual style, and brand elements",
          "reasoning": "Why this will work and target audience",
          "targetGroup": "Specific target audience",
          "intendedFeeling": "Emotion this content aims to generate",
          ${contentType === 'carousel' ? '"carouselSlides": [{"slideNumber": 1, "imageGuideline": "Slide 1 image description", "textGuideline": "Slide 1 text content"}, {"slideNumber": 2, "imageGuideline": "Slide 2 image description", "textGuideline": "Slide 2 text content"}, {"slideNumber": 3, "imageGuideline": "Slide 3 image description", "textGuideline": "Slide 3 text content"}],' : ''}
        }
      ]
    }`;

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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    // Try to parse JSON, fallback to mock data if parsing fails
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback to enhanced mock data
      parsedContent = {
        options: [
          {
            id: "1",
            mainTheme: "Career Growth & Appraisal Season",
            caption: "🎯 POV: It's appraisal season and you're updating your resume while sitting in office WiFi 😂 We've all been there! But here's the thing - while you're plotting your next move, make sure you're plotting it RIGHT! 💼✨ Naukri.com has 10M+ opportunities waiting for you. Stop dreaming, start applying! #AppraisalSeason #CareerGrowth #NaukriLife #OfficeStruggles",
            imagePrompt: "Create a vibrant, professionally composed image showcasing a young Indian professional (25-30 years) sitting at a modern office desk with warm, natural lighting streaming through large windows. The composition should be shot from a slightly elevated angle, focusing on the person's concentrated expression as they work on a laptop displaying job listings. The background should feature a contemporary Indian office environment with subtle orange and blue brand elements (Naukri colors) integrated naturally. Include props like a coffee cup, notepad, and smartphone displaying notifications. The lighting should be bright and optimistic with soft shadows, creating a sense of hope and opportunity. The visual style should be clean, modern, and aspirational, with depth of field highlighting the main subject while keeping office colleagues slightly blurred in the background. Color palette should emphasize warm oranges, professional blues, and clean whites to convey trust and energy.",
            reasoning: "Targets working professionals during appraisal season when job switching is highest",
            targetGroup: "Working professionals aged 25-35 in corporate jobs",
            intendedFeeling: "Relatability and motivation to take action"
          },
          {
            id: "2",
            mainTheme: "Office Politics & Survival Guide",
            caption: "📚 Chapter 1 of 'How to Survive Office Politics' 101: When your manager says 'We need to talk' 😅 Plot twist - maybe it's time for a new chapter entirely? 🔄 Life's too short for toxic workplaces. Find your happy workspace at Naukri.com! 🌟 #OfficePolitics #WorkplaceWellness #NewBeginnings #ToxicWorkplace",
            imagePrompt: "Design a cinematic, wide-angle shot of a modern Indian office setting with dramatic but professional lighting. The main focus should be on a meeting room with glass walls, where we can see silhouettes of people in discussion. The composition should use leading lines created by office corridors and furniture to draw attention to the central meeting room. Incorporate subtle storytelling elements like worried expressions visible through the glass, while maintaining a professional aesthetic. The lighting should create interesting shadows and highlights, suggesting both tension and opportunity. Background should include typical Indian office elements like motivational posters, team photos, and modern furniture. Use a color scheme that balances professional grays and whites with pops of Naukri's orange brand color appearing naturally in office decor. The visual style should be slightly dramatic but not overly dark, conveying the stress of office politics while hinting at brighter opportunities ahead. Camera angle should be at eye level to create connection with viewers.",
            reasoning: "Addresses universal office experiences that create emotional connection",
            targetGroup: "Mid-level professionals experiencing workplace stress",
            intendedFeeling: "Relief and empowerment to make a change"
          }
        ]
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});