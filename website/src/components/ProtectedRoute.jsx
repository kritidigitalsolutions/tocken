import { Navigate, Outlet } from 'react-router-dom'
import { isDeveloperLoggedIn } from '../lib/developerSession'

export default function ProtectedRoute() {
  if (!isDeveloperLoggedIn()) {
    return <Navigate to="/developer/login" replace />
  }

  return <Outlet />
}
