import api from "./api";

// ─── READ ──────────────────────────────────────────────
export const getProjects = (params) =>
  api.get("/admin/projects", { params });

export const getProjectDetails = (id) =>
  api.get(`/admin/projects/${id}`);

export const getUserProjects = (userId, params) =>
  api.get(`/admin/projects/user/${userId}`, { params });

// ─── WRITE ─────────────────────────────────────────────
export const updateProjectStatus = (id, status, extra = {}) =>
  api.patch(`/admin/projects/${id}/status`, { status, ...extra });

export const toggleFeatured = (id) =>
  api.patch(`/admin/projects/${id}/featured`);

export const updateProject = (id, data) =>
  api.put(`/admin/projects/${id}`, data);

export const deleteProject = (id) =>
  api.delete(`/admin/projects/${id}`);
