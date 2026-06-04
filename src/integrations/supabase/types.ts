export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      broadcasts: {
        Row: {
          audience: string
          created_at: string
          id: string
          message: string
          recipients_count: number
          send_sms: boolean
          sender_id: string
          title: string
        }
        Insert: {
          audience?: string
          created_at?: string
          id?: string
          message: string
          recipients_count?: number
          send_sms?: boolean
          sender_id: string
          title: string
        }
        Update: {
          audience?: string
          created_at?: string
          id?: string
          message?: string
          recipients_count?: number
          send_sms?: boolean
          sender_id?: string
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string
          id: string
          name_en: string
          name_ru: string
          name_uz: string
          order_num: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string
          id?: string
          name_en: string
          name_ru: string
          name_uz: string
          order_num?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string
          id?: string
          name_en?: string
          name_ru?: string
          name_uz?: string
          order_num?: number | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          description: string
          id: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_order_id: string | null
          target_review_id: string | null
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_order_id?: string | null
          target_review_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_order_id?: string | null
          target_review_id?: string | null
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorite_masters: {
        Row: {
          client_id: string
          created_at: string
          id: string
          master_profile_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          master_profile_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          master_profile_id?: string
        }
        Relationships: []
      }
      master_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          master_id: string
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          master_id: string
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          master_id?: string
          start_time?: string
        }
        Relationships: []
      }
      master_profiles: {
        Row: {
          balance: number | null
          bio: string | null
          category_ids: string[] | null
          created_at: string | null
          experience_years: number | null
          id: string
          is_active: boolean | null
          is_approved: boolean | null
          jobs_completed: number | null
          portfolio_urls: string[] | null
          rating: number | null
          reviews_count: number | null
          skills: string[] | null
          updated_at: string | null
          user_id: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified_at: string | null
          withdrawable_balance: number | null
        }
        Insert: {
          balance?: number | null
          bio?: string | null
          category_ids?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          jobs_completed?: number | null
          portfolio_urls?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified_at?: string | null
          withdrawable_balance?: number | null
        }
        Update: {
          balance?: number | null
          bio?: string | null
          category_ids?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_approved?: boolean | null
          jobs_completed?: number | null
          portfolio_urls?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified_at?: string | null
          withdrawable_balance?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          order_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          order_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          order_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_order_id: string | null
          sender_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_order_id?: string | null
          sender_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_order_id?: string | null
          sender_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          admin_approved: boolean | null
          amount: number | null
          category_id: string | null
          city: string | null
          client_confirmed: boolean | null
          client_id: string
          commission_amount: number | null
          created_at: string | null
          description: string | null
          id: string
          is_dispute: boolean | null
          master_amount: number | null
          master_confirmed: boolean | null
          master_id: string | null
          payment_method: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          admin_approved?: boolean | null
          amount?: number | null
          category_id?: string | null
          city?: string | null
          client_confirmed?: boolean | null
          client_id: string
          commission_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_dispute?: boolean | null
          master_amount?: number | null
          master_confirmed?: boolean | null
          master_id?: string | null
          payment_method?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          admin_approved?: boolean | null
          amount?: number | null
          category_id?: string | null
          city?: string | null
          client_confirmed?: boolean | null
          client_id?: string
          commission_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_dispute?: boolean | null
          master_amount?: number | null
          master_confirmed?: boolean | null
          master_id?: string | null
          payment_method?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bonus_balance: number
          city: string | null
          created_at: string | null
          full_name: string
          id: string
          is_blocked: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bonus_balance?: number
          city?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          is_blocked?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bonus_balance?: number
          city?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          is_blocked?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          discount_applied: number
          id: string
          order_id: string | null
          promo_code_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          master_id: string
          order_id: string | null
          rating: number
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id: string
          order_id?: string | null
          rating: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string
          order_id?: string | null
          rating?: number
        }
        Relationships: []
      }
      saved_addresses: {
        Row: {
          address: string
          city: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          region: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean
          market_avg_price: number | null
          master_id: string
          price: number
          price_max: number | null
          pricing_type: string
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          market_avg_price?: number | null
          master_id: string
          price?: number
          price_max?: number | null
          pricing_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          market_avg_price?: number | null
          master_id?: string
          price?: number
          price_max?: number | null
          pricing_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          daily_orders_used: number
          expires_at: string | null
          id: string
          last_reset_date: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_orders_used?: number
          expires_at?: string | null
          id?: string
          last_reset_date?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_orders_used?: number
          expires_at?: string | null
          id?: string
          last_reset_date?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          admin_note: string | null
          certificate_url: string | null
          created_at: string
          id: string
          master_id: string
          passport_url: string | null
          requested_tier: Database["public"]["Enums"]["verification_tier"]
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          master_id: string
          passport_url?: string | null
          requested_tier?: Database["public"]["Enums"]["verification_tier"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          certificate_url?: string | null
          created_at?: string
          id?: string
          master_id?: string
          passport_url?: string | null
          requested_tier?: Database["public"]["Enums"]["verification_tier"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      withdraw_requests: {
        Row: {
          admin_note: string | null
          amount: number
          card_number: string | null
          created_at: string | null
          id: string
          master_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          card_number?: string | null
          created_at?: string | null
          id?: string
          master_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          card_number?: string | null
          created_at?: string | null
          id?: string
          master_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      master_badges: {
        Row: {
          badge: string | null
          is_verified: boolean | null
          jobs_completed: number | null
          master_id: string | null
          rating: number | null
          reviews_count: number | null
          tier: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_approve_verification: {
        Args: { _approve: boolean; _note?: string; _request_id: string }
        Returns: Json
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_get_master_balances: {
        Args: never
        Returns: {
          balance: number
          user_id: string
          withdrawable_balance: number
        }[]
      }
      admin_recent_messages: {
        Args: { _limit?: number }
        Returns: {
          content: string
          created_at: string
          id: string
          receiver_id: string
          receiver_name: string
          sender_id: string
          sender_name: string
        }[]
      }
      admin_send_broadcast: {
        Args: {
          _audience: string
          _message: string
          _send_sms?: boolean
          _title: string
        }
        Returns: Json
      }
      apply_promo_code: {
        Args: { _code: string; _order_amount: number }
        Returns: Json
      }
      award_cashback: { Args: { _order_id: string }; Returns: undefined }
      claim_emergency_order: { Args: { _order_id: string }; Returns: Json }
      get_commission_percent: { Args: never; Returns: number }
      get_my_master_balance: {
        Args: never
        Returns: {
          balance: number
          withdrawable_balance: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      master_can_add_service: {
        Args: { _master_user_id: string }
        Returns: boolean
      }
      master_match_score: {
        Args: { _client_lat?: number; _client_lng?: number; _master_id: string }
        Returns: number
      }
      redeem_promo_code: {
        Args: { _discount: number; _order_id: string; _promo_code_id: string }
        Returns: undefined
      }
      use_bonus_balance: { Args: { _amount: number }; Returns: Json }
    }
    Enums: {
      app_role: "client" | "master" | "admin"
      subscription_tier: "free" | "standard" | "premium" | "vip" | "pro"
      verification_tier: "none" | "bronze" | "silver" | "gold"
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
      app_role: ["client", "master", "admin"],
      subscription_tier: ["free", "standard", "premium", "vip", "pro"],
      verification_tier: ["none", "bronze", "silver", "gold"],
    },
  },
} as const
