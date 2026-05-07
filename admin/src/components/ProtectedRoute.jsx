import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth()

  console.log('ProtectedRoute check - isAuthenticated:', isAuthenticated)

  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login')
    return <Navigate to="/admin/login" replace />
  }

  console.log('User authenticated, rendering protected content')
  return children
}
