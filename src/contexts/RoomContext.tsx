import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'
import type { Room, RoomState, Participant } from '@/types/database'

interface RoomContextValue {
  room: Room | null
  roomState: RoomState | null
  participants: Participant[]
  currentParticipant: Participant | null
  isLoading: boolean
  error: string | null
  dndEnabledAt: string | null
  joinRoom: (code: string) => Promise<boolean>
  leaveRoom: () => void
  updatePresence: () => void
  updateRoomName: (newName: string | null) => Promise<void>
  updateParticipantName: (newName: string) => Promise<void>
  toggleDoNotDisturb: () => Promise<boolean>
  updateBackground: (backgroundId: string) => Promise<void>
}

const RoomContext = createContext<RoomContextValue | null>(null)

// Make the key room-specific to avoid cross-room participant conflicts
function getParticipantKey(roomId: string) {
  return `hours_participant_${roomId}`
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user, displayName } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dndEnabledAt, setDndEnabledAt] = useState<string | null>(null)
  
  // Prevent double joins in React Strict Mode
  const joiningRef = useRef(false)

  // Subscribe to room state changes
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`room_state:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_state',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          setRoomState(payload.new as RoomState)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  // Subscribe to participant changes
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`participants:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          // Refetch all participants on any change
          const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('room_id', room.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
          if (data) {
            setParticipants(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  // Subscribe to room changes (for name updates from other participants)
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        (payload) => {
          setRoom(payload.new as Room)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.id])

  const joinRoom = useCallback(
    async (code: string): Promise<boolean> => {
      // Prevent double joins
      if (joiningRef.current) {
        return false
      }
      
      if (!displayName) {
        setError('Please enter your name to join')
        return false
      }

      joiningRef.current = true
      setIsLoading(true)
      setError(null)

      try {
        // Find the room by code
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('code', code.toLowerCase())
          .single()

        if (roomError || !roomData) {
          setError('Room not found')
          setIsLoading(false)
          joiningRef.current = false
          return false
        }

        setRoom(roomData)

        // Get room state
        const { data: stateData } = await supabase
          .from('room_state')
          .select('*')
          .eq('room_id', roomData.id)
          .single()

        if (stateData) {
          setRoomState(stateData)
        }

        // Check if participant already exists for THIS room (using room-specific key)
        const participantKey = getParticipantKey(roomData.id)
        const storedParticipantId = localStorage.getItem(participantKey)
        let participant: Participant | null = null

        if (storedParticipantId) {
          const { data: existingParticipant } = await supabase
            .from('participants')
            .select('*')
            .eq('id', storedParticipantId)
            .eq('room_id', roomData.id)
            .single()

          if (existingParticipant) {
            // Update existing participant - preserve their per-room name, only update activity status
            const { data: updatedParticipant } = await supabase
              .from('participants')
              .update({
                is_active: true,
                last_seen: new Date().toISOString(),
                user_id: user?.id ?? null,
              })
              .eq('id', storedParticipantId)
              .select()
              .single()

            participant = updatedParticipant
          }
        }

        if (!participant) {
          // Create new participant
          const { data: newParticipant, error: participantError } = await supabase
            .from('participants')
            .insert({
              room_id: roomData.id,
              user_id: user?.id ?? null,
              name: displayName,
              is_active: true,
            })
            .select()
            .single()

          if (participantError || !newParticipant) {
            setError('Failed to join room')
            setIsLoading(false)
            joiningRef.current = false
            return false
          }

          participant = newParticipant
          localStorage.setItem(participantKey, participant.id)
        }

        setCurrentParticipant(participant)

        // Fetch all active participants
        const { data: allParticipants } = await supabase
          .from('participants')
          .select('*')
          .eq('room_id', roomData.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })

        if (allParticipants) {
          setParticipants(allParticipants)
        }

        setIsLoading(false)
        joiningRef.current = false
        return true
      } catch (err) {
        setError('Failed to join room')
        setIsLoading(false)
        joiningRef.current = false
        return false
      }
    },
    [displayName, user]
  )

  const leaveRoom = useCallback(async () => {
    if (currentParticipant) {
      await supabase
        .from('participants')
        .update({ is_active: false })
        .eq('id', currentParticipant.id)
    }

    joiningRef.current = false
    setRoom(null)
    setRoomState(null)
    setParticipants([])
    setCurrentParticipant(null)
  }, [currentParticipant])

  const updatePresence = useCallback(async () => {
    if (currentParticipant) {
      await supabase
        .from('participants')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', currentParticipant.id)
    }
  }, [currentParticipant])

  const updateRoomName = useCallback(async (newName: string | null) => {
    if (!room) return
    await supabase
      .from('rooms')
      .update({ name: newName || null })
      .eq('id', room.id)
    // Optimistic update (realtime subscription will confirm)
    setRoom({ ...room, name: newName })
  }, [room])

  const updateParticipantName = useCallback(async (newName: string) => {
    if (!currentParticipant) return
    
    const { data } = await supabase
      .from('participants')
      .update({ name: newName })
      .eq('id', currentParticipant.id)
      .select()
      .single()
    
    if (data) {
      // Update local state immediately
      setCurrentParticipant(data)
      // Also update in participants list
      setParticipants(prev => 
        prev.map(p => p.id === data.id ? data : p)
      )
    }
  }, [currentParticipant])

  const toggleDoNotDisturb = useCallback(async (): Promise<boolean> => {
    if (!currentParticipant) return false
    
    const newDndStatus = !currentParticipant.do_not_disturb
    
    const { data, error } = await supabase
      .from('participants')
      .update({ do_not_disturb: newDndStatus })
      .eq('id', currentParticipant.id)
      .select()
      .single()
    
    if (error || !data) {
      console.error('Failed to toggle Do Not Disturb:', error)
      return false
    }
    
    // Update local state immediately
    setCurrentParticipant(data)
    // Also update in participants list
    setParticipants(prev => 
      prev.map(p => p.id === data.id ? data : p)
    )
    
    // Track when DND was enabled for chat filtering
    if (newDndStatus) {
      setDndEnabledAt(new Date().toISOString())
    } else {
      setDndEnabledAt(null)
    }
    
    return newDndStatus
  }, [currentParticipant])

  const updateBackground = useCallback(async (backgroundId: string) => {
    if (!room) return
    
    await supabase
      .from('room_state')
      .update({ background_id: backgroundId })
      .eq('room_id', room.id)
    
    // Optimistic update (realtime subscription will confirm)
    if (roomState) {
      setRoomState({ ...roomState, background_id: backgroundId })
    }
  }, [room, roomState])

  // Update presence periodically
  useEffect(() => {
    if (!currentParticipant) return

    const interval = setInterval(updatePresence, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [currentParticipant, updatePresence])

  const value: RoomContextValue = {
    room,
    roomState,
    participants,
    currentParticipant,
    isLoading,
    error,
    dndEnabledAt,
    joinRoom,
    leaveRoom,
    updatePresence,
    updateRoomName,
    updateParticipantName,
    toggleDoNotDisturb,
    updateBackground,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoomContext() {
  const context = useContext(RoomContext)
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider')
  }
  return context
}
