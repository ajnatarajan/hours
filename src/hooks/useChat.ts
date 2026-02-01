import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRoomContext } from '@/contexts/RoomContext'
import type { Message } from '@/types/database'

export function useChat() {
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

  // Subscribe to new messages - depends only on room (stable)
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
          setMessages((prev) => [...prev, newMessage])
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

      const { error } = await supabase.from('messages').insert({
        room_id: room.id,
        participant_id: currentParticipant.id,
        content: content.trim(),
      })

      if (error) {
        console.error('Failed to send message:', error)
        return false
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

  return {
    messages,
    isLoading,
    sendMessage,
    messagesEndRef,
    scrollToBottom,
  }
}
