import { useState, useEffect, useRef } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useChatContext } from '@/contexts/ChatContext'
import { useRoomContext } from '@/contexts/RoomContext'

export function Timer() {
  const { secondsLeft, isRunning, timerSeconds, start, pause, setTimerSeconds } = useTimer()
  const { sendSystemMessage } = useChatContext()
  const { currentParticipant } = useRoomContext()
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customHours, setCustomHours] = useState('0')
  const [customMinutes, setCustomMinutes] = useState('25')
  const [customSeconds, setCustomSeconds] = useState('0')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync custom time fields with actual timerSeconds from room state
  useEffect(() => {
    if (isCustomMode) {
      const h = Math.floor(timerSeconds / 3600)
      const m = Math.floor((timerSeconds % 3600) / 60)
      const s = timerSeconds % 60
      setCustomHours(h.toString())
      setCustomMinutes(m.toString())
      setCustomSeconds(s.toString())
    }
  }, [timerSeconds, isCustomMode])

  // Determine which preset is currently active based on timerSeconds
  const getCurrentPreset = () => {
    if (isCustomMode) return 'Custom'
    if (timerSeconds === 25 * 60) return '25 mins'
    if (timerSeconds === 50 * 60) return '50 mins'
    return '----------'
  }

  const handlePresetChange = async (value: string) => {
    if (value === '25 mins') {
      setIsCustomMode(false)
      await setTimerSeconds(25 * 60)
    } else if (value === '50 mins') {
      setIsCustomMode(false)
      await setTimerSeconds(50 * 60)
    } else if (value === 'Custom') {
      setIsCustomMode(true)
      const h = Math.floor(timerSeconds / 3600)
      const m = Math.floor((timerSeconds % 3600) / 60)
      const s = timerSeconds % 60
      setCustomHours(h.toString())
      setCustomMinutes(m.toString())
      setCustomSeconds(s.toString())
    } else {
      // "----------" option - exit custom mode but don't change duration
      setIsCustomMode(false)
    }
  }

  const updateTimerFromCustomInputs = (h: string, m: string, s: string) => {
    // Debounce the database update for live editing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(async () => {
      const hours = parseInt(h, 10) || 0
      const mins = parseInt(m, 10) || 0
      const secs = parseInt(s, 10) || 0
      const totalSeconds = hours * 3600 + mins * 60 + secs
      
      // Allow anything from 1 second to 24 hours
      if (totalSeconds > 0 && totalSeconds <= 24 * 3600) {
        await setTimerSeconds(totalSeconds)
      }
    }, 300) // 300ms debounce
  }

  const handleCustomHoursChange = (value: string) => {
    const clamped = Math.min(Math.max(parseInt(value, 10) || 0, 0), 23).toString()
    setCustomHours(value === '' ? '' : clamped)
    updateTimerFromCustomInputs(clamped, customMinutes, customSeconds)
  }

  const handleCustomMinutesChange = (value: string) => {
    const clamped = Math.min(Math.max(parseInt(value, 10) || 0, 0), 59).toString()
    setCustomMinutes(value === '' ? '' : clamped)
    updateTimerFromCustomInputs(customHours, clamped, customSeconds)
  }

  const handleCustomSecondsChange = (value: string) => {
    const clamped = Math.min(Math.max(parseInt(value, 10) || 0, 0), 59).toString()
    setCustomSeconds(value === '' ? '' : clamped)
    updateTimerFromCustomInputs(customHours, customMinutes, clamped)
  }

  const handleBackToPresets = () => {
    setIsCustomMode(false)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }

  const hours = Math.floor(secondsLeft / 3600)
  const minutes = Math.floor((secondsLeft % 3600) / 60)
  const seconds = secondsLeft % 60

  const formattedTime = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Format duration for chat messages
  const formatDurationForMessage = (totalSecs: number): string => {
    const h = Math.floor(totalSecs / 3600)
    const m = Math.floor((totalSecs % 3600) / 60)
    const s = totalSecs % 60
    
    if (h > 0 && m > 0 && s > 0) {
      return `${h}h ${m}m ${s}s`
    } else if (h > 0 && m > 0) {
      return `${h}h ${m}m`
    } else if (h > 0) {
      return `${h}h`
    } else if (m > 0 && s > 0) {
      return `${m}m ${s}s`
    } else if (m > 0) {
      return `${m} min${m !== 1 ? 's' : ''}`
    } else {
      return `${s}s`
    }
  }

  const handleToggle = async () => {
    const participantName = currentParticipant?.name || 'Someone'
    
    if (isRunning) {
      // Stopping the timer
      await pause()
      await sendSystemMessage(`Timer stopped by ${participantName}.`)
    } else {
      // Starting the timer
      await start()
      await sendSystemMessage(`Timer started for ${formatDurationForMessage(timerSeconds)} by ${participantName}.`)
    }
  }

  return (
    <div className="timer-tile-content">
      <div className="timer-tile-header">
        <span className="timer-tile-title">Timer</span>
        <div className="timer-header-icons">
          <button className="header-icon-btn-sm" title="Help">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>
          <button className="header-icon-btn-sm" title="Notifications">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>
        </div>
      </div>

      <div className="timer-display-large">{formattedTime}</div>

      <div className="timer-controls-row">
        {isCustomMode ? (
          // Custom mode: HH:MM:SS inputs
          <div className="timer-custom-inline">
            <button 
              className="timer-back-btn"
              onClick={handleBackToPresets}
              title="Back to presets"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <input
              type="number"
              className="timer-custom-input-hms"
              value={customHours}
              onChange={(e) => handleCustomHoursChange(e.target.value)}
              placeholder="0"
              min="0"
              max="23"
              title="Hours"
            />
            <span className="timer-custom-separator">:</span>
            <input
              type="number"
              className="timer-custom-input-hms"
              value={customMinutes}
              onChange={(e) => handleCustomMinutesChange(e.target.value)}
              placeholder="25"
              min="0"
              max="59"
              autoFocus
              title="Minutes"
            />
            <span className="timer-custom-separator">:</span>
            <input
              type="number"
              className="timer-custom-input-hms"
              value={customSeconds}
              onChange={(e) => handleCustomSecondsChange(e.target.value)}
              placeholder="0"
              min="0"
              max="59"
              title="Seconds"
            />
          </div>
        ) : (
          // Preset mode: show dropdown
          <select 
            className="timer-preset-select"
            value={getCurrentPreset()}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option>----------</option>
            <option>25 mins</option>
            <option>50 mins</option>
            <option>Custom</option>
          </select>
        )}

        <button
          className="timer-toggle-btn"
          onClick={handleToggle}
          title={isRunning ? 'Pause' : 'Start'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

