import { useState } from 'react'
import { useChat } from '@/hooks/useChat'
import { useRoomContext } from '@/contexts/RoomContext'
import { getAvatarColor } from '@/lib/colors'

export function Chat() {
  const { messages, messagesEndRef, sendMessage } = useChat()
  const { currentParticipant, participants } = useRoomContext()
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    setIsSending(true)
    const success = await sendMessage(content)
    setIsSending(false)

    if (success) {
      setContent('')
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-tile-header">
        <div className="chat-tile-header-left">
          <span className="chat-tile-title">Chat</span>
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
        <button className="chat-video-btn" title="Video Call">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-gray-400)', fontSize: '13px', padding: '20px 0' }}>
            No messages yet. Say hello! 👋
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.participant_id === currentParticipant?.id
            const participant = participants.find(p => p.id === message.participant_id)
            const name = participant?.name || 'Unknown'
            const initial = name.charAt(0).toUpperCase()
            const color = getAvatarColor(message.participant_id)
            const time = new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={message.id} className="chat-message">
                <div className="chat-message-header">
                  <div className="avatar avatar-sm" style={{ backgroundColor: color }}>
                    {initial}
                  </div>
                  <span className="chat-message-name">{isOwn ? 'You' : name}</span>
                  <span className="chat-message-time">{time}</span>
                </div>
                <div className="chat-message-content" style={{ marginLeft: '32px' }}>
                  {message.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Message"
          disabled={isSending}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!content.trim() || isSending}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
