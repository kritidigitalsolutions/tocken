import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import DeveloperLogin from './pages/DeveloperLogin'
import ProtectedRoute from './components/ProtectedRoute'
import DeveloperLayout from './pages/developer/DeveloperLayout'
import DeveloperDashboardHome from './pages/developer/DeveloperDashboardHome'
import DeveloperPostProject from './pages/developer/DeveloperPostProject'
import DeveloperProjectListing from './pages/developer/DeveloperProjectListing'
import DeveloperPaymentStatus from './pages/developer/DeveloperPaymentStatus'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/developer/login" element={<DeveloperLogin />} />
      <Route path="/payment/status/:merchantOrderId" element={<DeveloperPaymentStatus />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/developer" element={<DeveloperLayout />}>
          <Route path="dashboard" element={<DeveloperDashboardHome />} />
          <Route path="post-project" element={<DeveloperPostProject />} />
          <Route path="projects" element={<DeveloperProjectListing />} />
          <Route index element={<Navigate to="/developer/dashboard" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
