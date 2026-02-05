# 📁 Token App Admin Panel - Project Structure

**Last Updated:** February 5, 2026  
**Version:** 2.1 - Comprehensive Update with API Consumption Layer

---

## 🗂️ Root Directory Structure

```
tocken_app_Admin_panel/
├── 📁 backend/                     # Node.js Express API Server
├── 📁 frontend/                    # React.js Admin Panel
├── 📄 API_DOCUMENTATION.md         # Complete API Documentation
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 📄 README.md                    # Project Overview
└── 📄 .gitignore                   # Git ignore rules
```

---

# 🖥️ Backend Structure

```
backend/
├── 📄 server.js                    # Entry point - starts the server
├── 📄 app.js                       # Express app configuration & routes
├── 📄 package.json                 # Dependencies
├── 📄 .env                         # Environment variables
├── 📄 vercel.json                  # Vercel deployment config
│
├── 📁 config/                      # ⚙️ Configuration Files
│   ├── 📄 db.js                    # MongoDB connection (Mongoose)
│   ├── 📄 firebase.js              # Firebase Admin SDK initialization
│   ├── 📄 multer.js                # Multer config for file uploads (memory storage)
│   ├── 📄 cloudinary.js            # ❌ Deprecated - replaced by Firebase
│   └── 📄 radies.js                # Redis cache configuration
│
├── 📁 firebase/                    # 🔥 Firebase Configuration
│   └── 📄 serviceAccountKey.json   # Firebase service account credentials
│
├── 📁 controllers/                 # 🎮 Business Logic Controllers
│   ├── 📄 auth.controller.js       # User OTP authentication (send/verify)
│   ├── 📄 user.controller.js       # User profile, privacy, deletion
│   ├── 📄 property.controller.js   # Property CRUD, photo upload (Firebase)
│   ├── 📄 propertyFilter.controller.js  # Property search & filtering
│   ├── 📄 bookmark.controller.js   # User bookmarks management
│   ├── 📄 notification.controller.js    # User notifications
│   ├── 📄 lead.controller.js       # Contact lead creation
│   ├── 📄 plan.controller.js       # Premium plans for users
│   ├── 📄 faq.controller.js        # FAQs listing
│   ├── 📄 feedback.controller.js   # User feedback submission
│   ├── 📄 banner.controller.js     # Banner display for users
│   ├── 📄 wallpaper.controller.js  # Wallpaper images (Firebase)
│   ├── 📄 aboutUs.controller.js    # About us content
│   ├── 📄 legal.controller.js      # Privacy policy & terms
│   │
│   ├── 📁 auth/                    # Admin Authentication
│   │   └── 📄 adminAuth.controller.js   # Admin login
│   │
│   └── 📁 admin/                   # 👑 Admin Controllers
│       ├── 📄 dashboard.controller.js   # Analytics & statistics
│       ├── 📄 user.controller.js        # User management (block/delete)
│       ├── 📄 property.controller.js    # Property approval/rejection
│       ├── 📄 lead.controller.js        # Lead management
│       ├── 📄 plan.controller.js        # Plan CRUD
│       ├── 📄 faq.controller.js         # FAQ CRUD
│       ├── 📄 feedback.controller.js    # Feedback management
│       ├── 📄 notification.controller.js# Push notification management
│       ├── 📄 banner.controller.js      # Banner CRUD (Firebase upload)
│       ├── 📄 bookmark.controller.js    # Bookmark analytics
│       ├── 📄 audit.controller.js       # Audit logs
│       └── 📄 deletionRequest.controller.js  # Account deletion requests
│
├── 📁 models/                      # 📊 MongoDB Schemas (Mongoose)
│   ├── 📄 user.model.js            # User schema (with username, privacy)
│   ├── 📄 property.model.js        # Property schema (geo-coordinates)
│   ├── 📄 admin.model.js           # Admin user schema
│   ├── 📄 OTP.model.js             # OTP storage
│   ├── 📄 Banner.model.js          # Banner schema (Firebase fileName)
│   ├── 📄 wallpaper.model.js       # Wallpaper schema (Firebase fileName)
│   ├── 📄 notification.model.js    # Notification schema
│   ├── 📄 lead.model.js            # Contact leads
│   ├── 📄 plans.model.js           # Premium plans
│   ├── 📄 faq.model.js             # FAQs
│   ├── 📄 feedback.model.js        # User feedback
│   ├── 📄 aboutUs.model.js         # About us content
│   ├── 📄 Legal.model.js           # Privacy & Terms
│   └── 📄 auditLog.model.js        # Admin action logs
│
├── 📁 routes/                      # 🛣️ API Routes
│   ├── 📄 auth.routes.js           # /api/auth/*
│   ├── 📄 user.routes.js           # /api/users/*
│   ├── 📄 property.routes.js       # /api/properties/*
│   ├── 📄 location.routes.js       # /api/location/*
│   ├── 📄 bookmark.routes.js       # /api/bookmarks/*
│   ├── 📄 notification.routes.js   # /api/notifications/*
│   ├── 📄 lead.routes.js           # /api/leads/*
│   ├── 📄 plan.routes.js           # /api/plans/*
│   ├── 📄 faq.routes.js            # /api/faqs/*
│   ├── 📄 feedback.routes.js       # /api/feedback/*
│   ├── 📄 banner.routes.js         # /api/banners/*
│   ├── 📄 wallpaper.routes.js      # /api/wallpapers/*
│   ├── 📄 legal.routes.js          # /api/legal/*
│   ├── 📄 aboutUs.routes.js        # /api/about-us/*
│   │
│   └── 📁 admin/                   # 👑 Admin Routes
│       ├── 📄 auth.routes.js       # /api/admin/auth/*
│       ├── 📄 dashboard.routes.js  # /api/admin/dashboard/*
│       ├── 📄 user.routes.js       # /api/admin/users/*
│       ├── 📄 property.routes.js   # /api/admin/properties/*
│       ├── 📄 lead.routes.js       # /api/admin/leads/*
│       ├── 📄 plan.routes.js       # /api/admin/plans/*
│       ├── 📄 faq.routes.js        # /api/admin/faqs/*
│       ├── 📄 feedback.routes.js   # /api/admin/feedbacks/*
│       ├── 📄 notification.routes.js    # /api/admin/notifications/*
│       ├── 📄 banner.route.js      # /api/admin/banners/*
│       ├── 📄 wallpaper.routes.js  # /api/admin/wallpapers/*
│       ├── 📄 bookmark.routes.js   # /api/admin/bookmarks/*
│       ├── 📄 aboutUs.routes.js    # /api/admin/about-us/*
│       ├── 📄 audit.routes.js      # /api/admin/audit/*
│       └── 📄 deletionRequest.routes.js  # /api/admin/deletion-requests/*
│
├── 📁 middleware/                  # 🛡️ Middleware Functions
│   ├── 📄 auth.middleware.js       # JWT token verification
│   ├── 📄 admin.middleware.js      # Admin role check
│   ├── 📄 permission.middleware.js # Permission-based access
│   ├── 📄 multer.middleware.js     # File upload (memory storage)
│   ├── 📄 upload.js                # Alternative upload config
│   ├── 📄 cache.middleware.js      # Redis caching
│   └── 📄 plan.middleware.js       # Plan verification
│
└── 📁 utils/                       # 🔧 Utility Functions
    ├── 📄 firebaseUpload.js        # ✅ Firebase Storage upload/delete
    ├── 📄 generateToken.js         # JWT token generation
    ├── 📄 listingScore.js          # Property listing score calculation
    ├── 📄 premiumExpiry.js         # Premium plan expiry check
    ├── 📄 permissions.js           # Permission definitions
    ├── 📄 auditLogger.js           # Admin action logging
    ├── 📄 cacheInvalidator.js      # Cache clearing
    └── 📄 fixDuplicateIndex.js     # MongoDB index fix utility
```

---

# 💻 Frontend Structure

```
frontend/
├── 📄 package.json                 # Dependencies (React, Axios, etc.)
├── 📄 tailwind.config.js           # Tailwind CSS configuration (if used)
│
└── 📁 src/
    ├── 📄 index.js                 # React entry point
    ├── 📄 index.css                # Global styles
    ├── 📄 App.js                   # Main app component with routes
    ├── 📄 App.css                  # App-level styles
    │
### Frontend API Layer (API Consumption)

The frontend uses a well-organized service layer for API communication:

```
frontend/src/api/
├── 📄 api.js                      # 🔑 Core Axios configuration
│   ├── Base URL configuration
│   ├── JWT token interceptor (request)
│   ├── Token expiry handler (response - 401)
│   └── Auto-redirect to login on 401
│
├── 📁 Admin APIs (Protected Routes)
│   ├── 📄 admin.dashboard.api.js   # Dashboard analytics
│   ├── 📄 admin.property.api.js    # Property CRUD operations
│   ├── 📄 admin.lead.api.js        # Lead management
│   ├── 📄 admin.notification.api.js # Notifications CRUD
│   ├── 📄 admin.feedback.api.js    # Feedback management
│   ├── 📄 admin.bookmark.api.js    # Bookmark analytics
│   └── 📄 admin.audit.api.js       # Audit logs
│
├── 📁 Public/User APIs
│   ├── 📄 user.api.js              # User profile, auth
│   ├── 📄 banner.api.js            # Banner retrieval
│   ├── 📄 plans.js                 # Plans management
│   ├── 📄 faq.api.js               # FAQ retrieval
│   ├── 📄 dashboard.api.js         # Dashboard data
│   ├── 📄 legal.api.js             # Legal content
│   ├── 📄 aboutUs.api.js           # About us content
│   └── 📄 deletionRequest.api.js   # Account deletion requests
│
└── 🔐 Authentication Pattern
    ├── Token stored in localStorage
    ├── Automatically attached to all requests
    ├── Handles token expiry (401)
    └── Auto-redirect to /login on unauthorized
```

**Key Features:**
- ✅ Centralized API configuration
- ✅ Automatic JWT token injection
- ✅ Global error handling
- ✅ Token expiry detection (401)
- ✅ Auto-redirect on auth failure
- ✅ FormData support for file uploads
    │
    ├── 📁 context/                 # 🔄 React Context (State Management)
    │   ├── 📄 AuthContext.jsx      # 🔐 Authentication State
    │   │   ├── Stores admin token
    │   │   ├── Provides login/logout
    │   │   └── Protected route guard
    │   │
    │   ├── 📄 ThemeContext.jsx     # 🎨 Theme State (Dark/Light)
    │   │   └── Global theme toggle
    │   │
    │   └── 📄 DataContext.jsx      # 📊 Global Data State
    │       ├── Cached API responses
    │       └── Real-time data updates
    │
    ├── 📁 components/              # 🧩 Reusable Components
    │   ├── 📄 ProtectedRoute.jsx   # Route protection wrapper
    │   │   └── Redirects to login if not authenticated
    │   │
    │   ├── 📁 common/              # UI Components (Shared)
    │   │   ├── 📄 Button.jsx       # Styled button component
    │   │   ├── 📄 Input.jsx        # Styled input field
    │   │   ├── 📄 Modal.jsx        # Reusable modal dialog
    │   │   ├── 📄 Loader.jsx       # Loading spinner
    │   │   ├── 📄 Badge.jsx        # Status badges
    │   │   ├── 📄 Alert.jsx        # Alert/notification component
    │   │   └── 📄 Pagination.jsx   # Pagination component
    │   │
    │   ├── 📁 forms/               # Form Components
    │   │   ├── 📄 PlanForm.jsx     # Plan CRUD form
    │   │   ├── 📄 BannerForm.jsx   # Banner creation form
    │   │   ├── 📄 FAQForm.jsx      # FAQ form
    │   │   └── 📄 LegalForm.jsx    # Legal content editor
    │   │
    │   ├── 📁 modals/              # Modal Components
    │   │   ├── 📄 ConfirmModal.jsx # Confirmation dialog
    │   │   ├── 📄 ViewModal.jsx    # View details modal
    │   │   └── 📄 EditModal.jsx    # Edit inline modal
    │   │
    │   └── 📁 tables/              # Table Components
    │       ├── 📄 UsersTable.jsx   # User listings table
    │       ├── 📄 PropertiesTable.jsx # Property listings
    │       ├── 📄 LeadsTable.jsx   # Leads table
    │       └── 📄 FeedbackTable.jsx # Feedback table
    │
    ├── 📁 pages/                   # 📄 Page Components
    │   ├── 📄 Login.jsx            # 🔑 Admin authentication page
    │   │   └── Email/Password login form
    │   │
    │   └── 📁 admin/               # 👑 Admin Dashboard Pages
    │       ├── 📁 dashboard/       # 📊 Analytics Dashboard
    │       │   ├── 📄 Dashboard.jsx # Main analytics page
    │       │   ├── 📄 StatsCard.jsx # Stats summary cards
    │       │   └── 📄 Charts.jsx   # Analytics charts
    │       │
    │       ├── 📁 users/           # 👥 User Management
    │       │   ├── 📄 UsersList.jsx # All users table
    │       │   ├── 📄 UserDetail.jsx # User profile view
    │       │   └── 📄 UserActions.jsx # Block/Delete actions
    │       │
    │       ├── 📁 properties/      # 🏠 Property Management
    │       │   ├── 📄 PropertiesList.jsx # Property listings
    │       │   ├── 📄 PropertyDetail.jsx # Property details view
    │       │   ├── 📄 PropertyApproval.jsx # Approval/Rejection
    │       │   └── 📄 PremiumManagement.jsx # Make/Remove premium
    │       │
    │       ├── 📁 leads/           # 📞 Lead Management
    │       │   ├── 📄 LeadsList.jsx # All leads table
    │       │   ├── 📄 LeadDetail.jsx # Lead details
    │       │   └── 📄 LeadActions.jsx # Mark spam/Update status
    │       │
    │       ├── 📁 banners/         # 🖼️ Banner Management
    │       │   ├── 📄 BannersList.jsx # Banners listing
    │       │   ├── 📄 BannerCreate.jsx # Create banner
    │       │   ├── 📄 BannerEdit.jsx # Edit banner
    │       │   └── 📄 BannerToggle.jsx # Toggle status
    │       │
    │       ├── 📁 wallpapers/      # 🌄 Wallpaper Management
    │       │   ├── 📄 WallpapersList.jsx # Wallpapers listing
    │       │   ├── 📄 WallpaperCreate.jsx # Create wallpaper
    │       │   ├── 📄 WallpaperEdit.jsx # Edit wallpaper
    │       │   └── 📄 WallpaperDetail.jsx # View details
    │       │
    │       ├── 📁 plans/           # 💰 Premium Plan Management
    │       │   ├── 📄 PlansList.jsx # Plans table
    │       │   ├── 📄 PlanCreate.jsx # Create plan form
    │       │   └── 📄 PlanEdit.jsx # Edit plan
    │       │
    │       ├── 📁 faqs/            # ❓ FAQ Management
    │       │   ├── 📄 FAQsList.jsx # FAQs listing
    │       │   ├── 📄 FAQCreate.jsx # Create FAQ
    │       │   └── 📄 FAQEdit.jsx # Edit FAQ
    │       │
    │       ├── 📁 feedbacks/       # 💬 Feedback Management
    │       │   ├── 📄 FeedbacksList.jsx # All feedback table
    │       │   ├── 📄 FeedbackDetail.jsx # Feedback details
    │       │   └── 📄 FeedbackStats.jsx # Feedback statistics
    │       │
    │       ├── 📁 notifications/   # 🔔 Notification Management
    │       │   ├── 📄 NotificationsList.jsx # All notifications
    │       │   ├── 📄 NotificationCreate.jsx # Create notification
    │       │   └── 📄 NotificationStats.jsx # Stats
    │       │
    │       ├── 📁 bookmarks/       # 📚 Bookmark Analytics
    │       │   ├── 📄 BookmarkStats.jsx # Analytics page
    │       │   └── 📄 BookmarkList.jsx # Bookmarks list
    │       │
    │       ├── 📁 legal/           # ⚖️ Legal Content
    │       │   ├── 📄 PrivacyPolicy.jsx # Privacy policy editor
    │       │   └── 📄 TermsConditions.jsx # Terms editor
    │       │
    │       ├── 📁 aboutUs/         # ℹ️ About Us Management
    │       │   └── 📄 AboutUsEditor.jsx # Rich text editor
    │       │
    │       ├── 📁 audit/           # 📜 Audit Logs
    │       │   └── 📄 AuditLogs.jsx # Admin action logs
    │       │
    │       └── 📁 deletionRequests/ # 🗑️ Account Deletion Requests
    │           ├── 📄 DeletionRequestsList.jsx # Pending requests
    │           └── 📄 RequestActions.jsx # Approve/Reject actions
    │
    ├── 📁 layout/                  # 📐 Layout Components
    │   ├── 📄 AdminLayout.jsx      # 🎨 Main admin layout wrapper
    │   │   ├── Sidebar navigation
    │   │   ├── Top header bar
    │   │   ├── Main content area
    │   │   └── Responsive grid
    │   │
    │   ├── 📄 Sidebar.jsx          # 🧭 Admin navigation sidebar
    │   │   ├── Menu items
    │   │   ├── Collapse/Expand
    │   │   └── Active state indicator
    │   │
    │   └── 📄 Header.jsx           # 🔝 Top navigation bar
    │       ├── Admin profile menu
    │       ├── Notifications icon
    │       ├── Logout button
    │       └── Theme toggle
    │
    ├── 📁 routes/                  # 🛣️ Routing Configuration
    │   └── 📄 routes.jsx           # Route definitions & guards
    │       ├── Public routes (/login)
    │       ├── Protected admin routes
    │       ├── Nested route structure
    │       └── 404 fallback
    │
    └── 📁 utils/                   # 🔧 Utility Functions
        ├── 📄 helpers.js           # Common utilities
        ├── 📄 validators.js        # Form validation
        ├── 📄 formatters.js        # Data formatting
        ├── 📄 constants.js         # App constants
        └── 📄 colors.js            # Color palette
```

---

## 🔧 Key Technologies

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB** | Database (with Mongoose ODM) |
| **Firebase Storage** | Image/file storage (replaced Cloudinary) |
| **JWT** | Authentication tokens |
| **Multer** | File upload middleware (memory storage) |
| **Redis** | Caching (optional) |
| **Node-cron** | Scheduled tasks |

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **React.js** | UI library & components | ^19.2.3 |
| **React Router DOM** | Client-side routing | ^7.12.0 |
| **Axios** | HTTP client & API calls | ^1.13.2 |
| **Lucide React** | Icon library (SVG icons) | ^0.562.0 |
| **Tailwind CSS** | Utility-first CSS framework | ^3.4.19 |
| **React Hot Toast** | Toast notifications | ^2.6.0 |
| **CLSX** | Conditional className utility | ^2.1.1 |
| **React Scripts** | CRA build & dev tools | 5.0.1 |

---

## 🔥 Firebase Storage Integration

Images are now stored in **Firebase Storage** instead of Cloudinary:

```
Firebase Storage Buckets:
├── /banners/           # App banners
├── /wallpapers/        # Wallpaper images
└── /properties/        # Property photos
```

**Upload Flow:**
1. File uploaded via Multer (stored in memory as Buffer)
2. `uploadToFirebase()` uploads Buffer to Firebase Storage
3. File is made public, URL returned
4. `fileName` stored in DB for future deletion

---

## 🗄️ Database Schema Overview

### Collections:
| Collection | Purpose |
|------------|---------|
| `users` | App users (phone auth, profile) |
| `admins` | Admin users (email/password) |
| `properties` | Property listings |
| `banners` | App banners |
| `wallpapers` | Wallpaper images |
| `notifications` | Push notifications |
| `leads` | Contact leads |
| `plans` | Premium plans |
| `faqs` | Frequently asked questions |
| `feedbacks` | User feedback |
| `aboutuses` | About us content |
| `legals` | Privacy & Terms |
| `auditlogs` | Admin action logs |
| `otps` | OTP storage (temp) |

---

## 🚀 Running the Project

### Backend
```bash
cd backend
npm install
npm run dev      # Development (nodemon)
npm start        # Production
```

### Frontend
```bash
cd frontend
npm install
npm start        # Development (port 3000)
npm run build    # Production build
```

---

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
NODE_ENV=development
```

---

## 📊 API Base URLs

| Environment | Backend URL | Frontend URL |
|-------------|-------------|--------------|
| Development | http://localhost:5000 | http://localhost:3000 |
| Production | https://api.yourapp.com | https://admin.yourapp.com |

---

## ✅ Features Implemented

### User App APIs (Flutter)
- ✅ Phone OTP Authentication
- ✅ User Profile Management
- ✅ Property Listing (CRUD)
- ✅ Property Search & Filter
- ✅ Nearby Properties (Geospatial)
- ✅ Bookmarks
- ✅ Notifications
- ✅ Contact Leads
- ✅ Premium Plans
- ✅ Feedback System
- ✅ Phone Privacy Toggle
- ✅ Account Deletion Request
- ✅ Location Search

### Admin Panel (React)
- ✅ Admin Authentication
- ✅ Dashboard Analytics
- ✅ User Management (Block/Delete)
- ✅ Property Approval/Rejection
- ✅ Banner Management (Firebase)
- ✅ Wallpaper Management (Firebase)
- ✅ Plan Management
- ✅ FAQ Management
- ✅ Feedback Management
- ✅ Lead Management
- ✅ Notification Management
- ✅ Bookmark Analytics
- ✅ About Us Editor
- ✅ Privacy/Terms Editor
- ✅ Audit Logs
- ✅ Account Deletion Requests

---

**Documentation Generated:** February 5, 2026  
**Next Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)  
**API Consumption Guide:** [API_CONSUMPTION_GUIDE.md](API_CONSUMPTION_GUIDE.md)
