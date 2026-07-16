import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function ProductsTab({ products, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.products - 1) * itemsPerPage
  const pageRows = products.slice(start, start + itemsPerPage)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Catalogue produits</h2>
        <p className="text-sm text-gray-500 mt-1">Liste des téléphones disponibles</p>
      </div>
      <DataTable data={pageRows} columns={columns} />
      <Pagination currentPage={currentPage.products} totalPages={Math.ceil(products.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, products: p }))} totalItems={products.length} itemsPerPage={itemsPerPage} />
    </div>
  )
}
