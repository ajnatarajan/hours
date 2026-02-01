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

interface ChatContextValue {
  messages: Message[]
  isLoading: boolean
  sendMessage: (content: string) => Promise<boolean>
  sendSystemMessage: (content: string) => Promise<boolean>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  scrollToBottom: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { room, currentParticipant } = useRoomContext()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Fetch messages for the room
  const fetchMessages = useCallback(async () => {
    if (!room) return

    setIsLoading(true)

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true })
      .limit(100)

    if (data) {
      setMessages(data)
    }

    setIsLoading(false)
  }, [room])

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        sendMessage,
        sendSystemMessage,
        messagesEndRef,
        scrollToBottom,
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

