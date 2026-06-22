import React, { useState, useRef, useEffect } from 'react'
import { Bell, CheckCheck, X, Wrench, RefreshCw, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

export default function Header({ onMobileToggle }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef(null)

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'repair_completed': return <Wrench size={16} className="text-green-500" />
      case 'repair_assigned': return <Wrench size={16} className="text-blue-500" />
      case 'tradein_completed': return <RefreshCw size={16} className="text-green-500" />
      case 'tradein_assigned': return <RefreshCw size={16} className="text-blue-500" />
      default: return <Bell size={16} className="text-gray-500" />
    }
  }

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'repair_completed': return 'Réparation terminée'
      case 'repair_assigned': return 'Nouvelle réparation'
      case 'tradein_completed': return 'Échange terminé'
      case 'tradein_assigned': return 'Nouvel échange'
      default: return 'Notification'
    }
  }

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id)
    setShowNotifications(false)
    
    if (notification.type === 'repair_assigned' && notification.requestId) {
      navigate(`/admin/repairs/${notification.requestId}`)
    } else if (notification.type === 'tradein_assigned' && notification.requestId) {
      navigate(`/admin/tradeins/${notification.requestId}`)
    }
  }

  return (
    <header className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row justify-between items-center gap-4 shadow-sm">
      <div className="flex items-center gap-3 w-full lg:w-auto">
        {onMobileToggle && (
          <button onClick={onMobileToggle} className="lg:hidden p-2 rounded-xl bg-white text-slate-700 shadow-sm hover:bg-slate-100 transition">
            ☰
          </button>
        )}
        <div>
          <p className="text-slate-500 text-sm">{today}</p>
          <p className="text-lg font-semibold text-slate-900">Tableau de bord administrateur</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 w-full lg:w-auto justify-end">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          >
            <Bell size={20} className="text-slate-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500 mt-1">{unreadCount} non lue(s)</p>
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <CheckCheck size={14} /> Tout lire
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-sm text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notif.read ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          {getNotificationIcon(notif.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {getNotificationTitle(notif.type)}
                            </p>
                            {!notif.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="rounded-xl bg-slate-100 px-4 py-2">
          <p className="text-xs text-slate-500">Administrateur</p>
          <p className="font-semibold text-slate-900 text-sm">{user?.email || 'Admin'}</p>
        </div>
        
        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold shadow-md">
          {(user?.email?.[0] || 'A').toUpperCase()}
        </div>
      </div>
    </header>
  )
}