import React, { createContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'

export const CashierAuthContext = createContext(null)

export const CashierAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { login: syncAuthLogin, logout: syncAuthLogout } = useAuth()

  useEffect(() => {
    const token = localStorage.getItem('cashier_token')
    const userData = localStorage.getItem('cashier_user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        console.log('[CashierAuth] Utilisateur chargé:', parsedUser.name)
      } catch (error) {
        console.error('[CashierAuth] Erreur parsing userData:', error)
        localStorage.removeItem('cashier_token')
        localStorage.removeItem('cashier_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, authToken, role = 'cashier') => {
    console.log('[CashierAuth] Connexion:', userData.name)
    localStorage.setItem('cashier_token', authToken)
    localStorage.setItem('cashier_user', JSON.stringify(userData))
    syncAuthLogin(userData, authToken, role)
    setUser(userData)
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  const logout = () => {
    console.log('[CashierAuth] Déconnexion')
    localStorage.removeItem('cashier_token')
    localStorage.removeItem('cashier_user')
    syncAuthLogout('cashier')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    activeRole: 'cashier'
  }

  return (
    <CashierAuthContext.Provider value={value}>
      {children}
    </CashierAuthContext.Provider>
  )
}