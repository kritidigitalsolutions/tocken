import api from "./api";

export const getProperties = (params) =>
  api.get("/admin/properties", { params });

export const getPropertiesWithBookmarks = (params) =>
  api.get("/admin/properties/with-bookmarks", { params });

export const getPropertyBookmarks = (propertyId) =>
  api.get(`/admin/properties/${propertyId}/bookmarks`);

export const getPropertyDetails = (id) =>
  api.get(`/admin/properties/${id}`);

export const getUserProperties = (userId, params) =>
  api.get(`/admin/properties/user/${userId}`, { params });

export const updateProperty = (id, data) =>
  api.put(`/admin/properties/${id}`, data);

export const updatePropertyStatus = (id, status) =>
  api.patch(`/admin/properties/${id}/status`, { status });

// Permanent delete (for all pages)
export const deleteProperty = (id) =>
  api.delete(`/admin/properties/${id}`);

export const restoreProperty = (id) =>
  api.patch(`/admin/properties/${id}/restore`);

export const makePremium = (id, data) =>
  api.patch(`/admin/properties/${id}/premium`, data);

export const removePremium = (id) =>
  api.patch(`/admin/properties/${id}/remove-premium`);

export const deletePhoto = (propertyId, publicId) =>
  api.delete(`/properties/${propertyId}/photos/${publicId}`);
