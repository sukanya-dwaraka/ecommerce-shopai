const User = require('../models/User');
const Product = require('../models/Product');

// @route GET /api/wishlist
exports.getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    'wishlist', 'name price originalPrice discount images ratings numReviews stock brand category'
  );
  res.json({ success: true, wishlist: user.wishlist });
};

// @route POST /api/wishlist/:productId
exports.addToWishlist = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const user = await User.findById(req.user._id);
  if (user.wishlist.includes(req.params.productId)) {
    return res.status(400).json({ success: false, message: 'Already in wishlist' });
  }

  user.wishlist.push(req.params.productId);

  // Track category preference
  const catIndex = user.activityLog.wishlistedCategories.findIndex(
    (c) => c.category === product.category
  );
  if (catIndex > -1) {
    user.activityLog.wishlistedCategories[catIndex].count += 1;
  } else {
    user.activityLog.wishlistedCategories.push({ category: product.category });
  }

  await user.save({ validateBeforeSave: false });
  await Product.findByIdAndUpdate(req.params.productId, { $inc: { wishlistCount: 1 } });

  res.json({ success: true, message: 'Added to wishlist' });
};

// @route DELETE /api/wishlist/:productId
exports.removeFromWishlist = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  await Product.findByIdAndUpdate(req.params.productId, { $inc: { wishlistCount: -1 } });
  res.json({ success: true, message: 'Removed from wishlist' });
};

// @route POST /api/wishlist/:productId/move-to-cart
exports.moveToCart = async (req, res) => {
  // Handled by frontend (add to cart + remove from wishlist)
  await User.findByIdAndUpdate(req.user._id, { $pull: { wishlist: req.params.productId } });
  res.json({ success: true, message: 'Moved to cart' });
};
