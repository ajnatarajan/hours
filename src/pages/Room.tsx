import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRoomContext } from '@/contexts/RoomContext'
import { useChatContext } from '@/contexts/ChatContext'
import { useParticipants } from '@/hooks/useParticipants'
import { useTasks } from '@/hooks/useTasks'
import { useTimer } from '@/hooks/useTimer'
import { ParticipantList } from '@/components/room/ParticipantList'
import { Chat } from '@/components/chat/Chat'
import { Timer } from '@/components/timer/Timer'
import { TaskCard } from '@/components/tasks/TaskCard'
import { RoomTitleSection } from '@/components/room/RoomTitleSection'
import { GuestNameModal } from '@/components/auth/GuestNameModal'
import { BackgroundSelector } from '@/components/tasks/BackgroundSelector'
import { backgrounds, defaultBackground } from '@/lib/backgrounds'

export function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { displayName } = useAuth()
  const { room, roomState, joinRoom, leaveRoom, isLoading, error, toggleDoNotDisturb, setCurrentTask } = useRoomContext()
  const { sendSystemMessage } = useChatContext()
  const { sortedActiveParticipants, currentParticipant } = useParticipants()
  
  // Single instance of useTasks - state lifted up to Room level
  const { allTasks, addTask, updateTask, toggleTask, deleteTask, reorderTasks, isLoading: tasksLoading } = useTasks()
  
  // Timer state for document title
  const { formattedTime, isRunning } = useTimer()

  const [showNameModal, setShowNameModal] = useState(false)
  const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false)

  // Derive current background from room state
  const currentBackgroundId = roomState?.background_id || 'video-1'
  const currentBackground = backgrounds.find(b => b.id === currentBackgroundId) || defaultBackground

  const handleToggleDnd = async () => {
    const newDndStatus = await toggleDoNotDisturb()
    if (currentParticipant) {
      const statusText = newDndStatus ? 'enabled' : 'disabled'
      await sendSystemMessage(`${currentParticipant.name} ${statusText} Do Not Disturb`)
    }
  }

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

  // Update document title with timer countdown
  useEffect(() => {
    if (isRunning) {
      document.title = `${formattedTime} - Hours for Audrey`
    } else {
      document.title = 'Hours for Audrey'
    }
    
    // Cleanup: reset title when leaving the room
    return () => {
      document.title = 'Hours for Audrey'
    }
  }, [isRunning, formattedTime])

  const handleNameComplete = () => {
    setShowNameModal(false)
    // Don't call joinRoom here - let the useEffect handle it
    // once displayName is properly updated in context
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
            <span className="logo-sub">for Audrey</span>
          </div>
          <img src="/cherry-blossom-icon.png" alt="" className="logo-icon" />
        </div>

        <div className="header-actions">
          {/* Do Not Disturb Toggle */}
          <label className="toggle-container toggle-dnd" title={currentParticipant?.do_not_disturb ? 'Disable Do Not Disturb' : 'Enable Do Not Disturb'}>
            <input
              type="checkbox"
              checked={currentParticipant?.do_not_disturb ?? false}
              onChange={handleToggleDnd}
            />
            <span className="toggle-slider" />
            <span className="toggle-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              DND
            </span>
          </label>

          {/* Settings Icon */}
          <button className="header-icon-btn" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
            {/* Background Video */}
            <video
              key={currentBackground.id}
              className="tasks-bg-video"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src={currentBackground.url} type="video/mp4" />
            </video>
            
            <div className="tasks-panel-header">
              <span>Tasks</span>
              <img src="/heart.svg" alt="Heart" className="tasks-header-heart" width="32" height="32" />
              <BackgroundSelector />
            </div>
            <div className="tasks-grid">
              {sortedActiveParticipants.map((participant) => (
                <TaskCard
                  key={participant.id}
                  participant={participant}
                  isCurrentUser={participant.id === currentParticipant?.id}
                  tasks={allTasks
                    .filter(t => t.participant_id === participant.id)
                    .sort((a, b) => a.sort_order - b.sort_order)}
                  currentTaskId={participant.current_task_id ?? null}
                  onAddTask={addTask}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onUpdateTask={updateTask}
                  onReorderTasks={reorderTasks}
                  onSetCurrentTask={setCurrentTask}
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
