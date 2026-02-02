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
      rooms: {
        Row: {
          id: string
          code: string
          name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      room_state: {
        Row: {
          room_id: string
          started_at: string | null
          running: boolean
          timer_seconds: number
          background_id: string | null
        }
        Insert: {
          room_id: string
          started_at?: string | null
          running?: boolean
          timer_seconds?: number
          background_id?: string | null
        }
        Update: {
          room_id?: string
          started_at?: string | null
          running?: boolean
          timer_seconds?: number
          background_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'room_state_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      participants: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          name: string
          is_active: boolean
          do_not_disturb: boolean
          on_break: boolean
          break_started_at: string | null
          last_seen: string
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          name: string
          is_active?: boolean
          do_not_disturb?: boolean
          on_break?: boolean
          break_started_at?: string | null
          last_seen?: string
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          name?: string
          is_active?: boolean
          do_not_disturb?: boolean
          on_break?: boolean
          break_started_at?: string | null
          last_seen?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'participants_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          room_id: string
          participant_id: string
          content: string
          done: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          participant_id: string
          content: string
          done?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          participant_id?: string
          content?: string
          done?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasks_participant_id_fkey'
            columns: ['participant_id']
            referencedRelation: 'participants'
            referencedColumns: ['id']
          }
        ]
      }
      messages: {
        Row: {
          id: string
          room_id: string
          participant_id: string
          content: string
          message_type: 'user' | 'system'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          participant_id: string
          content: string
          message_type?: 'user' | 'system'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          participant_id?: string
          content?: string
          message_type?: 'user' | 'system'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'messages_room_id_fkey'
            columns: ['room_id']
            referencedRelation: 'rooms'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'messages_participant_id_fkey'
            columns: ['participant_id']
            referencedRelation: 'participants'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_room_with_state: {
        Args: {
          p_code: string
          p_name?: string | null
        }
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

// Helper types for easier use
export type Room = Database['public']['Tables']['rooms']['Row']
export type RoomInsert = Database['public']['Tables']['rooms']['Insert']
export type RoomState = Database['public']['Tables']['room_state']['Row']
export type RoomStateUpdate = Database['public']['Tables']['room_state']['Update']
export type Participant = Database['public']['Tables']['participants']['Row']
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
export type ParticipantUpdate = Database['public']['Tables']['participants']['Update']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']
export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
