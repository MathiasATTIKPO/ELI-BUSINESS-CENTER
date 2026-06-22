const STORAGE_KEY = 'eli_admin_activity_history'

export function getHistoryEntries() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (error) {
    return []
  }
}

export function logHistoryEntry(entry) {
  try {
    const existing = getHistoryEntries()
    const next = [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...entry,
      },
      ...existing,
    ]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 200)))
  } catch (error) {
    console.warn('Impossible de sauvegarder l historique', error)
  }
}

export function clearHistoryEntries() {
  window.localStorage.removeItem(STORAGE_KEY)
}
