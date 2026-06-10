import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw, ChevronRight, Minus, Plus } from 'lucide-react';
import { productAPI, aiAPI } from '../services/api';
import { useCartStore, useWishlistStore, useAuthStore } from '../store';
import ProductCard from '../components/product/ProductCard';
import { StarRating } from '../components/product/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { token, user } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('specs');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productAPI.getOne(id),
  });

  const { data: similarData } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => aiAPI.getSimilar(id),
    enabled: !!id,
  });

  const { data: fbtData } = useQuery({
    queryKey: ['fbt', id],
    queryFn: () => aiAPI.getFrequentlyBought(id),
    enabled: !!id,
  });

  const product = data?.data?.product;
  const similar = similarData?.data?.products || [];
  const fbt = fbtData?.data?.products || [];
  const wishlisted = product ? isWishlisted(product._id) : false;

  const handleAddToCart = () => {
    if (!token) { navigate('/login'); return; }
    addToCart(product._id, quantity);
  };

  const handleBuyNow = () => {
    if (!token) { navigate('/login'); return; }
    addToCart(product._id, quantity);
    navigate('/cart');
  };

  const handleWishlist = () => {
    if (!token) { navigate('/login'); return; }
    wishlisted ? removeFromWishlist(product._id) : addToWishlist(product._id);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) { navigate('/login'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      await productAPI.addReview(id, reviewForm);
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton h-96 rounded-xl" />
          <div className="space-y-4">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-8 w-1/3" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="text-center py-20">
      <p className="text-6xl mb-4">😕</p>
      <h2 className="text-2xl font-bold mb-2">Product not found</h2>
      <Link to="/products" className="btn-primary">Browse Products</Link>
    </div>
  );

  const images = product.images?.length > 0 ? product.images : [{ url: 'https://via.placeholder.com/500', alt: product.name }];
  const discount = product.discount || (product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0);

  const alreadyReviewed = product.reviews?.some((r) => r.user?._id === user?._id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link to="/" className="hover:text-amazon-orange transition-colors">Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" className="hover:text-amazon-orange transition-colors">Products</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${product.category}`} className="hover:text-amazon-orange transition-colors">{product.category}</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 dark:text-gray-100 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
        {/* Images */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden aspect-square">
            <img src={images[selectedImage]?.url} alt={images[selectedImage]?.alt || product.name}
              className="w-full h-full object-contain p-6" />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-colors ${selectedImage === i ? 'border-amazon-orange' : 'border-gray-200 dark:border-gray-700'}`}>
                  <img src={img.url} alt={img.alt} className="w-full h-full object-contain p-1 bg-white dark:bg-gray-800" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <p className="text-sm text-amazon-orange font-medium uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <StarRating rating={product.ratings} size={18} />
            <span className="text-amazon-orange font-semibold">{product.ratings?.toFixed(1)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">({product.numReviews} reviews)</span>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm text-gray-500">{product.viewCount} views</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{product.price?.toLocaleString('en-IN')}</span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.originalPrice?.toLocaleString('en-IN')}</span>
                <span className="text-green-600 font-semibold text-sm">Save ₹{(product.originalPrice - product.price).toLocaleString('en-IN')}</span>
              </>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{product.shortDescription || product.description}</p>

          {/* Stock */}
          <div>
            {product.stock === 0 ? (
              <span className="text-red-500 font-semibold">Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span className="text-orange-500 font-semibold">Only {product.stock} left in stock!</span>
            ) : (
              <span className="text-green-600 font-semibold">✓ In Stock</span>
            )}
          </div>

          {/* Quantity */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Qty:</span>
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Minus size={14} />
                </button>
                <span className="px-4 py-2 text-sm font-semibold border-x border-gray-300 dark:border-gray-600">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button onClick={handleAddToCart} disabled={product.stock === 0}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button onClick={handleWishlist}
                className={`p-3 border-2 rounded-lg transition-all hover:scale-105 ${wishlisted ? 'border-red-500 text-red-500' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}>
                <Heart size={20} className={wishlisted ? 'fill-red-500' : ''} />
              </button>
            </div>
            <button onClick={handleBuyNow} disabled={product.stock === 0}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-3">
              Buy Now
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[
              { icon: Truck, label: 'Free Delivery', sub: 'Above ₹499' },
              { icon: Shield, label: 'Secure Payment', sub: '100% Safe' },
              { icon: RefreshCw, label: 'Easy Returns', sub: '30 days' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Icon size={20} className="text-amazon-orange mx-auto mb-1" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buy box (desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="card p-4 space-y-3 sticky top-24">
            <p className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price?.toLocaleString('en-IN')}</p>
            <p className="text-sm text-green-600">FREE delivery on orders above ₹499</p>
            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-sm font-medium">
              {product.stock === 0 ? <span className="text-red-500">Out of Stock</span> : <span className="text-green-600">✓ In Stock</span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm">Qty:</span>
              <select value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                className="input text-sm py-1 w-20">
                {Array.from({ length: Math.min(10, product.stock) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddToCart} disabled={product.stock === 0} className="w-full btn-primary py-2 text-sm">
              Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0} className="w-full btn-secondary py-2 text-sm">
              Buy Now
            </button>
            <p className="text-xs text-gray-500 text-center">Sold by ShopAI | Brand: {product.brand}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700 flex">
          {[
            { id: 'specs', label: 'Specifications' },
            { id: 'desc', label: 'Description' },
            { id: 'reviews', label: `Reviews (${product.numReviews})` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-amazon-orange text-amazon-orange' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'specs' && (
            <div className="grid md:grid-cols-2 gap-2">
              {product.specifications?.map((s, i) => (
                <div key={i} className={`flex gap-4 py-2 text-sm ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''} px-3 rounded`}>
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-36 flex-shrink-0">{s.key}</span>
                  <span className="text-gray-600 dark:text-gray-400">{s.value}</span>
                </div>
              ))}
              <div className="flex gap-4 py-2 text-sm bg-gray-50 dark:bg-gray-800/50 px-3 rounded">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-36 flex-shrink-0">Category</span>
                <span className="text-gray-600 dark:text-gray-400">{product.category} › {product.subcategory}</span>
              </div>
              <div className="flex gap-4 py-2 text-sm px-3 rounded">
                <span className="font-medium text-gray-700 dark:text-gray-300 w-36 flex-shrink-0">SKU</span>
                <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{product.sku}</span>
              </div>
            </div>
          )}

          {activeTab === 'desc' && (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {product.tags.map((tag) => (
                    <span key={tag} className="badge bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Rating summary */}
              <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="text-center">
                  <p className="text-5xl font-bold text-gray-900 dark:text-white">{product.ratings?.toFixed(1)}</p>
                  <StarRating rating={product.ratings} size={16} />
                  <p className="text-xs text-gray-500 mt-1">{product.numReviews} reviews</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = product.reviews?.filter((r) => Math.round(r.rating) === star).length || 0;
                    const pct = product.numReviews ? (count / product.numReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-4 text-right text-gray-600 dark:text-gray-400">{star}</span>
                        <Star size={12} className="text-amazon-orange fill-amazon-orange" />
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amazon-orange rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-xs text-gray-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add review */}
              {token && !alreadyReviewed && (
                <form onSubmit={handleSubmitReview} className="card p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Write a Review</h4>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}>
                        <Star size={24} className={s <= reviewForm.rating ? 'text-amazon-orange fill-amazon-orange' : 'text-gray-300'} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={3} className="input resize-none"
                  />
                  <button type="submit" disabled={submittingReview} className="btn-primary">
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}

              {/* Reviews list */}
              <div className="space-y-4">
                {product.reviews?.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  product.reviews?.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {review.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{review.name}</span>
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs text-gray-400 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 ml-10">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Frequently bought together */}
      {fbt.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Frequently Bought Together</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fbt.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Similar products */}
      {similar.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Similar Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {similar.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
