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
      dishes: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          owner_id: string
          price: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          owner_id?: string
          price?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          owner_id?: string
          price?: number
        }
        Relationships: []
      }
      login_history: {
        Row: {
          browser: string
          country: string
          device: string
          email: string
          id: string
          ip_address: string
          logged_in_at: string
          method: string
          os: string
          user_agent: string
          user_id: string
        }
        Insert: {
          browser?: string
          country?: string
          device?: string
          email?: string
          id?: string
          ip_address?: string
          logged_in_at?: string
          method?: string
          os?: string
          user_agent?: string
          user_id?: string
        }
        Update: {
          browser?: string
          country?: string
          device?: string
          email?: string
          id?: string
          ip_address?: string
          logged_in_at?: string
          method?: string
          os?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_items: {
        Row: {
          id: string
          meal_id: string
          member_ids: string[]
          name: string
          owner_id: string
          position: number
          price: number
        }
        Insert: {
          id?: string
          meal_id: string
          member_ids?: string[]
          name: string
          owner_id?: string
          position?: number
          price: number
        }
        Update: {
          id?: string
          meal_id?: string
          member_ids?: string[]
          name?: string
          owner_id?: string
          position?: number
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_meal_id_owner_id_fkey"
            columns: ["meal_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          eaten_on: string
          id: string
          name: string
          owner_id: string
          participant_ids: string[]
          total_amount: number
        }
        Insert: {
          created_at?: string
          eaten_on?: string
          id?: string
          name: string
          owner_id?: string
          participant_ids?: string[]
          total_amount: number
        }
        Update: {
          created_at?: string
          eaten_on?: string
          id?: string
          name?: string
          owner_id?: string
          participant_ids?: string[]
          total_amount?: number
        }
        Relationships: []
      }
      members: {
        Row: {
          email: string
          id: string
          is_active: boolean
          name: string
          nickname: string
          owner_id: string
          team_id: string | null
          transfer_code: string
        }
        Insert: {
          email?: string
          id?: string
          is_active?: boolean
          name: string
          nickname?: string
          owner_id?: string
          team_id?: string | null
          transfer_code: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          nickname?: string
          owner_id?: string
          team_id?: string | null
          transfer_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_team_id_owner_id_fkey"
            columns: ["team_id", "owner_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id", "owner_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          member_id: string
          owner_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "view_member_balances"
            referencedColumns: ["member_id"]
          },
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      view_member_balances: {
        Row: {
          balance: number | null
          member_id: string | null
          name: string | null
          nickname: string | null
          owner_id: string | null
          total_paid: number | null
          total_spent: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
