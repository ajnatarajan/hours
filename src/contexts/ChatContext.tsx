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
import { useRoomContext } from './RoomContext'
import type { Message } from '@/types/database'

const MESSAGES_PER_PAGE = 100

interface ChatContextValue {
  messages: Message[]
  isLoading: boolean
  isLoadingMore: boolean
  hasMore: boolean
  sendMessage: (content: string) => Promise<boolean>
  sendSystemMessage: (content: string) => Promise<boolean>
  loadOlderMessages: () => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { room, currentParticipant } = useRoomContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const hasMoreRef = useRef(true)

  // Fetch most recent messages for the room
  const fetchMessages = useCallback(async () => {
    if (!room) return

    setIsLoading(true)
    hasMoreRef.current = true

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })  // Newest first
      .limit(MESSAGES_PER_PAGE)

    if (data) {
      // Reverse for chronological display (oldest at top, newest at bottom)
      setMessages(data.reverse())
      // If we got fewer than the limit, there are no more older messages
      hasMoreRef.current = data.length === MESSAGES_PER_PAGE
    }

    setIsLoading(false)
  }, [room])

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async () => {
    if (!room || isLoadingMore || !hasMoreRef.current || messages.length === 0) return

    const oldestMessage = messages[0]
    setIsLoadingMore(true)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .lt('created_at', oldestMessage.created_at)  // Older than current oldest
      .order('created_at', { ascending: false })   // Newest of the older batch first
      .limit(MESSAGES_PER_PAGE)

    if (data && data.length > 0) {
      // Reverse for chronological order and prepend to existing messages
      setMessages((prev) => [...data.reverse(), ...prev])
      hasMoreRef.current = data.length === MESSAGES_PER_PAGE
    } else {
      hasMoreRef.current = false
    }

    setIsLoadingMore(false)
  }, [room, isLoadingMore, messages])

  // Initial fetch
  useEffect(() => {
    fetchMessages()
  }, [room?.id])

  // Subscribe to new messages
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`messages:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => {
            // Avoid duplicates from optimistic updates
            if (prev.some((m) => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!room || !currentParticipant || !content.trim()) return false

      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: room.id,
          participant_id: currentParticipant.id,
          content: content.trim(),
          message_type: 'user',
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to send message:', error)
        return false
      }

      // Immediately add to local state for the sender
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          return [...prev, data]
        })
      }

      return true
    },
    [room, currentParticipant]
  )

  const sendSystemMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!room || !currentParticipant || !content.trim()) return false

      const { data, error } = await supabase
        .from('messages')
        .insert({
          room_id: room.id,
          participant_id: currentParticipant.id,
          content: content.trim(),
          message_type: 'system',
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to send system message:', error)
        return false
      }

      // Immediately add to local state for the sender
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          return [...prev, data]
        })
      }

      return true
    },
    [room, currentParticipant]
  )

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isLoadingMore,
        hasMore: hasMoreRef.current,
        sendMessage,
        sendSystemMessage,
        loadOlderMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

