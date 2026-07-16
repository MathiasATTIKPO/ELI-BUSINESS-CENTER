import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function HistoryTab({ historyList, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.history - 1) * itemsPerPage
  const pageRows = historyList.slice(start, start + itemsPerPage)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Historique complet</h2>
        <p className="text-sm text-gray-500 mt-1">Toutes les transactions (téléphones, réparations, échanges)</p>
      </div>
      <DataTable data={pageRows} columns={columns} />
      <Pagination currentPage={currentPage.history} totalPages={Math.ceil(historyList.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, history: p }))} totalItems={historyList.length} itemsPerPage={itemsPerPage} />
    </div>
  )
}
