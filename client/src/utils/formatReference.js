export function formatReference(id) {
  if (!id) return 'N/A';
  const stringId = typeof id === 'string' ? id : id.toString();
  return `REF-${stringId.slice(-6).toUpperCase()}`;
}
