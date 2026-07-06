import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CashierAuthContext = createContext()

export const useCashierAuth = () => {
  const context = useContext(CashierAuthContext)
  if (!context) {
    throw new Error('useCashierAuth must be used within a CashierAuthProvider')
  }
  return context
}

export const CashierAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { login: syncAuthLogin, logout: syncAuthLogout } = useAuth()

  useEffect(() => {
    // Initialiser l'état à partir du localStorage
    const token = localStorage.getItem('cashier_token')
    const userData = localStorage.getItem('cashier_user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        // Configurer le token pour l'API
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
    
    // Stocker dans localStorage
    localStorage.setItem('cashier_token', authToken)
    localStorage.setItem('cashier_user', JSON.stringify(userData))
    
    // Synchroniser avec l'auth globale utilisée par la cloche de notifications
    syncAuthLogin(userData, authToken, role)
    
    // Mettre à jour l'état
    setUser(userData)
    
    // Configurer l'API
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
  }

  const logout = () => {
    console.log('[CashierAuth] Déconnexion')
    
    // Supprimer du localStorage
    localStorage.removeItem('cashier_token')
    localStorage.removeItem('cashier_user')
    
    // Synchroniser avec l'auth globale
    syncAuthLogout('cashier')
    
    // Mettre à jour l'état
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