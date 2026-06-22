// services/api.js - Version compatible avec TokenManager
import axios from 'axios'
import TokenManager from './tokenManager'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Intercepteur pour ajouter le token selon le rôle de l'URL
api.interceptors.request.use((config) => {
  let role = null
  if (config.url.includes('/admin/')) {
    role = 'admin'
  } else if (config.url.includes('/cashier/')) {
    role = 'cashier'
  } else if (config.url.includes('/technician/')) {
    role = 'technician'
  }
  
  if (role) {
    const token = TokenManager.getTokenByRole(role)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`[API] Token ${role} ajouté pour ${config.url}`)
    } else {
      console.warn(`[API] Aucun token trouvé pour le rôle ${role}`)
    }
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