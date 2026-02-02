import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRoomContext } from '@/contexts/RoomContext'
import type { Task } from '@/types/database'

export function useTasks() {
  const { room, currentParticipant } = useRoomContext()
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch tasks for the room
  const fetchTasks = useCallback(async () => {
    if (!room) return

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('room_id', room.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (data) {
      setAllTasks(data)
    }
  }, [room])

  // Initial fetch - only when room changes
  useEffect(() => {
    if (room) {
      fetchTasks()
    }
  }, [room?.id])

  // Subscribe to task changes with individual event handlers (like chat)
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`tasks:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newTask = payload.new as Task
          setAllTasks((prev) => {
            // Avoid duplicates from optimistic updates
            if (prev.some((t) => t.id === newTask.id)) return prev
            return [...prev, newTask]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const updatedTask = payload.new as Task
          setAllTasks((prev) =>
            prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks',
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const deletedTask = payload.old as { id: string }
          setAllTasks((prev) => prev.filter((t) => t.id !== deletedTask.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room])

  const addTask = useCallback(
    async (content: string): Promise<Task | null> => {
      if (!room || !currentParticipant) return null

      setIsLoading(true)

      // Use allTasks to compute max sort order
      const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map((t) => t.sort_order)) : 0

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          room_id: room.id,
          participant_id: currentParticipant.id,
          content,
          sort_order: maxOrder + 1,
        })
        .select()
        .single()

      setIsLoading(false)

      if (error) {
        console.error('Failed to add task:', error)
        return null
      }

      // Immediately add to local state (like chat)
      if (data) {
        setAllTasks((prev) => {
          if (prev.some((t) => t.id === data.id)) return prev
          return [...prev, data]
        })
      }

      return data
    },
    [room, currentParticipant, allTasks]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Pick<Task, 'content' | 'done' | 'sort_order'>>) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        console.error('Failed to update task:', error)
        return
      }

      // Immediately update local state (like chat)
      if (data) {
        setAllTasks((prev) =>
          prev.map((t) => (t.id === data.id ? data : t))
        )
      }
    },
    []
  )

  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = allTasks.find((t) => t.id === taskId)
      if (!task) return

      const { data, error } = await supabase
        .from('tasks')
        .update({ done: !task.done })
        .eq('id', taskId)
        .select()
        .single()

      if (error) {
        console.error('Failed to toggle task:', error)
        return
      }

      // Immediately update local state (like chat)
      if (data) {
        setAllTasks((prev) =>
          prev.map((t) => (t.id === data.id ? data : t))
        )
      }
    },
    [allTasks]
  )

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Failed to delete task:', error)
      return
    }

    // Immediately remove from local state (like chat)
    setAllTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const reorderTasks = useCallback(
    async (participantId: string, orderedTaskIds: string[]) => {
      // Optimistically update local state first
      setAllTasks((prev) => {
        const participantTasks = prev.filter(t => t.participant_id === participantId)
        const otherTasks = prev.filter(t => t.participant_id !== participantId)
        
        // Reorder participant's tasks based on the new order
        const reorderedTasks = orderedTaskIds.map((id, index) => {
          const task = participantTasks.find(t => t.id === id)
          return task ? { ...task, sort_order: index } : null
        }).filter(Boolean) as Task[]
        
        return [...otherTasks, ...reorderedTasks]
      })

      // Update in database
      const updates = orderedTaskIds.map((id, index) => 
        supabase.from('tasks').update({ sort_order: index }).eq('id', id)
      )
      
      await Promise.all(updates)
    },
    []
  )

  return {
    allTasks,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    reorderTasks,
  }
}
