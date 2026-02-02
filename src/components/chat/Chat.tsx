import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatContext } from '@/contexts/ChatContext'
import { useRoomContext } from '@/contexts/RoomContext'
import { getAvatarColor } from '@/lib/colors'

export function Chat() {
  const { messages, sendMessage, loadOlderMessages, isLoadingMore, hasMore } = useChatContext()
  const { currentParticipant, participants, dndEnabledAt } = useRoomContext()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasScrolledInitially = useRef(false)
  const prevScrollHeightRef = useRef<number>(0)
  const isLoadingOlderRef = useRef(false)

  // Filter out messages received while DND is active (but always show system messages)
  const visibleMessages = dndEnabledAt
    ? messages.filter(m => m.message_type === 'system' || m.created_at < dndEnabledAt)
    : messages
  
  const isDndActive = !!dndEnabledAt

  // Handle scroll behavior - instant on first load, smooth for new messages
  // Also preserve scroll position when older messages are prepended
  useEffect(() => {
    const container = containerRef.current
    if (!container || visibleMessages.length === 0) return

    if (!hasScrolledInitially.current) {
      // Instant snap on first render with messages
      container.scrollTop = container.scrollHeight
      hasScrolledInitially.current = true
    } else if (isLoadingOlderRef.current) {
      // Preserve scroll position after prepending older messages
      const newScrollHeight = container.scrollHeight
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current
      container.scrollTop = scrollDiff
      isLoadingOlderRef.current = false
    } else {
      // Smooth scroll for new messages (appended at bottom)
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [visibleMessages.length])

  // Handle scroll to load older messages
  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container || isLoadingMore || !hasMore) return

    // Trigger load when scrolled near the top (within 50px)
    if (container.scrollTop < 50) {
      // Capture scroll height before loading
      prevScrollHeightRef.current = container.scrollHeight
      isLoadingOlderRef.current = true
      loadOlderMessages()
    }
  }, [isLoadingMore, hasMore, loadOlderMessages])

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    setIsSending(true)
    const success = await sendMessage(content)
    setIsSending(false)

    if (success) {
      setContent('')
    }
    // Refocus input after send completes and scroll effect runs
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div className="chat-container">
      <div className="chat-tile-header">
        <div className="chat-tile-header-left">
          <span className="chat-tile-title">Chat</span>
          <div className="tile-header-icons">
            <img src="/strawberry.svg" alt="Strawberry" className="tile-header-strawberry" width="32" height="32" />
          </div>
        </div>
        <button className="chat-video-btn" title="Video Call">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      </div>

      <div ref={containerRef} className="chat-messages">
        {/* Loading indicator for older messages */}
        {isLoadingMore && (
          <div className="chat-loading-more">
            <span className="chat-loading-spinner" />
            Loading older messages...
          </div>
        )}
        {visibleMessages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '13px', padding: '20px 0' }}>
            {dndEnabledAt ? 'Do Not Disturb is on. Messages are hidden.' : 'No messages yet. Say hello! 👋'}
          </p>
        ) : (
          visibleMessages.map((message, index) => {
            // Render system messages differently
            if (message.message_type === 'system') {
              return (
                <div key={message.id} className="chat-system-message">
                  {message.content}
                </div>
              )
            }

            const isOwn = message.participant_id === currentParticipant?.id
            const participant = participants.find(p => p.id === message.participant_id)
            const name = participant?.name || 'Unknown'
            const initial = name.charAt(0).toUpperCase()
            const color = getAvatarColor(message.participant_id)
            const time = new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            // Check if this message should be grouped with the previous one
            // Group if same participant and previous message wasn't a system message
            const prevMessage = visibleMessages[index - 1]
            const isGrouped = prevMessage && 
              prevMessage.participant_id === message.participant_id && 
              prevMessage.message_type !== 'system'

            return (
              <div key={message.id} className={`chat-message ${isGrouped ? 'chat-message-grouped' : ''}`}>
                {!isGrouped && (
                  <div className="chat-message-header">
                    <div className="avatar avatar-sm" style={{ backgroundColor: color }}>
                      {initial}
                    </div>
                    <span className="chat-message-name">{isOwn ? 'You' : name}</span>
                    <span className="chat-message-time">{time}</span>
                  </div>
                )}
                <div className="chat-message-content" style={{ marginLeft: '32px' }}>
                  {message.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {isDndActive && (
        <div className="chat-system-message chat-dnd-warning">
          You cannot send or receive messages while you have Do Not Disturb activated
        </div>
      )}

      <form onSubmit={handleSubmit} className={`chat-input-container ${isDndActive ? 'chat-input-disabled' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isDndActive ? 'Do Not Disturb is active' : 'Message'}
          disabled={isSending || isDndActive}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!content.trim() || isSending || isDndActive}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
