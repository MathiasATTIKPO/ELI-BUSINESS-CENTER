import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function InvoicesTab({ filters, setFilters, resetFilters, rows, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.invoices - 1) * itemsPerPage
  const pageRows = rows.slice(start, start + itemsPerPage)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="all">Tous</option>
            <option value="phone">Téléphones</option>
            <option value="repair">Réparations</option>
            <option value="tradein">Échanges</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Du</label>
          <input type="date" value={filters.startDate} onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Au</label>
          <input type="date" value={filters.endDate} onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={resetFilters} className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Réinitialiser</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Gestion des factures</h2>
          <p className="text-sm text-gray-500 mt-1">Téléchargez les factures des ventes, réparations et échanges</p>
        </div>
        <DataTable data={pageRows} columns={columns} />
        <Pagination currentPage={currentPage.invoices} totalPages={Math.ceil(rows.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, invoices: p }))} totalItems={rows.length} itemsPerPage={itemsPerPage} />
      </div>
    </div>
  )
}
