import React, { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const roles = ['admin', 'cashier', 'technician']
      let found = false
      
      for (const role of roles) {
        const token = localStorage.getItem(`${role}_token`)
        const userData = localStorage.getItem(`${role}_user`)
        
        if (token && userData) {
          try {
            setUser(JSON.parse(userData))
            setActiveRole(role)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            found = true
            console.log(`[AuthContext] Authentifié en tant que ${role}`)
            break
          } catch (error) {
            console.error(`[AuthContext] Erreur parsing userData pour ${role}:`, error)
          }
        }
      }
      
      if (!found) {
        console.log('[AuthContext] Aucun utilisateur authentifié trouvé')
      }
      
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = (userData, token, role) => {
    console.log(`[AuthContext] Login - rôle: ${role}`, userData)
    
    // Stockage
    localStorage.setItem(`${role}_token`, token)
    localStorage.setItem(`${role}_user`, JSON.stringify(userData))
    localStorage.setItem('active_role', role)
    
    // Mise à jour du state
    setUser(userData)
    setActiveRole(role)
    
    // Configuration de l'API
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  const logout = (role) => {
    console.log(`[AuthContext] Logout demandé pour le rôle: ${role}`)
    
    if (role) {
      // Supprimer uniquement le rôle spécifié
      localStorage.removeItem(`${role}_token`)
      localStorage.removeItem(`${role}_user`)
      
      // Vérifier si c'était le rôle actif
      if (activeRole === role) {
        // Chercher un autre rôle connecté
        const roles = ['admin', 'cashier', 'technician']
        let found = false
        
        for (const r of roles) {
          if (r === role) continue
          const token = localStorage.getItem(`${r}_token`)
          const userData = localStorage.getItem(`${r}_user`)
          
          if (token && userData) {
            try {
              setUser(JSON.parse(userData))
              setActiveRole(r)
              api.defaults.headers.common['Authorization'] = `Bearer ${token}`
              localStorage.setItem('active_role', r)
              found = true
              console.log(`[AuthContext] Changé vers le rôle ${r}`)
              break
            } catch (error) {
              console.error(`[AuthContext] Erreur parsing userData pour ${r}:`, error)
            }
          }
        }
        
        if (!found) {
          // Déconnexion totale
          setUser(null)
          setActiveRole(null)
          delete api.defaults.headers.common['Authorization']
          localStorage.removeItem('active_role')
          console.log('[AuthContext] Déconnexion totale')
        }
      }
    } else {
      // Déconnexion totale
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('cashier_token')
      localStorage.removeItem('cashier_user')
      localStorage.removeItem('technician_token')
      localStorage.removeItem('technician_user')
      localStorage.removeItem('active_role')
      
      setUser(null)
      setActiveRole(null)
      delete api.defaults.headers.common['Authorization']
      console.log('[AuthContext] Déconnexion totale')
    }
  }

  const isAuthenticated = (role) => {
    const token = localStorage.getItem(`${role}_token`)
    return !!token
  }

  const getToken = (role) => {
    return localStorage.getItem(`${role}_token`)
  }

  return (
    <AuthContext.Provider value={{
      user,
      activeRole,
      loading,
      login,
      logout,
      isAuthenticated,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}