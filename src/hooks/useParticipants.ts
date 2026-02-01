import { useMemo } from 'react'
import { useRoomContext } from '@/contexts/RoomContext'
import type { Participant } from '@/types/database'

export function useParticipants() {
  const { participants, currentParticipant } = useRoomContext()

  // Sorted participants: current user first, then others by join time (created_at)
  const sortedParticipants = useMemo(() => {
    if (!currentParticipant) return participants

    const others = participants
      .filter((p) => p.id !== currentParticipant.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    const current = participants.find((p) => p.id === currentParticipant.id)
    return current ? [current, ...others] : others
  }, [participants, currentParticipant])

  const otherParticipants = useMemo(() => {
    return participants.filter((p) => p.id !== currentParticipant?.id)
  }, [participants, currentParticipant])

  const isParticipantActive = (participant: Participant): boolean => {
    if (!participant.last_seen) return false
    const lastSeen = new Date(participant.last_seen).getTime()
    const now = Date.now()
    // Consider active if seen within last 2 minutes
    return now - lastSeen < 2 * 60 * 1000
  }

  const activeParticipants = useMemo(() => {
    return participants.filter(isParticipantActive)
  }, [participants])

  return {
    participants,
    sortedParticipants,
    currentParticipant,
    otherParticipants,
    activeParticipants,
    isParticipantActive,
  }
}

