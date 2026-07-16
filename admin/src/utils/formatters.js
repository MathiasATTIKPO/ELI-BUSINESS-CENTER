export const formatFcfa = (value = 0) => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`

export const formatShortDate = (value) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

export const monthKey = (value) => new Date(value).toLocaleString('fr-FR', { month: 'short', year: 'numeric' })
