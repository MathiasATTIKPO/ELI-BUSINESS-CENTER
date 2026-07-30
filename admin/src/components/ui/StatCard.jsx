import React from 'react'

export default function StatCard({ icon: Icon, title, value, subtitle, gradient }) {
  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md sm:p-5 lg:p-6">
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5 sm:space-y-2">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="break-words text-xl font-bold tabular-nums text-gray-900 sm:text-2xl lg:text-3xl">{value}</p>
          {subtitle && <p className="break-words text-xs leading-relaxed text-gray-500">{subtitle}</p>}
        </div>
        <div className={`shrink-0 rounded-xl bg-gradient-to-r p-2.5 transition-transform duration-200 group-hover:scale-105 sm:p-3 ${gradient}`}>
          <Icon aria-hidden="true" size={22} className="text-white sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  )
}
