# 🚀 Quick Reference Guide

**Last Updated:** February 5, 2026

---

## 📱 API Endpoints Quick Reference

### Authentication
```
🔓 POST   /auth/send-otp              → Send OTP to phone
🔓 POST   /auth/verify-otp            → Verify OTP & get token
🔑 POST   /admin/auth/login           → Admin login (email/password)
```

### User Management
```
🔓 GET    /users/profile              → Get own profile
🔓 POST   /users/profile-info         → Create profile (first time)
🔓 PATCH  /users/profile-update       → Update profile
🔓 GET    /users/phone-privacy        → Get privacy status
🔓 PATCH  /users/phone-privacy        → Toggle phone privacy
🔓 POST   /users/request-deletion     → Request account deletion
```

### Properties
```
🔓 GET    /properties/filter          → Filter properties
🔓 GET    /properties/search          → Search properties
🔓 GET    /properties/nearby          → Get nearby properties
🔓 GET    /properties/:id             → Get property details
🔑 GET    /properties/user/my         → Get my properties
🔑 POST   /properties                 → Create property
🔑 PUT    /properties/:id             → Update property
🔑 POST   /properties/:id/photos      → Upload photos
```

### Admin - Dashboard
```
🔐 GET    /admin/dashboard/analytics  → Get dashboard analytics
🔐 GET    /admin/users                → Get all users
🔐 PATCH  /admin/users/:id/block      → Block/unblock user
🔐 DELETE /admin/users/:id            → Delete user
```

### Admin - Properties
```
🔐 GET    /admin/properties           → Get all properties
🔐 GET    /admin/properties/:id       → Get property details
🔐 PATCH  /admin/properties/:id/status → Update status
🔐 PATCH  /admin/properties/:id/premium → Make premium
```

### Admin - Content Management
```
🔐 POST   /admin/banners              → Create banner
🔐 PUT    /admin/banners/:id          → Update banner
🔐 DELETE /admin/banners/:id          → Delete banner
🔐 POST   /admin/plans                → Create plan
🔐 PUT    /admin/plans/:id            → Update plan
🔐 POST   /admin/faqs                 → Create FAQ
```

---

## 🔐 Authentication Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public endpoint |
| 🔑 | Protected (user login required) |
| 🔐 | Protected (admin login required) |

---

## 🛠️ Frontend API Service Files

### Core
- `api.js` - Axios instance with interceptors

### Admin APIs
- `admin.dashboard.api.js` - Analytics
- `admin.property.api.js` - Property management
- `admin.lead.api.js` - Lead management
- `admin.feedback.api.js` - Feedback management
- `admin.notification.api.js` - Notification management
- `admin.bookmark.api.js` - Bookmark analytics
- `admin.audit.api.js` - Audit logs

### Public APIs
- `user.api.js` - User operations
- `banner.api.js` - Banner display
- `plans.js` - Plan management
- `faq.api.js` - FAQ listings
- `legal.api.js` - Legal content
- `aboutUs.api.js` - About us content

---

## 📦 Common Request Patterns

### GET with Pagination
```javascript
const response = await API.get('/admin/users', {
  params: { page: 1, limit: 10 }
});
```

### POST with Data
```javascript
const response = await API.post('/admin/plans', {
  name: 'Premium',
  price: 999,
  duration: 30
});
```

### PUT to Update
```javascript
const response = await API.put(`/admin/plans/${planId}`, {
  name: 'Updated Name',
  price: 1299
});
```

### DELETE
```javascript
const response = await API.delete(`/admin/plans/${planId}`);
```

### File Upload
```javascript
const formData = new FormData();
formData.append('image', file);
formData.append('title', 'Banner Title');

const response = await API.post('/admin/banners', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 🎯 Frontend Pages Structure

### Authentication
- `/login` → Admin login page

### Dashboard
- `/admin/dashboard` → Analytics & overview

### User Management
- `/admin/users` → Users list
- `/admin/users/:id` → User details

### Property Management
- `/admin/properties` → Properties list
- `/admin/properties/:id` → Property details & approval

### Content Management
- `/admin/banners` → Banner management
- `/admin/wallpapers` → Wallpaper management
- `/admin/plans` → Plan management
- `/admin/faqs` → FAQ management
- `/admin/legal` → Privacy & Terms editor
- `/admin/aboutus` → About us editor

### Lead Management
- `/admin/leads` → All leads

### Other
- `/admin/feedback` → Feedback management
- `/admin/notifications` → Notification management
- `/admin/audit` → Audit logs

---

## 🗂️ Backend File Organization

### Controllers
```
controllers/
├── Public Controllers (user, property, etc.)
├── auth/
│   └── adminAuth.controller.js
└── admin/ (15+ admin controllers)
```

### Routes
```
routes/
├── Public Routes (14 files)
└── admin/ (14 admin route files)
```

### Models
```
models/
├── User, Property, Admin models
├── Content models (Banner, Plan, FAQ, etc.)
└── Utility models (OTP, AuditLog, etc.)
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔐 Token Management

### Storage
```javascript
localStorage.setItem('adminToken', token);
```

### Retrieval (Automatic)
Token is automatically added to all requests via axios interceptor:
```javascript
Authorization: Bearer <token>
```

### Removal
```javascript
localStorage.removeItem('adminToken');
```

---

## 🌍 Environment Variables

### Backend (.env)
```
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
FIREBASE_STORAGE_BUCKET=bucket.appspot.com
NODE_ENV=development
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🚀 Common Commands

### Backend
```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Frontend
```bash
# Install dependencies
npm install

# Development
npm start

# Build for production
npm run build
```

---

## 🐛 Debugging Tips

### Check Token
```javascript
console.log(localStorage.getItem('adminToken'));
```

### API Response
```javascript
try {
  const { data } = await API.get('/admin/users');
  console.log('Success:', data);
} catch (error) {
  console.error('Error:', error.response?.data);
}
```

### Network Requests
- Open DevTools → Network tab
- Check Headers → Authorization
- Check Response status & body

---

## 📚 Documentation Links

- **API Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Project Structure:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **API Consumption:** [API_CONSUMPTION_GUIDE.md](API_CONSUMPTION_GUIDE.md)
- **Scan Summary:** [SCAN_SUMMARY.md](SCAN_SUMMARY.md)

---

## 🔗 Useful Endpoints for Testing

### Public Endpoints (No Auth Required)
```
GET  /banners
GET  /faqs
GET  /wallpapers
GET  /location/cities
GET  /location/search?q=mumbai
GET  /properties/filter?city=Mumbai
GET  /properties/search?q=apartment
```

### Protected Endpoints (User Token Required)
```
GET  /user/profile
GET  /bookmarks
GET  /notifications
POST /leads
```

### Admin Endpoints (Admin Token Required)
```
GET  /admin/dashboard/analytics
GET  /admin/users
GET  /admin/properties
GET  /admin/leads
GET  /admin/feedbacks
```

---

**Quick Reference Generated:** February 5, 2026  
**Status:** ✅ Complete & Ready to Use
