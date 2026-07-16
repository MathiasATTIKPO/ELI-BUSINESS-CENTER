import React from 'react'
import DataTable from '../../components/ui/DataTable'
import Pagination from '../../components/ui/Pagination'

export default function EmployeesTab({ employees, currentPage, setCurrentPage, itemsPerPage, columns }) {
  const start = (currentPage.employees - 1) * itemsPerPage
  const pageRows = employees.slice(start, start + itemsPerPage)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Équipe</h2>
        <p className="text-sm text-gray-500 mt-1">Liste des employés</p>
      </div>
      <DataTable data={pageRows} columns={columns} />
      <Pagination currentPage={currentPage.employees} totalPages={Math.ceil(employees.length / itemsPerPage)} onPageChange={(p) => setCurrentPage((prev) => ({ ...prev, employees: p }))} totalItems={employees.length} itemsPerPage={itemsPerPage} />
    </div>
  )
}
