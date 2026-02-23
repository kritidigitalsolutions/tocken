import api from "./api";

// 🔥 NEW CLEAN LEAD SYSTEM APIs

// ===== LEAD REQUESTS MANAGEMENT =====
export const getAllLeadRequests = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/admin/leads/requests?${queryParams}`);
};

export const approveLeadRequest = (requestId, data = {}) =>
  api.post(`/admin/leads/requests/${requestId}/approve`, data);

export const rejectLeadRequest = (requestId, data) =>
  api.post(`/admin/leads/requests/${requestId}/reject`, data);

// ===== LEAD ASSIGNMENT =====
export const assignLead = (data) =>
  api.post("/admin/leads/assign", data);

export const assignLeadBulk = (data) =>
  api.post("/admin/leads/assign-bulk", data);

export const getSubscriptionUsersCount = () =>
  api.get("/admin/leads/subscription-users-count");

// ===== LEADS MANAGEMENT =====
export const getAllLeads = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/admin/leads?${queryParams}`);
};

// ===== USER QUOTA MANAGEMENT =====
export const getUserQuota = (userId) =>
  api.get(`/admin/leads/users/${userId}/quota`);

// 🗑️ OLD APIs (DEPRECATED - DO NOT USE)
// export const getLeadsByProperty = (propertyId) =>
//   api.get(`/admin/leads/property/${propertyId}`);

// export const updateLeadStatus = (id, status) =>
//   api.patch(`/admin/leads/${id}/status`, { status });
