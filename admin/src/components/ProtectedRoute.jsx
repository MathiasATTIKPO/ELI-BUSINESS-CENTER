import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'  // ← chemin corrigé

export const ProtectedRoute = ({ children }) => {
  const { user, activeRole, loading } = useAuth()
  
  console.log('ProtectedRoute check - user:', user, 'activeRole:', activeRole, 'loading:', loading)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    )
  }
  
  if (!user || !activeRole || activeRole !== 'admin') {
    console.log('User not authenticated or not admin, redirecting to login')
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}