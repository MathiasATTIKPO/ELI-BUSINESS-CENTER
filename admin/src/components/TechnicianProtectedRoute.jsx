import { Navigate } from 'react-router-dom'
import { useTechnicianAuth } from '../hooks/useTechnicianAuth'  // ← chemin corrigé

export default function TechnicianProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useTechnicianAuth()

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

  return children
}