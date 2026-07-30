import React from 'react'

export default function PageHeader({ title, subtitle, description, actions }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        {description && <p className="text-sm text-gray-500">{description}</p>}
        <h1 className="break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-600 sm:text-base">{subtitle}</p>}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3 md:w-auto md:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
