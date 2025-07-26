import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { authAPI } from '../api/apiService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await handleAuthUser(session.user)
        } else {
          setLoading(false)
          setIsInitialized(true)
        }
      } catch (err) {
        console.error('Error getting session:', err)
        setError('Error loading authentication')
        setLoading(false)
        setIsInitialized(true)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          await handleAuthUser(session.user)
        } else {
          setUser(null)
          setLoading(false)
          localStorage.removeItem('workbit_token')
          setIsInitialized(true)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthUser = async (authUser) => {
    try {
      // Solo hacer loading si es la primera vez
      if (!isInitialized) {
        setLoading(true)
      }
      
      // Verificar si ya tenemos los datos del usuario en localStorage
      const cachedUser = localStorage.getItem('workbit_user')
      const cachedToken = localStorage.getItem('workbit_token')
      
      if (cachedUser && cachedToken && !isInitialized) {
        try {
          const userData = JSON.parse(cachedUser)
          // Verificar que el usuario cacheado corresponde al usuario actual de Supabase
          if (userData.supabaseUserId === authUser.id) {
            setUser(userData)
            setError(null)
            setLoading(false)
            setIsInitialized(true)
            return
          }
        } catch (e) {
          // Si hay error al parsear, continuar con la llamada al backend
        }
      }
      
      // Get user profile from our backend using the Supabase user ID
      const response = await authAPI.getUserBySupabaseId(authUser.id)
      
      if (response.user) {
        // Store JWT token and user data for future use
        localStorage.setItem('workbit_token', response.token)
        localStorage.setItem('workbit_user', JSON.stringify({
          ...response.user,
          supabaseUserId: authUser.id
        }))
        
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
      setIsInitialized(true)
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
      localStorage.removeItem('workbit_user')
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