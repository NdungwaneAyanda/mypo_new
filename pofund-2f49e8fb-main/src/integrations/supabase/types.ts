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
      application_documents: {
        Row: {
          application_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "fact_applications"
            referencedColumns: ["application_key"]
          },
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "fact_applications"
            referencedColumns: ["application_key"]
          },
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "funding_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      funding_applications: {
        Row: {
          amount_needed: number | null
          assigned_funder_id: string | null
          company_name: string
          contact_name: string
          cost_of_delivery: number | null
          created_at: string
          customer_name: string
          description: string | null
          email: string
          id: string
          industry: string
          payment_terms: string
          phone: string | null
          po_amount: number
          ref_code: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_needed?: number | null
          assigned_funder_id?: string | null
          company_name: string
          contact_name: string
          cost_of_delivery?: number | null
          created_at?: string
          customer_name: string
          description?: string | null
          email: string
          id?: string
          industry: string
          payment_terms: string
          phone?: string | null
          po_amount: number
          ref_code?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_needed?: number | null
          assigned_funder_id?: string | null
          company_name?: string
          contact_name?: string
          cost_of_delivery?: number | null
          created_at?: string
          customer_name?: string
          description?: string | null
          email?: string
          id?: string
          industry?: string
          payment_terms?: string
          phone?: string | null
          po_amount?: number
          ref_code?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          ref_code: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id: string
          phone?: string | null
          ref_code?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          ref_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registered_funders: {
        Row: {
          company_name: string
          company_website: string | null
          contact_name: string
          created_at: string
          email: string
          funding_capacity: string | null
          funding_description: string | null
          id: string
          industries: string[] | null
          is_active: boolean
          max_po_amount: number | null
          min_po_amount: number | null
          phone: string | null
          ref_code: string | null
          unsubscribe_token: string
          user_id: string | null
          years_in_business: number | null
        }
        Insert: {
          company_name: string
          company_website?: string | null
          contact_name: string
          created_at?: string
          email: string
          funding_capacity?: string | null
          funding_description?: string | null
          id?: string
          industries?: string[] | null
          is_active?: boolean
          max_po_amount?: number | null
          min_po_amount?: number | null
          phone?: string | null
          ref_code?: string | null
          unsubscribe_token?: string
          user_id?: string | null
          years_in_business?: number | null
        }
        Update: {
          company_name?: string
          company_website?: string | null
          contact_name?: string
          created_at?: string
          email?: string
          funding_capacity?: string | null
          funding_description?: string | null
          id?: string
          industries?: string[] | null
          is_active?: boolean
          max_po_amount?: number | null
          min_po_amount?: number | null
          phone?: string | null
          ref_code?: string | null
          unsubscribe_token?: string
          user_id?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          industry: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      dim_date: {
        Row: {
          date_key: string | null
          day: number | null
          day_name: string | null
          day_of_week: number | null
          month: number | null
          month_name: string | null
          quarter: number | null
          week: number | null
          year: number | null
        }
        Relationships: []
      }
      dim_funder: {
        Row: {
          company_name: string | null
          contact_name: string | null
          email: string | null
          funder_created_at: string | null
          funder_key: string | null
          funder_ref: string | null
          funding_capacity: string | null
          industries: string[] | null
          is_active: boolean | null
          max_po_amount: number | null
          min_po_amount: number | null
          phone: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          funder_created_at?: string | null
          funder_key?: string | null
          funder_ref?: string | null
          funding_capacity?: string | null
          industries?: string[] | null
          is_active?: boolean | null
          max_po_amount?: number | null
          min_po_amount?: number | null
          phone?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          funder_created_at?: string | null
          funder_key?: string | null
          funder_ref?: string | null
          funding_capacity?: string | null
          industries?: string[] | null
          is_active?: boolean | null
          max_po_amount?: number | null
          min_po_amount?: number | null
          phone?: string | null
        }
        Relationships: []
      }
      dim_supplier: {
        Row: {
          company_name: string | null
          contact_name: string | null
          email: string | null
          phone: string | null
          supplier_created_at: string | null
          supplier_key: string | null
          supplier_ref: string | null
        }
        Insert: {
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          supplier_created_at?: string | null
          supplier_key?: string | null
          supplier_ref?: string | null
        }
        Update: {
          company_name?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          supplier_created_at?: string | null
          supplier_key?: string | null
          supplier_ref?: string | null
        }
        Relationships: []
      }
      fact_applications: {
        Row: {
          amount_needed: number | null
          application_key: string | null
          application_ref: string | null
          company_name: string | null
          cost_of_delivery: number | null
          created_at: string | null
          customer_name: string | null
          date_key: string | null
          funder_key: string | null
          funder_ref: string | null
          gross_margin: number | null
          industry: string | null
          payment_terms: string | null
          po_amount: number | null
          status: string | null
          supplier_key: string | null
          supplier_ref: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      resolve_chat_recipient: {
        Args: { _application_id: string; _current_user_id: string }
        Returns: string
      }
      user_is_assigned_funder: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_application: {
        Args: { _app_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "supplier" | "funder"
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
      app_role: ["supplier", "funder"],
    },
  },
} as const
