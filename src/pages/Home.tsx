import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GuestNameModal } from '@/components/auth/GuestNameModal'
import { AuthModal } from '@/components/auth/AuthModal'
import { useAuth } from '@/contexts/AuthContext'
import { useRoom } from '@/hooks/useRoom'

export function Home() {
  const navigate = useNavigate()
  const { displayName, isAuthenticated, signOut } = useAuth()
  const { createRoom, getRoomByCode } = useRoom()

  const [joinCode, setJoinCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<'create' | 'join' | null>(null)

  // Core actions - perform the work without auth checks
  const performCreateRoom = async () => {
    setIsCreating(true)
    setError('')

    const room = await createRoom()
    if (room) {
      navigate(`/room/${room.code}`)
    } else {
      setError('Failed to create room')
    }

    setIsCreating(false)
  }

  const performJoinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsJoining(true)
    setError('')

    const room = await getRoomByCode(joinCode.trim())
    if (room) {
      navigate(`/room/${room.code}`)
    } else {
      setError('Room not found')
    }

    setIsJoining(false)
  }

  // Execute pending action after auth completes
  const executePendingAction = () => {
    if (pendingAction === 'create') {
      performCreateRoom()
    } else if (pendingAction === 'join') {
      performJoinRoom()
    }
    setPendingAction(null)
  }

  // UI handlers - check auth, prompt if needed
  const handleCreateRoom = () => {
    if (!displayName) {
      setPendingAction('create')
      setShowGuestModal(true)
      return
    }
    performCreateRoom()
  }

  const handleJoinRoom = () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code')
      return
    }
    if (!displayName) {
      setPendingAction('join')
      setShowGuestModal(true)
      return
    }
    performJoinRoom()
  }

  // Modal completion handlers
  const handleGuestComplete = () => {
    setShowGuestModal(false)
    executePendingAction()
  }

  const handleAuthComplete = () => {
    setShowAuthModal(false)
    executePendingAction()
  }

  return (
    <div className="home-container">
      {/* User status */}
      {displayName && (
        <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="user-badge">
            <span className="user-badge-name">{displayName}</span>
          </div>
          {isAuthenticated && (
            <button className="btn btn-ghost" onClick={signOut}>
              Sign Out
            </button>
          )}
        </div>
      )}

      {/* Logo */}
      <div className="home-logo">
        hours<img src="/cherry-blossom-icon.png" alt="" className="home-logo-icon" />
      </div>
      <p className="home-tagline">A site I built specifically for you, Audrey.</p>

      {/* Main card */}
      <div className="home-card">
        {/* Create room section */}
        <div>
          <div className="home-card-title">Start a new session</div>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleCreateRoom}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        {/* Divider */}
        <div className="home-divider">
          <div className="home-divider-line" />
          <span className="home-divider-text">or join existing</span>
          <div className="home-divider-line" />
        </div>

        {/* Join room section */}
        <div>
          <input
            type="text"
            className="input"
            placeholder="Enter room code..."
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJoinRoom()
              }
            }}
          />
          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: '12px' }}
            onClick={handleJoinRoom}
            disabled={isJoining}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {/* Error message */}
        {error && <div className="error-message">{error}</div>}

        {/* Auth link */}
        {!displayName && (
          <div className="home-footer">
            <a href="#" onClick={(e) => { e.preventDefault(); setShowAuthModal(true) }}>
              Sign in for persistent identity
            </a>
          </div>
        )}
      </div>

      {/* Modals */}
      <GuestNameModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false)
          setPendingAction(null)
        }}
        onComplete={handleGuestComplete}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false)
          setPendingAction(null)
        }}
        onComplete={handleAuthComplete}
      />
    </div>
  )
}
