import { useMemo } from 'react'
import { useRoomContext } from '@/contexts/RoomContext'
import type { Participant } from '@/types/database'

export function useParticipants() {
  const { participants, currentParticipant } = useRoomContext()

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
    currentParticipant,
    otherParticipants,
    activeParticipants,
    isParticipantActive,
  }
}

