import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

function ProductCard({ product, phoneNumber }) {
  // Sécurité : si product est undefined, on ne rend rien
  if (!product) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const photos = product.photos || [];
  const total = photos.length;

  const goToPrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // L'URL est directement utilisée (qu'elle vienne de Cloudinary ou du stockage local)
  const imageUrl = total > 0 ? photos[currentIndex] : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 shadow-md transition hover:shadow-xl hover:scale-[1.02] duration-200">
      {/* Carrousel */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={`${product.name || 'Produit'} - photo ${currentIndex + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // En cas d'erreur de chargement, on affiche une icône de remplacement
                e.target.onerror = null;
                const parent = e.target.parentElement;
                parent.innerHTML = `
                  <div class="flex h-full items-center justify-center bg-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                `;
              }}
            />
            {/* Flèches de navigation (affichées au survol) */}
            {total > 1 && (
              <>
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none opacity-0 group-hover:opacity-100"
                  aria-label="Image précédente"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/60 focus:outline-none opacity-0 group-hover:opacity-100"
                  aria-label="Image suivante"
                >
                  <ChevronRight size={20} />
                </button>
                {/* Indicateurs (points) */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        idx === currentIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'
                      }`}
                      aria-label={`Aller à la photo ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-200">
            <ImageIcon size={40} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Informations produit */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name || 'Produit sans nom'}</h3>
        <p className="text-xs text-slate-500 line-clamp-1">
          {product.brand} {product.model && `· ${product.model}`}
        </p>
        {product.price && (
          <p className="text-lg font-bold text-brand">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(product.price)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {product.state || 'État'}
          </span>
          {phoneNumber && (
            <a
              href={`https://wa.me/${phoneNumber.replace(/\s/g, '')}?text=Je%20suis%20intéressé%20par%20${encodeURIComponent(product.name || 'ce produit')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
              onClick={(e) => e.stopPropagation()}
            >
              Contacter
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;