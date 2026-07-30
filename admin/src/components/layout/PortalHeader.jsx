import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import NotificationBell from '../NotificationBell'
import UpdateBadge from '../UpdateBadge'

const palettes = {
  admin: {
    icon: 'from-indigo-600 to-blue-500',
    active: 'bg-indigo-600 text-white shadow-sm shadow-indigo-200',
    focus: 'focus-visible:ring-indigo-500',
  },
  technician: {
    icon: 'from-blue-600 to-cyan-500',
    active: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
    focus: 'focus-visible:ring-blue-500',
  },
  cashier: {
    icon: 'from-emerald-600 to-teal-500',
    active: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
    focus: 'focus-visible:ring-emerald-500',
  },
  reseller: {
    icon: 'from-teal-600 to-emerald-500',
    active: 'bg-teal-600 text-white shadow-sm shadow-teal-200',
    focus: 'focus-visible:ring-teal-500',
  },
  vip: {
    icon: 'from-amber-600 to-orange-500',
    active: 'bg-amber-600 text-white shadow-sm shadow-amber-200',
    focus: 'focus-visible:ring-amber-500',
  },
}

export default function PortalHeader({
  role = 'admin',
  icon: Icon,
  title,
  subtitle,
  navItems = [],
  onLogout,
  isItemActive,
  actions,
}) {
  const location = useLocation()
  const palette = palettes[role] || palettes.admin
  const itemIsActive = (item) => (
    isItemActive
      ? isItemActive(item.path, location.pathname)
      : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-5 lg:px-8">
        <div className="flex min-h-16 items-center gap-2 py-2 sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${palette.icon} shadow-sm`}>
              {Icon ? <Icon aria-hidden="true" className="text-white" size={20} /> : null}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-slate-950 min-[400px]:text-base sm:text-lg">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-slate-500 sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            {actions}
            <NotificationBell />
            <UpdateBadge />
            <button
              type="button"
              onClick={onLogout}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-2.5 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 ${palette.focus} sm:px-3`}
              aria-label="Se déconnecter"
              title="Déconnexion"
            >
              <LogOut aria-hidden="true" size={18} />
              <span className="hidden lg:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {navItems.length > 0 ? (
          <nav
            className="scrollbar-hide flex gap-1 overflow-x-auto border-t border-slate-100 py-2"
            aria-label={`Navigation ${title}`}
          >
            {navItems.map((item) => {
              const active = itemIsActive(item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex min-h-10 flex-none items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 ${palette.focus} ${
                    active
                      ? palette.active
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        ) : null}
      </div>
    </header>
  )
}
