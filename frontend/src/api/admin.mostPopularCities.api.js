import api from "./api";

/**
 * Fetch most popular cities with images
 */
export const getMostPopularCities = async (params = {}) => {
  try {
    const response = await api.get("/admin/most-popular-cities", { params });
    return response.data;
  } catch (error) {
    console.error("Get most popular cities error:", error);
    throw error.response?.data || { message: "Failed to fetch cities" };
  }
};

/**
 * Sync cities from properties collection
 */
export const syncCitiesFromProperties = async () => {
  try {
    const response = await api.post("/admin/most-popular-cities/sync");
    return response.data;
  } catch (error) {
    console.error("Sync cities error:", error);
    throw error.response?.data || { message: "Failed to sync cities" };
  }
};

/**
 * Upload image for a city
 */
export const uploadCityImage = async (cityId, imageFile) => {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    // Don't set Content-Type manually - let axios set it automatically with boundary
    const response = await api.post(
      `/admin/most-popular-cities/${cityId}/upload-image`,
      formData
    );
    return response.data;
  } catch (error) {
    console.error("Upload city image error:", error);
    throw error.response?.data || { message: "Failed to upload image" };
  }
};

/**
 * Update city status (active/inactive)
 */
export const updateCityStatus = async (cityId, isActive) => {
  try {
    const response = await api.patch(
      `/admin/most-popular-cities/${cityId}/status`,
      { isActive }
    );
    return response.data;
  } catch (error) {
    console.error("Update city status error:", error);
    throw error.response?.data || { message: "Failed to update city status" };
  }
};

/**
 * Delete city image
 */
export const deleteCityImage = async (cityId) => {
  try {
    const response = await api.delete(`/admin/most-popular-cities/${cityId}/image`);
    return response.data;
  } catch (error) {
    console.error("Delete city image error:", error);
    throw error.response?.data || { message: "Failed to delete city image" };
  }
};

/**
 * Delete city entry
 */
export const deleteCity = async (cityId) => {
  try {
    const response = await api.delete(`/admin/most-popular-cities/${cityId}`);
    return response.data;
  } catch (error) {
    console.error("Delete city error:", error);
    throw error.response?.data || { message: "Failed to delete city" };
  }
};

/**
 * Get public most popular cities (for testing)
 */
export const getPublicMostPopularCities = async (params = {}) => {
  try {
    const response = await api.get("/most-popular-cities", { params });
    return response.data;
  } catch (error) {
    console.error("Get public cities error:", error);
    throw error.response?.data || { message: "Failed to fetch cities" };
  }
};
