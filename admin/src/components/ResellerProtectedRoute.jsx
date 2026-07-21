import { Navigate } from 'react-router-dom'
import { useResellerAuth } from '../hooks/useResellerAuth'  // ← chemin corrigé

export default function ResellerProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useResellerAuth()

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

  return children
}