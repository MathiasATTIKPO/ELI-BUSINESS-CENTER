import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Tracking({ phoneNumber }) {
  const [ticket, setTicket] = useState('');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (event) => {
    event.preventDefault();
    setStatus(null);
    setMessage('');

    if (!ticket.trim()) {
      setMessage('Veuillez saisir un numéro de dossier pour continuer.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/repair/${ticket.trim()}`);
      const json = await response.json();
      if (!response.ok) {
        setMessage(json.message || 'Dossier introuvable.');
      } else {
        setStatus(json.data);
      }
    } catch (error) {
      setMessage('Impossible de contacter le serveur de suivi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="rounded-[32px] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-night">Suivi de réparation</h1>
        <p className="mt-4 text-slate-600">Entrez votre numéro de dossier pour consulter le statut de votre demande de réparation.</p>

        <form onSubmit={handleTrack} className="mt-8 space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Numéro de dossier</span>
            <input
              type="text"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              placeholder="Ex: 643e8f5c2a1b4b001234abcd"
              className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex rounded-full bg-night px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Suivre'}
          </button>
        </form>

        {message && <p className="mt-6 rounded-3xl bg-red-50 px-5 py-4 text-sm text-red-700">{message}</p>}

        {status && (
          <div className="mt-6 rounded-3xl bg-slate-50 px-6 py-5 text-sm text-slate-800">
            <p className="font-semibold text-night">Statut de la demande</p>
            <p className="mt-3">Dossier : <span className="font-semibold">{status._id}</span></p>
            <p className="mt-2">Statut actuel : <span className="font-semibold">{status.status}</span></p>
            <p className="mt-2">Modèle : <span className="font-semibold">{status.deviceModel || 'Non renseigné'}</span></p>
            <p className="mt-2">Description : <span className="font-semibold">{status.issueDescription || 'Aucune description'}</span></p>
            <p className="mt-2">WhatsApp client : <span className="font-semibold">{status.clientWhatsapp}</span></p>
            {status.estimatedPrice ? (
              <p className="mt-2">Devis estimé : <span className="font-semibold">{status.estimatedPrice.toLocaleString('fr-FR')} FCFA</span></p>
            ) : null}
            {status.assignedTo ? (
              <p className="mt-2">Assigné à : <span className="font-semibold">{status.assignedTo.name || status.assignedTo}</span></p>
            ) : null}
          </div>
        )}

        <div className="mt-8 rounded-[32px] bg-night/5 p-6 text-slate-700">
          <p className="font-semibold text-night">Contact WhatsApp</p>
          <p className="mt-2">Si vous ne trouvez pas votre dossier, contactez-nous directement sur WhatsApp.</p>
          <a href={`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=Bonjour%20ELI%27S%20BUSINESS%20CENTER%20-%20Je%20souhaite%20suivre%20mon%20dossier`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-night transition hover:bg-orange-400">
            Contacter sur WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export default Tracking;
