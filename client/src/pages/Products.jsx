import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/+$/, '');
const PAGE_SIZE = 8;

const Icons = {
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Loader: () => (
    <svg className="animate-spin h-6 w-6 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
};

function Products({ phoneNumber }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
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

  const { brands, models, states } = useMemo(() => {
    const brandSet = new Set();
    const modelSet = new Set();
    const stateSet = new Set();
    products.forEach((product) => {
      if (product.brand) brandSet.add(product.brand);
      if (product.model) modelSet.add(product.model);
      if (product.state) stateSet.add(product.state);
    });
    return {
      brands: [...brandSet].sort(),
      models: [...modelSet].sort(),
      states: [...stateSet].sort()
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      if (brandFilter && product.brand !== brandFilter) return false;
      if (modelFilter && product.model !== modelFilter) return false;
      if (stateFilter && product.state !== stateFilter) return false;
      if (query) {
        const searchable = [product.brand, product.name, product.model]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [products, brandFilter, modelFilter, stateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredProducts]);

  const handleBrandChange = (value) => { setBrandFilter(value); setCurrentPage(1); };
  const handleModelChange = (value) => { setModelFilter(value); setCurrentPage(1); };
  const handleStateChange = (value) => { setStateFilter(value); setCurrentPage(1); };
  const handleSearchChange = (value) => { setSearch(value); setCurrentPage(1); };

  const hasFilters = !!(brandFilter || modelFilter || stateFilter || search);

  const resetFilters = () => {
    setBrandFilter('');
    setModelFilter('');
    setStateFilter('');
    setSearch('');
    setCurrentPage(1);
  };

  const paginationRange = useMemo(() => {
    const range = [];
    const delta = 2;
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push('...');
    for (let i = left; i <= right; i++) {
      range.push(i);
    }
    if (right < totalPages - 1) range.push('...');
    if (totalPages > 1) range.push(totalPages);

    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* En-tête */}
        <header className="mb-8 overflow-hidden rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl">
          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
            <div className="space-y-5">
              <span className="inline-flex rounded-full bg-slate-100/80 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-slate-700">
                Catalogue Achat & Reconditionné
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Téléphones pour vos présentations commerciales
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-700 sm:text-base">
                Affinez facilement par marque, modèle et état, puis parcourez une sélection de téléphones neufs et reconditionnés.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-md p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Produits</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">{products.length}</p>
                </div>
                <div className="rounded-3xl border border-slate-200/60 bg-white/50 backdrop-blur-md p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Modes de vente</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">Neuf & Reconditionné</p>
                </div>
              </div>
            </div>
            {/* Carte visuelle */}
            <div className="relative overflow-hidden rounded-[32px] bg-slate-950 p-6 text-white shadow-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.25),_transparent_35%)]" />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs uppercase tracking-[0.28em] text-slate-300">Sélection</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">Téléphones</span>
                </div>
                <div className="rounded-[28px] bg-slate-900/80 p-5">
                  <img
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
                    alt="iPhone display"
                    className="h-[320px] w-full rounded-[28px] object-cover shadow-2xl shadow-slate-950/50"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Présentation</p>
                  <h2 className="text-3xl font-semibold text-white">Pagination intégrée</h2>
                  <p className="text-sm leading-6 text-slate-300">Passez d’une page à l’autre pour montrer tous les modèles disponibles.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filtres */}
        <div className="mb-8 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 p-8 shadow-md" role="search" aria-label="Filtres du catalogue">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label htmlFor="brand-filter" className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Marque</span>
              <select
                id="brand-filter"
                value={brandFilter}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
              >
                <option value="">Toutes les marques</option>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>

            {models.length > 0 && (
              <label htmlFor="model-filter" className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Modèle</span>
                <select
                  id="model-filter"
                  value={modelFilter}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
                >
                  <option value="">Tous les modèles</option>
                  {models.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </label>
            )}

            {states.length > 0 && (
              <label htmlFor="state-filter" className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">État</span>
                <select
                  id="state-filter"
                  value={stateFilter}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
                >
                  <option value="">Tous les états</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </label>
            )}

            <label htmlFor="search-filter" className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Recherche</span>
              <div className="relative">
                <input
                  id="search-filter"
                  type="search"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-sm py-3 pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
                  <Icons.Search />
                </span>
              </div>
            </label>
          </div>

          {hasFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-3xl bg-white/50 backdrop-blur-md px-5 py-4 text-sm text-slate-700">
              <span className="font-medium">Filtres actifs :</span>
              {brandFilter && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">Marque : {brandFilter}</span>}
              {modelFilter && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">Modèle : {modelFilter}</span>}
              {stateFilter && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">État : {stateFilter}</span>}
              {search && <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">Recherche : “{search}”</span>}
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2f1c50] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Grille produits */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-10 text-center shadow-md">
              <Icons.Loader />
              <h2 className="mt-4 text-xl font-semibold text-slate-900">Chargement du catalogue...</h2>
              <p className="mt-3 text-slate-600">Veuillez patienter, les produits arrivent depuis l’API.</p>
            </div>
          ) : loadError ? (
            <div className="col-span-full rounded-3xl bg-red-50/70 backdrop-blur-lg border border-red-200 p-10 text-center shadow-md" role="alert">
              <h2 className="text-xl font-semibold text-red-700">Erreur de chargement</h2>
              <p className="mt-3 text-red-600">{loadError}</p>
            </div>
          ) : pageProducts.length > 0 ? (
            pageProducts.map((product) => (
              <ProductCard key={product._id || product.name} product={product} phoneNumber={phoneNumber} />
            ))
          ) : (
            <div className="col-span-full rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-10 text-center shadow-md">
              <h2 className="text-xl font-semibold text-slate-900">Aucun produit trouvé</h2>
              <p className="mt-3 text-slate-600">
                {hasFilters
                  ? 'Ajustez vos filtres ou la recherche pour afficher plus de modèles.'
                  : 'Le catalogue est vide pour le moment.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <nav className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[32px] bg-white/70 backdrop-blur-xl border border-white/60 px-6 py-6 shadow-md sm:flex-row" aria-label="Pagination du catalogue">
            <div className="text-sm text-slate-600">
              Affichage {pageProducts.length > 0 ? `${(currentPage - 1) * PAGE_SIZE + 1}–${(currentPage - 1) * PAGE_SIZE + pageProducts.length}` : '0'} sur {filteredProducts.length} résultats
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Page précédente"
                className="inline-flex items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                ← Précédent
              </button>

              {paginationRange.map((page, index) =>
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    disabled={page === currentPage}
                    aria-current={page === currentPage ? 'page' : undefined}
                    aria-label={`Page ${page}`}
                    className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-full px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand ${
                      page === currentPage
                        ? 'border border-slate-800 bg-slate-800 text-white'
                        : 'border border-slate-200/60 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Page suivante"
                className="inline-flex items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand"
              >
                Suivant →
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  );
}

export default Products;