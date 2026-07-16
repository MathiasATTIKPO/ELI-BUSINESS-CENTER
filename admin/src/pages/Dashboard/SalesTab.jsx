import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function SalesTab({ sales, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.sales - 1) * itemsPerPage
  const pageRows = sales.slice(start, start + itemsPerPage)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Historique des ventes</h2>
        <p className="text-sm text-gray-500 mt-1">Téléphones vendus, réparations payées et échanges complétés</p>
      </div>
      <DataTable data={pageRows} columns={columns} />
      <Pagination currentPage={currentPage.sales} totalPages={Math.ceil(sales.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, sales: p }))} totalItems={sales.length} itemsPerPage={itemsPerPage} />
    </div>
  )
}
