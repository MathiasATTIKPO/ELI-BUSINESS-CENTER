import axios from 'axios'
import TokenManager from './tokenManager'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Intercepteur de requête - Ajoute le token JWT dans les headers
 */
api.interceptors.request.use(
  (config) => {
    // Ne pas ajouter de token pour les routes de login (elles ne le nécessitent pas)
    const isLoginRoute = config.url?.includes('/login')
    
    if (isLoginRoute) {
      console.log(`[API] Login route detected - skipping token for ${config.url}`)
      return config
    }

    // Obtenir le token correct pour cette URL
    const token = TokenManager.getTokenForUrl(config.url)

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`[API] Token added for ${config.url}`)
    } else {
      console.warn(`[API] No token found for ${config.url}`)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * Intercepteur de réponse - Gère les erreurs 401 et les redirects
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(`[API] 401 Error for ${error.config?.url}`)

      // Déterminer le rôle et rediriger vers la page de connexion appropriée
      if (error.config?.url?.includes('/technician/')) {
        TokenManager.clearRole('technician')
        window.location.href = '/technician/login'
      } else if (error.config?.url?.includes('/cashier/')) {
        TokenManager.clearRole('cashier')
        window.location.href = '/cashier/login'
      } else {
        TokenManager.clearRole('admin')
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
