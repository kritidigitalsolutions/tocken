# 🌐 API Consumption Guide

**Last Updated:** February 5, 2026  
**Version:** 1.0

---

## Overview

This document describes how the Frontend (React Admin Panel) consumes the Backend APIs using Axios, including request patterns, error handling, and authentication flow.

---

## 📂 API Service Layer Structure

```
frontend/src/api/
├── api.js                      # Axios instance with interceptors
├── admin.audit.api.js          # Audit logs API calls
├── admin.bookmark.api.js       # Bookmark analytics API calls
├── admin.dashboard.api.js      # Dashboard/Analytics API calls
├── admin.feedback.api.js       # Feedback management API calls
├── admin.lead.api.js           # Lead management API calls
├── admin.notification.api.js   # Notification management API calls
├── admin.property.api.js       # Property management API calls
├── aboutUs.api.js              # About Us content API calls
├── banner.api.js               # Banner API calls
├── dashboard.api.js            # Dashboard API calls
├── deletionRequest.api.js      # Account deletion requests API calls
├── faq.api.js                  # FAQ API calls
├── legal.api.js                # Legal content API calls
├── plans.js                    # Plan management API calls
└── user.api.js                 # User management API calls
```

---

## 🔧 Core Axios Configuration

**File:** [frontend/src/api/api.js](frontend/src/api/api.js)

```javascript
import axios from "axios";

// Create Axios instance with base URL from env
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  // baseURL: "https://backend-tocken-admin-panel.vercel.app/api" // Production
});

// 🔐 Request Interceptor - Attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🚨 Response Interceptor - Handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("adminToken");
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## 🔐 Authentication Flow

### 1. Admin Login
```javascript
// POST /api/admin/auth/login
import API from './api';

export const loginAdmin = async (email, password) => {
  try {
    const { data } = await API.post('/admin/auth/login', {
      email,
      password
    });
    
    // Store JWT token in localStorage
    localStorage.setItem('adminToken', data.token);
    
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};
```

### 2. Token Storage & Usage
```javascript
// Token is automatically added to all requests via interceptor
// No need to manually add it to each request
```

### 3. Logout
```javascript
export const logoutAdmin = () => {
  localStorage.removeItem('adminToken');
  window.location.href = '/login';
};
```

---

## 📋 API Call Patterns

### Common Request Patterns

#### GET Request
```javascript
// Get all users (protected route)
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const { data } = await API.get(`/admin/users`, {
      params: { page, limit }
    });
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
```

#### POST Request
```javascript
// Create new plan
export const createPlan = async (planData) => {
  try {
    const { data } = await API.post('/admin/plans', planData);
    return data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create plan';
  }
};
```

#### PUT Request
```javascript
// Update existing plan
export const updatePlan = async (planId, planData) => {
  try {
    const { data } = await API.put(`/admin/plans/${planId}`, planData);
    return data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update plan';
  }
};
```

#### DELETE Request
```javascript
// Delete plan
export const deletePlan = async (planId) => {
  try {
    const { data } = await API.delete(`/admin/plans/${planId}`);
    return data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete plan';
  }
};
```

#### File Upload
```javascript
// Upload banner with image
export const createBanner = async (formData) => {
  try {
    const { data } = await API.post('/admin/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data;
  } catch (error) {
    throw error;
  }
};
```

---

## 🛡️ Error Handling

### Global Error Handler
```javascript
// Error response format from backend
{
  "success": false,
  "message": "Error description"
}

// Error interceptor in api.js handles 401 errors
// Custom error handling in components:

try {
  const data = await someApiCall();
  // Success
} catch (error) {
  const message = error.response?.data?.message || 'An error occurred';
  console.error(message);
  // Show error toast/modal to user
}
```

---

## 📝 Common API Services

### Admin Dashboard
**File:** [frontend/src/api/admin.dashboard.api.js](frontend/src/api/admin.dashboard.api.js)

```javascript
import API from './api';

// Get dashboard analytics
export const getDashboardAnalytics = async () => {
  const { data } = await API.get('/admin/dashboard/analytics');
  return data;
};
```

### User Management
**File:** [frontend/src/api/user.api.js](frontend/src/api/user.api.js)

```javascript
import API from './api';

// Get all users
export const getAdminUsers = async (filters = {}) => {
  const { data } = await API.get('/admin/users', { params: filters });
  return data;
};

// Block/Unblock user
export const blockUnblockUser = async (userId) => {
  const { data } = await API.patch(`/admin/users/${userId}/block`);
  return data;
};

// Delete user
export const deleteAdminUser = async (userId) => {
  const { data } = await API.delete(`/admin/users/${userId}`);
  return data;
};
```

### Property Management
**File:** [frontend/src/api/admin.property.api.js](frontend/src/api/admin.property.api.js)

```javascript
import API from './api';

// Get all properties
export const getAdminProperties = async (filters = {}) => {
  const { data } = await API.get('/admin/properties', { params: filters });
  return data;
};

// Get property details
export const getPropertyDetails = async (propertyId) => {
  const { data } = await API.get(`/admin/properties/${propertyId}`);
  return data;
};

// Update property status
export const updatePropertyStatus = async (propertyId, status) => {
  const { data } = await API.patch(
    `/admin/properties/${propertyId}/status`,
    { status }
  );
  return data;
};

// Make property premium
export const makePremium = async (propertyId, days, plan) => {
  const { data } = await API.patch(
    `/admin/properties/${propertyId}/premium`,
    { days, plan }
  );
  return data;
};
```

### Plan Management
**File:** [frontend/src/api/plans.js](frontend/src/api/plans.js)

```javascript
import API from './api';

// Get all plans
export const getAdminPlans = async () => {
  const { data } = await API.get('/admin/plans');
  return data;
};

// Create plan
export const createAdminPlan = async (planData) => {
  const { data } = await API.post('/admin/plans', planData);
  return data;
};

// Update plan
export const updateAdminPlan = async (planId, planData) => {
  const { data } = await API.put(`/admin/plans/${planId}`, planData);
  return data;
};

// Delete plan
export const deleteAdminPlan = async (planId) => {
  const { data } = await API.delete(`/admin/plans/${planId}`);
  return data;
};
```

### Feedback Management
**File:** [frontend/src/api/admin.feedback.api.js](frontend/src/api/admin.feedback.api.js)

```javascript
import API from './api';

// Get all feedbacks
export const getAdminFeedbacks = async () => {
  const { data } = await API.get('/admin/feedbacks');
  return data;
};

// Get feedback stats
export const getFeedbackStats = async () => {
  const { data } = await API.get('/admin/feedbacks/stats');
  return data;
};

// Update feedback status
export const updateFeedbackStatus = async (feedbackId, status) => {
  const { data } = await API.patch(
    `/admin/feedbacks/${feedbackId}/status`,
    { status }
  );
  return data;
};
```

---

## 🔄 Request/Response Examples

### Example 1: Fetch & Display Users

**Component Code:**
```javascript
import { useState, useEffect } from 'react';
import { getAdminUsers } from '../api/user.api';

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getAdminUsers({ page: 1, limit: 10 });
        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      {users.map(user => (
        <div key={user._id}>{user.firstName} {user.lastName}</div>
      ))}
    </div>
  );
};
```

### Example 2: Create & Update with Form

**Component Code:**
```javascript
import { useState } from 'react';
import { createAdminPlan, updateAdminPlan } from '../api/plans';
import toast from 'react-hot-toast';

export const PlanForm = ({ planId, initialData }) => {
  const [formData, setFormData] = useState(initialData || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (planId) {
        // Update
        await updateAdminPlan(planId, formData);
        toast.success('Plan updated successfully');
      } else {
        // Create
        await createAdminPlan(formData);
        toast.success('Plan created successfully');
      }
      
      // Refresh list or redirect
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Plan'}
      </button>
    </form>
  );
};
```

---

## 🚀 Environment Configuration

**File:** `.env.local` or `.env`

```env
# Development
REACT_APP_API_URL=http://localhost:5000/api

# Production
# REACT_APP_API_URL=https://backend-tocken-admin-panel.vercel.app/api
```

---

## 📊 API Response Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 201 | Created | Success |
| 400 | Bad Request | Show error message |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show access denied message |
| 404 | Not Found | Show not found message |
| 500 | Server Error | Show error message |

---

## 🔗 Useful Links

- **Backend Repository:** Backend folder
- **API Documentation:** [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Project Structure:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Axios Documentation:** https://axios-http.com/
- **React Hooks Guide:** https://react.dev/reference/react/hooks

---

**Last Updated:** February 5, 2026
