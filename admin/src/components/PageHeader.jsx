import React from 'react'
import NotificationBell from './NotificationBell'

export default function PageHeader({ title, subtitle, description, actions }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell />
        {actions}
      </div>
    </div>
  )
}