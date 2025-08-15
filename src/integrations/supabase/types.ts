export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
          subscription_tier: 'free' | 'student_pro' | 'creator_pro' | 'organization'
          templates_limit: number
          monthly_exports: number
          monthly_exports_limit: number
          organization_id: string | null
          is_organization_admin: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'student_pro' | 'creator_pro' | 'organization'
          templates_limit?: number
          monthly_exports?: number
          monthly_exports_limit?: number
          organization_id?: string | null
          is_organization_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          subscription_tier?: 'free' | 'student_pro' | 'creator_pro' | 'organization'
          templates_limit?: number
          monthly_exports?: number
          monthly_exports_limit?: number
          organization_id?: string | null
          is_organization_admin?: boolean
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          name: string
          description: string | null
          template_type: string
          background_url: string | null
          frames: Json
          tags: string[] | null
          is_public: boolean
          user_id: string
          organization_id: string | null
          created_at: string
          updated_at: string
          view_count: number
          generation_count: number
          is_premium: boolean
          price: number | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          template_type: string
          background_url?: string | null
          frames: Json
          tags?: string[] | null
          is_public?: boolean
          user_id: string
          organization_id?: string | null
          created_at?: string
          updated_at?: string
          view_count?: number
          generation_count?: number
          is_premium?: boolean
          price?: number | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          template_type?: string
          background_url?: string | null
          frames?: Json
          tags?: string[] | null
          is_public?: boolean
          user_id?: string
          organization_id?: string | null
          created_at?: string
          updated_at?: string
          view_count?: number
          generation_count?: number
          is_premium?: boolean
          price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      template_generations: {
        Row: {
          id: string
          template_id: string
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_generations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          subscription_plan: 'department' | 'church' | 'faculty' | 'enterprise'
          subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_start: string | null
          subscription_end: string | null
          monthly_export_limit: number
          custom_branding: boolean
          white_label: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          subscription_plan: 'department' | 'church' | 'faculty' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_start?: string | null
          subscription_end?: string | null
          monthly_export_limit?: number
          custom_branding?: boolean
          white_label?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          subscription_plan?: 'department' | 'church' | 'faculty' | 'enterprise'
          subscription_status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          subscription_start?: string | null
          subscription_end?: string | null
          monthly_export_limit?: number
          custom_branding?: boolean
          white_label?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          plan_type: 'free' | 'student_pro' | 'creator_pro' | 'department' | 'church' | 'faculty' | 'enterprise'
          status: 'active' | 'inactive' | 'cancelled' | 'trial'
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          paystack_subscription_id: string | null
          paystack_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          plan_type: 'free' | 'student_pro' | 'creator_pro' | 'department' | 'church' | 'faculty' | 'enterprise'
          status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          paystack_subscription_id?: string | null
          paystack_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          plan_type?: 'free' | 'student_pro' | 'creator_pro' | 'department' | 'church' | 'faculty' | 'enterprise'
          status?: 'active' | 'inactive' | 'cancelled' | 'trial'
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          paystack_subscription_id?: string | null
          paystack_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'successful' | 'failed' | 'cancelled'
          payment_method: 'mobile_money' | 'card' | 'bank_transfer'
          paystack_reference: string
          paystack_transaction_id: string | null
          description: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'successful' | 'failed' | 'cancelled'
          payment_method?: 'mobile_money' | 'card' | 'bank_transfer'
          paystack_reference: string
          paystack_transaction_id?: string | null
          description: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'successful' | 'failed' | 'cancelled'
          payment_method?: 'mobile_money' | 'card' | 'bank_transfer'
          paystack_reference?: string
          paystack_transaction_id?: string | null
          description?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          action: 'template_created' | 'template_exported' | 'font_uploaded' | 'api_call'
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          action: 'template_created' | 'template_exported' | 'font_uploaded' | 'api_call'
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          action?: 'template_created' | 'template_exported' | 'font_uploaded' | 'api_call'
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_template_view: {
        Args: {
          template_uuid: string
        }
        Returns: undefined
      }
      increment_template_generation: {
        Args: {
          template_uuid: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

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

// Additional type definitions for the application
export type Profile = Tables<'profiles'>
export type Template = Tables<'templates'>
export type TemplateGeneration = Tables<'template_generations'>

// Frame types for the canvas editor
export interface BaseFrame {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export interface ImageFrame extends BaseFrame {
  type: 'image'
  placeholder?: string // Placeholder text like "Upload your photo"
}

export interface TextFrame extends BaseFrame {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  color: string
  textAlign: 'left' | 'center' | 'right'
  placeholder?: string // Default text like "Enter your name"
}

export type Frame = ImageFrame | TextFrame

// Template with populated frames (typed)
export interface TemplateWithFrames extends Omit<Template, 'frames'> {
  frames: Frame[]
}

export const Constants = {
  public: {
    Enums: {},
  },
} as const
