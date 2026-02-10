import { useMemo } from 'react'
import { useRoomContext } from '@/contexts/RoomContext'
import type { Participant } from '@/types/database'

export function useParticipants() {
  const { participants, currentParticipant } = useRoomContext()

  // Sorted participants: current user first, then others by join time (created_at, then id for stability)
  const sortedParticipants = useMemo(() => {
    if (!currentParticipant) return participants

    const others = participants
      .filter((p) => p.id !== currentParticipant.id)
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime()
        const timeB = new Date(b.created_at).getTime()
        if (timeA !== timeB) return timeA - timeB
        return a.id.localeCompare(b.id)
      })

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
    // Consider active if seen within last 30 seconds
    return now - lastSeen < 30 * 1000
  }

  const activeParticipants = useMemo(() => {
    return participants.filter(isParticipantActive)
  }, [participants])

  // Sorted ACTIVE participants: current user first, then active others by join time
  const sortedActiveParticipants = useMemo(() => {
    if (!currentParticipant) return participants.filter(isParticipantActive)

    const activeOthers = participants
      .filter((p) => p.id !== currentParticipant.id && isParticipantActive(p))
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime()
        const timeB = new Date(b.created_at).getTime()
        if (timeA !== timeB) return timeA - timeB
        return a.id.localeCompare(b.id)
      })

    return [currentParticipant, ...activeOthers]
  }, [participants, currentParticipant])

  return {
    participants,
    sortedParticipants,
    sortedActiveParticipants,
    currentParticipant,
    otherParticipants,
    activeParticipants,
    isParticipantActive,
  }
}

