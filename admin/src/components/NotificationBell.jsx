import React, { useState } from 'react'
import { Bell, CheckCheck, X } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { activeRole, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Ne pas afficher si non authentifié
  if (!activeRole || !isAuthenticated(activeRole)) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <CheckCheck size={14} />
                  Tout marquer
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => !notification.read && markAsRead(notification._id)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}