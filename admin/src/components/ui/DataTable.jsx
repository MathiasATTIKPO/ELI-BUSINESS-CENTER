import React from 'react'

export default function DataTable({
  data = [],
  columns = [],
  minWidth = '44rem',
  emptyMessage = 'Aucune donnée disponible',
  ariaLabel = 'Tableau de données',
  rowKey,
}) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={ariaLabel} tabIndex={0}>
      <table className="w-full" style={{ minWidth }}>
        <thead className="bg-gray-50/50">
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} scope="col" className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-5 sm:py-4">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.length === 0 ? (
            <tr>
              <td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-sm text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : data.map((item, idx) => (
            <tr key={rowKey ? rowKey(item, idx) : (item._id || idx)} className="transition-colors duration-150 hover:bg-gray-50/50">
              {columns.map((col, colIdx) => (
                <td key={col.key || colIdx} className="px-3 py-3 align-top text-sm sm:px-5 sm:py-4">
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
