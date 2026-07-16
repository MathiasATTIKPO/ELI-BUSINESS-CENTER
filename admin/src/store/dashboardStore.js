import { useState } from 'react'

export function useDashboardStore() {
  const [activeMainTab, setActiveMainTab] = useState('dashboard')
  const [activeSubTab, setActiveSubTab] = useState('overview')

  const [currentPage, setCurrentPage] = useState({
    products: 1,
    inventory: 1,
    employees: 1,
    sales: 1,
    invoices: 1,
    history: 1,
  })

  const [invoiceFilters, setInvoiceFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
  })

  return {
    activeMainTab,
    setActiveMainTab,
    activeSubTab,
    setActiveSubTab,
    currentPage,
    setCurrentPage,
    invoiceFilters,
    setInvoiceFilters,
    itemsPerPage: 10,
  }
}
