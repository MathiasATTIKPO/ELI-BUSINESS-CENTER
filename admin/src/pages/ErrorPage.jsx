import React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Server, Home, RefreshCw, ArrowLeft, WifiOff } from 'lucide-react'

/**
 * Composant de page d'erreur générique
 * @param {string} type - Type d'erreur : '404', '500', 'offline' (par défaut '404')
 * @param {string} message - Message personnalisé (optionnel)
 * @param {string} title - Titre personnalisé (optionnel)
 */
export default function ErrorPage({ type = '404', message, title }) {
  const navigate = useNavigate()

  const is404 = type === '404'
  const is500 = type === '500'
  const isOffline = type === 'offline'

  // Titres par défaut
  const defaultTitle = is404
    ? 'Page non trouvée'
    : isOffline
    ? 'Connexion perdue'
    : 'Erreur serveur'

  // Messages par défaut
  const defaultMessage = is404
    ? "La page que vous recherchez n'existe pas ou a été déplacée."
    : isOffline
    ? "Votre connexion internet semble interrompue. Vérifiez votre réseau et rafraîchissez la page."
    : "Une erreur est survenue sur le serveur. Veuillez réessayer plus tard."

  // Icône et couleurs selon le type
  const iconMap = {
    '404': { Icon: AlertCircle, gradient: 'from-amber-400 to-orange-500', badge: '404' },
    '500': { Icon: Server, gradient: 'from-red-400 to-rose-500', badge: '500' },
    'offline': { Icon: WifiOff, gradient: 'from-slate-400 to-gray-500', badge: '⚠️' },
  }
  const { Icon, gradient, badge } = iconMap[type] || iconMap['404']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Bandeau coloré en haut */}
        <div className={`h-2 w-full bg-gradient-to-r ${gradient}`}></div>

        <div className="p-8 text-center">
          {/* Icône */}
          <div className="relative inline-block">
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto shadow-lg transform hover:scale-105 transition-transform duration-300`}>
              <Icon size={40} className="text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-800 shadow-md border-2 border-gray-200">
              {badge}
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-4xl font-bold text-gray-900 mt-6">
            {title || defaultTitle}
          </h1>

          {/* Message */}
          <p className="text-gray-600 mt-3 text-lg leading-relaxed">
            {message || defaultMessage}
          </p>

          {/* Boutons d'action */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium shadow-sm"
            >
              <ArrowLeft size={18} />
              Retour
            </button>

            <button
              onClick={() => navigate('/admin/dashboard')}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
            >
              <Home size={18} />
              Tableau de bord
            </button>

            {(is500 || isOffline) && (
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                <RefreshCw size={18} />
                Réessayer
              </button>
            )}
          </div>

          {/* Pied de page avec conseil */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              {is404 && "Vérifiez l'URL ou utilisez le menu principal pour naviguer."}
              {is500 && "Si le problème persiste, contactez le support technique."}
              {isOffline && "Reconnectez-vous à internet et rafraîchissez la page."}
            </p>
            <p className="text-xs text-gray-300 mt-2">
              Code d'erreur : {type}
            </p>
          </div>
        </div>
      </div>

      {/* Lien support */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <a
          href="mailto:support@elibusiness.com"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
        >
          Besoin d'aide ? Contactez le support
        </a>
      </div>
    </div>
  )
}