import { useState, useRef, useEffect } from 'react'
import { useParticipants } from '@/hooks/useParticipants'
import { useRoomContext } from '@/contexts/RoomContext'
import { getAvatarColor } from '@/lib/colors'

export function ParticipantList() {
  const { sortedParticipants, currentParticipant, isParticipantActive } = useParticipants()
  const { updateParticipantName } = useRoomContext()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [, forceUpdate] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Force re-render every second to update break timers
  useEffect(() => {
    const hasBreakingParticipants = sortedParticipants.some(p => p.on_break)
    if (!hasBreakingParticipants) return
    
    const interval = setInterval(() => forceUpdate(n => n + 1), 1000)
    return () => clearInterval(interval)
  }, [sortedParticipants])

  // Helper function to format break duration
  const formatBreakDuration = (startedAt: string | null): string => {
    if (!startedAt) return '00:00'
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleEditClick = () => {
    if (currentParticipant) {
      setEditedName(currentParticipant.name)
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    const trimmedName = editedName.trim()
    if (trimmedName && trimmedName !== currentParticipant?.name) {
      await updateParticipantName(trimmedName)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedName('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  return (
    <div>
      <div className="tile-header-with-icons">
        <span className="tile-header-title">Participants</span>
        <div className="tile-header-icons">
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
      <div className="participant-list">
        {sortedParticipants.map((participant) => {
          const isMe = participant.id === currentParticipant?.id
          const isActive = isParticipantActive(participant)
          const initial = participant.name.charAt(0).toUpperCase()
          const color = getAvatarColor(participant.id)

          return (
            <div key={participant.id} className="participant-item">
              <div className="avatar" style={{ backgroundColor: color }}>
                {initial}
              </div>
              {isMe && isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="participant-name-input"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleSave}
                  placeholder="Your name..."
                  maxLength={30}
                />
              ) : (
                <>
                  <span className="participant-name">
                    {participant.name}
                    {isMe && ' (you)'}
                  </span>
                  {isMe && (
                    <button className="edit-name-btn" title="Edit your name" onClick={handleEditClick}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </>
              )}
              {participant.do_not_disturb && (
                <span className="participant-dnd-badge" title="Do Not Disturb">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </span>
              )}
              {participant.on_break && (
                <span className="participant-break-badge" title="On Break">
                  <img src="/bunny.svg" alt="" width="14" height="14" />
                  <span className="break-timer">{formatBreakDuration(participant.break_started_at)}</span>
                </span>
              )}
              {!isActive && (
                <span className="participant-inactive-badge">
                  <span className="inactive-dot" />
                  inactive
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
