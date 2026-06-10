import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI, cartAPI, wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      login: async (credentials) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.login(credentials);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, loading: false });
          toast.success(`Welcome back, ${data.user.name}!`);
          return { success: true };
        } catch (err) {
          set({ loading: false });
          toast.error(err.response?.data?.message || 'Login failed');
          return { success: false };
        }
      },

      register: async (userData) => {
        set({ loading: true });
        try {
          const { data } = await authAPI.register(userData);
          localStorage.setItem('token', data.token);
          set({ user: data.user, token: data.token, loading: false });
          toast.success('Account created successfully!');
          return { success: true };
        } catch (err) {
          set({ loading: false });
          toast.error(err.response?.data?.message || 'Registration failed');
          return { success: false };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        try {
          const { data } = await authAPI.getMe();
          set({ user: data.user });
        } catch (_) {
          get().logout();
        }
      },

      updateUser: (user) => set({ user }),
    }),
    { name: 'auth-store', partialize: (s) => ({ token: s.token }) }
  )
);

// ─── Cart Store ───────────────────────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const { data } = await cartAPI.get();
      set({ cart: data.cart, loading: false });
    } catch (_) {
      set({ loading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const { data } = await cartAPI.add(productId, quantity);
      set({ cart: data.cart });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  },

  updateItem: async (productId, quantity) => {
    try {
      const { data } = await cartAPI.update(productId, quantity);
      set({ cart: data.cart });
    } catch (err) {
      toast.error('Failed to update cart');
    }
  },

  removeItem: async (productId) => {
    try {
      const { data } = await cartAPI.remove(productId);
      set({ cart: data.cart });
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  },

  clearCart: async () => {
    try {
      await cartAPI.clear();
      set({ cart: { items: [], totalPrice: 0, totalItems: 0 } });
    } catch (_) {}
  },

  get itemCount() {
    return get().cart?.totalItems || 0;
  },
}));

// ─── Wishlist Store ───────────────────────────────────────────────────────────
export const useWishlistStore = create((set, get) => ({
  wishlist: [],
  loading: false,

  fetchWishlist: async () => {
    try {
      const { data } = await wishlistAPI.get();
      set({ wishlist: data.wishlist });
    } catch (_) {}
  },

  addToWishlist: async (productId) => {
    try {
      await wishlistAPI.add(productId);
      set((s) => ({ wishlist: [...s.wishlist, { _id: productId }] }));
      toast.success('Added to wishlist!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to wishlist');
    }
  },

  removeFromWishlist: async (productId) => {
    try {
      await wishlistAPI.remove(productId);
      set((s) => ({ wishlist: s.wishlist.filter((p) => p._id !== productId) }));
      toast.success('Removed from wishlist');
    } catch (_) {}
  },

  isWishlisted: (productId) => get().wishlist.some((p) => p._id === productId),
}));

// ─── UI Store ─────────────────────────────────────────────────────────────────
export const useUIStore = create(
  persist(
    (set) => ({
      darkMode: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        }),
      chatOpen: false,
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
    }),
    { name: 'ui-store' }
  )
);
