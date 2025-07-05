
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StarAPIUserData {
  username: string;
  full_name: string;
  biography: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  profile_picture_url: string;
  is_business_account: boolean;
  account_type: string;
}

interface StarAPIMediaData {
  id: string;
  permalink: string;
  media_type: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  play_count?: number;
  impressions_count?: number;
  reach?: number;
  shares_count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader?.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, username } = await req.json()
    const starApiKey = '55325f396cmsh1812ff7f2016376p1079d8jsn5ef3a673c06c'

    console.log(`Processing ${action} for username: ${username}`)

    if (action === 'connect_profile') {
      // Fetch user data from StarAPI
      const userResponse = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`, {
        headers: {
          'X-RapidAPI-Key': starApiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      })

      if (!userResponse.ok) {
        throw new Error(`Failed to fetch user data: ${userResponse.statusText}`)
      }

      const userData: StarAPIUserData = await userResponse.json()
      console.log('User data fetched:', userData)

      // Store connection in database
      const { data: connection, error } = await supabaseClient
        .from('instagram_connections')
        .insert({
          user_id: user.id,
          instagram_user_id: userData.username,
          username: userData.username,
          access_token: 'starapi_token',
          profile_picture_url: userData.profile_picture_url,
          follower_count: userData.follower_count,
          following_count: userData.following_count,
          media_count: userData.media_count,
          is_business_account: userData.is_business_account,
          account_type: userData.account_type || 'personal'
        })
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      return new Response(JSON.stringify({ success: true, connection }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'sync_content') {
      // Fetch media from StarAPI
      const mediaResponse = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=${username}`, {
        headers: {
          'X-RapidAPI-Key': starApiKey,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
        }
      })

      if (!mediaResponse.ok) {
        throw new Error(`Failed to fetch media data: ${mediaResponse.statusText}`)
      }

      const mediaData = await mediaResponse.json()
      console.log('Media data fetched:', mediaData.data?.length || 0, 'posts')

      const contentItems = []
      
      for (const media of (mediaData.data || []).slice(0, 50)) { // Limit to 50 recent posts
        const contentItem = {
          tracked_profile_id: username,
          instagram_media_id: media.id,
          content_link: media.permalink,
          content_type: media.media_type?.toLowerCase() === 'video' ? 'reel' : 
                       media.media_type?.toLowerCase() === 'carousel_album' ? 'carousel' : 'post',
          caption: media.caption?.substring(0, 2000) || null, // Limit caption length
          thumbnail_url: media.thumbnail_url || media.media_url,
          post_date: new Date(media.timestamp).toISOString(),
          total_likes: media.like_count || 0,
          total_comments: media.comments_count || 0,
          total_views: media.play_count || media.impressions_count || 0,
          total_shares: media.shares_count || 0,
          last_refreshed_at: new Date().toISOString()
        }
        contentItems.push(contentItem)
      }

      // Batch insert content
      const { data: insertedContent, error: contentError } = await supabaseClient
        .from('instagram_content')
        .upsert(contentItems, { 
          onConflict: 'instagram_media_id',
          ignoreDuplicates: false 
        })
        .select()

      if (contentError) {
        console.error('Content insert error:', contentError)
        throw contentError
      }

      console.log('Inserted/updated content items:', insertedContent?.length || 0)

      return new Response(JSON.stringify({ 
        success: true, 
        synced_posts: insertedContent?.length || 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
