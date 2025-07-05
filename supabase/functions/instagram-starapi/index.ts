
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
    
    if (!token) {
      console.error('No authorization token provided')
      return new Response(JSON.stringify({ error: 'No authorization token provided' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      console.error('User authentication failed')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, username } = await req.json()
    
    if (!action || !username) {
      console.error('Missing required parameters:', { action, username })
      return new Response(JSON.stringify({ error: 'Missing required parameters: action and username' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const starApiKey = '55325f396cmsh1812ff7f2016376p1079d8jsn5ef3a673c06c'
    console.log(`Processing ${action} for username: ${username}`)

    if (action === 'connect_profile') {
      try {
        // Fetch user data from StarAPI
        console.log('Fetching user data from StarAPI...')
        const userResponse = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${username}`, {
          headers: {
            'X-RapidAPI-Key': starApiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
          }
        })

        console.log('StarAPI user response status:', userResponse.status)
        console.log('StarAPI user response headers:', JSON.stringify(Object.fromEntries(userResponse.headers.entries())))
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error('StarAPI user fetch failed:', userResponse.status, errorText)
          
          // Check for specific API subscription errors
          if (userResponse.status === 403) {
            const errorData = JSON.parse(errorText)
            if (errorData.message?.includes('not subscribed')) {
              return new Response(JSON.stringify({ 
                error: 'API Key Issue: Your StarAPI subscription may have expired or doesn\'t include access to this endpoint. Please check your RapidAPI dashboard.',
                details: errorText,
                suggestion: 'Verify your StarAPI subscription status at https://rapidapi.com/hub'
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }
          }
          
          if (userResponse.status === 429) {
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait a moment before trying again.',
              details: errorText
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ 
            error: `Failed to fetch Instagram profile data. Status: ${userResponse.status}`,
            details: errorText,
            suggestion: userResponse.status === 404 ? 'Profile not found. Please check the username.' : 'Please try again later.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const userData = await userResponse.json()
        console.log('User data received:', JSON.stringify(userData, null, 2))

        // Check if the response contains valid user data
        if (!userData || !userData.username) {
          console.error('Invalid user data received:', userData)
          return new Response(JSON.stringify({ 
            error: 'Invalid profile data received. The username may not exist or be private.',
            received_data: userData,
            suggestion: 'Please verify the Instagram username is correct and the profile is public.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Store connection in database
        console.log('Storing connection in database...')
        const { data: connection, error } = await supabaseClient
          .from('instagram_connections')
          .insert({
            user_id: user.id,
            instagram_user_id: userData.username,
            username: userData.username,
            access_token: 'starapi_token',
            profile_picture_url: userData.profile_picture_url || null,
            follower_count: userData.follower_count || 0,
            following_count: userData.following_count || 0,
            media_count: userData.media_count || 0,
            is_business_account: userData.is_business_account || false,
            account_type: userData.account_type || 'personal'
          })
          .select()
          .single()

        if (error) {
          console.error('Database error:', error)
          return new Response(JSON.stringify({ 
            error: 'Failed to save connection to database',
            details: error.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Connection stored successfully:', connection)
        return new Response(JSON.stringify({ success: true, connection }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (apiError) {
        console.error('API call error:', apiError)
        return new Response(JSON.stringify({ 
          error: 'Failed to connect to Instagram API',
          details: apiError.message,
          suggestion: 'Please check your internet connection and try again.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (action === 'sync_content') {
      try {
        // Fetch media from StarAPI
        console.log('Fetching media data from StarAPI...')
        const mediaResponse = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/posts?username_or_id_or_url=${username}`, {
          headers: {
            'X-RapidAPI-Key': starApiKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com'
          }
        })

        console.log('StarAPI media response status:', mediaResponse.status)

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text()
          console.error('StarAPI media fetch failed:', mediaResponse.status, errorText)
          
          if (mediaResponse.status === 403) {
            const errorData = JSON.parse(errorText)
            if (errorData.message?.includes('not subscribed')) {
              return new Response(JSON.stringify({ 
                error: 'API Key Issue: Your StarAPI subscription may have expired or doesn\'t include access to this endpoint.',
                details: errorText,
                suggestion: 'Please check your RapidAPI dashboard and subscription status.'
              }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              })
            }
          }

          return new Response(JSON.stringify({ 
            error: `Failed to fetch Instagram media data. Status: ${mediaResponse.status}`,
            details: errorText
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const mediaData = await mediaResponse.json()
        console.log('Media data received, posts count:', mediaData.data?.length || 0)

        if (!mediaData.data || !Array.isArray(mediaData.data)) {
          console.error('Invalid media data structure:', mediaData)
          return new Response(JSON.stringify({ 
            error: 'Invalid media data structure received',
            received_data: mediaData
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

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
        console.log('Inserting content items into database:', contentItems.length)
        const { data: insertedContent, error: contentError } = await supabaseClient
          .from('instagram_content')
          .upsert(contentItems, { 
            onConflict: 'instagram_media_id',
            ignoreDuplicates: false 
          })
          .select()

        if (contentError) {
          console.error('Content insert error:', contentError)
          return new Response(JSON.stringify({ 
            error: 'Failed to save content to database',
            details: contentError.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        console.log('Content inserted/updated successfully:', insertedContent?.length || 0)
        return new Response(JSON.stringify({ 
          success: true, 
          synced_posts: insertedContent?.length || 0 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (apiError) {
        console.error('Content sync error:', apiError)
        return new Response(JSON.stringify({ 
          error: 'Failed to sync content from Instagram API',
          details: apiError.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action specified' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
