const PORTAL_ROLES = ['admin', 'technician', 'cashier', 'reseller', 'vip']

const PORTAL_CONFIG = {
  admin: {
    homePath: '/admin/dashboard',
    loginPath: '/admin/login',
    homeLabel: 'Tableau de bord administrateur',
    loginLabel: 'Connexion administrateur',
  },
  technician: {
    homePath: '/technician/dashboard',
    loginPath: '/technician/login',
    homeLabel: 'Tableau de bord technicien',
    loginLabel: 'Connexion technicien',
  },
  cashier: {
    homePath: '/cashier/sales',
    loginPath: '/cashier/login',
    homeLabel: 'Espace caissier',
    loginLabel: 'Connexion caissier',
  },
  reseller: {
    homePath: '/reseller/dashboard',
    loginPath: '/reseller/login',
    homeLabel: 'Espace revendeur',
    loginLabel: 'Connexion revendeur',
  },
  vip: {
    homePath: '/vip/dashboard',
    loginPath: '/vip/login',
    homeLabel: 'Espace client VIP',
    loginLabel: 'Connexion client VIP',
  },
}

const ROLE_ALIASES = {
  super_admin: 'admin',
  commercial_manager: 'admin',
}

const ERROR_PATHS = new Set(['/404', '/500', '/offline'])

const getBrowserStorage = () => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

const readStorage = (storage, key) => {
  try {
    return storage?.getItem?.(key) || null
  } catch {
    return null
  }
}

const normalizeLocalPath = (value) => {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null

  return trimmed
}

const getPathname = (value) => {
  const localPath = normalizeLocalPath(value)
  if (!localPath) return ''

  return localPath.split(/[?#]/, 1)[0] || '/'
}

export const normalizePortalRole = (role) => {
  const normalizedRole = ROLE_ALIASES[role] || role
  return PORTAL_ROLES.includes(normalizedRole) ? normalizedRole : null
}

export const getPortalRoleFromPath = (value) => {
  const pathname = getPathname(value)
  const role = pathname.match(/^\/(admin|technician|cashier|reseller|vip)(?:\/|$)/)?.[1]
  return normalizePortalRole(role)
}

export const hasPortalSession = (role, storage = getBrowserStorage()) => {
  const normalizedRole = normalizePortalRole(role)
  if (!normalizedRole) return false

  return Boolean(
    readStorage(storage, `${normalizedRole}_token`)
    && readStorage(storage, `${normalizedRole}_user`)
  )
}

export const getErrorSourcePath = (search = '') => {
  try {
    return normalizeLocalPath(new URLSearchParams(search).get('from'))
  } catch {
    return null
  }
}

export const buildErrorRoute = (type = '404', locationLike = {}) => {
  const normalizedType = ['404', '500', 'offline'].includes(String(type))
    ? String(type)
    : '404'
  const pathname = normalizeLocalPath(locationLike.pathname) || '/'
  const sourcePath = `${pathname}${locationLike.search || ''}${locationLike.hash || ''}`

  return `/${normalizedType}?from=${encodeURIComponent(sourcePath)}`
}

export const resolvePortalNavigation = ({
  pathname = '/',
  search = '',
  portalRole,
  storage = getBrowserStorage(),
} = {}) => {
  const sourcePath = getErrorSourcePath(search)
  const explicitRole = normalizePortalRole(portalRole)
  const sourceRole = getPortalRoleFromPath(sourcePath)
  const pathRole = getPortalRoleFromPath(pathname)
  const activeRole = normalizePortalRole(readStorage(storage, 'active_role'))
  const authenticatedActiveRole = activeRole && hasPortalSession(activeRole, storage)
    ? activeRole
    : null
  const authenticatedFallbackRole = PORTAL_ROLES.find((role) => hasPortalSession(role, storage))

  // The portal encoded in the URL always wins. This prevents a stale admin
  // session from hijacking a cashier or technician error page.
  const role = explicitRole
    || sourceRole
    || pathRole
    || authenticatedActiveRole
    || authenticatedFallbackRole
    || 'admin'
  const config = PORTAL_CONFIG[role]
  const isAuthenticated = hasPortalSession(role, storage)
  const destination = isAuthenticated ? config.homePath : config.loginPath
  const sourcePathname = getPathname(sourcePath)
  const safeReturnPath = (
    sourcePath
    && sourceRole === role
    && !ERROR_PATHS.has(sourcePathname)
  )
    ? sourcePath
    : null

  return {
    role,
    isAuthenticated,
    homePath: config.homePath,
    loginPath: config.loginPath,
    destination,
    destinationLabel: isAuthenticated ? config.homeLabel : config.loginLabel,
    returnPath: safeReturnPath,
  }
}

