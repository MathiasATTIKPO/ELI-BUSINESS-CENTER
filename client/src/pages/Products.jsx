import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const pageSize = 6;

function Products({ phoneNumber }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.message || 'Erreur lors du chargement des produits.');
        }
        setProducts(json.data || []);
      } catch (error) {
        setLoadError(error.message || 'Impossible de charger les produits.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand).filter(Boolean))], [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesBrand = brandFilter ? product.brand === brandFilter : true;
      const matchesQuery = query
        ? [product.brand, product.name]
            .some((field) => field?.toLowerCase().includes(query))
        : true;
      return matchesBrand && matchesQuery;
    });
  }, [brandFilter, products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [currentPage, filteredProducts]);

  const hasFilters = brandFilter || search;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 overflow-hidden rounded-[32px] bg-white shadow-sm">
        <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
          <div className="space-y-5">
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Catalogue Vente</span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-night sm:text-4xl">Le catalogue téléphones pour vos présentations commerciales.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Affinez facilement par marque, modèle et état, puis parcourez une sélection de téléphones neufs et reconditionnés.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Produits</p>
                <p className="mt-3 text-2xl font-semibold text-night">{products.length}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Modes de vente</p>
                <p className="mt-3 text-2xl font-semibold text-night">Neuf & Reconditionné</p>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.25),_transparent_35%)]" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs uppercase tracking-[0.28em] text-slate-300">Sélection</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Téléphones</span>
              </div>
              <div className="rounded-[28px] bg-slate-900/80 p-5">
                <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80" alt="iPhone display" className="h-[320px] w-full rounded-[28px] object-cover shadow-2xl shadow-slate-950/50" />
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Présentation</p>
                <h2 className="text-3xl font-semibold text-white">Pagination intégrée.</h2>
                <p className="text-sm leading-6 text-slate-300">Passez d’une page à l’autre pour montrer tous les modèles disponibles.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[32px] bg-white p-8 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Marque</span>
            <select
              value={brandFilter}
              onChange={(event) => {
                setBrandFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-night focus:ring-2 focus:ring-night/10"
            >
              <option value="">Toutes les marques</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">Recherche</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Rechercher par nom ou marque"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-night focus:ring-2 focus:ring-night/10"
            />
          </label>
        </div>

  {/*       {hasFilters && (
          <div className="mt-4 rounded-3xl bg-slate-50 px-5 py-4 text-sm text-slate-700">
            Filtres actifs : {brandFilter || 'Marque = toutes'} · {modelFilter || 'Modèle = tous'} · {stateFilter || 'État = tous'} · {search ? `Recherche = “${search}”` : 'Recherche libre'}
          </div>
        )} */}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-night">Chargement du catalogue...</h2>
            <p className="mt-3 text-slate-600">Veuillez patienter, le catalogue se charge depuis l’API.</p>
          </div>
        ) : loadError ? (
          <div className="col-span-full rounded-3xl bg-red-50 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-red-700">Erreur de chargement</h2>
            <p className="mt-3 text-red-600">{loadError}</p>
          </div>
        ) : pageProducts.length > 0 ? (
          pageProducts.map((product) => (
            <ProductCard key={product._id || product.name} product={product} phoneNumber={phoneNumber} />
          ))
        ) : (
          <div className="col-span-full rounded-3xl bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-night">Aucun produit trouvé</h2>
            <p className="mt-3 text-slate-600">Ajustez vos filtres ou la recherche pour afficher plus de modèles.</p>
          </div>
        )}
      </div>

      <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[32px] bg-white px-6 py-6 shadow-sm sm:flex-row">
        <div className="text-sm text-slate-600">
          Affichage {pageProducts.length > 0 ? `${(currentPage - 1) * pageSize + 1}–${(currentPage - 1) * pageSize + pageProducts.length}` : '0'} sur {filteredProducts.length} résultats
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Précédent
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-full px-3 text-sm font-semibold transition ${page === currentPage ? 'border border-night bg-night text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </section>
  );
}

export default Products;
