import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DataTable from "../../../components/tables/DataTable";
import Modal from "../../../components/modals/Modal";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import { useTheme } from "../../../context/ThemeContext";

import {
  fetchBanners,
  deleteBanner,
  createBanner,
  updateBanner,
  toggleBannerStatus
} from "../../../api/banner.api";

const initialForm = {
  title: "",
  description: "",
  status: "Active",
  image: null
};

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const [openForm, setOpenForm] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [formData, setFormData] = useState(initialForm);

  const loadBanners = async () => {
    try {
      const res = await fetchBanners();
      setBanners(res.data.banners || []);
    } catch (error) {
      console.error("Error loading banners:", error);
      if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error("Network error: Backend server not running on port 5000");
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized: Please login again");
      } else {
        toast.error("Failed to load banners");
      }
      setBanners([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBanners().finally(() => setLoading(false));
  }, []);

  /* ---------------- CREATE / UPDATE ---------------- */

  const handleSubmit = async () => {
    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("status", formData.status);
      if (formData.image) payload.append("image", formData.image);

      if (selectedBanner) {
        await updateBanner(selectedBanner._id, payload);
        toast.success("Banner updated successfully");
      } else {
        await createBanner(payload);
        toast.success("Banner created successfully");
      }

      setOpenForm(false);
      setSelectedBanner(null);
      setFormData(initialForm);
      loadBanners();
    } catch (err) {
      console.error("Submit error:", err);
      if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Network error: Backend server not running");
      } else if (err.response?.status === 401) {
        toast.error("Unauthorized: Please login again");
      } else {
        toast.error(err.response?.data?.message || "Failed to save banner");
      }
    }
  };

  /* ---------------- DELETE ---------------- */

  const handleDelete = async () => {
    try {
      await deleteBanner(selectedBanner._id);
      toast.success("Banner deleted successfully");
      setOpenDelete(false);
      loadBanners();
    } catch (error) {
      console.error("Delete error:", error);
      if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error("Network error: Backend server not running");
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized: Please login again");
      } else {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    }
  };

  /* ---------------- TOGGLE STATUS ---------------- */

  const handleToggle = async (id) => {
    try {
      const response = await toggleBannerStatus(id);
      if (response.data.success) {
        toast.success("Status toggled successfully");
        loadBanners();
      }
    } catch (error) {
      console.error("Toggle error:", error);
      
      if (error.code === "ERR_NETWORK" || !error.response) {
        toast.error("Network error: Backend server is not running on port 5000");
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized: Please login again");
      } else if (error.response?.status === 403) {
        toast.error("Forbidden: Admin access required");
      } else if (error.response?.status === 404) {
        toast.error("Banner not found");
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to toggle status");
      }
    }
  };

  return (
    <div>
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Banners</h2>
        <Button onClick={() => setOpenForm(true)}>+ Add Banner</Button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <DataTable columns={["Preview", "Title", "Status", "Actions"]}>
          {banners.map((banner) => (
            <tr key={banner._id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <td className="p-4">
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-32 h-14 object-cover rounded"
                />
              </td>
              <td className={`p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{banner.title}</td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    banner.status === "Active"
                      ? "bg-green-600"
                      : "bg-gray-500"
                  }`}
                >
                  {banner.status}
                </span>
              </td>
              <td className="p-4 flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedBanner(banner);
                    setFormData(banner);
                    setOpenForm(true);
                  }}
                >
                  Edit
                </Button>

                <Button
                  variant="warning"
                  onClick={() => handleToggle(banner._id)}
                >
                  Toggle
                </Button>

                <Button
                  variant="danger"
                  onClick={() => {
                    setSelectedBanner(banner);
                    setOpenDelete(true);
                  }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {/* ADD / EDIT MODAL */}
      <Modal
        open={openForm}
        title={selectedBanner ? "Edit Banner" : "Add Banner"}
        onClose={() => setOpenForm(false)}
      >
        <div className="space-y-4">
          <input
            placeholder="Title"
            className={`w-full p-2 rounded border transition-colors duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />

          <input
            placeholder="Description"
            className={`w-full p-2 rounded border transition-colors duration-200 ${isDark ? 'bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'}`}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <input
            type="file"
            onChange={(e) =>
              setFormData({ ...formData, image: e.target.files[0] })
            }
          />

          <Button onClick={handleSubmit}>
            {selectedBanner ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        open={openDelete}
        title="Delete Banner"
        onClose={() => setOpenDelete(false)}
      >
        <p className={`mb-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Are you sure you want to delete this banner?
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Banners;
