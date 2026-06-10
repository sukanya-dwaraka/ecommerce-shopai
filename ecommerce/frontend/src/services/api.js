import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/password', data),
  addAddress: (data) => API.post('/auth/address', data),
  updateAddress: (id, data) => API.put(`/auth/address/${id}`, data),
  deleteAddress: (id) => API.delete(`/auth/address/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: (params) => API.get('/products', { params }),
  getOne: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories'),
  getBrands: (params) => API.get('/products/brands', { params }),
  addReview: (id, data) => API.post(`/products/${id}/review`, data),
};

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const cartAPI = {
  get: () => API.get('/cart'),
  add: (productId, quantity) => API.post('/cart', { productId, quantity }),
  update: (productId, quantity) => API.put(`/cart/${productId}`, { quantity }),
  remove: (productId) => API.delete(`/cart/${productId}`),
  clear: () => API.delete('/cart'),
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
export const wishlistAPI = {
  get: () => API.get('/wishlist'),
  add: (productId) => API.post(`/wishlist/${productId}`),
  remove: (productId) => API.delete(`/wishlist/${productId}`),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orderAPI = {
  create: (data) => API.post('/orders', data),
  verifyPayment: (id, data) => API.post(`/orders/${id}/pay`, data),
  getMyOrders: (params) => API.get('/orders/my', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  cancel: (id, reason) => API.put(`/orders/${id}/cancel`, { reason }),
};

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiAPI = {
  getRecommendations: (params) => API.get('/ai/recommendations', { params }),
  getSimilar: (productId) => API.get(`/ai/similar/${productId}`),
  getTrending: (params) => API.get('/ai/trending', { params }),
  getFrequentlyBought: (productId) => API.get(`/ai/frequently-bought-together/${productId}`),
  chat: (data) => API.post('/ai/chat', data),
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getProducts: (params) => API.get('/admin/products', { params }),
  createProduct: (data) => API.post('/admin/products', data),
  updateProduct: (id, data) => API.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => API.delete(`/admin/products/${id}`),
  getOrders: (params) => API.get('/admin/orders', { params }),
  updateOrder: (id, data) => API.put(`/admin/orders/${id}`, data),
};
