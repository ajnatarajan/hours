import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRoomContext } from '@/contexts/RoomContext'
import { useParticipants } from '@/hooks/useParticipants'
import { useTasks } from '@/hooks/useTasks'
import { ParticipantList } from '@/components/room/ParticipantList'
import { Chat } from '@/components/chat/Chat'
import { Timer } from '@/components/timer/Timer'
import { TaskCard } from '@/components/tasks/TaskCard'
import { RoomTitleSection } from '@/components/room/RoomTitleSection'
import { GuestNameModal } from '@/components/auth/GuestNameModal'

export function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const { room, joinRoom, leaveRoom, isLoading, error } = useRoomContext()
  const { sortedParticipants, currentParticipant } = useParticipants()
  
  // Single instance of useTasks - state lifted up to Room level
  const { allTasks, addTask, toggleTask, deleteTask, isLoading: tasksLoading } = useTasks()

  const [showNameModal, setShowNameModal] = useState(false)
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false)
  const [soloMode, setSoloMode] = useState(false)

  useEffect(() => {
    if (!code) {
      navigate('/')
      return
    }

    if (!displayName && !hasAttemptedJoin) {
      setShowNameModal(true)
    } else if (displayName && !room && !isLoading && !hasAttemptedJoin) {
      setHasAttemptedJoin(true)
      joinRoom(code)
    }
  }, [code, displayName, room, isLoading, hasAttemptedJoin, joinRoom, navigate])

  const handleNameComplete = () => {
    setShowNameModal(false)
    if (code) {
      setHasAttemptedJoin(true)
      joinRoom(code)
    }
  }

  const handleLeave = () => {
    leaveRoom()
    navigate('/')
  }

  if (showNameModal) {
    return (
      <div className="loading-container">
        <GuestNameModal
          isOpen={true}
          onClose={() => navigate('/')}
          onComplete={handleNameComplete}
        />
      </div>
    )
  }

  if (isLoading || !room) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">{error || 'Joining room...'}</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-logo">
          <div className="logo-text">
            <span className="logo-main">hours</span>
            <span className="logo-sub">by fiveable</span>
          </div>
          <span className="logo-dot" />
        </div>

        <div className="header-actions">
          {/* Solo Mode Toggle */}
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={soloMode}
              onChange={(e) => setSoloMode(e.target.checked)}
            />
            <span className="toggle-slider" />
            <span className="toggle-label">Solo mode</span>
          </label>

          {/* Moon Icon (Dark Mode) */}
          <button className="header-icon-btn" title="Toggle dark mode">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>

          {/* Settings Icon */}
          <button className="header-icon-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* Help Icon */}
          <button className="header-icon-btn" title="Help">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </button>

          {/* Sign Up Button */}
          <button className="btn-signup">Sign up</button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {/* Row 1: Three Tiles */}
        <div className="dashboard-row dashboard-row-top">
          {/* Tile 1: Participants */}
          <div className="tile tile-participants">
            <ParticipantList />
          </div>

          {/* Tile 2: Room Info & Share Link */}
          <div className="tile tile-room-info">
            <RoomTitleSection roomCode={room.code} roomName={room.name} onLeave={handleLeave} />
          </div>

          {/* Tile 3: Timer */}
          <div className="tile tile-timer">
            <Timer />
          </div>
        </div>

        {/* Row 2: Two Tiles */}
        <div className="dashboard-row dashboard-row-bottom">
          {/* Tile: Chat */}
          <div className="tile tile-chat">
            <Chat />
          </div>

          {/* Tile: Tasks */}
          <div className="tile tile-tasks">
            <div className="tasks-panel-header">
              <span>Tasks</span>
              <div className="tasks-header-icons">
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
            <div className="tasks-grid">
              {sortedParticipants.map((participant) => (
                <TaskCard
                  key={participant.id}
                  participant={participant}
                  isCurrentUser={participant.id === currentParticipant?.id}
                  tasks={allTasks.filter(t => t.participant_id === participant.id)}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  isLoading={tasksLoading}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
