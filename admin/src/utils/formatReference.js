export function formatReference(id) {
  return id ? `REF-${id.slice(-6).toUpperCase()}` : 'N/A'
}
