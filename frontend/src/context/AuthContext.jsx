import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin, getToken, setToken, clearToken } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => Boolean(getToken()))

  useEffect(() => {
    const handleExpired = () => setIsAdmin(false)
    window.addEventListener('nidhi-session-expired', handleExpired)
    return () => window.removeEventListener('nidhi-session-expired', handleExpired)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password)
    setToken(data.access_token)
    setIsAdmin(true)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
