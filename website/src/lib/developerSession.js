const TOKEN_KEY = 'developerToken'
const USER_KEY = 'developerUser'

export function getDeveloperToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setDeveloperSession(token, user = null) {
  localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export function getDeveloperUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearDeveloperSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isDeveloperLoggedIn() {
  return Boolean(getDeveloperToken())
}
