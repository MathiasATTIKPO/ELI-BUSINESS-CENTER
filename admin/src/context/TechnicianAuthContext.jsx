import React, { createContext, useState } from 'react'
import TokenManager from '../services/tokenManager'
import { useAuth } from '../hooks/useAuth'

export const TechnicianAuthContext = createContext(null)

export const TechnicianAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => TokenManager.getUser('technician'))
  const [token, setToken] = useState(() => TokenManager.getTokenByRole('technician'))
  const [loading, setLoading] = useState(false)
  const { login: syncAuthLogin, logout: syncAuthLogout } = useAuth()

  const login = (userData, authToken, role = 'technician') => {
    console.log('[TechnicianAuthContext] Login - Saving technician credentials')
    TokenManager.saveToken('technician', authToken)
    TokenManager.saveUser('technician', userData)
    syncAuthLogin(userData, authToken, role)
    setUser(userData)
    setToken(authToken)
  }

  const logout = () => {
    console.log('[TechnicianAuthContext] Logout - Clearing technician session')
    TokenManager.clearRole('technician')
    syncAuthLogout('technician')
    setUser(null)
    setToken(null)
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user && !!token
  }

  return (
    <TechnicianAuthContext.Provider value={value}>
      {children}
    </TechnicianAuthContext.Provider>
  )
}