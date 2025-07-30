
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

    const starApiKey = Deno.env.get('STARAPI_KEY')
    if (!starApiKey) {
      return new Response(JSON.stringify({ error: 'StarAPI key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Processing ${action} for username: ${username}`)

    if (action === 'verify_credentials') {
      try {
        // Just test the API without storing anything - try the get_media endpoint since we know it works
        console.log('Testing StarAPI credentials with get_media endpoint...')
        const testResponse = await fetch(`https://starapi1.p.rapidapi.com/instagram/user/get_media`, {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': starApiKey,
            'X-RapidAPI-Host': 'starapi1.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: 12281817, count: 1 }) // Use a known Instagram user ID for testing
        })

        console.log('StarAPI test response status:', testResponse.status)
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text()
          console.error('StarAPI test failed:', testResponse.status, errorText)
          
          if (testResponse.status === 403) {
            return new Response(JSON.stringify({ 
              error: 'API Key Issue: Your StarAPI subscription may have expired or doesn\'t include access to this endpoint.',
              details: errorText,
              suggestion: 'Verify your StarAPI subscription status at https://rapidapi.com/hub'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          
          if (testResponse.status === 429) {
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait a moment before trying again.',
              details: errorText
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ 
            error: `API verification failed. Status: ${testResponse.status}`,
            details: errorText,
            suggestion: 'Please check your StarAPI subscription and try again.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const testData = await testResponse.json()
        console.log('API verification successful')

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'StarAPI credentials verified successfully',
          test_data: { username: testData.username }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (apiError) {
        console.error('API verification error:', apiError)
        return new Response(JSON.stringify({ 
          error: 'Failed to verify StarAPI credentials',
          details: apiError.message,
          suggestion: 'Please check your internet connection and try again.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    if (action === 'connect_profile') {
      try {
        // Use the working user posts endpoint to get profile info
        console.log('Fetching user info from StarAPI...')
        const userResponse = await fetch(`https://starapi1.p.rapidapi.com/instagram/user/posts`, {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': starApiKey,
            'X-RapidAPI-Host': 'starapi1.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: username, limit: 1 })
        })

        console.log('StarAPI user response status:', userResponse.status)
        
        if (!userResponse.ok) {
          const errorText = await userResponse.text()
          console.error('StarAPI user fetch failed:', userResponse.status, errorText)
          
          if (userResponse.status === 403) {
            return new Response(JSON.stringify({ 
              error: 'API Key Issue: Your StarAPI subscription may have expired or doesn\'t include access to this endpoint.',
              details: errorText,
              suggestion: 'Verify your StarAPI subscription status at https://rapidapi.com/hub'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
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
            suggestion: 'Please verify the Instagram username is correct and try again.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const userData = await userResponse.json()
        console.log('User data received:', JSON.stringify(userData, null, 2))

        // Extract user info from the posts response
        if (!userData || !userData.data || !Array.isArray(userData.data) || userData.data.length === 0) {
          console.error('No posts found or invalid data structure:', userData)
          return new Response(JSON.stringify({ 
            error: 'No posts found for this username. The profile may be private or have no posts.',
            received_data: userData,
            suggestion: 'Please verify the Instagram username is correct and the profile is public with at least one post.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Get user info from the first post
        const firstPost = userData.data[0]
        const userInfo = firstPost.user || firstPost.owner

        if (!userInfo || !userInfo.username) {
          console.error('Could not extract user info from posts:', firstPost)
          return new Response(JSON.stringify({ 
            error: 'Could not extract profile information from posts.',
            suggestion: 'The profile may be private or the username may be incorrect.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Store connection in database using instagram_profiles table
        console.log('Storing connection in database...')
        const { data: connection, error } = await supabaseClient
          .from('instagram_profiles')
          .insert({
            user_id: user.id,
            profile_id: userInfo.id || userInfo.username,
            username: userInfo.username,
            full_name: userInfo.full_name || userInfo.username,
            biography: userInfo.biography || null,
            profile_picture_url: userInfo.profile_picture_url || userInfo.profile_pic_url || null,
            follower_count: userInfo.follower_count || 0,
            following_count: userInfo.following_count || 0,
            media_count: userData.data.length,
            is_business_account: userInfo.is_business_account || false,
            account_type: userInfo.account_type || 'personal',
            is_active: true
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
        // Use the working posts endpoint with username parameter
        console.log('Fetching media data from StarAPI...')
        const mediaResponse = await fetch(`https://starapi1.p.rapidapi.com/instagram/user/posts`, {
          method: 'POST',
          headers: {
            'X-RapidAPI-Key': starApiKey,
            'X-RapidAPI-Host': 'starapi1.p.rapidapi.com',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: username, limit: 50 })
        })

        console.log('StarAPI media response status:', mediaResponse.status)

        if (!mediaResponse.ok) {
          const errorText = await mediaResponse.text()
          console.error('StarAPI media fetch failed:', mediaResponse.status, errorText)
          
          if (mediaResponse.status === 403) {
            return new Response(JSON.stringify({ 
              error: 'API Key Issue: Your StarAPI subscription may have expired or doesn\'t include access to this endpoint.',
              details: errorText,
              suggestion: 'Please check your RapidAPI dashboard and subscription status.'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          if (mediaResponse.status === 429) {
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait a moment before trying again.',
              details: errorText
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }

          return new Response(JSON.stringify({ 
            error: `Failed to fetch Instagram media data. Status: ${mediaResponse.status}`,
            details: errorText,
            suggestion: `Username "${username}" may not exist or be private. Please verify the username.`
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
            received_data: mediaData,
            suggestion: `No posts found for username "${username}". The profile may be private or have no posts.`
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const contentItems = []
        
        for (const media of (mediaData.data || []).slice(0, 50)) {
          const contentItem = {
            profile_id: username,
            media_id: media.id,
            media_type: media.media_type?.toLowerCase() || 'image',
            media_url: media.display_url || media.media_url,
            thumbnail_url: media.thumbnail_url || media.display_url || media.media_url,
            permalink: media.permalink || `https://instagram.com/p/${media.shortcode}`,
            caption: media.caption?.substring(0, 2000) || null,
            timestamp: new Date(media.taken_at_timestamp * 1000).toISOString(),
            like_count: media.like_count || 0,
            comment_count: media.comment_count || 0,
            view_count: media.video_view_count || media.play_count || 0,
            share_count: 0, // StarAPI doesn't provide share count
            hashtags: media.hashtags || [],
            mentions: media.mentions || []
          }
          contentItems.push(contentItem)
        }

        // Batch insert content
        console.log('Inserting content items into database:', contentItems.length)
        const { data: insertedContent, error: contentError } = await supabaseClient
          .from('instagram_media')
          .upsert(contentItems, { 
            onConflict: 'media_id',
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
          synced_posts: insertedContent?.length || 0,
          message: `Successfully synced ${insertedContent?.length || 0} posts for ${username}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      } catch (apiError) {
        console.error('Content sync error:', apiError)
        return new Response(JSON.stringify({ 
          error: 'Failed to sync content from Instagram API',
          details: apiError.message,
          suggestion: 'Please check your internet connection and try again.'
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
      details: error.message,
      suggestion: 'Please try again. If the problem persists, contact support.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
