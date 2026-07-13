import { useState, useRef, useEffect } from 'react';
import { formatReference } from '../utils/formatReference';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');

const repairs = [
  { label: 'Écran cassé', price: '35 000 – 60 000 FCFA' },
  { label: 'Batterie', price: '20 000 – 35 000 FCFA' },
  { label: 'Chargeur / port', price: '15 000 FCFA' }
];

const modelsList = [
  'iPhone 6', 'iPhone 7', 'iPhone 8', 'iPhone X',
  'iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15'
];

function Repair({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Bonjour, je souhaite réparer mon modèle – panne : décrire')}`;

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const successRef = useRef(null);

  useEffect(() => {
    return () => {
      photos.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [photos]);

  const resetForm = () => {
    setClientName('');
    setClientWhatsapp('');
    setDeviceModel('');
    setIssueDescription('');
    setPhotos([]);
    setFieldErrors({});
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const filesWithPreview = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPhotos(filesWithPreview);
    if (files.length < e.target.files.length) {
      setFieldErrors(prev => ({ ...prev, photos: 'Maximum 5 photos autorisées.' }));
    } else {
      setFieldErrors(prev => ({ ...prev, photos: undefined }));
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const validate = () => {
    const errors = {};
    if (!clientWhatsapp.trim()) {
      errors.clientWhatsapp = 'Le numéro WhatsApp est obligatoire.';
    } else if (!/^\+\d{7,15}$/.test(clientWhatsapp.trim())) {
      errors.clientWhatsapp = 'Format invalide (ex: +228xxxxxxxx).';
    }
    if (!deviceModel.trim()) {
      errors.deviceModel = 'Veuillez indiquer le modèle.';
    }
    if (!issueDescription.trim()) {
      errors.issueDescription = 'Décrivez la panne.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    if (!validate()) return;

    const formData = new FormData();
    formData.append('clientName', clientName.trim());
    formData.append('clientWhatsapp', clientWhatsapp.trim());
    formData.append('deviceModel', deviceModel.trim());
    formData.append('issueDescription', issueDescription.trim());
    photos.forEach(({ file }) => formData.append('photos', file));

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
        resetForm();
        setTimeout(() => {
          if (successRef.current) {
            successRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (fetchError) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* En-tête */}
        <header className="mb-10 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Réparation Apple</h1>
          <p className="mt-4 max-w-2xl text-slate-700">
            Suivez notre processus simple pour une réparation fiable et rapide.
          </p>
        </header>

        {/* Étapes */}
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">1. Envoyez des photos WhatsApp</h2>
            <p className="mt-3 text-slate-700">
              Décrivez la panne et envoyez 3 photos de votre téléphone pour obtenir un diagnostic précis.
            </p>
          </article>
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">2. Devis sous 24h</h2>
            <p className="mt-3 text-slate-700">
              Nous évaluons rapidement votre appareil et vous envoyons une estimation claire.
            </p>
          </article>
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">3. Réparation rapide</h2>
            <p className="mt-3 text-slate-700">
              Votre appareil est réparé avec soin pour retrouver son état optimal dans les meilleurs délais.
            </p>
          </article>
        </div>

        {/* Tarifs */}
        <section className="mt-10 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
          <h2 className="text-2xl font-semibold text-slate-900">Pannes courantes et tarifs indicatifs</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {repairs.map((item) => (
              <article key={item.label} className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-sm p-5">
                <p className="font-semibold text-slate-900">{item.label}</p>
                <p className="mt-2 text-slate-600">{item.price}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Modèles compatibles */}
          <aside className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-slate-900">Modèles compatibles</h2>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-700">
              {modelsList.map((model) => (
                <span key={model} className="rounded-full bg-slate-100/80 backdrop-blur-sm px-3 py-2">
                  {model}
                </span>
              ))}
            </div>
          </aside>

          {/* Formulaire */}
          <div className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-2xl font-semibold text-slate-900">Commencer ma réparation</h2>
            <p className="mt-3 text-slate-700">
              Envoyez-nous votre modèle et la description de la panne pour démarrer.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {/* Nom */}
              <div>
                <label htmlFor="repair-name" className="block text-sm font-semibold text-slate-700">Nom</label>
                <input
                  id="repair-name"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
                  placeholder="Votre nom (optionnel)"
                  autoComplete="name"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="repair-whatsapp" className="block text-sm font-semibold text-slate-700">
                  WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  id="repair-whatsapp"
                  type="tel"
                  value={clientWhatsapp}
                  onChange={(e) => setClientWhatsapp(e.target.value)}
                  required
                  aria-required="true"
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/10 ${
                    fieldErrors.clientWhatsapp
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-slate-400'
                  }`}
                  placeholder="+228..."
                  autoComplete="tel"
                />
                {fieldErrors.clientWhatsapp && (
                  <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.clientWhatsapp}</p>
                )}
              </div>

              {/* Modèle */}
              <div>
                <label htmlFor="repair-model" className="block text-sm font-semibold text-slate-700">
                  Modèle <span className="text-red-500">*</span>
                </label>
                <input
                  id="repair-model"
                  type="text"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  required
                  aria-required="true"
                  className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/10 ${
                    fieldErrors.deviceModel
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-slate-400'
                  }`}
                  placeholder="Ex: iPhone 13"
                />
                {fieldErrors.deviceModel && (
                  <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.deviceModel}</p>
                )}
              </div>

              {/* Panne */}
              <div>
                <label htmlFor="repair-issue" className="block text-sm font-semibold text-slate-700">
                  Description de la panne <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="repair-issue"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  required
                  aria-required="true"
                  className={`mt-2 h-24 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/10 ${
                    fieldErrors.issueDescription
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-slate-400'
                  }`}
                  placeholder="Expliquez le problème rencontré"
                />
                {fieldErrors.issueDescription && (
                  <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.issueDescription}</p>
                )}
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-semibold text-slate-700">Photos</label>
                <p className="mt-1 text-xs text-slate-500">Ajoutez jusqu'à 5 photos pour un diagnostic plus précis.</p>
                <div className="mt-2">
                  <input
                    id="repair-photos"
                    type="file"
                    accept="image/png, image/jpeg"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="repair-photos"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/10"
                    tabIndex="0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Choisir des photos
                  </label>
                  {photos.length > 0 && (
                    <p className="mt-1 text-xs text-slate-600">{photos.length} fichier{photos.length > 1 ? 's' : ''} sélectionné{photos.length > 1 ? 's' : ''}</p>
                  )}
                </div>
                {photos.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {photos.map((item, idx) => (
                      <div key={idx} className="group relative">
                        <img src={item.preview} alt={`Photo ${idx + 1}`} className="h-20 w-20 rounded-2xl border border-slate-200 object-cover shadow-sm" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 p-0.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          aria-label={`Supprimer la photo ${idx + 1}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-full bg-gold px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer la demande'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 rounded-3xl bg-red-50/80 backdrop-blur-sm border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>
            )}

            {result && (
              <div ref={successRef} className="mt-4 rounded-3xl bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 px-4 py-4 text-sm text-emerald-800" role="alert">
                <p className="font-semibold">Demande envoyée avec succès.</p>
                <p className="mt-2">
                  Numéro de dossier : <span className="font-semibold">{result.reference ?? (result.requestId ? formatReference(result.requestId) : 'N/A')}</span>
                </p>
              </div>
            )}

            <div className="mt-6 rounded-[24px] border border-slate-200/60 bg-white/50 backdrop-blur-md p-5">
              <p className="text-sm font-semibold text-slate-700">Ou par WhatsApp</p>
              <p className="mt-2 text-sm text-slate-600">Si vous préférez, envoyez-nous votre demande directement via WhatsApp.</p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
              >
                Contacter sur WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Repair;