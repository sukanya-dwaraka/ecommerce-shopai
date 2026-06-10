const Product = require('../models/Product');
const User = require('../models/User');

// @route GET /api/products
exports.getProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = { isActive: true };

  // Search
  if (req.query.search) {
    query.$text = { $search: req.query.search };
    // Track search activity
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          'activityLog.searchHistory': {
            $each: [{ query: req.query.search }],
            $slice: -50,
          },
        },
      });
    }
  }

  // Filters
  if (req.query.category) query.category = { $in: req.query.category.split(',') };
  if (req.query.brand) query.brand = { $in: req.query.brand.split(',') };
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }
  if (req.query.minRating) query.ratings = { $gte: Number(req.query.minRating) };
  if (req.query.inStock === 'true') query.stock = { $gt: 0 };
  if (req.query.featured === 'true') query.isFeatured = true;

  // Sort
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { ratings: -1 },
    popular: { purchaseCount: -1 },
    relevance: req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 },
  };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-reviews -featureVector -__v'),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

// @route GET /api/products/:id
exports.getProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, isActive: true })
    .populate('reviews.user', 'name avatar');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Increment view count
  await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  // Track user activity
  if (req.user) {
    const user = await User.findById(req.user._id);
    const existingView = user.activityLog.viewedProducts.find(
      (v) => v.product.toString() === req.params.id
    );
    if (existingView) {
      existingView.count += 1;
      existingView.viewedAt = new Date();
    } else {
      user.activityLog.viewedProducts.push({ product: req.params.id });
      if (user.activityLog.viewedProducts.length > 50) {
        user.activityLog.viewedProducts.shift();
      }
    }
    await user.save({ validateBeforeSave: false });
  }

  res.json({ success: true, product });
};

// @route GET /api/products/categories
exports.getCategories = async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 }, subcategories: { $addToSet: '$subcategory' } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, categories });
};

// @route GET /api/products/brands
exports.getBrands = async (req, res) => {
  const query = req.query.category ? { category: req.query.category, isActive: true } : { isActive: true };
  const brands = await Product.distinct('brand', query);
  res.json({ success: true, brands });
};

// @route POST /api/products/:id/review
exports.addReview = async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment)
    return res.status(400).json({ success: false, message: 'Rating and comment required' });

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const alreadyReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (alreadyReviewed)
    return res.status(400).json({ success: false, message: 'Already reviewed this product' });

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.updateRating();
  await product.save();

  res.status(201).json({ success: true, message: 'Review added', product });
};

// --- ADMIN ---
// @route POST /api/admin/products
exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
};

// @route PUT /api/admin/products/:id
exports.updateProduct = async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true, runValidators: true,
  });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
};

// @route DELETE /api/admin/products/:id
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
};

// @route GET /api/admin/products
exports.adminGetProducts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const query = req.query.search ? { $text: { $search: req.query.search } } : {};

  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};
