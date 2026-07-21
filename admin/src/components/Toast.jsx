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
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-lg ${bgColor} flex items-center gap-3 max-w-md`}>
      {icon}
      <span className="flex-1 text-gray-800">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  )
}