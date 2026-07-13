// services/api.js - Version compatible avec TokenManager
import axios from 'axios'
import TokenManager from './tokenManager'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001').replace(/\/+$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Intercepteur pour ajouter le token selon le rôle de l'URL
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
  // If no specific role, try generic token
  if (!config.headers.Authorization) {
    const generic = TokenManager.getTokenByRole('admin') || TokenManager.getTokenByRole('cashier') || TokenManager.getTokenByRole('technician')
    if (generic) config.headers.Authorization = `Bearer ${generic}`
  }
  return config
})

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      let role = null
      
      if (url.includes('/admin/')) role = 'admin'
      else if (url.includes('/cashier/')) role = 'cashier'
      else if (url.includes('/technician/')) role = 'technician'
      
      if (role) {
        TokenManager.clearRole(role)
        
        const currentPath = window.location.pathname
        if (currentPath.includes(`/${role}/`) && !currentPath.includes('/login')) {
          window.location.href = `/${role}/login`
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
export { API_BASE_URL }