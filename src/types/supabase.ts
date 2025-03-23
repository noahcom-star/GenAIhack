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
      users: {
        Row: {
          id: string
          email: string
          role: 'organizer' | 'participant'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'organizer' | 'participant'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'organizer' | 'participant'
          created_at?: string
          updated_at?: string
        }
      }
      participant_conversations: {
        Row: {
          id: string
          user_id: string
          hackathon_id: string | null
          transcript: string
          confidence: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hackathon_id?: string | null
          transcript: string
          confidence: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hackathon_id?: string | null
          transcript?: string
          confidence?: number
          created_at?: string
          updated_at?: string
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
  }
} 