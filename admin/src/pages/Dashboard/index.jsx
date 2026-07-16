import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Toast from '../../components/ui/Toast'
import Tabs from './Tabs'
import OverviewTab from './OverviewTab'
import RepairsTab from './RepairsTab'
import TradeinsTab from './TradeinsTab'
import ProductsTab from './ProductsTab'
import InventoryTab from './InventoryTab'
import EmployeesTab from './EmployeesTab'
import SalesTab from './SalesTab'
import InvoicesTab from './InvoicesTab'
import HistoryTab from './HistoryTab'
import ReportsTab from './ReportsTab'
import { useDashboardStore } from '../../store/dashboardStore'
import { useDashboardData } from '../../hooks/useDashboardData'
import { useFilters } from '../../hooks/useFilters'
import {
  buildEmployeeColumns,
  buildInventoryColumns,
  buildInvoiceColumns,
  buildProductColumns,
  buildTransactionColumns,
} from '../../constants/columns.jsx'


export default function DashboardPage() {
  const navigate = useNavigate()
  const store = useDashboardStore()
  const {
    loading,
    toast,
    setToast,
    fetchAllData,
    stats,
    products,
    inventory,
    employees,
    sales,
    historyList,
    invoicesData,
    salesEvolution,
    repairsEvolution,
    tradeinsEvolution,
    weeklyActivity,
    kpis,
    downloadInvoice,
  } = useDashboardData()

  const invoiceFiltersState = useFilters(store.invoiceFilters, invoicesData)

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  useEffect(() => {
    store.setInvoiceFilters(invoiceFiltersState.filters)
  }, [invoiceFiltersState.filters])

  const productColumns = buildProductColumns()
  const inventoryColumns = buildInventoryColumns()
  const employeeColumns = buildEmployeeColumns()
  const transactionColumns = buildTransactionColumns()
  const invoiceColumns = buildInvoiceColumns(downloadInvoice)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 animate-pulse font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <Tabs
        activeMainTab={store.activeMainTab}
        setActiveMainTab={store.setActiveMainTab}
        setActiveSubTab={store.setActiveSubTab}
        badges={kpis}
      />

      {store.activeMainTab === 'dashboard' && (
        <OverviewTab
          stats={stats}
          salesEvolution={salesEvolution}
          repairsEvolution={repairsEvolution}
          tradeinsEvolution={tradeinsEvolution}
          weeklyActivity={weeklyActivity}
          setToast={setToast}
        />
      )}

      {store.activeMainTab === 'repairs' && <RepairsTab pendingRepairsCount={kpis.pendingRepairsCount} navigate={navigate} />}
      {store.activeMainTab === 'tradeins' && <TradeinsTab pendingTradeinsCount={kpis.pendingTradeinsCount} navigate={navigate} />}

      {store.activeMainTab === 'products' && (
        <ProductsTab products={products} currentPage={store.currentPage} setCurrentPage={store.setCurrentPage} itemsPerPage={store.itemsPerPage} columns={productColumns} />
      )}

      {store.activeMainTab === 'inventory' && (
        <InventoryTab inventory={inventory} currentPage={store.currentPage} setCurrentPage={store.setCurrentPage} itemsPerPage={store.itemsPerPage} columns={inventoryColumns} />
      )}

      {store.activeMainTab === 'employees' && (
        <EmployeesTab employees={employees} currentPage={store.currentPage} setCurrentPage={store.setCurrentPage} itemsPerPage={store.itemsPerPage} columns={employeeColumns} />
      )}

      {store.activeMainTab === 'sales' && (
        <SalesTab sales={sales} currentPage={store.currentPage} setCurrentPage={store.setCurrentPage} itemsPerPage={store.itemsPerPage} columns={transactionColumns} />
      )}

      {store.activeMainTab === 'invoices' && (
        <InvoicesTab
          filters={invoiceFiltersState.filters}
          setFilters={invoiceFiltersState.setFilters}
          resetFilters={invoiceFiltersState.resetFilters}
          rows={invoiceFiltersState.filteredData}
          currentPage={store.currentPage}
          setCurrentPage={store.setCurrentPage}
          itemsPerPage={store.itemsPerPage}
          columns={invoiceColumns}
        />
      )}

      {store.activeMainTab === 'history' && (
        <HistoryTab historyList={historyList} currentPage={store.currentPage} setCurrentPage={store.setCurrentPage} itemsPerPage={store.itemsPerPage} columns={transactionColumns} />
      )}

      {store.activeMainTab === 'reports' && <ReportsTab stats={stats} sales={sales} employees={employees} />}
    </DashboardLayout>
  )
}
