import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Package, ShoppingBag, Users, Menu, X, LogOut, Sun, Moon, TrendingUp, DollarSign, ShoppingCart, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminAPI } from '../../services/api';
import { useAuthStore, useUIStore } from '../../store';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/users', label: 'Users', icon: Users },
];

const PIE_COLORS = ['#FF9900', '#00C49F', '#FFBB28', '#FF6B6B', '#845EC2', '#D65DB1'];

export function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-amazon-dark dark:bg-gray-900 text-white transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 flex flex-col`}>
        <div className="p-4 border-b border-gray-700">
          <Link to="/" className="text-amazon-orange font-bold text-xl flex items-center gap-2">
            🛒 ShopAI Admin
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
            const active = exact ? location.pathname === path : location.pathname.startsWith(path);
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-amazon-orange text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                <Icon size={18} /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            ← View Store
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 shadow-sm px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white hidden md:block">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard(),
  });
  const stats = data?.data?.stats;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = stats?.revenueByMonth?.map((m) => ({
    month: monthNames[m._id.month - 1],
    revenue: Math.round(m.revenue),
    orders: m.orders,
  })) || [];

  const orderStatusData = stats?.ordersByStatus?.map((s) => ({
    name: s._id,
    value: s.count,
  })) || [];

  return (
    <AdminLayout title="Dashboard">
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={DollarSign} label="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`} color="bg-green-500" />
            <StatCard icon={ShoppingBag} label="Total Orders" value={(stats?.totalOrders || 0).toLocaleString()} color="bg-blue-500" />
            <StatCard icon={Users} label="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} color="bg-purple-500" />
            <StatCard icon={Package} label="Total Products" value={(stats?.totalProducts || 0).toLocaleString()} color="bg-amazon-orange" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue chart */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-amazon-orange" /> Revenue (Last 12 months)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#FF9900" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order status pie */}
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Status Distribution</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h2>
                <Link to="/admin/orders" className="text-xs text-amazon-orange hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {stats?.recentOrders?.map((order) => (
                  <div key={order._id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{order.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 font-mono">{order._id.slice(-8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                      <span className={`badge text-xs capitalize ${order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top products */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Top Selling Products</h2>
                <Link to="/admin/products" className="text-xs text-amazon-orange hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {stats?.topProducts?.map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="w-6 h-6 bg-amazon-orange/10 text-amazon-orange rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-10 object-contain rounded bg-gray-50 dark:bg-gray-700 p-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.purchaseCount} sold</p>
                    </div>
                    <p className="text-sm font-semibold">₹{p.price?.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
