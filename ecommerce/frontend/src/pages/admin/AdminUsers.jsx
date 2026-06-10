import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { AdminLayout } from './AdminDashboard';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', debouncedSearch, page],
    queryFn: () => adminAPI.getUsers({ search: debouncedSearch, page, limit: 15 }),
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || {};

  const handleSearch = (e) => {
    setSearch(e.target.value);
    clearTimeout(window._uSearchTimer);
    window._uSearchTimer = setTimeout(() => { setDebouncedSearch(e.target.value); setPage(1); }, 400);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setUpdatingId(userId);
    try {
      await adminAPI.updateUser(userId, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      queryClient.invalidateQueries(['admin-users']);
    } catch { toast.error('Failed to update user'); }
    finally { setUpdatingId(null); }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    setUpdatingId(userId);
    try {
      await adminAPI.updateUser(userId, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      queryClient.invalidateQueries(['admin-users']);
    } catch { toast.error('Failed to update role'); }
    finally { setUpdatingId(null); }
  };

  return (
    <AdminLayout title="Users">
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={handleSearch} placeholder="Search users by name or email..."
            className="input pl-9 text-sm" />
        </div>
        <span className="text-sm text-gray-500">{pagination.total || 0} users</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No users found</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                {['User', 'Email', 'Phone', 'Role', 'Joined', 'Last Login', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{user.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                      {user.role === 'admin' && <Shield size={10} className="inline mr-0.5" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                        disabled={updatingId === user._id}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        className={`p-1.5 rounded transition-colors ${user.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                        {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                      <button
                        onClick={() => handleToggleRole(user._id, user.role)}
                        disabled={updatingId === user._id}
                        title={user.role === 'admin' ? 'Remove admin' : 'Make admin'}
                        className="p-1.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors">
                        <Shield size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800">Next</button>
        </div>
      )}
    </AdminLayout>
  );
}
