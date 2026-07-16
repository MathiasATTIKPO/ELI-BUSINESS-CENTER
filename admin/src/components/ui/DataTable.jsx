import React from 'react'

export default function DataTable({ data, columns }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50/50">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((item, idx) => (
            <tr key={item._id || idx} className="hover:bg-gray-50/50 transition-colors duration-150">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-6 py-4 text-sm">
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
