import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore, useCartStore } from '../store';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { wishlist, removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();

  const handleMoveToCart = async (product) => {
    await addToCart(product._id);
    removeFromWishlist(product._id);
  };

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <Heart size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you love for later.</p>
        <Link to="/products" className="btn-primary">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        My Wishlist <span className="text-gray-400 text-lg">({wishlist.length} items)</span>
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {wishlist.map((product) => {
          if (!product._id) return null;
          const image = product.images?.[0]?.url || 'https://via.placeholder.com/200';
          return (
            <div key={product._id} className="card group overflow-hidden">
              <Link to={`/products/${product._id}`} className="block">
                <div className="bg-gray-50 dark:bg-gray-700 h-40 overflow-hidden">
                  <img src={image} alt={product.name} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" />
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500 mb-1">{product.brand}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-white mt-1">₹{product.price?.toLocaleString('en-IN')}</p>
                </div>
              </Link>
              <div className="px-3 pb-3 flex gap-2">
                <button onClick={() => handleMoveToCart(product)}
                  className="flex-1 bg-amazon-orange hover:bg-yellow-500 text-white text-xs py-1.5 rounded-md flex items-center justify-center gap-1 transition-colors">
                  <ShoppingCart size={12} /> Add to Cart
                </button>
                <button onClick={() => removeFromWishlist(product._id)}
                  className="p-1.5 text-red-400 hover:text-red-600 border border-red-200 rounded-md transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
