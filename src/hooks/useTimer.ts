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

    const totalSeconds = roomState.timer_minutes * 60

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

      // Stop timer when it hits 0
      if (remaining === 0 && roomState.running) {
        stop()
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

  const stop = useCallback(async () => {
    if (!room) return

    await supabase
      .from('room_state')
      .update({
        running: false,
        started_at: null,
      })
      .eq('room_id', room.id)
  }, [room])

  const setMinutes = useCallback(
    async (minutes: number) => {
      if (!room) return

      await supabase
        .from('room_state')
        .update({
          timer_minutes: minutes,
        })
        .eq('room_id', room.id)
    },
    [room]
  )

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    secondsLeft,
    formattedTime: formatTime(secondsLeft),
    isRunning: roomState?.running ?? false,
    timerMinutes: roomState?.timer_minutes ?? 25,
    start,
    pause,
    stop,
    setMinutes,
  }
}

