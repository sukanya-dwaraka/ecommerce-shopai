# 🛒 ShopAI — AI-Powered E-Commerce Platform

A full-stack, production-ready e-commerce platform built with the **MERN stack** and **Anthropic AI (Claude)**, inspired by Amazon. Features personalized AI recommendations, an AI shopping assistant chatbot, complete order management, and a powerful admin dashboard.

---

## ✨ Features

### 🛍️ Customer Features
- **Product Browsing** — Grid/list view with infinite pagination
- **Advanced Search & Filters** — Full-text search, category, brand, price range, rating filters, sort options
- **Product Detail Pages** — Image gallery, specifications, reviews, star ratings
- **Smart Cart** — Real-time quantity updates, price calculation, GST + shipping
- **Wishlist** — Save products, move to cart
- **Checkout** — Multi-step: Address → Payment → Review
- **Razorpay Payment** — Credit/Debit, UPI, Net Banking, Wallets + Cash on Delivery
- **Order Management** — Track orders, cancel orders, full order history
- **User Profile** — Edit profile, change password, manage multiple delivery addresses

### 🤖 AI Features
- **Personalized Recommendations** — Tracks views, searches, wishlist, purchases → builds preference profile → suggests relevant products
- **Similar Products** — Category + brand + tag-based similarity engine
- **Frequently Bought Together** — Price-range based complementary product suggestions
- **Trending Products** — Sorted by purchase count + views + ratings
- **ShopBot AI Assistant** — Conversational shopping assistant powered by Claude AI
  - Natural language queries: *"Suggest laptops under ₹60,000"*, *"Best Sony headphones"*
  - Extracts price limits, categories, brands from user messages
  - Fetches matching products from MongoDB in real-time
  - Generates contextual responses using Claude Haiku

### 👨‍💼 Admin Features
- **Dashboard** — Revenue charts, order status distribution, recent orders, top products
- **Product Management** — Full CRUD with image URLs, specifications, tags, inventory
- **Order Management** — View all orders, update status (confirmed → processing → shipped → delivered)
- **User Management** — View all users, activate/deactivate, toggle admin role

### 🎨 UI/UX
- **Amazon-inspired Design** — Dark navy header, orange accent, clean product grid
- **Dark Mode** — Full dark mode with persistent preference
- **Responsive** — Mobile-first design, works on all screen sizes
- **Loading States** — Skeleton screens for all data fetches
- **Toast Notifications** — Success/error feedback for all actions
- **Smooth Animations** — Fade-in, slide-up, hover effects

---

## 🏗️ Architecture

```
shopai/
├── backend/                    # Node.js + Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, login, profile, addresses
│   │   ├── productController.js # CRUD, reviews, search, filter
│   │   ├── cartController.js   # Cart management
│   │   ├── wishlistController.js
│   │   ├── orderController.js  # Orders, Razorpay, dashboard stats
│   │   ├── aiController.js     # Recommendations, similarity, ShopBot chat
│   │   └── adminController.js  # User management
│   ├── middleware/
│   │   ├── auth.js             # JWT protect, authorize, optionalAuth
│   │   └── errorHandler.js     # Centralized error handling
│   ├── models/
│   │   ├── User.js             # User + activity log schema
│   │   ├── Product.js          # Product + reviews + text index
│   │   ├── Order.js            # Order + status history
│   │   └── Cart.js             # User cart
│   ├── routes/
│   │   └── index.js            # All API routes
│   ├── utils/
│   │   └── seeder.js           # 25+ sample products seeder
│   └── server.js               # Express app entry
│
└── frontend/                   # React + Vite + Tailwind
    └── src/
        ├── components/
        │   ├── layout/         # Navbar, Footer
        │   ├── product/        # ProductCard, StarRating
        │   ├── common/         # Skeletons
        │   └── ai/             # AIChat (ShopBot)
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── ProductsPage.jsx
        │   ├── ProductDetailPage.jsx
        │   ├── CartPage.jsx
        │   ├── CheckoutPage.jsx
        │   ├── WishlistPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── LoginPage.jsx / RegisterPage.jsx
        │   ├── OrderPages.jsx  # Success, List, Detail
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminProducts.jsx
        │       ├── AdminProductForm.jsx
        │       ├── AdminOrders.jsx
        │       └── AdminUsers.jsx
        ├── services/
        │   └── api.js          # Axios instance + all API methods
        └── store/
            └── index.js        # Zustand stores (auth, cart, wishlist, UI)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Razorpay account (for payments)
- Anthropic API key (for AI chat)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env    # Fill in your values

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecommerce_ai
JWT_SECRET=your_very_strong_secret_key_here_min_32_chars
JWT_EXPIRE=30d

# Razorpay (get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx

# Anthropic (get from console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx

NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- 25+ real products across 10+ categories
- Admin: `admin@shopai.com` / `Admin@123`
- Test user: `user@shopai.com` / `User@123`

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

---

## 🐳 Docker Deployment

```bash
# Copy and fill environment
cp backend/.env.example backend/.env

# Build and start all services
docker-compose up --build -d

# Seed the database
docker-compose exec backend node utils/seeder.js
```

---

## 🌐 Production Deployment

### Backend (Railway / Render / Heroku)
1. Set all env vars from `.env.example`
2. Set `NODE_ENV=production`
3. Deploy from `backend/` directory

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add env var: `VITE_API_URL=https://your-backend.com`
4. Update `vite.config.js` proxy to point to production URL

### MongoDB Atlas
- Replace `MONGO_URI` with your Atlas connection string

---

## 📡 API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | ✅ | Get profile |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| PUT | `/api/auth/password` | ✅ | Change password |
| POST | `/api/auth/address` | ✅ | Add address |

### Products
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | Optional | List with filters, search, sort, paginate |
| GET | `/api/products/:id` | Optional | Get product + track view |
| GET | `/api/products/categories` | — | All categories |
| GET | `/api/products/brands` | — | Brands (filter by category) |
| POST | `/api/products/:id/review` | ✅ | Add review |

**Query params for GET /products:**
`search`, `category`, `brand`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `featured`, `sort`, `page`, `limit`

### Cart, Wishlist, Orders
Standard REST CRUD — see `routes/index.js` for full list.

### AI Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/ai/recommendations` | Personalized or popular |
| GET | `/api/ai/similar/:id` | Similar products |
| GET | `/api/ai/trending` | Top products by sales |
| GET | `/api/ai/frequently-bought-together/:id` | Cross-sell |
| POST | `/api/ai/chat` | ShopBot conversation |

### Admin (Admin role required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Stats, charts data |
| CRUD | `/api/admin/products` | Product management |
| CRUD | `/api/admin/orders` | Order management |
| CRUD | `/api/admin/users` | User management |

---

## 🤖 AI Recommendation Logic

### Personalized Recommendations
1. User activity tracked in MongoDB (`activityLog`):
   - **Viewed products** (up to 50 recent, with view count)
   - **Search history** (up to 50 recent queries)
   - **Wishlisted categories** (weighted ×3)
   - **Purchased categories** (weighted ×5)
2. Category score computed: `purchases×5 + wishlists×3`
3. Top 4 preferred categories fetched
4. Products from those categories returned (excluding already-viewed/wishlisted)
5. Padded with popular products if < limit

### ShopBot Intent Parsing
- **Price extraction**: regex for ₹, Rs, "under", "above", "k" suffix
- **Category detection**: keyword map (30+ keywords → 15 categories)
- **Brand detection**: 20+ known brands
- **Rating filter**: "rated above 4 stars" parsing
- **Claude API call**: sends matched products as context, gets natural response

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Zustand, TanStack Query, Framer Motion |
| Backend | Node.js, Express, JWT, bcryptjs, express-async-errors |
| Database | MongoDB, Mongoose (full-text search index) |
| Payment | Razorpay (with HMAC-SHA256 signature verification) |
| AI | Anthropic Claude Haiku (chat), custom recommendation engine |
| Charts | Recharts |
| Deployment | Docker, nginx (reverse proxy + SPA routing) |

---

## 🔒 Security Features
- JWT with 30-day expiry
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- CORS with whitelist
- Rate limiting (500 req/15min)
- Payment signature verification (HMAC-SHA256)
- Role-based route protection
- Input validation

---

## 📝 License
MIT — free to use and modify.
