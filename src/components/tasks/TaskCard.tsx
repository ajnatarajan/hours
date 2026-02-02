import { useState, useRef, useEffect } from 'react'
import { getAvatarColor } from '@/lib/colors'
import type { Participant, Task } from '@/types/database'

interface TaskCardProps {
  participant: Participant
  isCurrentUser: boolean
  tasks: Task[]
  onAddTask: (content: string) => Promise<Task | null>
  onToggleTask: (taskId: string) => Promise<void>
  onDeleteTask: (taskId: string) => Promise<void>
  onUpdateTask: (taskId: string, updates: { content?: string }) => Promise<void>
  onReorderTasks: (participantId: string, orderedTaskIds: string[]) => Promise<void>
  isLoading: boolean
}

export function TaskCard({ 
  participant, 
  isCurrentUser, 
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  onReorderTasks,
  isLoading 
}: TaskCardProps) {
  const [newTaskContent, setNewTaskContent] = useState('')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  
  const completedCount = tasks.filter((t) => t.done).length
  const totalCount = tasks.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const color = getAvatarColor(participant.id)

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingTaskId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingTaskId])

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

  const handleStartEdit = (task: Task, e: React.MouseEvent) => {
    if (!isCurrentUser) return
    // Prevent starting edit if we're dragging
    e.stopPropagation()
    setEditingTaskId(task.id)
    setEditContent(task.content)
  }

  const handleSaveEdit = async () => {
    if (!editingTaskId) {
      setEditingTaskId(null)
      return
    }
    
    const trimmedContent = editContent.trim()
    if (!trimmedContent) {
      // If content is empty, cancel the edit
      setEditingTaskId(null)
      setEditContent('')
      return
    }
    
    await onUpdateTask(editingTaskId, { content: trimmedContent })
    setEditingTaskId(null)
    setEditContent('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setEditingTaskId(null)
      setEditContent('')
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!isCurrentUser) {
      e.preventDefault()
      return
    }
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('dragging')
    }, 0)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('dragging')
    setDraggedTaskId(null)
    setDragOverTaskId(null)
  }

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    if (!isCurrentUser || taskId === draggedTaskId) return
    setDragOverTaskId(taskId)
  }

  const handleDragLeave = () => {
    setDragOverTaskId(null)
  }

  const handleDrop = async (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault()
    if (!isCurrentUser || !draggedTaskId || draggedTaskId === dropTargetId) {
      setDraggedTaskId(null)
      setDragOverTaskId(null)
      return
    }

    // Reorder tasks
    const taskIds = tasks.map(t => t.id)
    const draggedIndex = taskIds.indexOf(draggedTaskId)
    const dropIndex = taskIds.indexOf(dropTargetId)

    // Remove dragged item and insert at new position
    taskIds.splice(draggedIndex, 1)
    taskIds.splice(dropIndex, 0, draggedTaskId)

    await onReorderTasks(participant.id, taskIds)
    
    setDraggedTaskId(null)
    setDragOverTaskId(null)
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
              <div 
                key={task.id} 
                className={`task-item ${draggedTaskId === task.id ? 'dragging' : ''} ${dragOverTaskId === task.id ? 'drag-over' : ''}`}
                draggable={isCurrentUser && editingTaskId !== task.id}
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, task.id)}
              >
                <label className={`task-checkbox ${!isCurrentUser ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                    disabled={!isCurrentUser}
                  />
                  <span className="task-checkbox-custom" />
                </label>
                
                {editingTaskId === task.id ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    className="task-edit-input"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                  />
                ) : (
                  <span 
                    className={`task-text ${task.done ? 'completed' : ''} ${isCurrentUser ? 'editable' : ''}`}
                    onClick={(e) => handleStartEdit(task, e)}
                  >
                    {task.content}
                  </span>
                )}
                
                {isCurrentUser && editingTaskId !== task.id && (
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
