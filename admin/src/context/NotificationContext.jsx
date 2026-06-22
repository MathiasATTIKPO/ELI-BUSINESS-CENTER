import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { activeRole, isAuthenticated } = useAuth()

  const fetchNotifications = async () => {
    // Ne pas charger les notifications si pas authentifié
    if (!activeRole || !isAuthenticated(activeRole)) {
      console.log('[NotificationContext] Non authentifié, skip fetch')
      setLoading(false)
      return
    }
    
    try {
      // Récupérer les notifications selon le rôle
      const endpoint = `/api/${activeRole}/notifications`
      console.log(`[NotificationContext] Fetching from ${endpoint}`)
      
      const response = await api.get(endpoint)
      setNotifications(response.data.data || [])
      
      const unread = (response.data.data || []).filter(n => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      // Ne pas afficher d'erreur si c'est juste un 500 (endpoint peut ne pas exister)
      if (error.response?.status !== 500) {
        console.error('Détail erreur:', error.response?.data)
      }
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/${activeRole}/notifications/${notificationId}/read`)
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur marquage notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put(`/api/${activeRole}/notifications/read-all`)
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error)
    }
  }

  useEffect(() => {
    if (activeRole && isAuthenticated(activeRole)) {
      fetchNotifications()
      
      // Polling toutes les 30 secondes
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [activeRole])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}