import React, { createContext, useState } from 'react'
import TokenManager from '../services/tokenManager'
import { useAuth } from '../hooks/useAuth'

export const VIPAuthContext = createContext(null)

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