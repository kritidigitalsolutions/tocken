import { apiRequest } from './api'

export async function getPlanStatus(token) {
  return apiRequest('/api/plans/status', {}, token)
}

export async function getPlansForType(userType, token) {
  const query = encodeURIComponent(userType)
  return apiRequest(`/api/plans?userType=${query}`, {}, token)
}

export async function getAllPlans(token) {
  return apiRequest('/api/plans?all=true', {}, token)
}

export async function createPaymentOrder(planId, token, redirectBaseUrl) {
  return apiRequest(
    '/api/payments/create-order',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, redirectBaseUrl }),
    },
    token
  )
}

export async function checkPaymentStatus(merchantOrderId, token) {
  return apiRequest(`/api/payments/status/${merchantOrderId}`, {}, token)
}

export async function fetchMyProjects(token) {
  return apiRequest('/api/projects/user/my', {}, token)
}

export async function createProject(formData, token) {
  return apiRequest('/api/projects', { method: 'POST', body: formData }, token)
}

export async function updateProject(projectId, formData, token) {
  return apiRequest(`/api/projects/${projectId}`, { method: 'PUT', body: formData }, token)
}

export async function uploadDeveloperDocs(formData, token) {
  return apiRequest('/api/projects/developer/me/uploads', { method: 'PATCH', body: formData }, token)
}
