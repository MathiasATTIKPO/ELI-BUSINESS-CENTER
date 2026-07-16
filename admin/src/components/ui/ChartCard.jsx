import React from 'react'

export default function ChartCard({ title, icon: Icon, iconClassName = 'text-blue-600', children, actions }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {Icon ? <Icon size={20} className={iconClassName} /> : null}
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </div>
  )
}
