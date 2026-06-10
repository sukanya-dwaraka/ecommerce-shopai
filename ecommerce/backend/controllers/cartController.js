const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @route GET /api/cart
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product', 'name images price stock isActive'
  );
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  // Filter out inactive products
  if (cart.items) {
    cart.items = cart.items.filter((item) => item.product && item.product.isActive);
  }
  res.json({ success: true, cart });
};

// @route POST /api/cart
exports.addToCart = async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ success: false, message: 'Product ID required' });

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  if (product.stock < 1) return res.status(400).json({ success: false, message: 'Out of stock' });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
  if (itemIndex > -1) {
    const newQty = cart.items[itemIndex].quantity + quantity;
    cart.items[itemIndex].quantity = Math.min(newQty, product.stock);
  } else {
    cart.items.push({ product: productId, quantity: Math.min(quantity, product.stock), price: product.price });
  }

  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product', 'name images price stock');

  res.json({ success: true, cart });
};

// @route PUT /api/cart/:productId
exports.updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  const itemIndex = cart.items.findIndex((i) => i.product.toString() === req.params.productId);
  if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Item not in cart' });

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    const product = await Product.findById(req.params.productId);
    cart.items[itemIndex].quantity = Math.min(quantity, product.stock);
  }

  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product', 'name images price stock');
  res.json({ success: true, cart });
};

// @route DELETE /api/cart/:productId
exports.removeFromCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  cart.calculateTotals();
  await cart.save();
  await cart.populate('items.product', 'name images price stock');
  res.json({ success: true, cart });
};

// @route DELETE /api/cart
exports.clearCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    cart.calculateTotals();
    await cart.save();
  }
  res.json({ success: true, message: 'Cart cleared' });
};
