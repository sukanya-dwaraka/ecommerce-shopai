import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ChevronDown, Grid, List } from 'lucide-react';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/Skeletons';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'relevance', label: 'Relevance' },
];

const PRICE_RANGES = [
  { label: 'Under ₹5,000', min: 0, max: 5000 },
  { label: '₹5,000 – ₹15,000', min: 5000, max: 15000 },
  { label: '₹15,000 – ₹30,000', min: 15000, max: 30000 },
  { label: '₹30,000 – ₹60,000', min: 30000, max: 60000 },
  { label: '₹60,000 – ₹1,00,000', min: 60000, max: 100000 },
  { label: 'Above ₹1,00,000', min: 100000, max: 99999999 },
];

const RATING_OPTIONS = [4, 3, 2, 1];

function FilterSidebar({ params, onUpdate, onReset, categories, brands }) {
  const [open, setOpen] = useState({ price: true, category: true, brand: true, rating: true });
  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="card p-4 space-y-4 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white">Filters</h3>
        <button onClick={onReset} className="text-xs text-amazon-orange hover:underline">Clear All</button>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={params.inStock === 'true'} onChange={(e) => onUpdate('inStock', e.target.checked ? 'true' : '')}
          className="rounded text-amazon-orange focus:ring-amazon-orange" />
        <span className="text-sm text-gray-700 dark:text-gray-300">In Stock Only</span>
      </label>

      {/* Price */}
      <div>
        <button onClick={() => toggle('price')} className="flex items-center justify-between w-full mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Price Range</span>
          <ChevronDown size={14} className={`transition-transform ${open.price ? 'rotate-180' : ''}`} />
        </button>
        {open.price && (
          <div className="space-y-1">
            {PRICE_RANGES.map((r) => (
              <label key={r.label} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="price" checked={params.minPrice == r.min && params.maxPrice == r.max}
                  onChange={() => { onUpdate('minPrice', r.min); onUpdate('maxPrice', r.max); }}
                  className="text-amazon-orange focus:ring-amazon-orange" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{r.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="price" checked={!params.minPrice && !params.maxPrice} onChange={() => { onUpdate('minPrice', ''); onUpdate('maxPrice', ''); }}
                className="text-amazon-orange" />
              <span className="text-sm text-gray-700 dark:text-gray-300">All Prices</span>
            </label>
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <button onClick={() => toggle('category')} className="flex items-center justify-between w-full mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Category</span>
          <ChevronDown size={14} className={`transition-transform ${open.category ? 'rotate-180' : ''}`} />
        </button>
        {open.category && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((c) => (
              <label key={c._id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(params.category || '').split(',').includes(c._id)}
                  onChange={(e) => {
                    const current = params.category ? params.category.split(',').filter(Boolean) : [];
                    const updated = e.target.checked ? [...current, c._id] : current.filter((x) => x !== c._id);
                    onUpdate('category', updated.join(','));
                  }}
                  className="rounded text-amazon-orange focus:ring-amazon-orange" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{c._id}</span>
                <span className="text-xs text-gray-400 ml-auto">{c.count}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Brand */}
      <div>
        <button onClick={() => toggle('brand')} className="flex items-center justify-between w-full mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Brand</span>
          <ChevronDown size={14} className={`transition-transform ${open.brand ? 'rotate-180' : ''}`} />
        </button>
        {open.brand && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {brands.map((b) => (
              <label key={b} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={(params.brand || '').split(',').includes(b)}
                  onChange={(e) => {
                    const current = params.brand ? params.brand.split(',').filter(Boolean) : [];
                    const updated = e.target.checked ? [...current, b] : current.filter((x) => x !== b);
                    onUpdate('brand', updated.join(','));
                  }}
                  className="rounded text-amazon-orange focus:ring-amazon-orange" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{b}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div>
        <button onClick={() => toggle('rating')} className="flex items-center justify-between w-full mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">Min Rating</span>
          <ChevronDown size={14} className={`transition-transform ${open.rating ? 'rotate-180' : ''}`} />
        </button>
        {open.rating && (
          <div className="space-y-1">
            {RATING_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="rating" checked={params.minRating == r}
                  onChange={() => onUpdate('minRating', r)}
                  className="text-amazon-orange" />
                <div className="flex text-amazon-orange">
                  {Array.from({ length: r }).map((_, i) => <span key={i}>★</span>)}
                  {Array.from({ length: 5 - r }).map((_, i) => <span key={i} className="text-gray-300">★</span>)}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">& above</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="rating" checked={!params.minRating} onChange={() => onUpdate('minRating', '')} className="text-amazon-orange" />
              <span className="text-sm text-gray-700 dark:text-gray-300">All Ratings</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const params = Object.fromEntries(searchParams.entries());

  const updateParam = (key, value) => {
    setPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
      next.delete('page');
      return next;
    });
  };

  const resetFilters = () => {
    setPage(1);
    const search = searchParams.get('search');
    setSearchParams(search ? { search } : {});
  };

  const { data: productData, isLoading } = useQuery({
    queryKey: ['products', params, page],
    queryFn: () => productAPI.getAll({ ...params, page, limit: 20 }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productAPI.getCategories(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ['brands', params.category],
    queryFn: () => productAPI.getBrands({ category: params.category }),
    staleTime: 10 * 60 * 1000,
  });

  const products = productData?.data?.products || [];
  const pagination = productData?.data?.pagination || {};
  const categories = categoriesData?.data?.categories || [];
  const brands = brandsData?.data?.brands || [];

  const activeFiltersCount = ['category', 'brand', 'minPrice', 'maxPrice', 'minRating', 'inStock']
    .filter((k) => params[k]).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {params.search ? `Results for "${params.search}"` : params.category || 'All Products'}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {pagination.total?.toLocaleString() || 0} products found
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 btn-outline text-sm relative">
            <SlidersHorizontal size={14} /> Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amazon-orange text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <select
            value={params.sort || 'newest'}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="input w-auto text-sm py-1.5"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Active filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {params.category && params.category.split(',').map((c) => (
            <span key={c} className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
              {c} <button onClick={() => updateParam('category', params.category.split(',').filter((x) => x !== c).join(','))}><X size={10} /></button>
            </span>
          ))}
          {(params.minPrice || params.maxPrice) && (
            <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
              ₹{Number(params.minPrice || 0).toLocaleString('en-IN')} – ₹{Number(params.maxPrice).toLocaleString('en-IN')}
              <button onClick={() => { updateParam('minPrice', ''); updateParam('maxPrice', ''); }}><X size={10} /></button>
            </span>
          )}
          {params.minRating && (
            <span className="badge bg-orange-100 text-orange-700 flex items-center gap-1">
              {params.minRating}★ & above <button onClick={() => updateParam('minRating', '')}><X size={10} /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar - desktop */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <FilterSidebar params={params} onUpdate={updateParam} onReset={resetFilters} categories={categories} brands={brands} />
        </aside>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 overflow-y-auto p-4 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X size={20} /></button>
              </div>
              <FilterSidebar params={params} onUpdate={updateParam} onReset={resetFilters} categories={categories} brands={brands} />
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1">
          {isLoading ? (
            <ProductGridSkeleton count={20} />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🔍</p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or search terms</p>
              <button onClick={resetFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page === 1} onClick={() => setPage(page - 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const p = i + Math.max(1, page - 2);
                    if (p > pagination.pages) return null;
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-amazon-orange text-white' : 'border hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                        {p}
                      </button>
                    );
                  })}
                  <button disabled={!pagination.hasNext} onClick={() => setPage(page + 1)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
