import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function Repair({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Bonjour, je souhaite réparer mon modèle – panne : décrire')}`;

  const repairs = [
    { label: 'Écran cassé', price: '35 000 – 60 000 FCFA' },
    { label: 'Batterie', price: '20 000 – 35 000 FCFA' },
    { label: 'Chargeur / port', price: '15 000 FCFA' }
  ];

  const models = ['iPhone 6', 'iPhone 7', 'iPhone 8', 'iPhone X', 'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'];

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);

    if (!clientWhatsapp.trim()) {
      setError('Le numéro WhatsApp est obligatoire.');
      return;
    }

    const formData = new FormData();
    formData.append('clientName', clientName);
    formData.append('clientWhatsapp', clientWhatsapp);
    formData.append('deviceModel', deviceModel);
    formData.append('issueDescription', issueDescription);
    photos.forEach((file) => formData.append('photos', file));

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/repair`, {
        method: 'POST',
        body: formData
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message || 'Erreur lors de la création de la demande.');
      } else {
        setResult(json.data);
      }
    } catch (fetchError) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 rounded-[32px] bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-night">Réparation Apple</h1>
        <p className="mt-4 max-w-2xl text-slate-600">Suivez notre processus simple pour une réparation fiable et rapide.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">1. Envoyez des photos WhatsApp</h2>
          <p className="mt-3 text-slate-600">Décrivez la panne et envoyez 3 photos de votre téléphone pour obtenir un diagnostic précis.</p>
        </div>
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">2. Devis sous 24h</h2>
          <p className="mt-3 text-slate-600">Nous évaluons rapidement votre appareil et vous envoyons une estimation claire.</p>
        </div>
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">3. Réparation rapide</h2>
          <p className="mt-3 text-slate-600">Votre appareil est réparé avec soin pour retrouver son état optimal dans les meilleurs délais.</p>
        </div>
      </div>

      <div className="mt-10 rounded-[32px] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-night">Pannes courantes et tarifs indicatifs</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {repairs.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 p-5">
              <p className="font-semibold text-night">{item.label}</p>
              <p className="mt-2 text-slate-600">{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-night">Modèles compatibles</h2>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
            {models.map((model) => (
              <span key={model} className="rounded-full bg-night/5 px-3 py-2">{model}</span>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-night">Commencer ma réparation</h2>
          <p className="mt-3 text-slate-600">Envoyez-nous votre modèle et la description de la panne pour démarrer.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Nom</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
                placeholder="Votre nom"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">WhatsApp</label>
              <input
                value={clientWhatsapp}
                onChange={(e) => setClientWhatsapp(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
                placeholder="+228..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Modèle</label>
              <input
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
                placeholder="Ex: iPhone 13"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Description de la panne</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="mt-2 h-24 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
                placeholder="Expliquez le problème rencontré"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700">Photos</label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files))}
                className="mt-2 w-full text-sm text-slate-700"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-night transition hover:bg-orange-400 disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>

          {error && <p className="mt-4 rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {result && (
            <div className="mt-4 rounded-3xl bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <p className="font-semibold">Demande envoyée avec succès.</p>
              <p className="mt-2">Numéro de dossier : <span className="font-semibold">{result.requestId}</span></p>
            </div>
          )}

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">Ou par WhatsApp</p>
            <p className="mt-2 text-sm text-slate-600">Si vous préférez, envoyez-nous votre demande directement via WhatsApp.</p>
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-night px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Contacter sur WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Repair;
