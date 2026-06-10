import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Truck, CheckCircle, Plus } from 'lucide-react';
import { useCartStore, useAuthStore } from '../store';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Payment', 'Review'];

function AddressForm({ onSave }) {
  const [form, setForm] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '' });
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['name', 'phone', 'street', 'city', 'state', 'pincode'];
    if (required.some((k) => !form[k].trim())) {
      toast.error('All address fields are required');
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) { toast.error('Enter a valid 10-digit phone number'); return; }
    if (!/^\d{6}$/.test(form.pincode)) { toast.error('Enter a valid 6-digit pincode'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className="input" placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
          <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input" placeholder="9876543210" maxLength={10} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address *</label>
        <input value={form.street} onChange={(e) => update('street', e.target.value)} className="input" placeholder="123, Main Street, Apt 4B" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
          <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input" placeholder="Mumbai" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
          <input value={form.state} onChange={(e) => update('state', e.target.value)} className="input" placeholder="Maharashtra" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode *</label>
          <input value={form.pincode} onChange={(e) => update('pincode', e.target.value)} className="input" placeholder="400001" maxLength={6} />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full py-2.5">Use This Address</button>
    </form>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [loading, setLoading] = useState(false);
  const [useExisting, setUseExisting] = useState(user?.addresses?.length > 0);
  const [selectedAddr, setSelectedAddr] = useState(user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0]);

  const items = cart?.items || [];
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const tax = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = async () => {
    const shippingAddress = useExisting && selectedAddr ? selectedAddr : address;
    if (!shippingAddress) { toast.error('Please select or add an address'); return; }

    setLoading(true);
    try {
      const { data } = await orderAPI.create({ shippingAddress, paymentMethod });

      if (paymentMethod === 'razorpay' && data.razorpayOrder) {
        // Load Razorpay script
        await loadRazorpay();

        const options = {
          key: data.key,
          amount: data.razorpayOrder.amount,
          currency: 'INR',
          name: 'ShopAI',
          description: 'Order Payment',
          order_id: data.razorpayOrder.id,
          handler: async (response) => {
            try {
              await orderAPI.verifyPayment(data.order._id, response);
              await clearCart();
              navigate(`/order-success/${data.order._id}`);
            } catch {
              toast.error('Payment verification failed. Contact support.');
            }
          },
          prefill: { name: user?.name, email: user?.email, contact: shippingAddress.phone },
          theme: { color: '#FF9900' },
          modal: { ondismiss: () => { setLoading(false); toast.error('Payment cancelled'); } },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      } else {
        // COD
        await clearCart();
        navigate(`/order-success/${data.order._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      document.body.appendChild(script);
    });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i <= step ? 'bg-amazon-orange text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${i <= step ? 'text-amazon-orange' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-amazon-orange' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 0: Address */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={20} className="text-amazon-orange" />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Delivery Address</h2>
            </div>

            {user?.addresses?.length > 0 && (
              <div className="mb-4">
                <div className="flex gap-3 mb-3">
                  <button onClick={() => setUseExisting(true)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${useExisting ? 'bg-amazon-orange text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    Saved Addresses
                  </button>
                  <button onClick={() => setUseExisting(false)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${!useExisting ? 'bg-amazon-orange text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    <Plus size={14} /> New Address
                  </button>
                </div>

                {useExisting && (
                  <div className="space-y-2">
                    {user.addresses.map((addr) => (
                      <label key={addr._id} className={`flex gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${selectedAddr?._id === addr._id ? 'border-amazon-orange bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                        <input type="radio" name="address" checked={selectedAddr?._id === addr._id}
                          onChange={() => setSelectedAddr(addr)} className="mt-1 text-amazon-orange" />
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-semibold">{addr.name} · {addr.phone}</p>
                          <p>{addr.street}, {addr.city}, {addr.state} – {addr.pincode}</p>
                          {addr.isDefault && <span className="text-xs text-amazon-orange">Default</span>}
                        </div>
                      </label>
                    ))}
                    <button onClick={() => setStep(1)}
                      className="w-full btn-primary py-2.5 mt-2">
                      Deliver to This Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {(!useExisting || !user?.addresses?.length) && (
              <AddressForm onSave={(addr) => { setAddress(addr); setStep(1); }} />
            )}
          </div>

          {/* Step 1: Payment */}
          {step >= 1 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-amazon-orange" />
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'border-amazon-orange bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input type="radio" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-amazon-orange" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Pay Online (Razorpay)</p>
                    <p className="text-xs text-gray-500">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {['💳', '📱', '🏦'].map((e) => <span key={e} className="text-lg">{e}</span>)}
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-amazon-orange bg-orange-50 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input type="radio" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="text-amazon-orange" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-500">Pay when your order arrives</p>
                  </div>
                  <span className="ml-auto text-2xl">💵</span>
                </label>
              </div>

              <button onClick={() => setStep(2)} className="btn-primary w-full py-2.5 mt-4">
                Continue to Review
              </button>
            </div>
          )}

          {/* Step 2: Review */}
          {step >= 2 && (
            <div className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Review Order</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.product?._id} className="flex gap-3 items-center">
                    <img src={item.product?.images?.[0]?.url} alt={item.product?.name}
                      className="w-12 h-12 object-contain rounded bg-gray-50 dark:bg-gray-700 p-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.product?.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <button onClick={handlePlaceOrder} disabled={loading}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="animate-spin">⟳</span> Processing...</>
                ) : (
                  <><CheckCircle size={18} /> Place Order — ₹{total.toLocaleString('en-IN')}</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit sticky top-24 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-white">Price Details</h3>
          <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
            <div className="flex justify-between"><span>Price ({items.length} items)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>₹{tax.toLocaleString('en-IN')}</span></div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white text-base">
              <span>Total Amount</span><span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400">🔒 Secured by Razorpay</p>
        </div>
      </div>
    </div>
  );
}
