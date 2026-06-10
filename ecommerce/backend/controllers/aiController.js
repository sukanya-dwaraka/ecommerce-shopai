const Product = require('../models/Product');
const User = require('../models/User');

// ─── RECOMMENDATION ENGINE ────────────────────────────────────────────────────
// @route GET /api/ai/recommendations
exports.getRecommendations = async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;

  if (!req.user) {
    // Guest: return popular products
    const products = await Product.find({ isActive: true })
      .sort({ purchaseCount: -1, ratings: -1 })
      .limit(limit)
      .select('-reviews -featureVector');
    return res.json({ success: true, products, type: 'popular' });
  }

  const user = await User.findById(req.user._id);
  const activity = user.activityLog;

  // Build preference scores per category
  const categoryScores = {};

  (activity.purchasedCategories || []).forEach(({ category, count }) => {
    categoryScores[category] = (categoryScores[category] || 0) + count * 5;
  });
  (activity.wishlistedCategories || []).forEach(({ category, count }) => {
    categoryScores[category] = (categoryScores[category] || 0) + count * 3;
  });
  (activity.viewedProducts || []).forEach(({ product, count }) => {
    // We'll join with product categories later
  });

  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([cat]) => cat);

  // Get viewed product IDs to exclude
  const viewedIds = activity.viewedProducts.map((v) => v.product);
  const wishlistIds = user.wishlist || [];
  const excludeIds = [...viewedIds, ...wishlistIds];

  let products = [];

  if (topCategories.length > 0) {
    products = await Product.find({
      isActive: true,
      category: { $in: topCategories },
      _id: { $nin: excludeIds },
    })
      .sort({ ratings: -1, purchaseCount: -1 })
      .limit(limit)
      .select('-reviews -featureVector');
  }

  // Pad with popular if not enough
  if (products.length < limit) {
    const extra = await Product.find({
      isActive: true,
      _id: { $nin: [...excludeIds, ...products.map((p) => p._id)] },
    })
      .sort({ purchaseCount: -1, ratings: -1 })
      .limit(limit - products.length)
      .select('-reviews -featureVector');
    products = [...products, ...extra];
  }

  // Shuffle slightly for variety
  products = products.sort(() => Math.random() - 0.3);

  res.json({
    success: true,
    products,
    type: topCategories.length > 0 ? 'personalized' : 'popular',
    basedOn: topCategories,
  });
};

// @route GET /api/ai/similar/:productId
exports.getSimilarProducts = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const similar = await Product.find({
    isActive: true,
    _id: { $ne: product._id },
    $or: [
      { category: product.category, subcategory: product.subcategory },
      { brand: product.brand },
      { tags: { $in: product.tags } },
    ],
  })
    .sort({ ratings: -1, purchaseCount: -1 })
    .limit(8)
    .select('-reviews -featureVector');

  res.json({ success: true, products: similar });
};

// @route GET /api/ai/trending
exports.getTrending = async (req, res) => {
  const products = await Product.find({ isActive: true })
    .sort({ purchaseCount: -1, viewCount: -1, ratings: -1 })
    .limit(parseInt(req.query.limit) || 10)
    .select('-reviews -featureVector');
  res.json({ success: true, products });
};

// @route GET /api/ai/frequently-bought-together/:productId
exports.getFrequentlyBoughtTogether = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  // Find complementary products in same category
  const companions = await Product.find({
    isActive: true,
    _id: { $ne: product._id },
    category: product.category,
    price: { $gte: product.price * 0.2, $lte: product.price * 3 },
  })
    .sort({ purchaseCount: -1 })
    .limit(3)
    .select('-reviews -featureVector');

  res.json({ success: true, products: companions });
};

// ─── AI SHOPPING ASSISTANT ────────────────────────────────────────────────────
// @route POST /api/ai/chat
exports.chat = async (req, res) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });

  try {
    // Extract intent from message using pattern matching + Claude API
    const intent = await parseShoppingIntent(message);

    // Fetch relevant products from DB
    const products = await fetchProductsForIntent(intent);

    // Generate AI response
    const aiResponse = await generateAIResponse(message, products, intent, conversationHistory);

    res.json({
      success: true,
      reply: aiResponse,
      products: products.slice(0, 6),
      intent,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    // Fallback response
    res.json({
      success: true,
      reply: "I'm having trouble connecting to my AI brain right now. Let me show you our popular products instead!",
      products: await Product.find({ isActive: true }).sort({ ratings: -1 }).limit(6).select('-reviews'),
      intent: {},
    });
  }
};

async function parseShoppingIntent(message) {
  const lower = message.toLowerCase();
  const intent = {};

  // Price extraction (₹, Rs, rupees)
  const priceMatch = lower.match(/(?:under|below|less than|within|upto|up to)\s*(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:k|thousand)?/i);
  if (priceMatch) {
    let price = parseFloat(priceMatch[1].replace(',', ''));
    if (lower.includes('k') || lower.includes('thousand')) price *= 1000;
    intent.maxPrice = price;
  }

  const minPriceMatch = lower.match(/(?:above|over|more than|starting from)\s*(?:₹|rs\.?|rupees?)?\s*(\d+(?:,\d+)*)/i);
  if (minPriceMatch) intent.minPrice = parseFloat(minPriceMatch[1].replace(',', ''));

  // Category detection
  const categoryMap = {
    laptop: ['laptop', 'laptops', 'notebook', 'macbook'],
    phone: ['phone', 'mobile', 'smartphone', 'iphone', 'android'],
    headphones: ['headphone', 'earphone', 'earbuds', 'headset', 'airpods'],
    tv: ['tv', 'television', 'smart tv', 'oled', 'qled'],
    camera: ['camera', 'dslr', 'mirrorless', 'gopro'],
    tablet: ['tablet', 'ipad', 'tab'],
    watch: ['watch', 'smartwatch', 'wearable'],
    speaker: ['speaker', 'bluetooth speaker', 'soundbar'],
    clothing: ['shirt', 'dress', 'jeans', 'jacket', 'clothing', 'fashion'],
    shoes: ['shoes', 'sneakers', 'boots', 'footwear'],
    books: ['book', 'books', 'novel', 'textbook'],
    gaming: ['gaming', 'game', 'console', 'ps5', 'xbox', 'nintendo'],
    appliances: ['refrigerator', 'fridge', 'washing machine', 'microwave', 'ac', 'air conditioner'],
    furniture: ['sofa', 'chair', 'table', 'bed', 'furniture'],
    fitness: ['fitness', 'gym', 'yoga', 'treadmill', 'dumbbell'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      intent.category = category;
      break;
    }
  }

  // Brand detection
  const brands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'asus', 'acer', 'oneplus', 'xiaomi', 'realme', 'oppo', 'vivo', 'nike', 'adidas', 'boat', 'jbl', 'bose', 'sennheiser'];
  for (const brand of brands) {
    if (lower.includes(brand)) {
      intent.brand = brand;
      break;
    }
  }

  // Rating requirement
  const ratingMatch = lower.match(/(?:rated|rating|stars?)\s*(?:above|over|atleast|at least)?\s*(\d(?:\.\d)?)/i);
  if (ratingMatch) intent.minRating = parseFloat(ratingMatch[1]);

  // Keywords for search
  intent.keywords = message;

  return intent;
}

async function fetchProductsForIntent(intent) {
  const query = { isActive: true };

  if (intent.maxPrice) query.price = { $lte: intent.maxPrice };
  if (intent.minPrice) {
    query.price = { ...query.price, $gte: intent.minPrice };
  }
  if (intent.category) {
    query.$or = [
      { category: { $regex: intent.category, $options: 'i' } },
      { subcategory: { $regex: intent.category, $options: 'i' } },
      { tags: { $regex: intent.category, $options: 'i' } },
    ];
  }
  if (intent.brand) query.brand = { $regex: intent.brand, $options: 'i' };
  if (intent.minRating) query.ratings = { $gte: intent.minRating };

  // Text search if we have keywords
  if (intent.keywords && !intent.category && !intent.brand) {
    try {
      const textResults = await Product.find({
        ...query,
        $text: { $search: intent.keywords },
      })
        .sort({ score: { $meta: 'textScore' }, ratings: -1 })
        .limit(10)
        .select('-reviews -featureVector');
      if (textResults.length > 0) return textResults;
    } catch (_) {}
  }

  return await Product.find(query)
    .sort({ ratings: -1, purchaseCount: -1 })
    .limit(10)
    .select('-reviews -featureVector');
}

async function generateAIResponse(message, products, intent, conversationHistory) {
  // Call Anthropic API
  if (!process.env.ANTHROPIC_API_KEY) {
    return buildFallbackResponse(message, products, intent);
  }

  const productContext = products.slice(0, 5).map((p) =>
    `- ${p.name} | ₹${p.price.toLocaleString('en-IN')} | Rating: ${p.ratings}/5 | Brand: ${p.brand} | Category: ${p.category}`
  ).join('\n');

  const systemPrompt = `You are ShopBot, a friendly and knowledgeable AI shopping assistant for an Indian e-commerce platform (like Amazon India). 
Help customers find products, compare options, and make purchasing decisions.
Be concise, helpful, and enthusiastic. Use rupee symbol ₹ for prices.
When products are available, briefly describe why they're good choices.
Keep responses under 150 words. Don't list all products — pick highlights.`;

  const messages = [
    ...conversationHistory.slice(-4),
    {
      role: 'user',
      content: `Customer query: "${message}"\n\nAvailable products from our database:\n${productContext || 'No exact matches found, showing popular items'}\n\nRespond naturally and helpfully.`,
    },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text || buildFallbackResponse(message, products, intent);
}

function buildFallbackResponse(message, products, intent) {
  if (products.length === 0) {
    return "I couldn't find products matching your exact requirements. Try adjusting your budget or search terms!";
  }
  const top = products[0];
  let reply = '';
  if (intent.maxPrice) {
    reply = `Great news! I found ${products.length} products under ₹${intent.maxPrice.toLocaleString('en-IN')}. `;
  } else {
    reply = `I found ${products.length} matching products for you. `;
  }
  reply += `Top pick: **${top.name}** at ₹${top.price.toLocaleString('en-IN')} with a ${top.ratings}⭐ rating. Check out the options below!`;
  return reply;
}
