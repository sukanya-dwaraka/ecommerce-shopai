const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name required'], trim: true, index: true },
    description: { type: String, required: [true, 'Description required'] },
    shortDescription: { type: String },
    price: { type: Number, required: [true, 'Price required'], min: 0 },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    images: [{ url: String, alt: String }],
    category: { type: String, required: [true, 'Category required'], index: true },
    subcategory: { type: String, index: true },
    brand: { type: String, required: true, index: true },
    stock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true },

    // Specs stored as key-value pairs
    specifications: [{ key: String, value: String }],
    tags: [{ type: String, index: true }],

    // Ratings
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],

    // AI vectors (simplified — category/tag based similarity)
    featureVector: { type: [Number], default: [] },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Analytics
    viewCount: { type: Number, default: 0 },
    purchaseCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Full-text search index
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

// Compute discount on save
productSchema.pre('save', function (next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  next();
});

// Update average rating
productSchema.methods.updateRating = function () {
  if (this.reviews.length === 0) {
    this.ratings = 0;
    this.numReviews = 0;
  } else {
    const avg = this.reviews.reduce((acc, r) => acc + r.rating, 0) / this.reviews.length;
    this.ratings = Math.round(avg * 10) / 10;
    this.numReviews = this.reviews.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
