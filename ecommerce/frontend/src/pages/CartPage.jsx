import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '../store';

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, updateItem, removeItem, clearCart, loading } = useCartStore();

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="btn-primary inline-flex items-center gap-2">
          <ShoppingBag size={16} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Shopping Cart <span className="text-gray-400 text-lg">({items.length} items)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              const image = product.images?.[0]?.url || 'https://via.placeholder.com/80';

              return (
                <div key={item._id || product._id} className="p-4 flex gap-4">
                  <Link to={`/products/${product._id}`} className="flex-shrink-0">
                    <img src={image} alt={product.name}
                      className="w-24 h-24 object-contain rounded-lg bg-gray-50 dark:bg-gray-700 p-1"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/96/f3f4f6/9ca3af?text=?'; }} />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${product._id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-amazon-orange transition-colors line-clamp-2 text-sm">
                      {product.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Brand: {product.brand || 'N/A'}</p>

                    {product.stock > 0 ? (
                      <p className="text-xs text-green-600 mt-0.5">✓ In Stock</p>
                    ) : (
                      <p className="text-xs text-red-500 mt-0.5">Out of Stock</p>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                        <button onClick={() => updateItem(product._id, item.quantity - 1)}
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <Minus size={12} />
                        </button>
                        <span className="px-3 py-1 text-sm font-semibold border-x border-gray-300 dark:border-gray-600">
                          {item.quantity}
                        </span>
                        <button onClick={() => updateItem(product._id, item.quantity + 1)}
                          disabled={item.quantity >= product.stock}
                          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                          <Plus size={12} />
                        </button>
                      </div>

                      <button onClick={() => removeItem(product._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    {item.quantity > 1 && (
                      <p className="text-xs text-gray-500">₹{item.price.toLocaleString('en-IN')} each</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center">
            <Link to="/products" className="text-amazon-orange hover:text-yellow-500 text-sm font-medium flex items-center gap-1 transition-colors">
              ← Continue Shopping
            </Link>
            <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition-colors">
              <Trash2 size={14} /> Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal ({items.length} items)</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {shipping === 0 ? 'FREE' : `₹${shipping}`}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white text-base">
                <span>Total</span>
                <span>₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {subtotal < 499 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 text-sm text-orange-700 dark:text-orange-400">
                <Tag size={14} className="inline mr-1" />
                Add ₹{(499 - subtotal).toLocaleString('en-IN')} more for FREE shipping!
              </div>
            )}

            <button onClick={() => navigate('/checkout')}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base">
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">🔒 Secure checkout with Razorpay</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
