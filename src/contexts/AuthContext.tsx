import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

const GUEST_NAME_KEY = 'hours_guest_name'

interface AuthContextValue {
  user: User | null
  session: Session | null
  guestName: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  displayName: string | null
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  setGuestName: (name: string) => void
  clearGuestName: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [guestName, setGuestNameState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(GUEST_NAME_KEY)
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error: error as Error | null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const setGuestName = useCallback((name: string) => {
    localStorage.setItem(GUEST_NAME_KEY, name)
    setGuestNameState(name)
  }, [])

  const clearGuestName = useCallback(() => {
    localStorage.removeItem(GUEST_NAME_KEY)
    setGuestNameState(null)
  }, [])

  const isAuthenticated = !!user
  const isGuest = !user && !!guestName
  const displayName = user?.email?.split('@')[0] ?? guestName

  const value: AuthContextValue = {
    user,
    session,
    guestName,
    isLoading,
    isAuthenticated,
    isGuest,
    displayName,
    signIn,
    signUp,
    signOut,
    setGuestName,
    clearGuestName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

