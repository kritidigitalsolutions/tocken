import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";

import Dashboard from "../pages/admin/dashboard/Dashboard";
import Users from "../pages/admin/users/Users";
import Plans from "../pages/admin/plans/Plans";
import FAQs from "../pages/admin/faqs/FAQs";
import Banners from "../pages/admin/banners/Banners";
import LegalPages from "../pages/admin/legal/LegalPages";
import ProtectedRoute from "../components/common/ProtectedRoute";
// for properties and leads
import Properties from "../pages/admin/properties/Properties";
import Leads from "../pages/admin/leads/Leads";
// for bookmarks
import Bookmarks from "../pages/admin/bookmarks/Bookmarks";
// for feedbacks
import Feedbacks from "../pages/admin/feedbacks/Feedbacks";
// for notifications
import Notifications from "../pages/admin/notifications/Notifications";
// for about us
import AboutUs from "../pages/admin/aboutUs/AboutUs";
// for deletion requests
import DeletionRequests from "../pages/admin/deletionRequests/DeletionRequests";
// for wallpapers
import Wallpapers from "../pages/admin/wallpapers/Wallpapers";
// for dashboard sub-pages
import UserAnalytics from "../pages/admin/dashboard/UserAnalytics";
import PropertyAnalytics from "../pages/admin/dashboard/PropertyAnalytics";
import RevenueAnalytics from "../pages/admin/dashboard/RevenueAnalytics";
import ActivityLogs from "../pages/admin/dashboard/ActivityLogs";
import Reports from "../pages/admin/dashboard/Reports";


const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard/user-analytics" element={<UserAnalytics />} />
        <Route path="dashboard/property-analytics" element={<PropertyAnalytics />} />
        <Route path="dashboard/revenue-analytics" element={<RevenueAnalytics />} />
        <Route path="dashboard/activity-logs" element={<ActivityLogs />} />
        <Route path="dashboard/reports" element={<Reports />} />
        <Route path="users" element={<Users />} />
        <Route path="plans" element={<Plans />} />
        <Route path="faqs" element={<FAQs />} />
        <Route path="banners" element={<Banners />} />
        <Route path="legal" element={<LegalPages />} />
        <Route path="properties" element={<Properties />} />
        <Route path="leads" element={<Leads />} />
        <Route path="bookmarks" element={<Bookmarks />} />
        <Route path="feedbacks" element={<Feedbacks />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="about-us" element={<AboutUs />} />
        <Route path="deletion-requests" element={<DeletionRequests />} />
        <Route path="wallpapers" element={<Wallpapers />} />
        
        {/* Dashboard sub-routes */}
        <Route path="dashboard/user-analytics" element={<UserAnalytics />} />
        <Route path="dashboard/property-analytics" element={<PropertyAnalytics />} />
        <Route path="dashboard/revenue-analytics" element={<RevenueAnalytics />} />
        <Route path="dashboard/activity-logs" element={<ActivityLogs />} />
        <Route path="dashboard/reports" element={<Reports />} />


      </Route>
    </Routes>
  );
};

export default AdminRoutes;
