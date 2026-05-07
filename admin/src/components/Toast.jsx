import React, { useEffect } from 'react'

export default function Toast({ type = 'success', message, duration = 4000 }) {
  const [visible, setVisible] = React.useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration)
    return () => clearTimeout(timer)
  }, [duration])

  if (!visible) return null

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-pulse`}>
      <span className="text-xl">{icon}</span>
      <span>{message}</span>
    </div>
  )
}
