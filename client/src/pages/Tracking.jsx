import { useState, useRef } from 'react';
import { formatReference } from '../utils/formatReference';
import { Clock, User, Search, Wrench, Package, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

// ============================================
// CONFIGURATION DES STATUTS
// ============================================
const STATUS_CONFIGS = {
  // Statuts en anglais (provenant de l'API)
  pending: { 
    color: 'bg-amber-50 text-amber-700 border-amber-200', 
    icon: Clock, 
    label: 'En attente',
    gradient: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-500 to-orange-500'
  },
  assigned: { 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: User, 
    label: 'Assignée',
    gradient: 'from-blue-400 to-cyan-500',
    bgGradient: 'from-blue-500 to-cyan-500'
  },
  diagnosing: { 
    color: 'bg-purple-50 text-purple-700 border-purple-200', 
    icon: Search, 
    label: 'Diagnostic en cours',
    gradient: 'from-purple-400 to-violet-500',
    bgGradient: 'from-purple-500 to-violet-500'
  },
  repairing: { 
    color: 'bg-orange-50 text-orange-700 border-orange-200', 
    icon: Wrench, 
    label: 'En réparation',
    gradient: 'from-orange-400 to-red-500',
    bgGradient: 'from-orange-500 to-red-500'
  },
  ready: { 
    color: 'bg-teal-50 text-teal-700 border-teal-200', 
    icon: Package, 
    label: 'Prête',
    gradient: 'from-teal-400 to-emerald-500',
    bgGradient: 'from-teal-500 to-emerald-500'
  },
  completed: { 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: CheckCircle, 
    label: 'Terminée',
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'from-emerald-500 to-green-500'
  },
  paid: { 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: CheckCircle, 
    label: 'Payée',
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'from-emerald-500 to-green-500'
  },
  cancelled: { 
    color: 'bg-red-50 text-red-700 border-red-200', 
    icon: AlertCircle, 
    label: 'Annulée',
    gradient: 'from-red-400 to-rose-500',
    bgGradient: 'from-red-500 to-rose-500'
  },
  // Statuts en français (pour compatibilité)
  'reçu': { 
    color: 'bg-blue-50 text-blue-700 border-blue-200', 
    icon: Package, 
    label: 'Reçu',
    gradient: 'from-blue-400 to-blue-500',
    bgGradient: 'from-blue-500 to-blue-600'
  },
  'en cours': { 
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
    icon: Wrench, 
    label: 'En cours',
    gradient: 'from-yellow-400 to-amber-500',
    bgGradient: 'from-yellow-500 to-amber-500'
  },
  'en attente': { 
    color: 'bg-orange-50 text-orange-700 border-orange-200', 
    icon: Clock, 
    label: 'En attente',
    gradient: 'from-orange-400 to-orange-500',
    bgGradient: 'from-orange-500 to-orange-600'
  },
  'terminé': { 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
    icon: CheckCircle, 
    label: 'Terminé',
    gradient: 'from-emerald-400 to-green-500',
    bgGradient: 'from-emerald-500 to-green-500'
  },
  'livré': { 
    color: 'bg-violet-50 text-violet-700 border-violet-200', 
    icon: Package, 
    label: 'Livré',
    gradient: 'from-violet-400 to-purple-500',
    bgGradient: 'from-violet-500 to-purple-500'
  },
  'annulé': { 
    color: 'bg-red-50 text-red-700 border-red-200', 
    icon: AlertCircle, 
    label: 'Annulé',
    gradient: 'from-red-400 to-rose-500',
    bgGradient: 'from-red-500 to-rose-500'
  }
};

// Fonction pour récupérer la config d'un statut
const getStatusConfig = (status) => {
  if (!status) return STATUS_CONFIGS['pending'];
  const normalizedStatus = status.toLowerCase().trim();
  return STATUS_CONFIGS[normalizedStatus] || { 
    color: 'bg-gray-50 text-gray-700 border-gray-200', 
    icon: AlertCircle, 
    label: status,
    gradient: 'from-gray-400 to-gray-500',
    bgGradient: 'from-gray-500 to-gray-600'
  };
};

// ============================================
// COMPOSANTS
// ============================================

// StatusBadge avec icône
const StatusBadge = ({ status, className = '' }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${config.color} ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
};

// Version simplifiée sans icône
const StatusBadgeSimple = ({ status, className = '' }) => {
  const config = getStatusConfig(status);
  
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${config.color} ${className}`}>
      {config.label}
    </span>
  );
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// Composant pour afficher les détails d'une demande d'échange
const ExchangeDetails = ({ status }) => (
  <div className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Dossier</p>
        <p className="mt-1 font-semibold text-slate-900">{formatReference(status.reference || status._id)}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Type de demande</p>
        <p className="mt-1 font-semibold text-slate-900">Échange</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Produit</p>
        <p className="mt-1 font-semibold text-slate-900">{status.productName || 'Non renseigné'}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Motif</p>
        <p className="mt-1 text-slate-700">{status.reason || 'Non renseigné'}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">WhatsApp client</p>
        <p className="mt-1 font-mono text-sm text-slate-700">{status.clientWhatsapp}</p>
      </div>
      {status.assignedTo ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Assigné à</p>
          <p className="mt-1 text-slate-700">{typeof status.assignedTo === 'object' ? status.assignedTo.name : status.assignedTo}</p>
        </div>
      ) : null}
    </div>
    {status.notes && (
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Notes</p>
        <p className="mt-1 text-slate-700">{status.notes}</p>
      </div>
    )}
  </div>
);

// Composant pour afficher les détails d'une demande de réparation
const RepairDetails = ({ status }) => (
  <div className="grid gap-3 sm:grid-cols-2">
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Dossier</p>
      <p className="mt-1 font-semibold text-slate-900">{formatReference(status.reference || status._id)}</p>
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Type de demande</p>
      <p className="mt-1 font-semibold text-slate-900">Réparation</p>
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Modèle</p>
      <p className="mt-1 font-semibold text-slate-900">{status.deviceModel || 'Non renseigné'}</p>
    </div>
    <div className="sm:col-span-2">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Description</p>
      <p className="mt-1 text-slate-700">{status.issueDescription || 'Aucune description'}</p>
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">WhatsApp client</p>
      <p className="mt-1 font-mono text-sm text-slate-700">{status.clientWhatsapp}</p>
    </div>
    {status.estimatedPrice ? (
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Devis estimé</p>
        <p className="mt-1 font-semibold text-slate-900">{status.estimatedPrice.toLocaleString('fr-FR')} FCFA</p>
      </div>
    ) : null}
    {status.assignedTo ? (
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Assigné à</p>
        <p className="mt-1 text-slate-700">{typeof status.assignedTo === 'object' ? status.assignedTo.name : status.assignedTo}</p>
      </div>
    ) : null}
  </div>
);

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

function Tracking({ phoneNumber }) {
  const [ticket, setTicket] = useState('');
  const [status, setStatus] = useState(null);
  const [requestType, setRequestType] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const inputRef = useRef(null);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER%20-%20Je%20souhaite%20suivre%20mon%20dossier`;

  const handleTrack = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setStatus(null);
    setRequestType(null);
    setFieldError('');

    const trimmedTicket = ticket.trim();
    if (!trimmedTicket) {
      setFieldError('Veuillez saisir un numéro de dossier.');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      let response = await fetch(`${API_BASE_URL}/api/repair/${trimmedTicket}`);
      let json = await response.json();

      if (response.ok) {
        setStatus(json.data);
        setRequestType('repair');
      } else {
        response = await fetch(`${API_BASE_URL}/api/tradein/${trimmedTicket}`);
        json = await response.json();
        
        if (response.ok) {
          setStatus(json.data);
          setRequestType('exchange');
        } else {
          setErrorMessage(json.message || 'Dossier introuvable. Vérifiez le numéro.');
        }
      }
    } catch (error) {
      setErrorMessage('Impossible de contacter le serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTicket('');
    setStatus(null);
    setRequestType(null);
    setErrorMessage('');
    setFieldError('');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Suivi de demande</h1>
          <p className="mt-4 text-slate-700">
            Entrez votre numéro de dossier pour consulter le statut de votre demande de réparation ou d'échange.
          </p>

          <form onSubmit={handleTrack} className="mt-8 space-y-6" noValidate>
            <div>
              <label htmlFor="tracking-ticket" className="block text-sm font-semibold text-slate-700">Numéro de dossier</label>
              <input
                id="tracking-ticket"
                ref={inputRef}
                type="text"
                value={ticket}
                onChange={(e) => {
                  setTicket(e.target.value);
                  if (fieldError) setFieldError('');
                }}
                placeholder="Ex: REF-1A2B3C ou 643e8f5c2a1b4b001234abcd"
                className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-slate-400/10 ${
                  fieldError
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-slate-400'
                }`}
                aria-describedby={fieldError ? 'ticket-error' : undefined}
                autoComplete="off"
              />
              {fieldError && (
                <p id="ticket-error" className="mt-1 text-xs text-red-600" role="alert">{fieldError}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
              >
                {loading ? (
                  <>
                    <Spinner />
                    <span className="ml-2">Recherche...</span>
                  </>
                ) : (
                  'Suivre'
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/10"
              >
                Effacer
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-6 rounded-3xl bg-red-50/80 backdrop-blur-sm border border-red-200 px-5 py-4 text-sm text-red-700" role="alert">
              {errorMessage}
            </div>
          )}

          {status && requestType && (
            <div className="mt-6 space-y-4 rounded-3xl bg-white/50 backdrop-blur-md border border-white/60 px-6 py-6 text-sm text-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">Statut de la demande</p>
                {/* StatusBadge avec icône et libellé en français */}
                <StatusBadge status={status.status || 'Inconnu'} />
              </div>
              
              {requestType === 'repair' ? (
                <RepairDetails status={status} />
              ) : (
                <ExchangeDetails status={status} />
              )}

              {status.createdAt && (
                <div className="border-t border-slate-200 pt-3 mt-3 text-xs text-slate-500">
                  Créé le {new Date(status.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                  {status.updatedAt && ` · Mis à jour le ${new Date(status.updatedAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}`}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 rounded-[32px] bg-slate-100/80 backdrop-blur-md border border-white/60 p-6 text-slate-700">
            <p className="font-semibold text-slate-900">Contact WhatsApp</p>
            <p className="mt-2">Si vous ne trouvez pas votre dossier, contactez-nous directement sur WhatsApp.</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-400 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            >
              Contacter sur WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Tracking;