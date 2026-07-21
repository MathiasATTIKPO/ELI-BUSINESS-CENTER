import { useContext } from 'react'
import { ResellerAuthContext } from '../context/ResellerAuthContext'

export const useResellerAuth = () => {
  const context = useContext(ResellerAuthContext)
  if (!context) {
    throw new Error('useResellerAuth must be used within a ResellerAuthProvider')
  }
  return context
}