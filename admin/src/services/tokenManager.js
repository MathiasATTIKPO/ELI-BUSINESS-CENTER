/**
 * Token Manager - Gestion centralisée des tokens
 * Évite les problèmes de synchronisation entre localStorage et les états React
 */

const TOKEN_KEYS = {
  admin: 'admin_token',
  technician: 'technician_token',
  cashier: 'cashier_token',
  reseller: 'reseller_token',
  vip: 'vip_token',
}

const USER_KEYS = {
  admin: 'admin_user',
  technician: 'technician_user',
  cashier: 'cashier_user',
  reseller: 'reseller_user',
  vip: 'vip_user',
}

class TokenManager {
  /**
   * Obtenir le token basé sur le rôle ou l'URL
   */
  static getTokenByRole(role = 'admin') {
    const token = localStorage.getItem(TOKEN_KEYS[role])
    console.log(`[TokenManager] Getting ${role} token:`, token ? 'found' : 'not found')
    return token
  }

  /**
   * Obtenir le token correct pour une URL
   */
  static getTokenForUrl(url) {
    if (url?.includes('/technician/')) {
      return this.getTokenByRole('technician')
    }
    if (url?.includes('/cashier/')) {
      return this.getTokenByRole('cashier')
    }
    if (url?.includes('/reseller/')) {
      return this.getTokenByRole('reseller')
    }
    if (url?.includes('/vip/')) {
      return this.getTokenByRole('vip')
    }
    return this.getTokenByRole('admin')
  }

  /**
   * Sauvegarder un token
   */
  static saveToken(role, token) {
    if (!token) return
    localStorage.setItem(TOKEN_KEYS[role], token)
    console.log(`[TokenManager] Saved ${role} token`)
  }

  /**
   * Sauvegarder un utilisateur
   */
  static saveUser(role, user) {
    if (!user) return
    localStorage.setItem(USER_KEYS[role], JSON.stringify(user))
    console.log(`[TokenManager] Saved ${role} user`)
  }

  /**
   * Obtenir l'utilisateur stocké
   */
  static getUser(role = 'admin') {
    const userStr = localStorage.getItem(USER_KEYS[role])
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  static isAuthenticated(role = 'admin') {
    const token = this.getTokenByRole(role)
    return !!token
  }

  /**
   * Supprimer tous les tokens d'un rôle
   */
  static clearRole(role) {
    localStorage.removeItem(TOKEN_KEYS[role])
    localStorage.removeItem(USER_KEYS[role])
    console.log(`[TokenManager] Cleared ${role} role`)
  }

  /**
   * Supprimer tous les tokens
   */
  static clearAll() {
    Object.values(TOKEN_KEYS).forEach(key => localStorage.removeItem(key))
    Object.values(USER_KEYS).forEach(key => localStorage.removeItem(key))
    console.log('[TokenManager] Cleared all tokens')
  }

  /**
   * Obtenir le rôle actuel basé sur les tokens disponibles
   */
  static getCurrentRole() {
    if (this.getTokenByRole('admin')) return 'admin'
    if (this.getTokenByRole('technician')) return 'technician'
    if (this.getTokenByRole('cashier')) return 'cashier'
    if (this.getTokenByRole('reseller')) return 'reseller'
    if (this.getTokenByRole('vip')) return 'vip'
    return null
  }
}

export default TokenManager
