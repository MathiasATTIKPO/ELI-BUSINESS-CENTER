import React, { createContext, useContext, useState } from 'react'
import TokenManager from '../services/tokenManager'
import { useAuth } from './AuthContext'

const VIPAuthContext = createContext()

export const useVIPAuth = () => {
  const context = useContext(VIPAuthContext)
  if (!context) {
    throw new Error('useVIPAuth must be used within a VIPAuthProvider')
  }
  return context
}

export const VIPAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => TokenManager.getUser('vip'))
  const [token, setToken] = useState(() => TokenManager.getTokenByRole('vip'))
  const [loading, setLoading] = useState(false)
  const { login: syncAuthLogin, logout: syncAuthLogout } = useAuth()

  const login = (userData, authToken, role = 'vip') => {
    TokenManager.saveToken('vip', authToken)
    TokenManager.saveUser('vip', userData)
    syncAuthLogin(userData, authToken, role)
    setUser(userData)
    setToken(authToken)
  }

  const logout = () => {
    TokenManager.clearRole('vip')
    syncAuthLogout('vip')
    setUser(null)
    setToken(null)
  }

  const value = { user, token, loading, login, logout, isAuthenticated: !!user && !!token }
  return <VIPAuthContext.Provider value={value}>{children}</VIPAuthContext.Provider>
}
