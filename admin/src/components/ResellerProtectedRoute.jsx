import { Navigate, useLocation } from 'react-router-dom'
import { useResellerAuth } from '../hooks/useResellerAuth'  // ← chemin corrigé

export default function ResellerProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useResellerAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/reseller/login" replace />
  }

  if (user?.forcePasswordChange && location.pathname !== '/reseller/change-password') {
    return <Navigate to="/reseller/change-password" replace />
  }

  return children
}
