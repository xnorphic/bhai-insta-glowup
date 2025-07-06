export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      instagram_connections: {
        Row: {
          access_token: string
          account_type: string | null
          connected_at: string
          created_at: string
          follower_count: number | null
          following_count: number | null
          id: string
          instagram_user_id: string
          is_active: boolean | null
          is_business_account: boolean | null
          last_sync_at: string | null
          media_count: number | null
          profile_picture_url: string | null
          refresh_token: string | null
          token_expires_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          access_token: string
          account_type?: string | null
          connected_at?: string
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          id?: string
          instagram_user_id: string
          is_active?: boolean | null
          is_business_account?: boolean | null
          last_sync_at?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          access_token?: string
          account_type?: string | null
          connected_at?: string
          created_at?: string
          follower_count?: number | null
          following_count?: number | null
          id?: string
          instagram_user_id?: string
          is_active?: boolean | null
          is_business_account?: boolean | null
          last_sync_at?: string | null
          media_count?: number | null
          profile_picture_url?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_content: {
        Row: {
          ai_performance_summary: string | null
          ai_sentiment_summary: string | null
          alt_text: string | null
          audio_used: string | null
          caption: string | null
          content_link: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          id: string
          instagram_media_id: string
          is_boosted: boolean
          last_refreshed_at: string
          location_id: number | null
          location_name: string | null
          performance_category:
            | Database["public"]["Enums"]["performance_category"]
            | null
          post_date: string
          thumbnail_url: string
          total_comments: number
          total_likes: number
          total_shares: number
          total_views: number
          tracked_profile_id: string
        }
        Insert: {
          ai_performance_summary?: string | null
          ai_sentiment_summary?: string | null
          alt_text?: string | null
          audio_used?: string | null
          caption?: string | null
          content_link: string
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          instagram_media_id: string
          is_boosted?: boolean
          last_refreshed_at: string
          location_id?: number | null
          location_name?: string | null
          performance_category?:
            | Database["public"]["Enums"]["performance_category"]
            | null
          post_date: string
          thumbnail_url: string
          total_comments?: number
          total_likes?: number
          total_shares?: number
          total_views?: number
          tracked_profile_id: string
        }
        Update: {
          ai_performance_summary?: string | null
          ai_sentiment_summary?: string | null
          alt_text?: string | null
          audio_used?: string | null
          caption?: string | null
          content_link?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          id?: string
          instagram_media_id?: string
          is_boosted?: boolean
          last_refreshed_at?: string
          location_id?: number | null
          location_name?: string | null
          performance_category?:
            | Database["public"]["Enums"]["performance_category"]
            | null
          post_date?: string
          thumbnail_url?: string
          total_comments?: number
          total_likes?: number
          total_shares?: number
          total_views?: number
          tracked_profile_id?: string
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
