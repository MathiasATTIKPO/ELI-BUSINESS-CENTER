import React from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../hooks/useAuth'

export default function UpdateBadge() {
  const { unreadCount } = useNotifications()
  const { activeRole, isAuthenticated } = useAuth()

  if (!activeRole || !isAuthenticated(activeRole)) {
    return null
  }

  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
      Nouvelles mises a jour
      <span className={`inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-200 text-amber-800'}`}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </span>
  )
}
