export const resolveMediaUrl = (
  value,
  baseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:4001' : '')
) => {
  if (!value) return value
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '')
  if (value.startsWith('/uploads')) return `${normalizedBase}${value}`
  return value
}
