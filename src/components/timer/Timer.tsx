import { useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { useChatContext } from '@/contexts/ChatContext'
import { useRoomContext } from '@/contexts/RoomContext'

export function Timer() {
  const { secondsLeft, isRunning, focusMinutes, start, pause } = useTimer()
  const { sendSystemMessage } = useChatContext()
  const { currentParticipant } = useRoomContext()
  const [selectedPreset, setSelectedPreset] = useState('----------')

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
      
      // Determine the duration text based on preset or minutes
      let durationText: string
      if (selectedPreset === 'Custom' || selectedPreset === '----------') {
        if (focusMinutes === 25 || focusMinutes === 50) {
          durationText = `${focusMinutes} mins`
        } else {
          durationText = 'Custom'
        }
      } else if (selectedPreset.includes('min')) {
        durationText = `${focusMinutes} mins`
      } else {
        durationText = 'Custom'
      }
      
      await sendSystemMessage(`Timer started for ${durationText} by ${participantName}.`)
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
        <select 
          className="timer-preset-select"
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
        >
          <option>----------</option>
          <option>25 min focus</option>
          <option>50 min focus</option>
          <option>Custom</option>
        </select>

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
