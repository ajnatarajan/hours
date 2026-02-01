import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRoomContext } from '@/contexts/RoomContext'

export function useTimer() {
  const { room, roomState } = useRoomContext()
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Compute seconds left from room state
  useEffect(() => {
    if (!roomState) {
      setSecondsLeft(0)
      return
    }

    const totalSeconds =
      (roomState.phase === 'focus' ? roomState.focus_minutes : roomState.break_minutes) * 60

    const tick = () => {
      if (!roomState.running || !roomState.started_at) {
        setSecondsLeft(totalSeconds)
        return
      }

      const elapsed = Math.floor(
        (Date.now() - new Date(roomState.started_at).getTime()) / 1000
      )
      const remaining = Math.max(0, totalSeconds - elapsed)
      setSecondsLeft(remaining)

      // Auto-switch phase when timer hits 0
      if (remaining === 0 && roomState.running) {
        switchPhase()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [roomState])

  const start = useCallback(async () => {
    if (!room) return

    await supabase
      .from('room_state')
      .update({
        running: true,
        started_at: new Date().toISOString(),
      })
      .eq('room_id', room.id)
  }, [room])

  const pause = useCallback(async () => {
    if (!room) return

    await supabase
      .from('room_state')
      .update({
        running: false,
        started_at: null,
      })
      .eq('room_id', room.id)
  }, [room])

  const reset = useCallback(async () => {
    if (!room) return

    await supabase
      .from('room_state')
      .update({
        running: false,
        started_at: null,
      })
      .eq('room_id', room.id)
  }, [room])

  const switchPhase = useCallback(async () => {
    if (!room || !roomState) return

    const newPhase = roomState.phase === 'focus' ? 'break' : 'focus'

    await supabase
      .from('room_state')
      .update({
        phase: newPhase,
        running: false,
        started_at: null,
      })
      .eq('room_id', room.id)
  }, [room, roomState])

  const setDurations = useCallback(
    async (focusMinutes: number, breakMinutes: number) => {
      if (!room) return

      await supabase
        .from('room_state')
        .update({
          focus_minutes: focusMinutes,
          break_minutes: breakMinutes,
        })
        .eq('room_id', room.id)
    },
    [room]
  )

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    phase: roomState?.phase ?? 'focus',
    isRunning: roomState?.running ?? false,
    focusMinutes: roomState?.focus_minutes ?? 25,
    breakMinutes: roomState?.break_minutes ?? 5,
    start,
    pause,
    reset,
    switchPhase,
    setDurations,
  }
}

