import { useState, useEffect, useCallback, useRef } from 'react'
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

  // Keep a ref to the latest fetchTasks for stable subscription callback
  const fetchTasksRef = useRef(fetchTasks)
  useEffect(() => {
    fetchTasksRef.current = fetchTasks
  }, [fetchTasks])

  // Initial fetch - only when room changes
  useEffect(() => {
    if (room) {
      fetchTasks()
    }
  }, [room?.id])

  // Subscribe to task changes - depends only on room (stable)
  useEffect(() => {
    if (!room) return

    const channel = supabase
      .channel(`tasks:${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          fetchTasksRef.current()
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

      return data
    },
    [room, currentParticipant, allTasks]
  )

  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Pick<Task, 'content' | 'done' | 'sort_order'>>) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', taskId)

      if (error) {
        console.error('Failed to update task:', error)
      }
    },
    []
  )

  // Use allTasks to find the task for toggling
  const toggleTask = useCallback(
    async (taskId: string) => {
      const task = allTasks.find((t) => t.id === taskId)
      if (!task) return

      await updateTask(taskId, { done: !task.done })
    },
    [allTasks, updateTask]
  )

  const deleteTask = useCallback(async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) {
      console.error('Failed to delete task:', error)
    }
  }, [])

  return {
    allTasks,
    isLoading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  }
}
