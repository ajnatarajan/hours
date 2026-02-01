import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import { supabase } from '@/lib/supabase'
import type { Room } from '@/types/database'

export function useRoom() {
  const createRoom = useCallback(async (name?: string): Promise<Room | null> => {
    const code = nanoid(8).toLowerCase()

    // Use the database function to create room with state
    const { data, error } = await supabase.rpc('create_room_with_state', {
      p_code: code,
      p_name: name ?? null,
    })

    if (error) {
      console.error('Failed to create room:', error)
      return null
    }

    // Fetch the created room
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', data)
      .single()

    return room
  }, [])

  const getRoomByCode = useCallback(async (code: string): Promise<Room | null> => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', code.toLowerCase())
      .single()

    if (error) {
      return null
    }

    return data
  }, [])

  return {
    createRoom,
    getRoomByCode,
  }
}

