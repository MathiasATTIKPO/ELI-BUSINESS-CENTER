import { Navigate, useLocation } from 'react-router-dom'
import { useTechnicianAuth } from '../hooks/useTechnicianAuth'  // ← chemin corrigé

export default function TechnicianProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useTechnicianAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/technician/login" replace />
  }

  if (user?.forcePasswordChange && location.pathname !== '/technician/change-password') {
    return <Navigate to="/technician/change-password" replace />
  }

  return children
}
