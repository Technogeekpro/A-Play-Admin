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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          amount: number | null
          booking_date: string
          created_at: string
          event_date: string | null
          event_id: string
          id: string
          quantity: number
          status: string
          user_id: string
          zone_id: string
        }
        Insert: {
          amount?: number | null
          booking_date: string
          created_at?: string
          event_date?: string | null
          event_id: string
          id?: string
          quantity: number
          status?: string
          user_id: string
          zone_id: string
        }
        Update: {
          amount?: number | null
          booking_date?: string
          created_at?: string
          event_date?: string | null
          event_id?: string
          id?: string
          quantity?: number
          status?: string
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          content: string
          created_at: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          reply_to: string | null
          room_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          room_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          avatar_url: string | null
          chat_room_id: string
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          left_at: string | null
          role: Database["public"]["Enums"]["participant_role"] | null
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          chat_room_id: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          role?: Database["public"]["Enums"]["participant_role"] | null
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          chat_room_id?: string
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          role?: Database["public"]["Enums"]["participant_role"] | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          is_group: boolean | null
          last_message: string | null
          last_message_time: string | null
          name: string
          participant_ids: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          name: string
          participant_ids?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          is_group?: boolean | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string
          participant_ids?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      club_bookings: {
        Row: {
          booking_date: string
          club_id: string
          created_at: string | null
          end_time: string
          id: string
          start_time: string
          status: string
          table_id: string
          total_price: number
          user_id: string
        }
        Insert: {
          booking_date: string
          club_id: string
          created_at?: string | null
          end_time: string
          id?: string
          start_time: string
          status?: string
          table_id: string
          total_price: number
          user_id: string
        }
        Update: {
          booking_date?: string
          club_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          start_time?: string
          status?: string
          table_id?: string
          total_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_bookings_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "club_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      club_tables: {
        Row: {
          capacity: number
          club_id: string
          created_at: string | null
          id: string
          is_available: boolean
          location: string | null
          name: string
          price_per_hour: number
        }
        Insert: {
          capacity: number
          club_id: string
          created_at?: string | null
          id?: string
          is_available?: boolean
          location?: string | null
          name: string
          price_per_hour: number
        }
        Update: {
          capacity?: number
          club_id?: string
          created_at?: string | null
          id?: string
          is_available?: boolean
          location?: string | null
          name?: string
          price_per_hour?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_tables_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          description: string
          id: string
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
      concierge_requests: {
        Row: {
          additional_details: Json | null
          category: string
          created_at: string | null
          description: string
          id: string
          is_urgent: boolean | null
          requested_at: string | null
          service_name: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_details?: Json | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          is_urgent?: boolean | null
          requested_at?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_details?: Json | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          is_urgent?: boolean | null
          requested_at?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          city: string
          country: string | null
          created_at: string | null
          delivery_instructions: string | null
          id: string
          is_default: boolean | null
          label: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          is_default?: boolean | null
          label: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          category_id: string
          event_id: string
        }
        Insert: {
          category_id: string
          event_id: string
        }
        Update: {
          category_id?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_categories_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_categories_category_id"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_event_categories_event_id"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          club_id: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string
          end_date: string
          id: string
          is_featured: boolean | null
          location: string
          start_date: string
          title: string
        }
        Insert: {
          club_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          end_date: string
          id?: string
          is_featured?: boolean | null
          location: string
          start_date: string
          title: string
        }
        Update: {
          club_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          end_date?: string
          id?: string
          is_featured?: boolean | null
          location?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string
          feed_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          feed_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          feed_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_likes: {
        Row: {
          created_at: string
          feed_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      feeds: {
        Row: {
          comment_count: number | null
          content: string
          created_at: string
          event_id: string | null
          id: string
          image_url: string | null
          like_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number | null
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number | null
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          image_url?: string | null
          like_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feeds_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feeds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
          special_instructions: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          menu_item_id: string
          order_id: string
          price: number
          quantity: number
          special_instructions?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          menu_item_id?: string
          order_id?: string
          price?: number
          quantity?: number
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address_id: string | null
          delivery_fee: number | null
          estimated_delivery_time: string | null
          id: string
          order_type: Database["public"]["Enums"]["order_type"]
          special_instructions: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_fee?: number | null
          estimated_delivery_time?: string | null
          id?: string
          order_type: Database["public"]["Enums"]["order_type"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address_id?: string | null
          delivery_fee?: number | null
          estimated_delivery_time?: string | null
          id?: string
          order_type?: Database["public"]["Enums"]["order_type"]
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "delivery_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_approved: boolean | null
          is_organizer: boolean | null
          is_premium: boolean | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_approved?: boolean | null
          is_organizer?: boolean | null
          is_premium?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean | null
          is_organizer?: boolean | null
          is_premium?: boolean | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_date: string
          payment_method: string | null
          status: string
          subscription_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date: string
          payment_method?: string | null
          status?: string
          subscription_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          benefits: string[] | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_monthly: number
          price_yearly: number | null
          tier_level: number | null
          updated_at: string | null
        }
        Insert: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_monthly: number
          price_yearly?: number | null
          tier_level?: number | null
          updated_at?: string | null
        }
        Update: {
          benefits?: string[] | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          tier_level?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          end_date: string | null
          features_unlocked: Json | null
          id: string
          is_auto_renew: boolean | null
          plan_type: string | null
          start_date: string
          status: string
          subscription_type: string
          tier_points_earned: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          features_unlocked?: Json | null
          id?: string
          is_auto_renew?: boolean | null
          plan_type?: string | null
          start_date: string
          status?: string
          subscription_type: string
          tier_points_earned?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          end_date?: string | null
          features_unlocked?: Json | null
          id?: string
          is_auto_renew?: boolean | null
          plan_type?: string | null
          start_date?: string
          status?: string
          subscription_type?: string
          tier_points_earned?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price: number
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "zones_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"
      order_type: "dine_in" | "takeaway" | "delivery"
      participant_role: "admin" | "member"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "admin" | "user" | "staff" | "blogger"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
