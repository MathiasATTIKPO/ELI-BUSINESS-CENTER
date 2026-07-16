import { useMemo, useState } from 'react'

export function useFilters(initialFilters, sourceData = []) {
  const [filters, setFilters] = useState(initialFilters)

  const filteredData = useMemo(() => {
    let data = [...sourceData]

    if (filters.type && filters.type !== 'all') {
      data = data.filter((item) => item.type === filters.type)
    }

    if (filters.startDate) {
      const start = new Date(filters.startDate)
      data = data.filter((item) => new Date(item.date) >= start)
    }

    if (filters.endDate) {
      const end = new Date(filters.endDate)
      data = data.filter((item) => new Date(item.date) <= end)
    }

    return data
  }, [filters, sourceData])

  const resetFilters = () => setFilters(initialFilters)

  return {
    filters,
    setFilters,
    filteredData,
    resetFilters,
  }
}
