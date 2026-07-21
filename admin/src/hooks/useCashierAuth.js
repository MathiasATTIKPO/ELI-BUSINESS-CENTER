import { useContext } from 'react'
import { CashierAuthContext } from '../context/CashierAuthContext'

export const useCashierAuth = () => {
  const context = useContext(CashierAuthContext)
  if (!context) {
    throw new Error('useCashierAuth must be used within a CashierAuthProvider')
  }
  return context
}