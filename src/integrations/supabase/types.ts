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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string
          fee: number
          fee_payer: string | null
          id: string
          monthly_rent: number
          property_id: string
          rental_request_id: string | null
          renter_id: string
          renter_name: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee?: number
          fee_payer?: string | null
          id?: string
          monthly_rent: number
          property_id: string
          rental_request_id?: string | null
          renter_id: string
          renter_name?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee?: number
          fee_payer?: string | null
          id?: string
          monthly_rent?: number
          property_id?: string
          rental_request_id?: string | null
          renter_id?: string
          renter_name?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_rental_request_id_fkey"
            columns: ["rental_request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          area_m2: number | null
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          images: string[]
          max_guests: number | null
          min_stay_days: number
          monthly_rent: number | null
          municipality: string
          nightly_price: number | null
          owner_id: string | null
          owner_name: string | null
          property_type: string
          rental_kind: string
          rooms: number
          status: string
          title: string
          wilaya: string
        }
        Insert: {
          amenities?: string[]
          area_m2?: number | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          images?: string[]
          max_guests?: number | null
          min_stay_days?: number
          monthly_rent?: number | null
          municipality: string
          nightly_price?: number | null
          owner_id?: string | null
          owner_name?: string | null
          property_type: string
          rental_kind?: string
          rooms?: number
          status?: string
          title: string
          wilaya: string
        }
        Update: {
          amenities?: string[]
          area_m2?: number | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          images?: string[]
          max_guests?: number | null
          min_stay_days?: number
          monthly_rent?: number | null
          municipality?: string
          nightly_price?: number | null
          owner_id?: string | null
          owner_name?: string | null
          property_type?: string
          rental_kind?: string
          rooms?: number
          status?: string
          title?: string
          wilaya?: string
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          author_name: string | null
          budget: number
          created_at: string
          duration_months: number | null
          id: string
          municipality: string | null
          property_type: string
          renter_id: string | null
          rooms: number
          specifications: string | null
          status: string
          title: string
          wilaya: string
        }
        Insert: {
          author_name?: string | null
          budget: number
          created_at?: string
          duration_months?: number | null
          id?: string
          municipality?: string | null
          property_type: string
          renter_id?: string | null
          rooms?: number
          specifications?: string | null
          status?: string
          title: string
          wilaya: string
        }
        Update: {
          author_name?: string | null
          budget?: number
          created_at?: string
          duration_months?: number | null
          id?: string
          municipality?: string | null
          property_type?: string
          renter_id?: string | null
          rooms?: number
          specifications?: string | null
          status?: string
          title?: string
          wilaya?: string
        }
        Relationships: []
      }
      short_term_rentals: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          fee: number
          fee_payer: string | null
          guest_name: string | null
          guests_count: number
          id: string
          notes: string | null
          property_id: string
          status: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          fee?: number
          fee_payer?: string | null
          guest_name?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          property_id: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          fee?: number
          fee_payer?: string | null
          guest_name?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          property_id?: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_term_rentals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_delete_user: { Args: { p_user_id: string }; Returns: undefined }
      admin_list_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          phone: string
        }[]
      }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      cancel_deal: { Args: { p_deal_id: string }; Returns: undefined }
      get_booking_contacts: {
        Args: { p_booking_id: string }
        Returns: {
          guest_name: string
          guest_phone: string
          host_name: string
          host_phone: string
        }[]
      }
      get_deal_contacts: {
        Args: { p_deal_id: string }
        Returns: {
          owner_name: string
          owner_phone: string
          renter_name: string
          renter_phone: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_party_of_property: { Args: { p_property: string }; Returns: boolean }
      owns_property: { Args: { p_property: string }; Returns: boolean }
      property_in_use: { Args: { p_property: string }; Returns: boolean }
      request_deal: {
        Args: { p_property_id: string; p_rental_request_id?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
