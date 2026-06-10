import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, X } from 'lucide-react';
import { AdminLayout } from './AdminDashboard';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700', shipped: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, page],
    queryFn: () => adminAPI.getOrders({ status: statusFilter, page, limit: 15 }),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {};

  const handleUpdateStatus = async (orderId, orderStatus, note) => {
    setUpdatingId(orderId);
    try {
      await adminAPI.updateOrder(orderId, { orderStatus, note });
      toast.success(`Order status updated to ${orderStatus}`);
      queryClient.invalidateQueries(['admin-orders']);
      setExpandedOrder(null);
    } catch {
      toast.error('Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title="Orders">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input w-auto text-sm py-2">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">{pagination.total || 0} orders</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-lg" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No orders found</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                {['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {order._id.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      ₹{order.totalPrice?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${order.isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {order.isPaid ? 'Paid' : order.paymentMethod === 'cod' ? 'COD' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge capitalize text-xs ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                        className="text-amazon-orange hover:text-yellow-500 text-sm font-medium flex items-center gap-1">
                        Manage <ChevronDown size={14} className={`transition-transform ${expandedOrder === order._id ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded row */}
                  {expandedOrder === order._id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Order Items</p>
                            {order.orderItems?.map((item) => (
                              <div key={item.product} className="flex gap-2 items-center mb-1">
                                <img src={item.image} alt={item.name} className="w-8 h-8 object-contain rounded bg-white dark:bg-gray-700 p-0.5" />
                                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 line-clamp-1">{item.name}</span>
                                <span className="text-xs font-medium">×{item.quantity}</span>
                              </div>
                            ))}
                            <p className="text-xs text-gray-500 mt-2">
                              Ship to: {order.shippingAddress?.name}, {order.shippingAddress?.city}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Update Status</p>
                            <div className="flex flex-wrap gap-2">
                              {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                                <button key={s} onClick={() => handleUpdateStatus(order._id, s)}
                                  disabled={updatingId === order._id || order.orderStatus === s}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors capitalize disabled:opacity-40 ${order.orderStatus === s ? 'border-amazon-orange bg-amazon-orange text-white' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-amazon-orange hover:text-amazon-orange'}`}>
                                  {updatingId === order._id ? '...' : s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
