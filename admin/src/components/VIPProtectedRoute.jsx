import { Navigate, useLocation } from 'react-router-dom'
import { useVIPAuth } from '../hooks/useVIPAuth'  // ← chemin corrigé

export default function VIPProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useVIPAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/vip/login" replace />
  }

  if (user?.forcePasswordChange && location.pathname !== '/vip/change-password') {
    return <Navigate to="/vip/change-password" replace />
  }

  return children
}
