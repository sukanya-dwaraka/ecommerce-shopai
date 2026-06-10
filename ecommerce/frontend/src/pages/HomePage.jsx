import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Zap, Shield, Truck, RefreshCw, Bot, TrendingUp, Sparkles } from 'lucide-react';
import { productAPI, aiAPI } from '../services/api';
import { useAuthStore } from '../store';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/common/Skeletons';

const HERO_CATEGORIES = [
  { name: 'Laptops', icon: '💻', color: 'from-blue-500 to-blue-700', href: '/products?category=Laptops' },
  { name: 'Smartphones', icon: '📱', color: 'from-purple-500 to-purple-700', href: '/products?category=Smartphones' },
  { name: 'Headphones', icon: '🎧', color: 'from-pink-500 to-pink-700', href: '/products?category=Headphones' },
  { name: 'Cameras', icon: '📷', color: 'from-green-500 to-green-700', href: '/products?category=Cameras' },
  { name: 'Gaming', icon: '🎮', color: 'from-red-500 to-red-700', href: '/products?category=Gaming' },
  { name: 'Smartwatches', icon: '⌚', color: 'from-orange-500 to-orange-700', href: '/products?category=Smartwatches' },
  { name: 'Tablets', icon: '📟', color: 'from-teal-500 to-teal-700', href: '/products?category=Tablets' },
  { name: 'Televisions', icon: '📺', color: 'from-indigo-500 to-indigo-700', href: '/products?category=Televisions' },
];

function SectionHeader({ icon: Icon, title, subtitle, link }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-amazon-orange rounded-lg flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      {link && (
        <Link to={link} className="text-amazon-orange hover:text-yellow-500 text-sm font-medium flex items-center gap-1 transition-colors">
          See all <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

export default function HomePage() {
  const { token } = useAuthStore();

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured'],
    queryFn: () => productAPI.getAll({ featured: 'true', limit: 8 }),
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => aiAPI.getTrending({ limit: 8 }),
  });

  const { data: recsData, isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', token],
    queryFn: () => aiAPI.getRecommendations({ limit: 8 }),
  });

  const featured = featuredData?.data?.products || [];
  const trending = trendingData?.data?.products || [];
  const recs = recsData?.data?.products || [];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-amazon-dark via-amazon-navy to-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-amazon-orange rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 bg-amazon-orange/20 border border-amazon-orange/40 text-amazon-orange px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Bot size={14} /> AI-Powered Shopping Experience
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Shop Smarter with <span className="text-amazon-orange">AI</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8">
            Personalized recommendations, AI shopping assistant, and millions of products at the best prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products"
              className="bg-amazon-orange hover:bg-yellow-500 text-white font-bold px-8 py-3 rounded-lg transition-all hover:scale-105 flex items-center gap-2">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link to="/products?featured=true"
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-bold px-8 py-3 rounded-lg transition-all flex items-center gap-2">
              <Sparkles size={18} /> Featured Deals
            </Link>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, label: 'Free Delivery', sub: 'On orders above ₹499' },
            { icon: Shield, label: 'Secure Payment', sub: '100% safe & encrypted' },
            { icon: RefreshCw, label: 'Easy Returns', sub: '30-day return policy' },
            { icon: Zap, label: 'Fast Delivery', sub: '2-5 business days' },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 bg-amazon-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-amazon-orange" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Shop by Category</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {HERO_CATEGORIES.map((cat) => (
              <Link key={cat.name} to={cat.href}
                className="flex flex-col items-center gap-2 group">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                  {cat.icon}
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center group-hover:text-amazon-orange transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* AI Recommendations */}
        {recs.length > 0 && (
          <section>
            <SectionHeader
              icon={Bot}
              title="Recommended for You"
              subtitle={recsData?.data?.type === 'personalized' ? 'Based on your browsing & purchase history' : 'Popular picks'}
              link="/products"
            />
            {recsLoading ? <ProductGridSkeleton count={8} /> : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recs.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </section>
        )}

        {/* Trending */}
        <section>
          <SectionHeader icon={TrendingUp} title="Trending Now" subtitle="Most popular products this week" link="/products" />
          {trendingLoading ? <ProductGridSkeleton count={8} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trending.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </section>

        {/* Featured */}
        <section>
          <SectionHeader icon={Sparkles} title="Featured Deals" subtitle="Handpicked deals with best discounts" link="/products?featured=true" />
          {featuredLoading ? <ProductGridSkeleton count={8} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </section>

        {/* AI Banner */}
        <section className="bg-gradient-to-r from-amazon-navy to-gray-900 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-amazon-orange rounded-2xl flex items-center justify-center flex-shrink-0">
            <Bot size={40} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Meet ShopBot — Your AI Shopping Assistant</h3>
            <p className="text-gray-300 mb-4">Ask questions like "Suggest laptops under ₹60,000" or "Best camera for travel" and get instant personalized recommendations powered by Claude AI.</p>
          </div>
          <button
            onClick={() => document.querySelector('[title="AI Shopping Assistant"]')?.click()}
            className="bg-amazon-orange hover:bg-yellow-500 text-white font-bold px-6 py-3 rounded-lg transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap"
          >
            <Bot size={18} /> Try ShopBot
          </button>
        </section>
      </div>
    </div>
  );
}
