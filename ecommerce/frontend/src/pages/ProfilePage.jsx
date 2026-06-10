import React, { useState } from 'react';
import { User, Lock, MapPin, Package, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [addingAddr, setAddingAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(profileForm);
      await fetchMe();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password updated!');
      setPwdForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSaving(false); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await authAPI.addAddress(newAddr);
      await fetchMe();
      toast.success('Address added!');
      setAddingAddr(false);
      setNewAddr({ name: '', phone: '', street: '', city: '', state: '', pincode: '', isDefault: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await authAPI.deleteAddress(id);
      await fetchMe();
      toast.success('Address deleted');
    } catch { toast.error('Failed to delete address'); }
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'orders', label: 'Orders', icon: Package },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-amazon-orange rounded-full flex items-center justify-center text-white font-bold text-2xl">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
          {user?.role === 'admin' && (
            <span className="badge bg-amazon-orange text-white mt-1">Admin</span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="card p-2 h-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-amazon-orange text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Personal Information</h2>
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input value={user?.email} disabled className="input opacity-60 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} className="input" placeholder="9876543210" />
                </div>
                <button type="submit" disabled={saving} className="btn-primary px-6 py-2">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {tab === 'password' && (
            <div className="card p-6">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {[
                  { key: 'currentPassword', label: 'Current Password' },
                  { key: 'newPassword', label: 'New Password' },
                  { key: 'confirm', label: 'Confirm New Password' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                    <input type="password" value={pwdForm[key]} onChange={(e) => setPwdForm((f) => ({ ...f, [key]: e.target.value }))} className="input" required />
                  </div>
                ))}
                <button type="submit" disabled={saving} className="btn-primary px-6 py-2">
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {tab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-900 dark:text-white">Saved Addresses</h2>
                <button onClick={() => setAddingAddr(!addingAddr)} className="btn-outline text-sm py-1.5 flex items-center gap-1">
                  <Plus size={14} /> Add Address
                </button>
              </div>

              {addingAddr && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">New Address</h3>
                  <form onSubmit={handleAddAddress} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Name *</label>
                        <input value={newAddr.name} onChange={(e) => setNewAddr((a) => ({ ...a, name: e.target.value }))} className="input mt-1" required />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Phone *</label>
                        <input value={newAddr.phone} onChange={(e) => setNewAddr((a) => ({ ...a, phone: e.target.value }))} className="input mt-1" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Street *</label>
                      <input value={newAddr.street} onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))} className="input mt-1" required />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {['city', 'state', 'pincode'].map((f) => (
                        <div key={f}>
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">{f} *</label>
                          <input value={newAddr[f]} onChange={(e) => setNewAddr((a) => ({ ...a, [f]: e.target.value }))} className="input mt-1" required />
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr((a) => ({ ...a, isDefault: e.target.checked }))} className="rounded text-amazon-orange" />
                      Set as default address
                    </label>
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary px-4 py-2 text-sm">Save Address</button>
                      <button type="button" onClick={() => setAddingAddr(false)} className="btn-outline px-4 py-2 text-sm">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {user?.addresses?.length === 0 && !addingAddr && (
                <div className="card p-8 text-center">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No saved addresses. Add one to speed up checkout!</p>
                </div>
              )}

              {user?.addresses?.map((addr) => (
                <div key={addr._id} className="card p-4 flex gap-4">
                  <MapPin size={20} className="text-amazon-orange flex-shrink-0 mt-1" />
                  <div className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{addr.name}</span>
                      <span className="text-gray-400">·</span>
                      <span>{addr.phone}</span>
                      {addr.isDefault && <span className="badge bg-orange-100 text-orange-600 text-xs">Default</span>}
                    </div>
                    <p>{addr.street}, {addr.city}, {addr.state} – {addr.pincode}</p>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr._id)} className="p-1.5 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'orders' && (
            <div className="card p-6 text-center">
              <Package size={48} className="mx-auto text-amazon-orange mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">View your complete order history</p>
              <Link to="/orders" className="btn-primary px-6 py-2">Go to My Orders</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
