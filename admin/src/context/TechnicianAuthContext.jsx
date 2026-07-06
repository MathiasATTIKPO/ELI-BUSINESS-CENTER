import React, { createContext, useContext, useState } from 'react'
import TokenManager from '../services/tokenManager'
import { useAuth } from './AuthContext'

const TechnicianAuthContext = createContext()

export const useTechnicianAuth = () => {
  const context = useContext(TechnicianAuthContext)
  if (!context) {
    throw new Error('useTechnicianAuth must be used within a TechnicianAuthProvider')
  }
  return context
}

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