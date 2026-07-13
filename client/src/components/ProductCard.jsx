function ProductCard({ product, phoneNumber }) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Bonjour, je suis intéressé par ${product.name}`)}`;

  // Utiliser la première photo du tableau photos avec l'URL complète du backend
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
  const imageUrl = product.photos && product.photos.length > 0
    ? `${API_BASE_URL}${product.photos[0]}`
    : 'https://via.placeholder.com/400x300/f3f4f6/9ca3af?text=Pas+d%27image';

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
        <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-night">{product.name}</h3>
            <p className="text-sm text-slate-500">{product.brand}</p>
          </div>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
            {product.stock > 0 ? 'En stock' : 'Épuisé'}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-600">Prix indicatif : <span className="font-semibold text-night">{typeof product.price === 'number' ? `${product.price.toLocaleString('fr-FR')} FCFA` : product.price}</span></p>
        <p className="mt-1 text-sm text-slate-500">Prix sur devis – contactez-nous pour disponibilité.</p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-night px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Demander sur WhatsApp
        </a>
      </div>
    </article>
  );
}

export default ProductCard;
