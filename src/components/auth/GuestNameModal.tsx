import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface GuestNameModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function GuestNameModal({ isOpen, onClose, onComplete }: GuestNameModalProps) {
  const { setGuestName } = useAuth()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    setGuestName(name.trim())
    setName('')
    setError('')
    onComplete()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Join as Guest</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--color-gray-700)', marginBottom: '8px' }}>
              Your Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
