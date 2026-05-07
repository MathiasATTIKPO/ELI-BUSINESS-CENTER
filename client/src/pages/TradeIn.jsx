import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function TradeIn({ phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent('Bonjour, je souhaite échanger mon modèle')}`;

  const values = [
    { model: 'iPhone 11', value: '150 000 FCFA' },
    { model: 'iPhone 12', value: '220 000 FCFA' },
    { model: 'iPhone 13', value: '300 000 FCFA' }
  ];

  const [clientName, setClientName] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [condition, setCondition] = useState('');
  const [targetProduct, setTargetProduct] = useState('');
  const [photos, setPhotos] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const json = await res.json();
        setAvailableProducts(json.data || []);
      } catch (err) { console.error(err); }
    };
    fetchProducts();
  }, []);

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
    formData.append('condition', condition);
    formData.append('targetProduct', targetProduct);
    photos.forEach((file) => formData.append('photos', file));

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
        <h1 className="text-3xl font-bold text-night">Échange / Reprise</h1>
        <p className="mt-4 max-w-2xl text-slate-600">Présentez votre ancien téléphone et recevez une offre de reprise avantageuse.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">1. Décrivez votre ancien téléphone</h2>
          <p className="mt-3 text-slate-600">Donnez les informations clés : modèle, état, capacité et accessoires.</p>
        </div>
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">2. Envoyez des photos WhatsApp</h2>
          <p className="mt-3 text-slate-600">Envoyez des photos claires de l’écran, de l’arrière et des angles.</p>
        </div>
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-night">3. Recevez une offre</h2>
          <p className="mt-3 text-slate-600">Vous obtenez une estimation précise en quelques heures.</p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-[32px] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-night text-white">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Modèle</th>
              <th className="px-6 py-4 text-left font-semibold">Valeur indicative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {values.map((item) => (
              <tr key={item.model} className="hover:bg-slate-50">
                <td className="px-6 py-4">{item.model}</td>
                <td className="px-6 py-4 font-semibold text-night">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-[32px] bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-night">Estimer mon échange</h2>
        <p className="mt-3 text-slate-600">Nous avons besoin de photos pour une estimation précise. N’hésitez pas à décrire l’état et les rayures.</p>
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
            <label className="block text-sm font-semibold text-slate-700">Produit souhaité en échange</label>
            <select
              value={targetProduct}
              onChange={(e) => setTargetProduct(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
            >
              <option value="">-- Choisir un modèle --</option>
              {availableProducts.map(p => (
                <option key={p._id} value={p.name}>
                  {p.name} - {p.price.toLocaleString()} FCFA
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700">État</label>
            <input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-night focus:ring-2 focus:ring-night/10"
              placeholder="Ex: Très bon état"
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
            className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night transition hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer ma demande'}
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
            Estimer mon échange
          </a>
        </div>
      </div>
    </section>
  );
}

export default TradeIn;
