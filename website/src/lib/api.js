const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function normalizePath(path) {
  if (!path.startsWith('/')) {
    return `/${path}`
  }
  return path
}

export function buildApiUrl(path) {
  return `${API_BASE_URL}${normalizePath(path)}`
}

export async function apiRequest(path, options = {}, token) {
  const headers = {
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed')
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
