import React, { useId, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth' 

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, pushEnabled, enablePush } = useNotifications()
  const { activeRole, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()

  // Ne pas afficher si non authentifié
  if (!activeRole || !isAuthenticated(activeRole)) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue(s)` : 'Notifications'}
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <Bell aria-hidden="true" size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            id={panelId}
            className="fixed left-3 right-3 top-[4.5rem] z-50 mt-2 max-h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-80"
            role="dialog"
            aria-label="Centre de notifications"
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {!pushEnabled && (
                  <button
                    type="button"
                    onClick={enablePush}
                    className="min-h-8 rounded-lg px-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    Activer push
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <CheckCheck aria-hidden="true" size={14} />
                    Tout marquer
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[min(24rem,calc(100dvh-11rem))] overflow-y-auto">
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
