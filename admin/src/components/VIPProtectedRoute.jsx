import { Navigate } from 'react-router-dom'
import { useVIPAuth } from '../hooks/useVIPAuth'  // ← chemin corrigé

export default function VIPProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useVIPAuth()

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

  return children
}