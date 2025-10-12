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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          display_name: string | null
          role: 'senior' | 'caregiver' | 'family_member' | 'admin'
          phone_number: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          notification_preferences: Json | null
          created_at: string
          updated_at: string
          last_active_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          display_name?: string | null
          role?: 'senior' | 'caregiver' | 'family_member' | 'admin'
          phone_number?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_active_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          display_name?: string | null
          role?: 'senior' | 'caregiver' | 'family_member' | 'admin'
          phone_number?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          notification_preferences?: Json | null
          created_at?: string
          updated_at?: string
          last_active_at?: string | null
        }
      }
      care_relationships: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string
          relationship_type: string
          relationship_label: string | null
          can_view_health_data: boolean
          can_receive_alerts: boolean
          can_modify_settings: boolean
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          caregiver_id: string
          relationship_type: string
          relationship_label?: string | null
          can_view_health_data?: boolean
          can_receive_alerts?: boolean
          can_modify_settings?: boolean
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          caregiver_id?: string
          relationship_type?: string
          relationship_label?: string | null
          can_view_health_data?: boolean
          can_receive_alerts?: boolean
          can_modify_settings?: boolean
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
          accepted_at?: string | null
        }
      }
      check_ins: {
        Row: {
          id: string
          patient_id: string
          interaction_type: 'voice' | 'text' | 'whatsapp'
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          messages: Json
          sentiment_score: number | null
          mood_detected: string | null
          topics_discussed: string[] | null
          safety_concern_detected: boolean
          safety_concern_type: string | null
          safety_concern_details: string | null
          alert_sent: boolean
          alert_sent_at: string | null
          commitments: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          interaction_type: 'voice' | 'text' | 'whatsapp'
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          messages?: Json
          sentiment_score?: number | null
          mood_detected?: string | null
          topics_discussed?: string[] | null
          safety_concern_detected?: boolean
          safety_concern_type?: string | null
          safety_concern_details?: string | null
          alert_sent?: boolean
          alert_sent_at?: string | null
          commitments?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          interaction_type?: 'voice' | 'text' | 'whatsapp'
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          messages?: Json
          sentiment_score?: number | null
          mood_detected?: string | null
          topics_discussed?: string[] | null
          safety_concern_detected?: boolean
          safety_concern_type?: string | null
          safety_concern_details?: string | null
          alert_sent?: boolean
          alert_sent_at?: string | null
          commitments?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: string
          patient_id: string
          summary_date: string
          check_in_count: number
          total_conversation_minutes: number
          overall_mood: string | null
          average_sentiment_score: number | null
          medication_taken: boolean | null
          meals_reported: number
          activity_reported: boolean
          sleep_quality: string | null
          overall_status: 'ok' | 'warning' | 'alert'
          status_reason: string | null
          summary_text: string | null
          highlights: string[] | null
          concerns: string[] | null
          alerts_triggered: number
          alert_types: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          summary_date: string
          check_in_count?: number
          total_conversation_minutes?: number
          overall_mood?: string | null
          average_sentiment_score?: number | null
          medication_taken?: boolean | null
          meals_reported?: number
          activity_reported?: boolean
          sleep_quality?: string | null
          overall_status?: 'ok' | 'warning' | 'alert'
          status_reason?: string | null
          summary_text?: string | null
          highlights?: string[] | null
          concerns?: string[] | null
          alerts_triggered?: number
          alert_types?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          summary_date?: string
          check_in_count?: number
          total_conversation_minutes?: number
          overall_mood?: string | null
          average_sentiment_score?: number | null
          medication_taken?: boolean | null
          meals_reported?: number
          activity_reported?: boolean
          sleep_quality?: string | null
          overall_status?: 'ok' | 'warning' | 'alert'
          status_reason?: string | null
          summary_text?: string | null
          highlights?: string[] | null
          concerns?: string[] | null
          alerts_triggered?: number
          alert_types?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          patient_id: string
          check_in_id: string | null
          alert_type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          alert_message: string
          alert_details: Json | null
          status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
          notified_caregivers: string[] | null
          notification_sent_at: string | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          resolution_notes: string | null
          escalation_countdown_started: string | null
          escalated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          check_in_id?: string | null
          alert_type: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          alert_message: string
          alert_details?: Json | null
          status?: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
          notified_caregivers?: string[] | null
          notification_sent_at?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolution_notes?: string | null
          escalation_countdown_started?: string | null
          escalated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          check_in_id?: string | null
          alert_type?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          alert_message?: string
          alert_details?: Json | null
          status?: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
          notified_caregivers?: string[] | null
          notification_sent_at?: string | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          resolution_notes?: string | null
          escalation_countdown_started?: string | null
          escalated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      caregiver_notes: {
        Row: {
          id: string
          patient_id: string
          caregiver_id: string
          note_type: string
          note_text: string
          is_reminder: boolean
          reminder_date: string | null
          reminder_time: string | null
          shared_with_patient: boolean
          shared_with_care_team: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          caregiver_id: string
          note_type?: string
          note_text: string
          is_reminder?: boolean
          reminder_date?: string | null
          reminder_time?: string | null
          shared_with_patient?: boolean
          shared_with_care_team?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          caregiver_id?: string
          note_type?: string
          note_text?: string
          is_reminder?: boolean
          reminder_date?: string | null
          reminder_time?: string | null
          shared_with_patient?: boolean
          shared_with_care_team?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          activity_description: string | null
          activity_metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          activity_description?: string | null
          activity_metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          activity_description?: string | null
          activity_metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      waitlist_signups: {
        Row: {
          id: string
          name: string
          email: string
          role: string | null
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string | null
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string | null
          message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
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
