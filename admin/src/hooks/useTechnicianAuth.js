import { useContext } from 'react'
import { TechnicianAuthContext } from '../context/TechnicianAuthContext'

export const useTechnicianAuth = () => {
  const context = useContext(TechnicianAuthContext)
  if (!context) {
    throw new Error('useTechnicianAuth must be used within a TechnicianAuthProvider')
  }
  return context
}