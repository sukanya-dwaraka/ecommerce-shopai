import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Menu, X, Sun, Moon, Package, LogOut, Settings, Bot } from 'lucide-react';
import { useAuthStore, useCartStore, useWishlistStore, useUIStore } from '../../store';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { wishlist } = useWishlistStore();
  const { darkMode, toggleDarkMode, toggleChat } = useUIStore();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const cartCount = cart?.totalItems || 0;
  const wishlistCount = wishlist?.length || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-amazon-navy dark:bg-gray-900 shadow-lg">
      {/* Top bar */}
      <div className="bg-amazon-dark dark:bg-gray-950 px-4 py-1">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-amazon-orange font-bold text-xl flex items-center gap-1">
            <span className="text-2xl">🛒</span> ShopAI
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:flex">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, categories..."
              className="flex-1 px-4 py-2 text-gray-900 rounded-l-md focus:outline-none text-sm"
            />
            <button type="submit" className="bg-amazon-orange hover:bg-yellow-500 px-4 py-2 rounded-r-md transition-colors">
              <Search size={18} className="text-white" />
            </button>
          </form>

          {/* Nav icons */}
          <div className="flex items-center gap-2">
            <button onClick={toggleDarkMode} className="p-2 text-gray-300 hover:text-white transition-colors">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button onClick={toggleChat} className="p-2 text-gray-300 hover:text-amazon-orange transition-colors relative" title="AI Shopping Assistant">
              <Bot size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </button>

            {user ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 text-gray-300 hover:text-white text-sm p-2 transition-colors">
                  <User size={18} />
                  <span className="hidden md:block max-w-20 truncate">{user.name.split(' ')[0]}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {[
                      { to: '/profile', icon: Settings, label: 'Profile' },
                      { to: '/orders', icon: Package, label: 'My Orders' },
                    ].map(({ to, icon: Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Icon size={14} /> {label}
                      </Link>
                    ))}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-amazon-orange hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                        <Settings size={14} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/'); }}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-gray-300 hover:text-white text-sm px-3 py-2 flex items-center gap-1 transition-colors">
                <User size={18} /> Sign In
              </Link>
            )}

            <Link to="/wishlist" className="relative p-2 text-gray-300 hover:text-red-400 transition-colors">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 text-gray-300 hover:text-amazon-orange transition-colors">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amazon-orange text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-amazon-navy dark:bg-gray-900 px-4 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          {['Laptops', 'Smartphones', 'Headphones', 'Televisions', 'Cameras', 'Tablets', 'Gaming', 'Smartwatches'].map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`}
              className="text-gray-300 hover:text-white text-sm whitespace-nowrap transition-colors hover:underline">
              {cat}
            </Link>
          ))}
          <Link to="/products" className="text-amazon-orange hover:text-yellow-400 text-sm whitespace-nowrap transition-colors ml-auto">
            All Products →
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <div className="bg-amazon-dark dark:bg-gray-950 px-4 pb-2 md:hidden">
        <form onSubmit={handleSearch} className="flex">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-2 text-sm text-gray-900 rounded-l-md focus:outline-none"
          />
          <button type="submit" className="bg-amazon-orange px-3 py-2 rounded-r-md">
            <Search size={16} className="text-white" />
          </button>
        </form>
      </div>
    </nav>
  );
}
