import { useState, useEffect, useRef } from 'react';
import { formatReference } from '../utils/formatReference';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const conditionOptions = [
  'Très bon état',
  'Bon état',
  'État moyen',
  'Rayures / Chocs'
];

function TradeIn({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Bonjour, je souhaite échanger mon modèle')}`;

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [condition, setCondition] = useState('');
  const [targetProduct, setTargetProduct] = useState('');
  const [photos, setPhotos] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const successRef = useRef(null);

  // Récupération des produits pour le tableau et la liste déroulante
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const json = await res.json();
        setAvailableProducts(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Nettoyage des prévisualisations
  useEffect(() => {
    return () => {
      photos.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [photos]);

  const resetForm = () => {
    setClientName('');
    setClientWhatsapp('');
    setDeviceModel('');
    setCondition('');
    setTargetProduct('');
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
      errors.deviceModel = 'Veuillez indiquer le modèle de votre appareil.';
    }
    if (!condition) {
      errors.condition = 'Veuillez sélectionner l\'état de l\'appareil.';
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
    formData.append('condition', condition);
    formData.append('targetProduct', targetProduct);
    photos.forEach(({ file }) => formData.append('photos', file));

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/tradein`, {
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
          successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } catch (fetchError) {
      setError('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  // Construction dynamique de la table des valeurs indicatives
  const dynamicValues = availableProducts
  .filter(p => p.name && p.price)
  .sort((a, b) => b.price - a.price)
  .slice(0, 4)
  .map(p => ({
    model: p.name,
    value: `${p.price.toLocaleString('fr-FR')} FCFA`
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* En-tête */}
        <header className="mb-10 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
          <h1 className="text-3xl font-bold text-slate-900">Échange / Reprise</h1>
          <p className="mt-4 max-w-2xl text-slate-700">
            Présentez votre ancien téléphone et recevez une offre de reprise avantageuse.
          </p>
        </header>

        {/* Étapes */}
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">1. Décrivez votre ancien téléphone</h2>
            <p className="mt-3 text-slate-700">Donnez les informations clés : modèle, état, capacité et accessoires.</p>
          </article>
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">2. Envoyez des photos WhatsApp</h2>
            <p className="mt-3 text-slate-700">Envoyez des photos claires de l’écran, de l’arrière et des angles.</p>
          </article>
          <article className="rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
            <h2 className="text-xl font-semibold text-slate-900">3. Recevez une offre</h2>
            <p className="mt-3 text-slate-700">Vous obtenez une estimation précise en quelques heures.</p>
          </article>
        </div>

        {/* Tableau dynamique des valeurs indicatives */}
        <div className="mt-10 overflow-hidden rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-md">
          <div className="px-6 py-4 bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-900">Valeurs indicatives de reprise</h2>
            <p className="text-sm text-slate-500">Basées sur les prix de notre catalogue actuel</p>
          </div>
          {loadingProducts ? (
            <div className="p-6 text-center text-slate-500">Chargement des modèles...</div>
          ) : dynamicValues.length === 0 ? (
            <div className="p-6 text-center text-slate-500">Aucun modèle disponible pour le moment.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200/60 text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Modèle</th>
                  <th className="px-6 py-4 text-left font-semibold">Prix indicatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white/50">
                {dynamicValues.map((item) => (
                  <tr key={item.model} className="hover:bg-white/80">
                    <td className="px-6 py-4 text-slate-800">{item.model}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulaire */}
        <div className="mt-10 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md">
          <h2 className="text-2xl font-semibold text-slate-900">Estimer mon échange</h2>
          <p className="mt-3 text-slate-700">
            Nous avons besoin de photos pour une estimation précise. N’hésitez pas à décrire l’état et les rayures.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Nom */}
            <div>
              <label htmlFor="tradein-name" className="block text-sm font-semibold text-slate-700">Nom</label>
              <input
                id="tradein-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
                placeholder="Votre nom (optionnel)"
                autoComplete="name"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="tradein-whatsapp" className="block text-sm font-semibold text-slate-700">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                id="tradein-whatsapp"
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
              <label htmlFor="tradein-model" className="block text-sm font-semibold text-slate-700">
                Modèle <span className="text-red-500">*</span>
              </label>
              <input
                id="tradein-model"
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

            {/* État */}
            <div>
              <label htmlFor="tradein-condition" className="block text-sm font-semibold text-slate-700">
                État <span className="text-red-500">*</span>
              </label>
              <select
                id="tradein-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
                aria-required="true"
                className={`mt-2 w-full rounded-3xl border px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-400/10 ${
                  fieldErrors.condition
                    ? 'border-red-400 bg-red-50'
                    : 'border-slate-200/60 bg-white/80 backdrop-blur-sm focus:border-slate-400'
                }`}
              >
                <option value="">-- Sélectionner l'état --</option>
                {conditionOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {fieldErrors.condition && (
                <p className="mt-1 text-xs text-red-600" role="alert">{fieldErrors.condition}</p>
              )}
            </div>

            {/* Produit souhaité */}
            <div>
              <label htmlFor="tradein-target" className="block text-sm font-semibold text-slate-700">Produit souhaité en échange</label>
              <select
                id="tradein-target"
                value={targetProduct}
                onChange={(e) => setTargetProduct(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
              >
                <option value="">-- Choisir un modèle --</option>
                {availableProducts.map(p => (
                  <option key={p._id || p.name} value={p.name}>
                    {p.name} - {p.price ? p.price.toLocaleString() + ' FCFA' : 'Prix non défini'}
                  </option>
                ))}
              </select>
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold text-slate-700">Photos</label>
              <p className="mt-1 text-xs text-slate-500">Ajoutez jusqu'à 5 photos pour une évaluation plus précise.</p>
              <div className="mt-2">
                <input
                  id="tradein-photos"
                  type="file"
                  accept="image/png, image/jpeg"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="tradein-photos"
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
              className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
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
                'Envoyer ma demande'
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
              Estimer mon échange
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TradeIn;