// services/api.js - Version compatible avec TokenManager
import axios from 'axios'
import TokenManager from './tokenManager'

const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
const configuredMediaBaseUrl = (import.meta.env.VITE_MEDIA_BASE_URL || '').replace(/\/+$/, '')
const isVercelRuntime = typeof window !== 'undefined' && /\.vercel\.app$/i.test(window.location.hostname)
const API_BASE_URL = isVercelRuntime
  ? ''
  : (configuredBaseUrl || 'http://localhost:4001')
const MEDIA_BASE_URL = configuredMediaBaseUrl || configuredBaseUrl || API_BASE_URL

const resolveMediaUrl = (value) => {
  if (!value) return value
  const raw = String(value).trim()
  if (!raw) return raw

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw

  // Some bad payloads lose one slash in protocol (e.g. "https:/res.cloudinary...").
  if (/^https?:\/(?!\/)/i.test(raw)) {
    return raw.replace(/^https?:\//i, (prefix) => `${prefix}/`)
  }

  const normalized = raw.replace(/\\/g, '/')
  const uploadPath = normalized.startsWith('uploads/') ? `/${normalized}` : normalized

  if (uploadPath.startsWith('/uploads')) {
    const base = (MEDIA_BASE_URL || '').replace(/\/+$/, '')
    return base ? `${base}${uploadPath}` : uploadPath
  }

  return normalized
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Intercepteur de requête : ajout du token selon le rôle de l'URL
api.interceptors.request.use((config) => {
  let role = null
  const url = config.url || ''
  const isPublicAuthEndpoint = /\/(admin|cashier|technician|reseller|vip)\/(login|forgot|reset)\b/.test(url)

  if (url.includes('/admin/')) {
    role = 'admin'
  } else if (url.includes('/cashier/')) {
    role = 'cashier'
  } else if (url.includes('/technician/')) {
    role = 'technician'
  } else if (url.includes('/reseller/')) {
    role = 'reseller'
  } else if (url.includes('/vip/')) {
    role = 'vip'
  }
  
  if (role && !isPublicAuthEndpoint) {
    const token = TokenManager.getTokenByRole(role)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`[API] Token ${role} ajouté pour ${config.url}`)
    } else {
      console.warn(`[API] Aucun token trouvé pour le rôle ${role}`)
    }
  }
  // Si aucun rôle spécifique, essayer un token générique
  if (!config.headers.Authorization) {
    const activeRole = localStorage.getItem('active_role')
    const activeToken = activeRole ? TokenManager.getTokenByRole(activeRole) : null
    const generic = activeToken
      || TokenManager.getTokenByRole('admin')
      || TokenManager.getTokenByRole('cashier')
      || TokenManager.getTokenByRole('technician')
      || TokenManager.getTokenByRole('reseller')
      || TokenManager.getTokenByRole('vip')
    if (generic) config.headers.Authorization = `Bearer ${generic}`
  }
  return config
})

// Intercepteur de réponse : gestion des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status
      const url = error.config?.url || ''
      
      // 🔹 Redirection vers les pages d'erreur 404 et 500 (sauf pour les endpoints d'authentification)
      const isAuthEndpoint = /\/login|\/forgot|\/reset|\/admin\/login|\/technician\/login|\/cashier\/login|\/reseller\/login|\/vip\/login/.test(url)
      if (!isAuthEndpoint && typeof window !== 'undefined') {
        if (status === 404) {
          window.location.href = '/404?from=' + encodeURIComponent(window.location.pathname)
          return Promise.reject(error)
        }
        if (status === 500) {
          window.location.href = '/500'
          return Promise.reject(error)
        }
      }

      // 🔹 Gestion 401 : déconnexion du rôle concerné
      if (status === 401) {
        let role = null
        if (url.includes('/admin/')) role = 'admin'
        else if (url.includes('/cashier/')) role = 'cashier'
        else if (url.includes('/technician/')) role = 'technician'
        else if (url.includes('/reseller/')) role = 'reseller'
        else if (url.includes('/vip/')) role = 'vip'
        
        if (role) {
          TokenManager.clearRole(role)
          const currentPath = window.location.pathname
          if (currentPath.includes(`/${role}/`) && !currentPath.includes('/login')) {
            window.location.href = `/${role}/login`
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE_URL }
export { MEDIA_BASE_URL }
export { resolveMediaUrl }