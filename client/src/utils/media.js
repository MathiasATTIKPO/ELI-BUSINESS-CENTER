export const resolveMediaUrl = (value, baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') => {
  if (!value) return value
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '')
  if (value.startsWith('/uploads')) return `${normalizedBase}${value}`
  return value
}