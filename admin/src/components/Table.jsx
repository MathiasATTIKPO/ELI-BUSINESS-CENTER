import React, { useState, useMemo } from 'react'

export default function Table({ 
  columns = [], 
  data = [], 
  onRowClick = null,
  actionColumn = null,
  searchField = null 
}) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })

  const filteredData = useMemo(() => {
    let result = data
    
    if (search && searchField) {
      result = result.filter((item) =>
        String(item[searchField]).toLowerCase().includes(search.toLowerCase())
      )
    }

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, sortConfig, searchField])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="space-y-4">
      {searchField && (
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-base mb-4"
        />
      )}

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
            {filteredData.map((row, idx) => (
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

      {filteredData.length === 0 && (
        <p className="text-center text-gray-500 py-4">Aucune donnée trouvée</p>
      )}
    </div>
  )
}
