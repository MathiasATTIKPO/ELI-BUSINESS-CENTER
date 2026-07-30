// src/components/Toast.jsx
import React, { useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
  const icon = type === 'success' ? <CheckCircle className="text-green-500" size={20} /> : <AlertCircle className="text-red-500" size={20} />

  return (
    <div
      className={`fixed left-3 right-3 top-3 z-[70] flex items-start gap-3 rounded-xl border p-3 shadow-lg sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-md sm:p-4 ${bgColor}`}
      role={type === 'success' ? 'status' : 'alert'}
      aria-live={type === 'success' ? 'polite' : 'assertive'}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 break-words text-sm text-gray-800 sm:text-base">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="-m-1 inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-black/5 hover:text-gray-700"
        aria-label="Fermer la notification"
      >
        <X aria-hidden="true" size={18} />
      </button>
    </div>
  )
}
