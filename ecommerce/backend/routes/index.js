const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/authController');
const productCtrl = require('../controllers/productController');
const cartCtrl = require('../controllers/cartController');
const wishlistCtrl = require('../controllers/wishlistController');
const orderCtrl = require('../controllers/orderController');
const aiCtrl = require('../controllers/aiController');
const adminCtrl = require('../controllers/adminController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

// ─── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', protect, authCtrl.getMe);
router.put('/auth/profile', protect, authCtrl.updateProfile);
router.put('/auth/password', protect, authCtrl.changePassword);
router.post('/auth/address', protect, authCtrl.addAddress);
router.put('/auth/address/:id', protect, authCtrl.updateAddress);
router.delete('/auth/address/:id', protect, authCtrl.deleteAddress);

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
router.get('/products', optionalAuth, productCtrl.getProducts);
router.get('/products/categories', productCtrl.getCategories);
router.get('/products/brands', productCtrl.getBrands);
router.get('/products/:id', optionalAuth, productCtrl.getProduct);
router.post('/products/:id/review', protect, productCtrl.addReview);

// ─── CART ─────────────────────────────────────────────────────────────────────
router.get('/cart', protect, cartCtrl.getCart);
router.post('/cart', protect, cartCtrl.addToCart);
router.put('/cart/:productId', protect, cartCtrl.updateCartItem);
router.delete('/cart/:productId', protect, cartCtrl.removeFromCart);
router.delete('/cart', protect, cartCtrl.clearCart);

// ─── WISHLIST ────────────────────────────────────────────────────────────────
router.get('/wishlist', protect, wishlistCtrl.getWishlist);
router.post('/wishlist/:productId', protect, wishlistCtrl.addToWishlist);
router.delete('/wishlist/:productId', protect, wishlistCtrl.removeFromWishlist);

// ─── ORDERS ──────────────────────────────────────────────────────────────────
router.post('/orders', protect, orderCtrl.createOrder);
router.post('/orders/:id/pay', protect, orderCtrl.verifyPayment);
router.get('/orders/my', protect, orderCtrl.getMyOrders);
router.get('/orders/:id', protect, orderCtrl.getOrder);
router.put('/orders/:id/cancel', protect, orderCtrl.cancelOrder);

// ─── AI ───────────────────────────────────────────────────────────────────────
router.get('/ai/recommendations', optionalAuth, aiCtrl.getRecommendations);
router.get('/ai/similar/:productId', aiCtrl.getSimilarProducts);
router.get('/ai/trending', aiCtrl.getTrending);
router.get('/ai/frequently-bought-together/:productId', aiCtrl.getFrequentlyBoughtTogether);
router.post('/ai/chat', optionalAuth, aiCtrl.chat);

// ─── ADMIN ───────────────────────────────────────────────────────────────────
const admin = [protect, authorize('admin')];

router.get('/admin/dashboard', ...admin, orderCtrl.getDashboardStats);
router.get('/admin/users', ...admin, adminCtrl.getUsers);
router.get('/admin/users/:id', ...admin, adminCtrl.getUser);
router.put('/admin/users/:id', ...admin, adminCtrl.updateUser);
router.delete('/admin/users/:id', ...admin, adminCtrl.deleteUser);

router.get('/admin/products', ...admin, productCtrl.adminGetProducts);
router.post('/admin/products', ...admin, productCtrl.createProduct);
router.put('/admin/products/:id', ...admin, productCtrl.updateProduct);
router.delete('/admin/products/:id', ...admin, productCtrl.deleteProduct);

router.get('/admin/orders', ...admin, orderCtrl.adminGetOrders);
router.put('/admin/orders/:id', ...admin, orderCtrl.adminUpdateOrder);

module.exports = router;
