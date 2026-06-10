import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCartStore, useWishlistStore, useAuthStore } from '../../store';
import { useNavigate } from 'react-router-dom';

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-amazon-orange fill-amazon-orange' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { token } = useAuthStore();

  const wishlisted = isWishlisted(product._id);
  const discount = product.discount || (product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!token) { navigate('/login'); return; }
    wishlisted ? removeFromWishlist(product._id) : addToWishlist(product._id);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!token) { navigate('/login'); return; }
    addToCart(product._id);
  };

  const image = product.images?.[0]?.url || `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`;

  return (
    <div className="product-card card group relative overflow-hidden">
      {/* Discount badge */}
      {discount > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
          -{discount}%
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={handleWishlist}
        className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow hover:scale-110 transition-all"
      >
        <Heart
          size={16}
          className={wishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 dark:text-gray-300'}
        />
      </button>

      <Link to={`/products/${product._id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50 dark:bg-gray-700 h-52">
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.target.src = `https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=No+Image`; }}
          />
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{product.brand}</p>
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={product.ratings} />
            <span className="text-xs text-gray-500 dark:text-gray-400">({product.numReviews || 0})</span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.originalPrice?.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {product.stock === 0 && (
            <p className="text-xs text-red-500 font-medium mb-2">Out of Stock</p>
          )}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-orange-500 font-medium mb-2">Only {product.stock} left!</p>
          )}
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="w-full bg-amazon-orange hover:bg-yellow-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={14} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export { StarRating };
