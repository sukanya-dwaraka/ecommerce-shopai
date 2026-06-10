import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, Package, Truck, MapPin, Clock, X } from 'lucide-react';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  shipped: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
};

export function OrderSuccessPage() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
  });
  const order = data?.data?.order;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Placed! 🎉</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-2">Thank you for your order. We'll get it to you soon!</p>
      {order && (
        <p className="text-sm text-gray-500 mb-8">
          Order ID: <span className="font-mono font-semibold">{order._id}</span>
        </p>
      )}

      {order && (
        <div className="card p-6 text-left mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {order.orderItems?.map((item) => (
              <div key={item.product} className="flex gap-3 items-center">
                <img src={item.image} alt={item.name} className="w-12 h-12 object-contain rounded bg-gray-50 dark:bg-gray-700 p-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span>₹{order.totalPrice?.toLocaleString('en-IN')}</span></div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
            <p className="font-medium text-gray-900 dark:text-white mb-1">Delivery Address</p>
            <p className="text-gray-600 dark:text-gray-400">
              {order.shippingAddress?.name}, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to={`/orders/${id}`} className="btn-primary px-8">Track Order</Link>
        <Link to="/products" className="btn-outline px-8">Continue Shopping</Link>
      </div>
    </div>
  );
}

export function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMyOrders({ limit: 20 }),
  });
  const orders = data?.data?.orders || [];

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Package size={80} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
      <p className="text-gray-500 mb-6">Your order history will appear here.</p>
      <Link to="/products" className="btn-primary">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order._id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{order._id}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Placed on</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className={`badge ${STATUS_COLORS[order.orderStatus] || ''} capitalize font-semibold px-3 py-1`}>
                {order.orderStatus}
              </span>
              <p className="font-bold text-gray-900 dark:text-white">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {order.orderItems?.slice(0, 4).map((item) => (
                <div key={item.product} className="flex-shrink-0 text-center">
                  <img src={item.image} alt={item.name} className="w-14 h-14 object-contain rounded bg-gray-50 dark:bg-gray-700 p-1" />
                  <p className="text-xs text-gray-500 mt-1 w-14 truncate">{item.name}</p>
                </div>
              ))}
              {order.orderItems?.length > 4 && (
                <div className="flex-shrink-0 w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm text-gray-500">
                  +{order.orderItems.length - 4}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-3">
              <Link to={`/orders/${order._id}`} className="btn-outline text-sm py-1.5">View Details</Link>
              {['pending', 'confirmed'].includes(order.orderStatus) && (
                <Link to={`/orders/${order._id}`} className="text-sm text-red-500 hover:text-red-700 py-1.5 flex items-center gap-1">
                  <X size={14} /> Cancel Order
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
  });
  const order = data?.data?.order;

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await orderAPI.cancel(id, 'Cancelled by customer');
      refetch();
    } catch {
      toast.error('Could not cancel order');
    }
  };

  if (isLoading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="skeleton h-96 rounded-xl" /></div>;
  if (!order) return <div className="text-center py-20"><p className="text-xl">Order not found</p></div>;

  const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{order._id}</p>
        </div>
        <span className={`badge ${STATUS_COLORS[order.orderStatus]} capitalize font-semibold px-3 py-1.5 text-sm`}>
          {order.orderStatus}
        </span>
      </div>

      {/* Progress tracker */}
      {order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((s, i) => {
              const icons = [Clock, CheckCircle, Package, Truck, MapPin];
              const Icon = icons[i];
              const done = i <= currentStep;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-amazon-orange text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                      <Icon size={18} />
                    </div>
                    <span className={`text-xs capitalize font-medium ${done ? 'text-amazon-orange' : 'text-gray-400'}`}>{s}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${i < currentStep ? 'bg-amazon-orange' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Items</h2>
          <div className="space-y-3">
            {order.orderItems?.map((item) => (
              <div key={item.product} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-14 h-14 object-contain rounded bg-gray-50 dark:bg-gray-700 p-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{item.name}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span>₹{order.itemsPrice?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Shipping</span><span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>GST</span><span>₹{order.taxPrice?.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span><span>₹{order.totalPrice?.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Address + Payment */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><MapPin size={16} /> Delivery Address</h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <p className="font-medium">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}</p>
              <p>📞 {order.shippingAddress?.phone}</p>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Info</h2>
            <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
              <p>Method: <span className="font-medium capitalize">{order.paymentMethod}</span></p>
              <p>Status: <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-orange-500'}`}>{order.isPaid ? 'Paid' : 'Pending'}</span></p>
              {order.paidAt && <p>Paid on: {new Date(order.paidAt).toLocaleDateString('en-IN')}</p>}
            </div>
          </div>

          {['pending', 'confirmed'].includes(order.orderStatus) && (
            <button onClick={handleCancel} className="w-full border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <X size={16} /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {/* Status history */}
      {order.statusHistory?.length > 0 && (
        <div className="card p-5 mt-6">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Timeline</h2>
          <div className="space-y-3">
            {order.statusHistory.map((h, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <div className="w-2 h-2 bg-amazon-orange rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="font-medium capitalize text-gray-900 dark:text-white">{h.status}</p>
                  {h.note && <p className="text-gray-500">{h.note}</p>}
                  <p className="text-xs text-gray-400">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
