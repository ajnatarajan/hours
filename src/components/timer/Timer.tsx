import { useState, useEffect, useRef } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useChatContext } from '@/contexts/ChatContext'
import { useRoomContext } from '@/contexts/RoomContext'

export function Timer() {
  const { secondsLeft, isRunning, timerMinutes, start, pause, setMinutes } = useTimer()
  const { sendSystemMessage } = useChatContext()
  const { currentParticipant } = useRoomContext()
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync custom minutes with actual timerMinutes from room state
  useEffect(() => {
    // Only update customMinutes if we're in custom mode and the value changed externally
    if (isCustomMode) {
      setCustomMinutes(timerMinutes.toString())
    }
  }, [timerMinutes, isCustomMode])

  // Determine which preset is currently active based on timerMinutes
  const getCurrentPreset = () => {
    if (isCustomMode) return 'Custom'
    if (timerMinutes === 25) return '25 mins'
    if (timerMinutes === 50) return '50 mins'
    return '----------'
  }

  const handlePresetChange = async (value: string) => {
    if (value === '25 mins') {
      setIsCustomMode(false)
      await setMinutes(25)
    } else if (value === '50 mins') {
      setIsCustomMode(false)
      await setMinutes(50)
    } else if (value === 'Custom') {
      setIsCustomMode(true)
      setCustomMinutes(timerMinutes.toString())
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
        await setMinutes(mins)
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

  const formattedTime = hours > 0
    ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const handleToggle = async () => {
    const participantName = currentParticipant?.name || 'Someone'
    
    if (isRunning) {
      // Stopping the timer
      await pause()
      await sendSystemMessage(`Timer stopped by ${participantName}.`)
    } else {
      // Starting the timer
      await start()
      await sendSystemMessage(`Timer started for ${timerMinutes} mins by ${participantName}.`)
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

