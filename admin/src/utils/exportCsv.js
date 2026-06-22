export function exportCsv(rows, filename = 'export') {
  if (!rows || !rows.length) {
    return
  }

  const headers = Object.keys(rows[0])
  const csvContent = [headers.join(';')].concat(
    rows.map((row) =>
      headers.map((header) => {
        const value = row[header] ?? ''
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(';')
    )
  ).join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
