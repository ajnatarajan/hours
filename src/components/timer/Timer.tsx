import { useState, useEffect, useRef } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useChatContext } from '@/contexts/ChatContext'
import { useRoomContext } from '@/contexts/RoomContext'

export function Timer() {
  const { secondsLeft, isRunning, focusMinutes, start, pause, setDurations } = useTimer()
  const { sendSystemMessage } = useChatContext()
  const { currentParticipant } = useRoomContext()
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync custom minutes with actual focusMinutes from room state
  useEffect(() => {
    // Only update customMinutes if we're in custom mode and the value changed externally
    if (isCustomMode) {
      setCustomMinutes(focusMinutes.toString())
    }
  }, [focusMinutes, isCustomMode])

  // Determine which preset is currently active based on focusMinutes
  const getCurrentPreset = () => {
    if (isCustomMode) return 'Custom'
    if (focusMinutes === 25) return '25 min focus'
    if (focusMinutes === 50) return '50 min focus'
    return '----------'
  }

  const handlePresetChange = async (value: string) => {
    if (value === '25 min focus') {
      setIsCustomMode(false)
      await setDurations(25, 5)
    } else if (value === '50 min focus') {
      setIsCustomMode(false)
      await setDurations(50, 10)
    } else if (value === 'Custom') {
      setIsCustomMode(true)
      setCustomMinutes(focusMinutes.toString())
    } else {
      // "----------" option - exit custom mode but don't change duration
      setIsCustomMode(false)
    }
  }

  const handleCustomMinutesChange = (value: string) => {
    setCustomMinutes(value)
    
    // Debounce the database update for live editing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(async () => {
      const mins = parseInt(value, 10)
      if (!isNaN(mins) && mins > 0 && mins <= 180) {
        // Calculate a reasonable break time (roughly 1/5 of focus time, minimum 5 mins)
        const breakMins = Math.max(5, Math.ceil(mins / 5))
        await setDurations(mins, breakMins)
      }
    }, 300) // 300ms debounce
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

  const formattedTime = [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')

  const handleToggle = async () => {
    const participantName = currentParticipant?.name || 'Someone'
    
    if (isRunning) {
      // Stopping the timer
      await pause()
      await sendSystemMessage(`Timer stopped by ${participantName}.`)
    } else {
      // Starting the timer
      await start()
      await sendSystemMessage(`Timer started for ${focusMinutes} mins by ${participantName}.`)
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
          // Custom mode: inline input replaces dropdown
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
              className="timer-custom-input-inline"
              value={customMinutes}
              onChange={(e) => handleCustomMinutesChange(e.target.value)}
              placeholder="45"
              min="1"
              max="180"
              autoFocus
            />
            <span className="timer-custom-label-inline">mins</span>
          </div>
        ) : (
          // Preset mode: show dropdown
          <select 
            className="timer-preset-select"
            value={getCurrentPreset()}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option>----------</option>
            <option>25 min focus</option>
            <option>50 min focus</option>
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

