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
    <span
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100 px-1.5 text-xs font-semibold text-amber-800 sm:px-2.5"
      title={`${unreadCount} nouvelle(s) mise(s) à jour`}
      aria-label={`${unreadCount} nouvelle(s) mise(s) à jour`}
    >
      <span className="hidden md:inline">Mises à jour</span>
      <span className={`inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full text-[10px] font-bold ${unreadCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-200 text-amber-800'}`}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    </span>
  )
}
