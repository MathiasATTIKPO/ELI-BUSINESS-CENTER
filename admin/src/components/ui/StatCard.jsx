import React from 'react'

export default function StatCard({ icon: Icon, title, value, subtitle, gradient }) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform duration-200`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )
}
