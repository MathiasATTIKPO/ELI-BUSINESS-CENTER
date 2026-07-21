import React, { createContext, useState } from 'react'
import TokenManager from '../services/tokenManager'
import { useAuth } from '../hooks/useAuth'

export const ResellerAuthContext = createContext(null)

export const ResellerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => TokenManager.getUser('reseller'))
  const [token, setToken] = useState(() => TokenManager.getTokenByRole('reseller'))
  const [loading, setLoading] = useState(false)
  const { login: syncAuthLogin, logout: syncAuthLogout } = useAuth()

  const login = (userData, authToken, role = 'reseller') => {
    TokenManager.saveToken('reseller', authToken)
    TokenManager.saveUser('reseller', userData)
    syncAuthLogin(userData, authToken, role)
    setUser(userData)
    setToken(authToken)
  }

  const logout = () => {
    TokenManager.clearRole('reseller')
    syncAuthLogout('reseller')
    setUser(null)
    setToken(null)
  }

  const value = { user, token, loading, login, logout, isAuthenticated: !!user && !!token }
  return <ResellerAuthContext.Provider value={value}>{children}</ResellerAuthContext.Provider>
}