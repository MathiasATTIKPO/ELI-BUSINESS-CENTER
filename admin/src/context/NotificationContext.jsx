import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { activeRole, isAuthenticated } = useAuth()
  const isFetchingRef = useRef(false)

  const fetchNotifications = async () => {
    if (isFetchingRef.current) return

    // Ne pas charger les notifications si pas authentifié
    if (!activeRole || !isAuthenticated(activeRole)) {
      console.log('[NotificationContext] Non authentifié, skip fetch')
      setLoading(false)
      return
    }

    isFetchingRef.current = true
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
      isFetchingRef.current = false
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

      const onFocusOrVisible = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications()
        }
      }

      window.addEventListener('focus', onFocusOrVisible)
      document.addEventListener('visibilitychange', onFocusOrVisible)
      window.addEventListener('online', fetchNotifications)
      
      // Polling plus fréquent pour remonter plus vite les nouvelles demandes.
      const interval = setInterval(fetchNotifications, 7000)
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', onFocusOrVisible)
        document.removeEventListener('visibilitychange', onFocusOrVisible)
        window.removeEventListener('online', fetchNotifications)
      }
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