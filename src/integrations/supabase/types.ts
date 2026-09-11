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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          ip_address: string | null
          meta: Json
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          meta?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          meta?: Json
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_cards: {
        Row: {
          brand: string
          card_holder: string
          card_last4: string
          card_masked: string
          created_at: string
          expiry: string | null
          id: string
          is_default: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string
          card_holder: string
          card_last4: string
          card_masked: string
          created_at?: string
          expiry?: string | null
          id?: string
          is_default?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          card_holder?: string
          card_last4?: string
          card_masked?: string
          created_at?: string
          expiry?: string | null
          id?: string
          is_default?: boolean
          is_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
          parent_id: string | null
          slug: string | null
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
          parent_id?: string | null
          slug?: string | null
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
          parent_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
          accepts_emergency: boolean | null
          agreed_to_privacy: boolean | null
          agreed_to_terms: boolean | null
          balance: number | null
          bank_account: string | null
          bio: string | null
          card_number: string | null
          category_ids: string[] | null
          certificate_urls: string[] | null
          created_at: string | null
          experience_years: number | null
          founding_number: number | null
          id: string
          id_document_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          jobs_completed: number | null
          portfolio_urls: string[] | null
          rating: number | null
          reviews_count: number | null
          selfie_url: string | null
          service_radius_km: number | null
          skills: string[] | null
          subcategory_ids: string[] | null
          tax_info: string | null
          updated_at: string | null
          user_id: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified_at: string | null
          withdrawable_balance: number | null
          work_days: string[] | null
          work_end: string | null
          work_start: string | null
        }
        Insert: {
          accepts_emergency?: boolean | null
          agreed_to_privacy?: boolean | null
          agreed_to_terms?: boolean | null
          balance?: number | null
          bank_account?: string | null
          bio?: string | null
          card_number?: string | null
          category_ids?: string[] | null
          certificate_urls?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          founding_number?: number | null
          id?: string
          id_document_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          jobs_completed?: number | null
          portfolio_urls?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          selfie_url?: string | null
          service_radius_km?: number | null
          skills?: string[] | null
          subcategory_ids?: string[] | null
          tax_info?: string | null
          updated_at?: string | null
          user_id: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified_at?: string | null
          withdrawable_balance?: number | null
          work_days?: string[] | null
          work_end?: string | null
          work_start?: string | null
        }
        Update: {
          accepts_emergency?: boolean | null
          agreed_to_privacy?: boolean | null
          agreed_to_terms?: boolean | null
          balance?: number | null
          bank_account?: string | null
          bio?: string | null
          card_number?: string | null
          category_ids?: string[] | null
          certificate_urls?: string[] | null
          created_at?: string | null
          experience_years?: number | null
          founding_number?: number | null
          id?: string
          id_document_url?: string | null
          is_active?: boolean | null
          is_approved?: boolean | null
          jobs_completed?: number | null
          portfolio_urls?: string[] | null
          rating?: number | null
          reviews_count?: number | null
          selfie_url?: string | null
          service_radius_km?: number | null
          skills?: string[] | null
          subcategory_ids?: string[] | null
          tax_info?: string | null
          updated_at?: string | null
          user_id?: string
          verification_tier?: Database["public"]["Enums"]["verification_tier"]
          verified_at?: string | null
          withdrawable_balance?: number | null
          work_days?: string[] | null
          work_end?: string | null
          work_start?: string | null
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
      order_escrow: {
        Row: {
          amount: number
          client_id: string
          commission_amount: number
          created_at: string
          id: string
          master_amount: number
          master_id: string | null
          order_id: string
          refunded_at: string | null
          released_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          master_amount?: number
          master_id?: string | null
          order_id: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          master_amount?: number
          master_id?: string | null
          order_id?: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
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
          escrow_status: string
          id: string
          is_dispute: boolean | null
          master_amount: number | null
          master_confirmed: boolean | null
          master_id: string | null
          payment_method: string
          status: string
          title: string
          updated_at: string | null
          warranty_until: string | null
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
          escrow_status?: string
          id?: string
          is_dispute?: boolean | null
          master_amount?: number | null
          master_confirmed?: boolean | null
          master_id?: string | null
          payment_method?: string
          status?: string
          title: string
          updated_at?: string | null
          warranty_until?: string | null
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
          escrow_status?: string
          id?: string
          is_dispute?: boolean | null
          master_amount?: number | null
          master_confirmed?: boolean | null
          master_id?: string | null
          payment_method?: string
          status?: string
          title?: string
          updated_at?: string | null
          warranty_until?: string | null
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
          referral_code: string | null
          referred_by: string | null
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
          referral_code?: string | null
          referred_by?: string | null
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
          referral_code?: string | null
          referred_by?: string | null
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
      referrals: {
        Row: {
          bonus_amount: number
          code: string
          converted_at: string | null
          created_at: string
          id: string
          referred_user_id: string
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_amount?: number
          code: string
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_user_id: string
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_amount?: number
          code?: string
          converted_at?: string | null
          created_at?: string
          id?: string
          referred_user_id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string | null
          id: string
          master_id: string
          order_id: string | null
          photo_urls: string[]
          rating: number
          video_url: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id: string
          order_id?: string | null
          photo_urls?: string[]
          rating: number
          video_url?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          master_id?: string
          order_id?: string | null
          photo_urls?: string[]
          rating?: number
          video_url?: string | null
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
      subscription_plans: {
        Row: {
          audience: string
          badge: string | null
          created_at: string
          features: string[]
          icon: string | null
          id: string
          is_active: boolean
          name: string
          order_num: number
          popular: boolean
          price_12m: number
          price_1m: number
          price_3m: number
          price_6m: number
          tier: string
          updated_at: string
        }
        Insert: {
          audience: string
          badge?: string | null
          created_at?: string
          features?: string[]
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_num?: number
          popular?: boolean
          price_12m?: number
          price_1m?: number
          price_3m?: number
          price_6m?: number
          tier: string
          updated_at?: string
        }
        Update: {
          audience?: string
          badge?: string | null
          created_at?: string
          features?: string[]
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_num?: number
          popular?: boolean
          price_12m?: number
          price_1m?: number
          price_3m?: number
          price_6m?: number
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          audience: string
          billing_period: string | null
          created_at: string
          daily_orders_used: number
          expires_at: string | null
          id: string
          is_trial: boolean
          last_reset_date: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          billing_period?: string | null
          created_at?: string
          daily_orders_used?: number
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          last_reset_date?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          billing_period?: string | null
          created_at?: string
          daily_orders_used?: number
          expires_at?: string | null
          id?: string
          is_trial?: boolean
          last_reset_date?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          trial_ends_at?: string | null
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          id: string
          note: string | null
          order_id: string | null
          payment_method: string | null
          ref_code: string
          status: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_method?: string | null
          ref_code?: string
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string | null
          payment_method?: string | null
          ref_code?: string
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          card_id: string | null
          created_at: string
          id: string
          otp_code: string | null
          otp_verified: boolean
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          card_id?: string | null
          created_at?: string
          id?: string
          otp_code?: string | null
          otp_verified?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          card_id?: string | null
          created_at?: string
          id?: string
          otp_code?: string | null
          otp_verified?: boolean
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_withdrawals_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "bank_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          frozen_balance: number
          id: string
          total_deposited: number
          total_spent: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          frozen_balance?: number
          id?: string
          total_deposited?: number
          total_spent?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          frozen_balance?: number
          id?: string
          total_deposited?: number
          total_spent?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      warranty_claims: {
        Row: {
          admin_note: string | null
          client_id: string
          created_at: string
          id: string
          master_id: string | null
          order_id: string
          photos: string[]
          reason: string
          resolution: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          client_id: string
          created_at?: string
          id?: string
          master_id?: string | null
          order_id: string
          photos?: string[]
          reason: string
          resolution?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          client_id?: string
          created_at?: string
          id?: string
          master_id?: string | null
          order_id?: string
          photos?: string[]
          reason?: string
          resolution?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      activate_subscription: {
        Args: {
          _months?: number
          _tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: Json
      }
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
      admin_get_master_profile: {
        Args: { _user_id: string }
        Returns: {
          accepts_emergency: boolean | null
          agreed_to_privacy: boolean | null
          agreed_to_terms: boolean | null
          balance: number | null
          bank_account: string | null
          bio: string | null
          card_number: string | null
          category_ids: string[] | null
          certificate_urls: string[] | null
          created_at: string | null
          experience_years: number | null
          founding_number: number | null
          id: string
          id_document_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          jobs_completed: number | null
          portfolio_urls: string[] | null
          rating: number | null
          reviews_count: number | null
          selfie_url: string | null
          service_radius_km: number | null
          skills: string[] | null
          subcategory_ids: string[] | null
          tax_info: string | null
          updated_at: string | null
          user_id: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified_at: string | null
          withdrawable_balance: number | null
          work_days: string[] | null
          work_end: string | null
          work_start: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "master_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_get_profiles: {
        Args: { _user_ids: string[] }
        Returns: {
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
          referral_code: string | null
          referred_by: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_profiles: {
        Args: never
        Returns: {
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
          referral_code: string | null
          referred_by: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_wallet_transactions: {
        Args: { _limit?: number }
        Returns: {
          amount: number
          created_at: string
          full_name: string
          id: string
          note: string
          payment_method: string
          ref_code: string
          role: string
          status: Database["public"]["Enums"]["wallet_tx_status"]
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }[]
      }
      admin_list_warranty_claims: {
        Args: never
        Returns: {
          admin_note: string
          client_name: string
          created_at: string
          id: string
          master_name: string
          order_id: string
          photos: string[]
          reason: string
          resolution: string
        }[]
      }
      admin_list_withdrawals: {
        Args: never
        Returns: {
          admin_note: string
          amount: number
          card_holder: string
          card_masked: string
          created_at: string
          full_name: string
          id: string
          reviewed_at: string
          role: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          user_id: string
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
      admin_resolve_warranty: {
        Args: { _id: string; _note?: string; _resolution: string }
        Returns: Json
      }
      admin_resync_founding_numbers: { Args: never; Returns: Json }
      admin_review_withdrawal: {
        Args: { _decision: string; _id: string; _note?: string }
        Returns: Json
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
      admin_wallet_overview: { Args: never; Returns: Json }
      apply_promo_code: {
        Args: { _code: string; _order_amount: number }
        Returns: Json
      }
      award_cashback: { Args: { _order_id: string }; Returns: undefined }
      claim_emergency_order: { Args: { _order_id: string }; Returns: Json }
      create_warranty_claim: {
        Args: { _order_id: string; _photos?: string[]; _reason: string }
        Returns: Json
      }
      ensure_my_referral_code: { Args: never; Returns: string }
      escrow_hold: { Args: { _order_id: string }; Returns: Json }
      escrow_refund: {
        Args: { _note?: string; _order_id: string }
        Returns: Json
      }
      escrow_release: { Args: { _order_id: string }; Returns: Json }
      gen_referral_code: { Args: never; Returns: string }
      get_commission_percent: { Args: never; Returns: number }
      get_founding_config: { Args: never; Returns: Json }
      get_my_earnings_summary: { Args: never; Returns: Json }
      get_my_master_balance: {
        Args: never
        Returns: {
          balance: number
          withdrawable_balance: number
        }[]
      }
      get_my_master_profile: {
        Args: never
        Returns: {
          accepts_emergency: boolean | null
          agreed_to_privacy: boolean | null
          agreed_to_terms: boolean | null
          balance: number | null
          bank_account: string | null
          bio: string | null
          card_number: string | null
          category_ids: string[] | null
          certificate_urls: string[] | null
          created_at: string | null
          experience_years: number | null
          founding_number: number | null
          id: string
          id_document_url: string | null
          is_active: boolean | null
          is_approved: boolean | null
          jobs_completed: number | null
          portfolio_urls: string[] | null
          rating: number | null
          reviews_count: number | null
          selfie_url: string | null
          service_radius_km: number | null
          skills: string[] | null
          subcategory_ids: string[] | null
          tax_info: string | null
          updated_at: string | null
          user_id: string
          verification_tier: Database["public"]["Enums"]["verification_tier"]
          verified_at: string | null
          withdrawable_balance: number | null
          work_days: string[] | null
          work_end: string | null
          work_start: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "master_profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_profile: {
        Args: never
        Returns: {
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
          referral_code: string | null
          referred_by: string | null
          region: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_referral_code: { Args: never; Returns: string }
      get_my_referral_list: {
        Args: never
        Returns: {
          bonus_amount: number
          converted_at: string
          created_at: string
          full_name: string
          id: string
          status: string
        }[]
      }
      get_my_referral_stats: { Args: never; Returns: Json }
      get_my_subscription_status: { Args: never; Returns: Json }
      get_my_wallet: {
        Args: never
        Returns: {
          balance: number
          created_at: string
          currency: string
          frozen_balance: number
          id: string
          total_deposited: number
          total_spent: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      master_can_accept_orders: { Args: { _user_id: string }; Returns: boolean }
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
      wallet_deposit: {
        Args: { _amount: number; _method: string }
        Returns: Json
      }
      wallet_request_withdrawal: {
        Args: { _amount: number; _card_id: string; _otp?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "client" | "master" | "admin"
      subscription_tier:
        | "free"
        | "standard"
        | "premium"
        | "vip"
        | "pro"
        | "basic"
      verification_tier: "none" | "bronze" | "silver" | "gold"
      wallet_tx_status: "pending" | "success" | "cancelled" | "failed"
      wallet_tx_type:
        | "deposit"
        | "withdrawal"
        | "payment"
        | "refund"
        | "bonus"
        | "earning"
        | "commission"
      withdrawal_status: "pending" | "approved" | "completed" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      subscription_tier: ["free", "standard", "premium", "vip", "pro", "basic"],
      verification_tier: ["none", "bronze", "silver", "gold"],
      wallet_tx_status: ["pending", "success", "cancelled", "failed"],
      wallet_tx_type: [
        "deposit",
        "withdrawal",
        "payment",
        "refund",
        "bonus",
        "earning",
        "commission",
      ],
      withdrawal_status: ["pending", "approved", "completed", "rejected"],
    },
  },
} as const
