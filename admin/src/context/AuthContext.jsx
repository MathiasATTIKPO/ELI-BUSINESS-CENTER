import React, { createContext, useContext, useState, useCallback } from 'react'
import TokenManager from '../services/tokenManager'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => TokenManager.getUser('admin'))
  const [token, setToken] = useState(() => TokenManager.getTokenByRole('admin'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = useCallback((userData, authToken) => {
    console.log('[AuthContext] Login - Saving admin credentials')
    // Sauvegarder via TokenManager
    TokenManager.saveToken('admin', authToken)
    TokenManager.saveUser('admin', userData)
    
    // Mettre à jour l'état
    setToken(authToken)
    setUser(userData)
    setError(null)
  }, [])

  const logout = useCallback(() => {
    console.log('[AuthContext] Logout - Clearing admin session')
    TokenManager.clearRole('admin')
    setUser(null)
    setToken(null)
  }, [])

  const isAuthenticated = !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isAuthenticated, setLoading, setError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  }
  return context
}
