import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import { isPushSupported, subscribeUserToPush } from '../services/pushNotifications'

const NotificationContext = createContext()

export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const { activeRole, isAuthenticated, getToken } = useAuth()
  const isFetchingRef = useRef(false)

  const getRoleAuthHeaders = () => {
    const token = activeRole ? getToken(activeRole) : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

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
      const response = await api.get('/api/notifications', { headers: getRoleAuthHeaders() })
      setNotifications(response.data.data || [])
      
      const unread = (response.data.data || []).filter(n => !n.read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Erreur chargement notifications:', error)
      if (error.response?.status !== 500) {
        const details = error.response?.data || error.message || 'Erreur réseau ou backend indisponible'
        console.error('Détail erreur:', details)
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
      await api.put(`/api/notifications/${notificationId}/read`, {}, { headers: getRoleAuthHeaders() })
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
      await api.put('/api/notifications/read-all', {}, { headers: getRoleAuthHeaders() })
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Erreur marquage toutes notifications:', error)
    }
  }

  const enablePush = async () => {
    try {
      const token = activeRole ? getToken(activeRole) : null
      const result = await subscribeUserToPush(token)
      setPushEnabled(!!result?.success)
      if (!result?.success && !['push_not_configured', 'permission_denied', 'unsupported'].includes(result?.reason)) {
        console.warn('Activation push non aboutie:', result)
      }
      return result
    } catch (error) {
      console.error('Erreur activation push:', error)
      setPushEnabled(false)
      return { success: false }
    }
  }

  useEffect(() => {
    if (activeRole && isAuthenticated(activeRole)) {
      fetchNotifications()
      if (isPushSupported()) {
        enablePush()
      }

      const onFocusOrVisible = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications()
        }
      }

      window.addEventListener('focus', onFocusOrVisible)
      document.addEventListener('visibilitychange', onFocusOrVisible)
      window.addEventListener('online', fetchNotifications)

      const onServiceWorkerMessage = (event) => {
        if (event?.data?.type === 'REFRESH_NOTIFICATIONS') {
          fetchNotifications()
        }
      }
      navigator?.serviceWorker?.addEventListener?.('message', onServiceWorkerMessage)
      
      // Polling plus fréquent pour remonter plus vite les nouvelles demandes.
      const interval = setInterval(fetchNotifications, 7000)
      return () => {
        clearInterval(interval)
        window.removeEventListener('focus', onFocusOrVisible)
        document.removeEventListener('visibilitychange', onFocusOrVisible)
        window.removeEventListener('online', fetchNotifications)
        navigator?.serviceWorker?.removeEventListener?.('message', onServiceWorkerMessage)
      }
    }
  }, [activeRole])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      pushEnabled,
      enablePush,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  )
}