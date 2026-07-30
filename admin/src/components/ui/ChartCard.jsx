import React from 'react'

export default function ChartCard({ title, icon: Icon, iconClassName = 'text-blue-600', children, actions }) {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
          {Icon ? <Icon size={20} className={iconClassName} /> : null}
          <span className="break-words">{title}</span>
        </h3>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
