import { useState, useRef, useEffect } from 'react'
import { useRoomContext } from '@/contexts/RoomContext'

interface RoomTitleSectionProps {
  roomCode: string
  roomName: string | null
  onLeave: () => void
}

export function RoomTitleSection({ roomCode, roomName, onLeave }: RoomTitleSectionProps) {
  const { updateRoomName } = useRoomContext()
  const [copied, setCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const roomUrl = `${window.location.origin}${import.meta.env.BASE_URL}room/${roomCode}`

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleEditClick = () => {
    setEditedName(roomName || '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmedName = editedName.trim()
    await updateRoomName(trimmedName || null)
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
    <div className="room-info-content">
      {/* Title at top center */}
      <div className="room-title-wrapper">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="room-title-input"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="Room title..."
            maxLength={45}
          />
        ) : (
          <>
            <h1 className="room-title">
              {roomName || 'Study With Your Babi'}
            </h1>
            <button className="edit-title-btn" title="Edit title" onClick={handleEditClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Bottom row: link, copy, icons */}
      <div className="room-link-row">
        <input
          type="text"
          className="room-link-input"
          value={roomUrl}
          readOnly
        />
        <button
          className="room-link-copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>

        {/* Action Icons */}
        <div className="room-action-icons">
          <button className="room-action-btn room-action-btn-green" title="Music">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </button>
          <button className="room-action-btn room-action-btn-red" title="Leave Room" onClick={onLeave}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
