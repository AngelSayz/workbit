import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { authAPI } from '../api/apiService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await handleAuthUser(session.user)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error getting session:', err)
        setError('Error loading authentication')
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await handleAuthUser(session.user)
        } else {
          setUser(null)
          setLoading(false)
          localStorage.removeItem('workbit_token')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthUser = async (authUser) => {
    try {
      setLoading(true)
      
      // Get JWT token and user data from our backend
      const response = await authAPI.login(authUser.email, '')
      
      if (response.token && response.user) {
        // Store JWT token for API calls
        localStorage.setItem('workbit_token', response.token)
        
        // Check if user has admin or technician role
        const allowedRoles = ['admin', 'technician']
        if (allowedRoles.includes(response.user.role)) {
          setUser(response.user)
          setError(null)
        } else {
          // User doesn't have required permissions
          setError('No tienes permisos para acceder a esta aplicación. Solo administradores y técnicos pueden acceder.')
          await supabase.auth.signOut()
          setUser(null)
        }
      } else {
        setError('Error al obtener los datos del usuario')
        await supabase.auth.signOut()
        setUser(null)
      }
    } catch (err) {
      console.error('Error handling auth user:', err)
      setError('Error al validar el usuario. Verifica que tu cuenta esté registrada en el sistema.')
      await supabase.auth.signOut()
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      setError(null)
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        throw authError
      }
      
      // The onAuthStateChange listener will handle the rest
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      localStorage.removeItem('workbit_token')
      setUser(null)
      setError(null)
    } catch (err) {
      console.error('Sign out error:', err)
      setError('Error al cerrar sesión')
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user
  }
} 