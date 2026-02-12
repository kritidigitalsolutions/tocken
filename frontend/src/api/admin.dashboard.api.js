import api from "./api";

// 🎯 Get comprehensive dashboard analytics
export const getDashboardAnalytics = (params) =>
  api.get("/admin/dashboard/analytics", { params });

// 📊 Get visitor statistics  
export const getVisitorStats = (params) =>
  api.get("/admin/dashboard/visitors", { params });

// 📋 Get activity logs
export const getActivityLogs = (params) =>
  api.get("/admin/dashboard/activity", { params });

// 🔄 Get legacy dashboard data (backward compatibility)
export const getDashboardData = () =>
  api.get("/admin/dashboard");
