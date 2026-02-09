import api from "./api";

// Get all deletion requests
export const fetchDeletionRequests = (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append("status", params.status);
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    const queryString = queryParams.toString();
    return api.get(`/admin/deletion-requests${queryString ? `?${queryString}` : ""}`);
};

// Approve deletion request
export const approveDeletionRequest = (userId) =>
    api.post(`/admin/deletion-requests/${userId}/approve`);

// // Reject deletion request
// export const rejectDeletionRequest = (userId, adminNote = "") =>
//     api.post(`/admin/deletion-requests/${userId}/reject`, { adminNote });

// Permanently delete user
export const permanentlyDeleteUser = (userId) =>
    api.delete(`/admin/deletion-requests/${userId}/permanent`);
