import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Header() {
  const { user } = useAuth()

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-sm">{today}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-semibold text-gray-800">{user?.email || 'Administrateur'}</p>
          <p className="text-sm text-gray-500">Connecté</p>
        </div>
        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold">
          {(user?.email?.[0] || 'A').toUpperCase()}
        </div>
      </div>
    </header>
  )
}
