import api from "./api";

// ── Admin Payment APIs (/api/admin/payments) ──

export const adminGetAllPayments = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return api.get(`/admin/payments?${queryParams}`);
};

export const adminGetPaymentStats = () =>
  api.get("/admin/payments/stats");
