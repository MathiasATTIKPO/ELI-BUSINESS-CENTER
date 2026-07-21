import { Navigate } from 'react-router-dom'
import { useCashierAuth } from '../hooks/useCashierAuth'  // ← chemin corrigé

export default function CashierProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useCashierAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/cashier/login" replace />
  }

  return children
}