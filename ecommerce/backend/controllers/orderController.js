const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @route POST /api/orders
exports.createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  if (!shippingAddress || !paymentMethod)
    return res.status(400).json({ success: false, message: 'Shipping address and payment method required' });

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0)
    return res.status(400).json({ success: false, message: 'Cart is empty' });

  // Validate stock
  for (const item of cart.items) {
    if (!item.product || !item.product.isActive)
      return res.status(400).json({ success: false, message: `${item.product?.name} is unavailable` });
    if (item.product.stock < item.quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock for ${item.product.name}` });
  }

  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.images[0]?.url || '',
    price: item.product.price,
    quantity: item.quantity,
  }));

  const itemsPrice = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const taxPrice = Math.round(itemsPrice * 0.18 * 100) / 100;
  const shippingPrice = itemsPrice > 499 ? 0 : 49;
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // If Razorpay, create payment order
  if (paymentMethod === 'razorpay') {
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalPrice * 100),
      currency: 'INR',
      receipt: order._id.toString(),
    });
    order.paymentResult = { razorpay_order_id: razorpayOrder.id };
    await order.save();

    return res.status(201).json({
      success: true,
      order,
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  }

  // COD - reduce stock immediately
  await updateStockAndActivity(orderItems, req.user._id);
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalPrice: 0, totalItems: 0 });

  res.status(201).json({ success: true, order });
};

// @route POST /api/orders/:id/pay
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

  if (expectedSig !== razorpay_signature)
    return res.status(400).json({ success: false, message: 'Payment verification failed' });

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.isPaid = true;
  order.paidAt = new Date();
  order.orderStatus = 'confirmed';
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid', paidAt: new Date() };
  order.statusHistory.push({ status: 'confirmed', note: 'Payment verified' });
  await order.save();

  await updateStockAndActivity(order.orderItems, req.user._id);
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], totalPrice: 0, totalItems: 0 });

  res.json({ success: true, order });
};

async function updateStockAndActivity(orderItems, userId) {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity, purchaseCount: item.quantity },
    });
    const product = await Product.findById(item.product);
    if (product) {
      const user = await User.findById(userId);
      const catIndex = user.activityLog.purchasedCategories.findIndex(
        (c) => c.category === product.category
      );
      if (catIndex > -1) {
        user.activityLog.purchasedCategories[catIndex].count += item.quantity;
      } else {
        user.activityLog.purchasedCategories.push({ category: product.category, count: item.quantity });
      }
      await user.save({ validateBeforeSave: false });
    }
  }
}

// @route GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments({ user: req.user._id }),
  ]);

  res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// @route GET /api/orders/:id
exports.getOrder = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Not authorized' });
  res.json({ success: true, order });
};

// @route PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString())
    return res.status(403).json({ success: false, message: 'Not authorized' });
  if (!['pending', 'confirmed'].includes(order.orderStatus))
    return res.status(400).json({ success: false, message: 'Cannot cancel this order' });

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = req.body.reason || 'Cancelled by user';
  order.statusHistory.push({ status: 'cancelled', note: order.cancellationReason });

  // Restore stock
  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  await order.save();
  res.json({ success: true, order });
};

// --- ADMIN ---
exports.adminGetOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const query = req.query.status ? { orderStatus: req.query.status } : {};

  const [orders, total] = await Promise.all([
    Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

exports.adminUpdateOrder = async (req, res) => {
  const { orderStatus, trackingNumber, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (orderStatus === 'delivered') order.deliveredAt = new Date();
  order.statusHistory.push({ status: orderStatus, note: note || `Status updated to ${orderStatus}` });
  await order.save();
  res.json({ success: true, order });
};

exports.getDashboardStats = async (req, res) => {
  const [
    totalOrders, totalRevenue, totalUsers, totalProducts,
    recentOrders, topProducts, ordersByStatus, revenueByMonth,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Product.find().sort({ purchaseCount: -1 }).limit(5).select('name purchaseCount price images'),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    success: true,
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
      recentOrders,
      topProducts,
      ordersByStatus,
      revenueByMonth,
    },
  });
};
