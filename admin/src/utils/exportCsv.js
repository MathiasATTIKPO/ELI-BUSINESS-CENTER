export function exportCsv(rows, filename = 'export', headers = null) {
  if (!rows || !rows.length) {
    return false
  }

  const orderedHeaders = headers?.length ? headers : Object.keys(rows[0])
  const csvContent = [orderedHeaders.join(';')].concat(
    rows.map((row) =>
      orderedHeaders.map((header) => {
        const value = row[header] ?? ''
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(';')
    )
  ).join('\r\n')

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return true
}
