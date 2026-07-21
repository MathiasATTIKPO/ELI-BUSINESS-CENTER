import { useContext } from 'react'
import { VIPAuthContext } from '../context/VIPAuthContext'

export const useVIPAuth = () => {
  const context = useContext(VIPAuthContext)
  if (!context) {
    throw new Error('useVIPAuth must be used within a VIPAuthProvider')
  }
  return context
}