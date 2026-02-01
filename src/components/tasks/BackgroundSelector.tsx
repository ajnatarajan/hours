import { useState, useRef, useEffect } from 'react'
import { backgrounds, type Background } from '@/lib/backgrounds'
import { useRoomContext } from '@/contexts/RoomContext'

export function BackgroundSelector() {
  const { roomState, updateBackground } = useRoomContext()
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const currentBackgroundId = roomState?.background_id || 'video-1'
  const currentBackground = backgrounds.find(b => b.id === currentBackgroundId) || backgrounds[0]

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: Math.max(8, rect.right - 280), // Align right edge with button, but don't go off-screen
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = async (background: Background) => {
    await updateBackground(background.id)
    setIsOpen(false)
  }

  return (
    <div className="background-selector">
      <button
        ref={buttonRef}
        className="header-icon-btn-sm"
        title="Change background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Image/landscape icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="background-selector-dropdown"
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <div className="background-selector-header">Choose Background</div>
          <div className="background-selector-grid">
            {backgrounds.map((bg) => (
              <button
                key={bg.id}
                className={`background-option ${bg.id === currentBackground.id ? 'active' : ''}`}
                onClick={() => handleSelect(bg)}
                title={bg.name}
              >
                <video
                  src={bg.url}
                  muted
                  loop
                  playsInline
                  className="background-option-preview"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause()
                    e.currentTarget.currentTime = 0
                  }}
                />
                <span className="background-option-name">{bg.name}</span>
                {bg.id === currentBackground.id && (
                  <span className="background-option-check">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

