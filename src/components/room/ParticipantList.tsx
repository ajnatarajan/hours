import { useParticipants } from '@/hooks/useParticipants'
import { getAvatarColor } from '@/lib/colors'

export function ParticipantList() {
  const { participants, currentParticipant, isParticipantActive } = useParticipants()

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
        {participants.map((participant) => {
          const isMe = participant.id === currentParticipant?.id
          const isActive = isParticipantActive(participant)
          const initial = participant.name.charAt(0).toUpperCase()
          const color = getAvatarColor(participant.id)

          return (
            <div key={participant.id} className="participant-item">
              <div className="avatar" style={{ backgroundColor: color }}>
                {initial}
              </div>
              <span className="participant-name">
                {participant.name}
                {isMe && ' (you)'}
              </span>
              {isActive && (
                <span className="participant-timer-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                  00:00
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
