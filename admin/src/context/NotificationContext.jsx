import React, { createContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { subscribeUserToPush } from '../services/pushNotifications'

export const NotificationContext = createContext(null)

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
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Erreur marquage notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all', {}, { headers: getRoleAuthHeaders() })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
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
      return result
    } catch (error) {
      console.error('Erreur activation push:', error)
      setPushEnabled(false)
      return { success: false }
    }
  }

  useEffect(() => {
    if (activeRole && isAuthenticated(activeRole)) {
      // Let the business-critical dashboard requests finish before starting
      // optional notification traffic. Push remains available via enablePush.
      const initialFetchTimer = setTimeout(fetchNotifications, 15000)

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
      
      // Seven-second polling creates unnecessary serverless/database pressure.
      // Focus, visibility and push events still refresh immediately.
      const interval = setInterval(fetchNotifications, 60000)
      return () => {
        clearTimeout(initialFetchTimer)
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
