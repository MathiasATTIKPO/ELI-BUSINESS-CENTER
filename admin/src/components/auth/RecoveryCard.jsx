import React from 'react'
import { ArrowLeft, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const variants = {
  reseller: {
    page: 'from-emerald-900 via-teal-900 to-slate-950',
    icon: 'from-emerald-600 to-teal-500',
    focus: 'focus:border-emerald-500 focus:ring-emerald-200',
    button: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
  },
  vip: {
    page: 'from-amber-900 via-orange-900 to-slate-950',
    icon: 'from-amber-600 to-orange-500',
    focus: 'focus:border-amber-500 focus:ring-amber-200',
    button: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
  },
}

export default function RecoveryCard({
  role = 'reseller',
  title,
  subtitle,
  backTo,
  children,
}) {
  const variant = variants[role] || variants.reseller
  const content = Array.isArray(children)
    ? children.map((child, index) => (
        typeof child === 'function'
          ? <React.Fragment key={`recovery-content-${index}`}>{child(variant)}</React.Fragment>
          : child
      ))
    : (typeof children === 'function' ? children(variant) : children)

  return (
    <div className={`flex min-h-[100dvh] items-start justify-center overflow-y-auto bg-gradient-to-br px-4 py-6 sm:items-center sm:py-8 ${variant.page}`}>
      <section className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${variant.icon}`}>
            <KeyRound aria-hidden="true" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
        </div>

        {content}

        {backTo ? (
          <Link
            to={backTo}
            className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <ArrowLeft aria-hidden="true" size={16} />
            Retour à la connexion
          </Link>
        ) : null}
      </section>
    </div>
  )
}
