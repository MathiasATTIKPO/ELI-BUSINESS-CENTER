import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function InventoryTab({ inventory, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.inventory - 1) * itemsPerPage
  const pageRows = inventory.slice(start, start + itemsPerPage)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Inventaire pièces</h2>
        <p className="text-sm text-gray-500 mt-1">Pièces détachées et composants</p>
      </div>
      <DataTable data={pageRows} columns={columns} />
      <Pagination currentPage={currentPage.inventory} totalPages={Math.ceil(inventory.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, inventory: p }))} totalItems={inventory.length} itemsPerPage={itemsPerPage} />
    </div>
  )
}
