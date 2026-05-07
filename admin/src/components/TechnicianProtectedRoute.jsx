import { Navigate } from 'react-router-dom'
import { useTechnicianAuth } from '../context/TechnicianAuthContext'

export default function TechnicianProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useTechnicianAuth()

  console.log('TechnicianProtectedRoute - isAuthenticated:', isAuthenticated, 'loading:', loading)

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