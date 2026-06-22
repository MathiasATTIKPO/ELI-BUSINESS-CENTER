import React, { useMemo, useState } from 'react'

export default function Table({
  columns = [],
  data = [],
  onRowClick = null,
  actionColumn = null,
  searchField = null,
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 50]
}) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const filteredData = useMemo(() => {
    let result = [...data]

    if (search) {
      const fields = Array.isArray(searchField)
        ? searchField
        : searchField
          ? [searchField]
          : columns.map((col) => col.key)

      result = result.filter((item) =>
        fields.some((field) => {
          const value = item[field]
          return String(value || '')
            .toLowerCase()
            .includes(search.toLowerCase())
        })
      )
    }

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key] ?? ''
        const bVal = b[sortConfig.key] ?? ''

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, sortConfig, searchField, columns])

  const totalPages = pagination ? Math.max(1, Math.ceil(filteredData.length / pageSize)) : 1
  const pagedData = pagination
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const changePage = (newPage) => {
    setCurrentPage(newPage)
  }

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value))
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-1/2">
          <input
            type="text"
            placeholder="Rechercher dans le tableau..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="input-base w-full"
          />
        </div>
        {pagination && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <label htmlFor="pageSize" className="font-medium">Affichage</label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={col.sortable ? 'cursor-pointer hover:bg-opacity-80' : ''}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && (
                      <span>
                        {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actionColumn && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actionColumn && (
                  <td>
                    <div className="flex gap-2">
                      {actionColumn(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucune donnée trouvée</p>
      ) : (
        pagination && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-slate-600">
            <p>
              Affichage {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} sur {filteredData.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => changePage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
              >Précédent</button>
              <span>Page {currentPage} / {totalPages}</span>
              <button
                onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white disabled:opacity-50"
              >Suivant</button>
            </div>
          </div>
        )
      )}
    </div>
  )
}
