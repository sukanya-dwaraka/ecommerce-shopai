import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import { AdminLayout } from './AdminDashboard';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', debouncedSearch, page],
    queryFn: () => adminAPI.getProducts({ search: debouncedSearch, page, limit: 15 }),
  });

  const products = data?.data?.products || [];
  const pagination = data?.data?.pagination || {};

  const handleSearch = (e) => {
    setSearch(e.target.value);
    clearTimeout(window._searchTimer);
    window._searchTimer = setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deactivated');
      queryClient.invalidateQueries(['admin-products']);
    } catch {
      toast.error('Failed to delete product');
    }
  };

  return (
    <AdminLayout title="Products">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={handleSearch} placeholder="Search products..."
            className="input pl-9 text-sm" />
        </div>
        <Link to="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  {['Product', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images?.[0]?.url} alt={product.name}
                          className="w-10 h-10 object-contain rounded bg-gray-100 dark:bg-gray-700 p-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 max-w-48">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{product.category}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{product.price?.toLocaleString('en-IN')}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-xs text-green-600">-{product.discount}%</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${product.stock === 0 ? 'bg-red-100 text-red-700' : product.stock <= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {product.stock === 0 ? 'Out of stock' : `${product.stock} in stock`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      ⭐ {product.ratings?.toFixed(1)} ({product.numReviews})
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/products/${product._id}/edit`}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                          <Edit2 size={14} />
                        </Link>
                        <button onClick={() => handleDelete(product._id, product.name)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">
                Previous
              </button>
              <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
