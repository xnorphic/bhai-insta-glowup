export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      api_usage_logs: {
        Row: {
          api_key_used: string | null
          api_name: Database["public"]["Enums"]["api_name"]
          cost_in_units: number | null
          endpoint_called: string
          error_message: string | null
          id: string
          is_error: boolean
          request_payload: Json | null
          request_timestamp: string
          response_data: Json | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          api_key_used?: string | null
          api_name: Database["public"]["Enums"]["api_name"]
          cost_in_units?: number | null
          endpoint_called: string
          error_message?: string | null
          id?: string
          is_error?: boolean
          request_payload?: Json | null
          request_timestamp?: string
          response_data?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          api_key_used?: string | null
          api_name?: Database["public"]["Enums"]["api_name"]
          cost_in_units?: number | null
          endpoint_called?: string
          error_message?: string | null
          id?: string
          is_error?: boolean
          request_payload?: Json | null
          request_timestamp?: string
          response_data?: Json | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_books: {
        Row: {
          addressed_market: string | null
          ai_generated_playbook: string | null
          ai_summary_json: Json | null
          aspiration_market: string | null
          brand_colors_fonts: string | null
          content_ips: string | null
          customer_personas: string | null
          customer_strengths: string | null
          customer_weaknesses: string | null
          extracted_text: string | null
          file_url: string
          id: string
          is_analysis_complete: boolean | null
          missing_information: Json | null
          original_filename: string
          playbook_start_year: number | null
          posts_scanned_for_playbook: number
          strategy_pillars: string | null
          tonality: string | null
          upload_timestamp: string
          uploaded_by_username: string
          user_id: string
          version: number
          what_not_to_do: string | null
          what_we_do: string | null
        }
        Insert: {
          addressed_market?: string | null
          ai_generated_playbook?: string | null
          ai_summary_json?: Json | null
          aspiration_market?: string | null
          brand_colors_fonts?: string | null
          content_ips?: string | null
          customer_personas?: string | null
          customer_strengths?: string | null
          customer_weaknesses?: string | null
          extracted_text?: string | null
          file_url: string
          id?: string
          is_analysis_complete?: boolean | null
          missing_information?: Json | null
          original_filename: string
          playbook_start_year?: number | null
          posts_scanned_for_playbook?: number
          strategy_pillars?: string | null
          tonality?: string | null
          upload_timestamp?: string
          uploaded_by_username: string
          user_id: string
          version: number
          what_not_to_do?: string | null
          what_we_do?: string | null
        }
        Update: {
          addressed_market?: string | null
          ai_generated_playbook?: string | null
          ai_summary_json?: Json | null
          aspiration_market?: string | null
          brand_colors_fonts?: string | null
          content_ips?: string | null
          customer_personas?: string | null
          customer_strengths?: string | null
          customer_weaknesses?: string | null
          extracted_text?: string | null
          file_url?: string
          id?: string
          is_analysis_complete?: boolean | null
          missing_information?: Json | null
          original_filename?: string
          playbook_start_year?: number | null
          posts_scanned_for_playbook?: number
          strategy_pillars?: string | null
          tonality?: string | null
          upload_timestamp?: string
          uploaded_by_username?: string
          user_id?: string
          version?: number
          what_not_to_do?: string | null
          what_we_do?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_books_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_calendar_events: {
        Row: {
          ai_generated_captions: Json | null
          ai_generated_image_prompts: string | null
          ai_generated_post_ideas: string
          ai_reasoning: string
          content_type: Database["public"]["Enums"]["calendar_content_type"]
          creation_timestamp: string
          event_date: string
          id: string
          is_saved: boolean
          platform: Database["public"]["Enums"]["platform_type"]
          post_category: Database["public"]["Enums"]["post_category"]
          user_id: string
          user_input_focus: string | null
        }
        Insert: {
          ai_generated_captions?: Json | null
          ai_generated_image_prompts?: string | null
          ai_generated_post_ideas: string
          ai_reasoning: string
          content_type: Database["public"]["Enums"]["calendar_content_type"]
          creation_timestamp?: string
          event_date: string
          id?: string
          is_saved?: boolean
          platform: Database["public"]["Enums"]["platform_type"]
          post_category: Database["public"]["Enums"]["post_category"]
          user_id: string
          user_input_focus?: string | null
        }
        Update: {
          ai_generated_captions?: Json | null
          ai_generated_image_prompts?: string | null
          ai_generated_post_ideas?: string
          ai_reasoning?: string
          content_type?: Database["public"]["Enums"]["calendar_content_type"]
          creation_timestamp?: string
          event_date?: string
          id?: string
          is_saved?: boolean
          platform?: Database["public"]["Enums"]["platform_type"]
          post_category?: Database["public"]["Enums"]["post_category"]
          user_id?: string
          user_input_focus?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content_data: Json
          created_at: string
          created_by_username: string
          form_data: Json
          id: string
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_data: Json
          created_at?: string
          created_by_username: string
          form_data: Json
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_data?: Json
          created_at?: string
          created_by_username?: string
          form_data?: Json
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          created_at: string
          date_month: string
          id: string
          is_fixed_date: boolean | null
          name: string
          occasion_type: string
          region_notes: string | null
        }
        Insert: {
          created_at?: string
          date_month: string
          id?: string
          is_fixed_date?: boolean | null
          name: string
          occasion_type: string
          region_notes?: string | null
        }
        Update: {
          created_at?: string
          date_month?: string
          id?: string
          is_fixed_date?: boolean | null
          name?: string
          occasion_type?: string
          region_notes?: string | null
        }
        Relationships: []
      }
      instagram_media: {
        Row: {
          caption: string | null
          children_media: Json | null
          comment_count: number | null
          created_at: string
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          insights: Json | null
          is_story_available: boolean | null
          last_updated: string
          like_count: number | null
          location_id: string | null
          location_name: string | null
          media_id: string
          media_type: string
          media_url: string
          mentions: string[] | null
          permalink: string
          profile_id: string
          save_count: number | null
          share_count: number | null
          thumbnail_url: string | null
          timestamp: string
          video_duration: number | null
          view_count: number | null
        }
        Insert: {
          caption?: string | null
          children_media?: Json | null
          comment_count?: number | null
          created_at?: string
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          insights?: Json | null
          is_story_available?: boolean | null
          last_updated?: string
          like_count?: number | null
          location_id?: string | null
          location_name?: string | null
          media_id: string
          media_type: string
          media_url: string
          mentions?: string[] | null
          permalink: string
          profile_id: string
          save_count?: number | null
          share_count?: number | null
          thumbnail_url?: string | null
          timestamp: string
          video_duration?: number | null
          view_count?: number | null
        }
        Update: {
          caption?: string | null
          children_media?: Json | null
          comment_count?: number | null
          created_at?: string
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          insights?: Json | null
          is_story_available?: boolean | null
          last_updated?: string
          like_count?: number | null
          location_id?: string | null
          location_name?: string | null
          media_id?: string
          media_type?: string
          media_url?: string
          mentions?: string[] | null
          permalink?: string
          profile_id?: string
          save_count?: number | null
          share_count?: number | null
          thumbnail_url?: string | null
          timestamp?: string
          video_duration?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_media_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "instagram_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      instagram_profiles: {
        Row: {
          account_type: string | null
          api_calls_reset_date: string | null
          api_calls_today: number | null
          biography: string | null
          category: string | null
          connected_at: string
          created_at: string
          external_url: string | null
          follower_count: number | null
          following_count: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_business_account: boolean | null
          is_verified: boolean | null
          last_sync_at: string | null
          media_count: number | null
          profile_id: string
          profile_picture_url: string | null
          total_api_calls: number | null
          user_id: string
          username: string
        }
        Insert: {
          account_type?: string | null
          api_calls_reset_date?: string | null
          api_calls_today?: number | null
          biography?: string | null
          category?: string | null
          connected_at?: string
          created_at?: string
          external_url?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_business_account?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          media_count?: number | null
          profile_id: string
          profile_picture_url?: string | null
          total_api_calls?: number | null
          user_id: string
          username: string
        }
        Update: {
          account_type?: string | null
          api_calls_reset_date?: string | null
          api_calls_today?: number | null
          biography?: string | null
          category?: string | null
          connected_at?: string
          created_at?: string
          external_url?: string | null
          follower_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_business_account?: boolean | null
          is_verified?: boolean | null
          last_sync_at?: string | null
          media_count?: number | null
          profile_id?: string
          profile_picture_url?: string | null
          total_api_calls?: number | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      instagram_stories: {
        Row: {
          created_at: string
          expires_at: string
          hashtags: string[] | null
          highlight_id: string | null
          id: string
          is_archived: boolean | null
          last_updated: string
          location_id: string | null
          location_name: string | null
          media_type: string
          media_url: string
          mentions: string[] | null
          profile_id: string
          reply_count: number | null
          stickers: Json | null
          story_id: string
          story_type: string | null
          thumbnail_url: string | null
          timestamp: string
          view_count: number | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          hashtags?: string[] | null
          highlight_id?: string | null
          id?: string
          is_archived?: boolean | null
          last_updated?: string
          location_id?: string | null
          location_name?: string | null
          media_type: string
          media_url: string
          mentions?: string[] | null
          profile_id: string
          reply_count?: number | null
          stickers?: Json | null
          story_id: string
          story_type?: string | null
          thumbnail_url?: string | null
          timestamp: string
          view_count?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          hashtags?: string[] | null
          highlight_id?: string | null
          id?: string
          is_archived?: boolean | null
          last_updated?: string
          location_id?: string | null
          location_name?: string | null
          media_type?: string
          media_url?: string
          mentions?: string[] | null
          profile_id?: string
          reply_count?: number | null
          stickers?: Json | null
          story_id?: string
          story_type?: string | null
          thumbnail_url?: string | null
          timestamp?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stories_profile"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "instagram_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      instagram_sync_logs: {
        Row: {
          api_calls_made: number | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          profile_id: string
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_details: Json | null
          sync_type: string
        }
        Insert: {
          api_calls_made?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          profile_id: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type: string
        }
        Update: {
          api_calls_made?: number | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          profile_id?: string
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          connected_instagram_profiles: Json
          created_at: string
          current_subscription_status: Database["public"]["Enums"]["subscription_status"]
          id: string
          is_admin: boolean
          last_login_at: string | null
          profile_picture_url: string | null
          subscription_expiry_date: string | null
          subscription_start_date: string | null
          username: string
        }
        Insert: {
          connected_instagram_profiles?: Json
          created_at?: string
          current_subscription_status?: Database["public"]["Enums"]["subscription_status"]
          id: string
          is_admin?: boolean
          last_login_at?: string | null
          profile_picture_url?: string | null
          subscription_expiry_date?: string | null
          subscription_start_date?: string | null
          username: string
        }
        Update: {
          connected_instagram_profiles?: Json
          created_at?: string
          current_subscription_status?: Database["public"]["Enums"]["subscription_status"]
          id?: string
          is_admin?: boolean
          last_login_at?: string | null
          profile_picture_url?: string | null
          subscription_expiry_date?: string | null
          subscription_start_date?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_api_calls: {
        Args: { target_profile_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reset_daily_api_calls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      trigger_manual_sync: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_instagram_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      api_name: "OpenAI" | "StarAPI"
      calendar_content_type:
        | "post"
        | "reel"
        | "story"
        | "carousel"
        | "video"
        | "short"
      content_type: "post" | "reel" | "carousel" | "story" | "highlight"
      performance_category: "Green" | "Amber" | "Red"
      platform_type: "twitter" | "linkedin" | "youtube" | "instagram"
      post_category:
        | "festival"
        | "launch"
        | "branding"
        | "educational"
        | "meme"
        | "topical"
      subscription_status: "active" | "expired" | "trial" | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      api_name: ["OpenAI", "StarAPI"],
      calendar_content_type: [
        "post",
        "reel",
        "story",
        "carousel",
        "video",
        "short",
      ],
      content_type: ["post", "reel", "carousel", "story", "highlight"],
      performance_category: ["Green", "Amber", "Red"],
      platform_type: ["twitter", "linkedin", "youtube", "instagram"],
      post_category: [
        "festival",
        "launch",
        "branding",
        "educational",
        "meme",
        "topical",
      ],
      subscription_status: ["active", "expired", "trial", "paused"],
    },
  },
} as const
