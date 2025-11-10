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
      youtube_content: {
        Row: {
          id: string
          video_id: string
          title: string
          description: string | null
          category: string | null
          year: number | null
          maturity_rating: string | null
          seasons: string | null
          content_type: string | null
          section_name: string | null
          is_featured: boolean | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          youtube_url: string | null
          category_id: string | null
          cover_image: string | null
          thumbnail_url: string | null
          duration: string | null
          published_at: string | null
          tags: string[] | null
          status: string | null
        }
        Insert: {
          id?: string
          video_id: string
          title: string
          description?: string | null
          category?: string | null
          year?: number | null
          maturity_rating?: string | null
          seasons?: string | null
          content_type?: string | null
          section_name?: string | null
          is_featured?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          youtube_url?: string | null
          category_id?: string | null
          cover_image?: string | null
          thumbnail_url?: string | null
          duration?: string | null
          published_at?: string | null
          tags?: string[] | null
          status?: string | null
        }
        Update: {
          id?: string
          video_id?: string
          title?: string
          description?: string | null
          category?: string | null
          year?: number | null
          maturity_rating?: string | null
          seasons?: string | null
          content_type?: string | null
          section_name?: string | null
          is_featured?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          youtube_url?: string | null
          category_id?: string | null
          cover_image?: string | null
          thumbnail_url?: string | null
          duration?: string | null
          published_at?: string | null
          tags?: string[] | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "youtube_content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "youtube_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_name: string
          status: string
          start_date: string
          end_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_name: string
          status?: string
          start_date: string
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_name?: string
          status?: string
          start_date?: string
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      participant_role: "admin" | "member" | "moderator"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
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