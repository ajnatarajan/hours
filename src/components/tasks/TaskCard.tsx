import { useState, useRef } from 'react'
import { getAvatarColor } from '@/lib/colors'
import type { Participant, Task } from '@/types/database'

interface TaskCardProps {
  participant: Participant
  isCurrentUser: boolean
  tasks: Task[]
  onAddTask: (content: string) => Promise<Task | null>
  onToggleTask: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  isLoading: boolean
}

export function TaskCard({ 
  participant, 
  isCurrentUser, 
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isLoading 
}: TaskCardProps) {
  const [newTaskContent, setNewTaskContent] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const completedCount = tasks.filter((t) => t.done).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const color = getAvatarColor(participant.id)

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskContent.trim() || isLoading) return

    await onAddTask(newTaskContent.trim())
    setNewTaskContent('')
    
    // Refocus input after task is added
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }

  return (
    <div className="task-card">
      {/* Header with name and progress */}
      <div className="task-card-header" style={{ backgroundColor: color }}>
        <span className="task-card-name">{participant.name}</span>
        <div className="task-card-progress">
          <div className="task-card-progress-bar">
            <div 
              className="task-card-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="task-card-progress-text">{progressPercent}%</span>
        </div>
      </div>

      {/* Task list */}
      <div className="task-card-body">
        {tasks.length === 0 ? (
          <div className="task-empty">
            <img 
              src={`${import.meta.env.BASE_URL}cherry-blossom.png`} 
              alt="Cherry blossom" 
              className="task-empty-icon"
            />
            <span className="task-empty-text">No tasks yet!</span>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-item">
                <label className={`task-checkbox ${!isCurrentUser ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                    disabled={!isCurrentUser}
                  />
                  <span className="task-checkbox-custom" />
                </label>
                <span className={`task-text ${task.done ? 'completed' : ''}`}>
                  {task.content}
                </span>
                {isCurrentUser && (
                  <button
                    className="task-delete-btn"
                    onClick={() => onDeleteTask(task.id)}
                    title="Delete task"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add task input - only for current user */}
      {isCurrentUser && (
        <form onSubmit={handleAddTask} className="task-add-container">
          <input
            ref={inputRef}
            type="text"
            className="task-add-input"
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="Add Task"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="task-add-btn"
            disabled={!newTaskContent.trim() || isLoading}
          >
            +
          </button>
        </form>
      )}
    </div>
  )
}
