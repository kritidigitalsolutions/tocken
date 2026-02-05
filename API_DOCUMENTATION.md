# 🚀 Token App Admin Panel - API Documentation

**Base URL (Development):** `http://localhost:5000/api`  
**Base URL (Production):** `https://backend-tocken-admin-panel.vercel.app/api`  
**Last Updated:** February 5, 2026  
**Version:** 2.1 - Comprehensive Update

---

## 📋 Table of Contents

1. [Authentication APIs](#1-authentication-apis)
2. [User APIs](#2-user-apis)
3. [Property APIs](#3-property-apis)
4. [Location APIs](#4-location-apis)
5. [Bookmark APIs](#5-bookmark-apis)
6. [Notification APIs](#6-notification-apis)
7. [Lead APIs](#7-lead-apis)
8. [Plan APIs](#8-plan-apis)
9. [Feedback APIs](#9-feedback-apis)
10. [FAQ APIs](#10-faq-apis)
11. [Banner APIs](#11-banner-apis)
12. [Wallpaper APIs](#12-wallpaper-apis)
13. [Legal & About Us APIs](#13-legal--about-us-apis)
14. [Admin APIs](#14-admin-apis)

---

## 🔐 Authentication Headers

For protected routes, include JWT token in header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication APIs

### 📱 Send OTP
```
POST http://localhost:5000/api/auth/send-otp
```
**Body:**
```json
{
  "phone": "9876543210"
}
```
**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otpId": "abc123"
}
```

---

### ✅ Verify OTP
```
POST http://localhost:5000/api/auth/verify-otp
```
**Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",   //if user all ready logedIn otherwise show create your complete profile
  "user": { ... }      
}
```

---

## 2. User APIs

### 👤 Get User Profile (🔒 Protected)
```
GET http://localhost:5000/api/users/profile
```
**Headers:** `Authorization: Bearer <token>`

---

### 📝 Complete Profile (First Time)
```
POST http://localhost:5000/api/users/profile-info
```
**Body:**
```json
{
  "phone": "919876543210",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "INDIVIDUAL",
  "email": "john@example.com",
  "profileImage": "https://..."
}
```

---

### ✏️ Update Profile (🔒 Protected)
```
PATCH http://localhost:5000/api/users/profile-update
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "gstNumber": "GST123456"
}
```

---

### 🔒 Get Phone Privacy Status (🔒 Protected)
```
GET http://localhost:5000/api/users/phone-privacy
```

---

### 🔐 Toggle Phone Privacy (🔒 Protected)
```
PATCH http://localhost:5000/api/users/phone-privacy
```

---

### 🗑️ Request Account Deletion (🔒 Protected)
```
POST http://localhost:5000/api/users/request-deletion
```
**Body:**
```json
{
  "reason": "Not using the app anymore",
  "feedback": "Great app!"
}
```

---

### ❌ Cancel Deletion Request (🔒 Protected)
```
DELETE http://localhost:5000/api/users/cancel-deletion
```

---

### 📊 Get Deletion Status (🔒 Protected)
```
GET http://localhost:5000/api/users/deletion-status
```

---

## 3. Property APIs

### 🔍 Filter Properties (Public)
```
GET http://localhost:5000/api/properties/filter
```
**Query Params:**
- `city` - Filter by city
- `listingType` - RENT, SELL, PG, CO_LIVING
- `propertyType` - RESIDENTIAL, COMMERCIAL
- `minPrice` / `maxPrice` - Price range
- `page` / `limit` - Pagination

**Example:**
```
GET http://localhost:5000/api/properties/filter?city=Mumbai&listingType=RENT&page=1&limit=10
```

---

### 🔎 Search Properties (Public)
```
GET http://localhost:5000/api/properties/search?q=apartment
```

---

### 📍 Get Nearby Properties (Public)
```
GET http://localhost:5000/api/properties/nearby?lat=19.07&lng=72.87&radius=5
```

---

### 📄 Get Property Details (Public)
```
GET http://localhost:5000/api/properties/:id
```

---

### 🏠 Get My Properties (🔒 Protected)
```
GET http://localhost:5000/api/properties/user/my
```

---

### ➕ Create Property Draft (🔒 Protected)
```
POST http://localhost:5000/api/properties
```
**Body:**
```json
{
  "listingType": "RENT",
  "propertyType": "RESIDENTIAL",
  "propertyCategory": "Apartment",
  "residentialDetails": { ... },
  "pricing": { ... },
  "location": { ... },
  "contact": { ... }
}
```

---

### ✏️ Update Property (🔒 Protected)
```
PUT http://localhost:5000/api/properties/:id
```

---

### 📤 Submit Property for Review (🔒 Protected)
```
POST http://localhost:5000/api/properties/:id/submit
```

---

### 📷 Upload Property Photos (🔒 Protected)
```
POST http://localhost:5000/api/properties/:id/photos
```
**Form Data:** `photos` (multiple files, max 10)

**Note:** Images are uploaded to **Firebase Storage**

---

### 🗑️ Delete Property Photo (🔒 Protected)
```
DELETE http://localhost:5000/api/properties/:id/photos/:photoId
```

---

## 4. Location APIs

### 🔍 Search Locations (Public)
```
GET http://localhost:5000/api/location/search?q=mumbai&type=all
```
**Query Params:**
- `q` - Search query
- `type` - city, locality, or all

---

### 🏙️ Get All Cities (Public)
```
GET http://localhost:5000/api/location/cities
```

---

### 📍 Get Localities by City (Public)
```
GET http://localhost:5000/api/location/localities/:city
```
**Example:**
```
GET http://localhost:5000/api/location/localities/Mumbai
```

---

### 💾 Save Preferred Location (🔒 Protected)
```
POST http://localhost:5000/api/location/save
```
**Body:**
```json
{
  "city": "Mumbai",
  "locality": "Bandra",
  "coordinates": [72.8347, 19.0596]
}
```

---

## 5. Bookmark APIs

### 📚 Get All Bookmarks (🔒 Protected)
```
GET http://localhost:5000/api/bookmarks
```

---

### ➕ Add Bookmark (🔒 Protected)
```
POST http://localhost:5000/api/bookmarks/:propertyId
```

---

### ❌ Remove Bookmark (🔒 Protected)
```
DELETE http://localhost:5000/api/bookmarks/:propertyId
```

---

### ✅ Check if Bookmarked (🔒 Protected)
```
GET http://localhost:5000/api/bookmarks/:propertyId/check
```

---

## 6. Notification APIs

### 📬 Get My Notifications (🔒 Protected)
```
GET http://localhost:5000/api/notifications
```

---

### 🔢 Get Unread Count (🔒 Protected)
```
GET http://localhost:5000/api/notifications/unread-count
```

---

### ✅ Mark All as Read (🔒 Protected)
```
PATCH http://localhost:5000/api/notifications/read-all
```

---

### ✅ Mark Single as Read (🔒 Protected)
```
PATCH http://localhost:5000/api/notifications/:id/read
```

---

## 7. Lead APIs

### ➕ Create Lead (Public)
```
POST http://localhost:5000/api/leads
```
**Body:**
```json
{
  "propertyId": "property_id",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "message": "Interested in this property"
}
```

---

## 8. Plan APIs

### 📋 Get All Plans & FAQs (Public)
```
GET http://localhost:5000/api/plans
```

---

### 💰 Buy Plan (🔒 Protected)
```
POST http://localhost:5000/api/plans/buy
```
**Body:**
```json
{
  "planId": "plan_id"
}
```

---

## 9. Feedback APIs

### 📝 Create Feedback (Public)
```
POST http://localhost:5000/api/feedback
```
**Body:**
```json
{
  "feedbackType": "Suggestion",
  "description": "Great app!",
  "name": "John Doe"
}
```

---

### 📋 Get My Feedbacks (🔒 Protected)
```
GET http://localhost:5000/api/feedback/my
```

---

## 10. FAQ APIs

### ❓ Get All FAQs (Public)
```
GET http://localhost:5000/api/faqs
```

---

## 11. Banner APIs

### 🖼️ Get Active Banners (Public)
```
GET http://localhost:5000/api/banners
```

---

## 12. Wallpaper APIs

### 🌄 Get All Wallpapers (Public)
```
GET http://localhost:5000/api/wallpapers
```

---

### 🖼️ Get Single Wallpaper (Public)
```
GET http://localhost:5000/api/wallpapers/:id
```

---

## 13. Legal & About Us APIs

### 📜 Get Legal Content (Public)
```
GET http://localhost:5000/api/legal/:type
```
**Types:** `privacy`, `terms`

**Example:**
```
GET http://localhost:5000/api/legal/privacy
```

---

### 📄 Get About Us (Public)
```
GET http://localhost:5000/api/about-us
```

---

---

# 🔐 14. Admin APIs

**Base URL:** `http://localhost:5000/api/admin`  
**Requires:** Admin JWT Token

---

## Admin Authentication

### 🔑 Admin Login
```
POST http://localhost:5000/api/admin/auth/login
```
**Body:**
```json
{
  "email": "admin123@gmail.com",
  "password": "admin123"
}
```

---

## Dashboard

### 📊 Get Analytics (🔒 Admin)
```
GET http://localhost:5000/api/admin/dashboard/analytics
```

---

## User Management

### 👥 Get All Users (🔒 Admin)
```
GET http://localhost:5000/api/admin/users
```

---

### ✏️ Update User (🔒 Admin)
```
PUT http://localhost:5000/api/admin/users/:id
```

---

### 🚫 Block/Unblock User (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/users/:id/block
```

---

### 🗑️ Delete User (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/users/:id
```

---

## Property Management

### 🏠 Get All Properties (🔒 Admin)
```
GET http://localhost:5000/api/admin/properties
```

---

### 📄 Get Single Property (🔒 Admin)
```
GET http://localhost:5000/api/admin/properties/:id
```

---

### 📝 Update Property Status (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/properties/:id/status
```
**Body:**
```json
{
  "status": "ACTIVE"
}
```
**Status Options:** DRAFT, ACTIVE, REJECTED, BLOCKED

---

### 🗑️ Soft Delete Property (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/properties/:id
```

---

### ♻️ Restore Property (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/properties/:id/restore
```

---

### ⭐ Make Premium (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/properties/:id/premium
```
**Body:**
```json
{
  "days": 30,
  "plan": "Gold"
}
```

---

### ❌ Remove Premium (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/properties/:id/remove-premium
```

---

## Lead Management

### 📋 Get All Leads (🔒 Admin)
```
GET http://localhost:5000/api/admin/leads
```

---

### 🏠 Get Leads by Property (🔒 Admin)
```
GET http://localhost:5000/api/admin/leads/property/:propertyId
```

---

### ✏️ Update Lead Status (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/leads/:id/status
```

---

### 🚫 Mark Lead as Spam (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/leads/:id/spam
```

---

## Plan Management

### 📋 Get All Plans (🔒 Admin)
```
GET http://localhost:5000/api/admin/plans
```

---

### ➕ Create Plan (🔒 Admin)
```
POST http://localhost:5000/api/admin/plans
```
**Body:**
```json
{
  "name": "Premium",
  "price": 999,
  "duration": 30,
  "features": ["Feature 1", "Feature 2"]
}
```

---

### ✏️ Update Plan (🔒 Admin)
```
PUT http://localhost:5000/api/admin/plans/:id
```

---

### 🗑️ Delete Plan (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/plans/:id
```

---

## FAQ Management

### 📋 Get All FAQs (🔒 Admin)
```
GET http://localhost:5000/api/admin/faqs
```

---

### ➕ Create FAQ (🔒 Admin)
```
POST http://localhost:5000/api/admin/faqs
```
**Body:**
```json
{
  "question": "How to post property?",
  "answer": "Go to Add Property section..."
}
```

---

### ✏️ Update FAQ (🔒 Admin)
```
PUT http://localhost:5000/api/admin/faqs/:id
```

---

### 🗑️ Delete FAQ (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/faqs/:id
```

---

## Banner Management

### 🖼️ Get All Banners (🔒 Admin)
```
GET http://localhost:5000/api/admin/banners
```

---

### ➕ Create Banner (🔒 Admin)
```
POST http://localhost:5000/api/admin/banners
```
**Form Data:**
- `title` - Banner title
- `status` - Active/Inactive
- `redirectUrl` - URL to redirect
- `image` - Image file (uploads to Firebase Storage)

---

### ✏️ Update Banner (🔒 Admin)
```
PUT http://localhost:5000/api/admin/banners/:id
```

---

### 🔄 Toggle Banner Status (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/banners/:id/toggle
```

---

### 🗑️ Delete Banner (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/banners/:id
```

---

## Wallpaper Management

### 🌄 Get All Wallpapers (🔒 Admin)
```
GET http://localhost:5000/api/admin/wallpapers
```

---

### ➕ Create Wallpaper (🔒 Admin)
```
POST http://localhost:5000/api/admin/wallpapers
```
**Form Data:**
- `title` - Wallpaper title
- `description` - Description
- `image` - Image file (uploads to Firebase Storage)

---

### ✏️ Update Wallpaper (🔒 Admin)
```
PUT http://localhost:5000/api/admin/wallpapers/:id
```

---

### 🗑️ Delete Wallpaper (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/wallpapers/:id
```

---

## Notification Management

### 📊 Get Notification Stats (🔒 Admin)
```
GET http://localhost:5000/api/admin/notifications/stats
```

---

### 📋 Get All Notifications (🔒 Admin)
```
GET http://localhost:5000/api/admin/notifications
```

---

### ➕ Create Notification (🔒 Admin)
```
POST http://localhost:5000/api/admin/notifications
```
**Body:**
```json
{
  "title": "New Update!",
  "message": "Check out our new features",
  "type": "PROMOTIONAL",
  "targetUsers": "ALL"
}
```

---

### 📄 Get Single Notification (🔒 Admin)
```
GET http://localhost:5000/api/admin/notifications/:id
```

---

### ✏️ Update Notification (🔒 Admin)
```
PUT http://localhost:5000/api/admin/notifications/:id
```

---

### 🗑️ Delete Notification (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/notifications/:id
```

---

## Feedback Management

### 📋 Get All Feedbacks (🔒 Admin)
```
GET http://localhost:5000/api/admin/feedbacks
```

---

### 📊 Get Feedback Stats (🔒 Admin)
```
GET http://localhost:5000/api/admin/feedbacks/stats
```

---

### ✏️ Update Feedback Status (🔒 Admin)
```
PATCH http://localhost:5000/api/admin/feedbacks/:id/status
```

---

### 🗑️ Delete Feedback (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/feedbacks/:id
```

---

## Bookmark Management

### 📚 Get All Bookmarks (🔒 Admin)
```
GET http://localhost:5000/api/admin/bookmarks
```

---

### 📊 Get Bookmark Stats (🔒 Admin)
```
GET http://localhost:5000/api/admin/bookmarks/stats
```

---

## About Us Management

### 📄 Get About Us (🔒 Admin)
```
GET http://localhost:5000/api/admin/about-us
```

---

### ✏️ Create/Update About Us (🔒 Admin)
```
PUT http://localhost:5000/api/admin/about-us
```

---

## Deletion Request Management

### 📋 Get All Deletion Requests (🔒 Admin)
```
GET http://localhost:5000/api/admin/deletion-requests
```

---

### ✅ Approve Deletion (🔒 Admin)
```
POST http://localhost:5000/api/admin/deletion-requests/:userId/approve
```

---

### ❌ Reject Deletion (🔒 Admin)
```
POST http://localhost:5000/api/admin/deletion-requests/:userId/reject
```

---

### 🗑️ Permanently Delete User (🔒 Admin)
```
DELETE http://localhost:5000/api/admin/deletion-requests/:userId/permanent
```

---

## Audit Logs

### 📜 Get Audit Logs (🔒 Admin)
```
GET http://localhost:5000/api/admin/audit
```

---

---

## 📝 Notes

1. **File Uploads:** All images are uploaded to **Firebase Storage**
2. **Authentication:** JWT tokens expire after 7 days
3. **Rate Limiting:** Not implemented yet
4. **Error Format:**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

**Documentation Generated:** January 28, 2026
