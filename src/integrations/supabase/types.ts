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
      deals: {
        Row: {
          completed: boolean
          contacts_released: boolean
          created_at: string
          id: string
          initial_fee: number
          initial_fee_payer: string
          monthly_fee: number
          monthly_fee_payer: string
          monthly_rent: number
          property_id: string | null
          rental_request_id: string | null
        }
        Insert: {
          completed?: boolean
          contacts_released?: boolean
          created_at?: string
          id?: string
          initial_fee: number
          initial_fee_payer: string
          monthly_fee: number
          monthly_fee_payer: string
          monthly_rent: number
          property_id?: string | null
          rental_request_id?: string | null
        }
        Update: {
          completed?: boolean
          contacts_released?: boolean
          created_at?: string
          id?: string
          initial_fee?: number
          initial_fee_payer?: string
          monthly_fee?: number
          monthly_fee_payer?: string
          monthly_rent?: number
          property_id?: string | null
          rental_request_id?: string | null
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
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_rental_request_id_fkey"
            columns: ["rental_request_id"]
            isOneToOne: false
            referencedRelation: "public_rental_requests"
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
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          area_m2: number | null
          contact_phone: string | null
          created_at: string
          description: string | null
          duration_months: number | null
          id: string
          monthly_rent: number
          municipality: string
          owner_id: string | null
          property_type: string
          status: string
          wilaya: string
        }
        Insert: {
          area_m2?: number | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          monthly_rent: number
          municipality: string
          owner_id?: string | null
          property_type: string
          status?: string
          wilaya: string
        }
        Update: {
          area_m2?: number | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          duration_months?: number | null
          id?: string
          monthly_rent?: number
          municipality?: string
          owner_id?: string | null
          property_type?: string
          status?: string
          wilaya?: string
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          budget: number
          contact_phone: string | null
          created_at: string
          duration_months: number | null
          id: string
          municipality: string | null
          property_type: string
          renter_id: string | null
          specifications: string | null
          status: string
          wilaya: string
        }
        Insert: {
          budget: number
          contact_phone?: string | null
          created_at?: string
          duration_months?: number | null
          id?: string
          municipality?: string | null
          property_type: string
          renter_id?: string | null
          specifications?: string | null
          status?: string
          wilaya: string
        }
        Update: {
          budget?: number
          contact_phone?: string | null
          created_at?: string
          duration_months?: number | null
          id?: string
          municipality?: string | null
          property_type?: string
          renter_id?: string | null
          specifications?: string | null
          status?: string
          wilaya?: string
        }
        Relationships: []
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
      public_properties: {
        Row: {
          area_m2: number | null
          created_at: string | null
          description: string | null
          duration_months: number | null
          id: string | null
          monthly_rent: number | null
          municipality: string | null
          property_type: string | null
          status: string | null
          wilaya: string | null
        }
        Insert: {
          area_m2?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string | null
          monthly_rent?: number | null
          municipality?: string | null
          property_type?: string | null
          status?: string | null
          wilaya?: string | null
        }
        Update: {
          area_m2?: number | null
          created_at?: string | null
          description?: string | null
          duration_months?: number | null
          id?: string | null
          monthly_rent?: number | null
          municipality?: string | null
          property_type?: string | null
          status?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
      public_rental_requests: {
        Row: {
          budget: number | null
          created_at: string | null
          duration_months: number | null
          id: string | null
          municipality: string | null
          property_type: string | null
          specifications: string | null
          status: string | null
          wilaya: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          duration_months?: number | null
          id?: string | null
          municipality?: string | null
          property_type?: string | null
          specifications?: string | null
          status?: string | null
          wilaya?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          duration_months?: number | null
          id?: string | null
          municipality?: string | null
          property_type?: string | null
          specifications?: string | null
          status?: string | null
          wilaya?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_deal_contacts: {
        Args: { p_deal_id: string }
        Returns: {
          property_phone: string
          renter_phone: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
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
