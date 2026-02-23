import { useState, useEffect, useCallback } from "react";
import { Trash2, Edit, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { wallpaperAPI } from "./wallpaperAPI";
import { useTheme } from "../../../context/ThemeContext";

const WallpaperManagement = () => {
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null
  });

  // Fetch wallpapers
  const fetchWallpapers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await wallpaperAPI.getAllWallpapersAdmin({
        page: 1,
        limit: 10
      });

      setWallpapers(response.data.wallpapers);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch wallpapers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallpapers();
  }, [fetchWallpapers]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For new wallpapers, image must be a File
    if (!editingId && !formData.image) {
      toast.error("Image is required");
      return;
    }

    // For new wallpapers, ensure image is actually a File
    if (!editingId && formData.image && !(formData.image instanceof File)) {
      toast.error("Please select a valid image file");
      return;
    }

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      
      // Append image only if it's a file (not a string URL)
      if (formData.image instanceof File) {
        data.append("image", formData.image);
      }

      if (editingId) {
        await wallpaperAPI.updateWallpaper(editingId, data);
        toast.success("Wallpaper updated successfully");
      } else {
        await wallpaperAPI.createWallpaper(data);
        toast.success("Wallpaper created successfully");
      }

      setFormData({
        title: "",
        description: "",
        image: null
      });
      setEditingId(null);
      setShowForm(false);
      fetchWallpapers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save wallpaper");
    }
  };

  // Edit wallpaper
  const handleEdit = (wallpaper) => {
    setFormData({
      title: wallpaper.title,
      description: wallpaper.description,
      image: wallpaper.image // Keep the image URL as string
    });
    setEditingId(wallpaper._id);
    setShowForm(true);
  };

  // Delete wallpaper
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this wallpaper?")) {
      try {
        await wallpaperAPI.deleteWallpaper(id);
        toast.success("Wallpaper deleted successfully");
        fetchWallpapers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete wallpaper");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Wallpaper Management</h1>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingId(null);
              setFormData({
                title: "",
                description: "",
                image: null
              });
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={20} /> Add Wallpaper
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className={`absolute left-3 top-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} size={20} />
            <input
              type="text"
              placeholder="Search wallpapers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className={`rounded-lg shadow-md p-6 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {editingId ? "Edit Wallpaper" : "Add New Wallpaper"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  placeholder="Enter wallpaper title (optional)"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
                  rows="3"
                  placeholder="Enter wallpaper description"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required={!editingId}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${isDark ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}
                />
                {editingId && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Leave empty to keep current image
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      title: "",
                      description: "",
                      image: null
                    });
                  }}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Wallpapers Grid */}
        {loading ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading...</div>
        ) : wallpapers.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No wallpapers found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallpapers
              .filter((w) =>
                w.title.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((wallpaper) => (
                <div
                  key={wallpaper._id}
                  className={`rounded-lg shadow-md overflow-hidden hover:shadow-lg transition border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Image */}
                  <img
                    src={wallpaper.image}
                    alt={wallpaper.title}
                    className={`w-full h-48 object-cover ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%231e293b' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='18' fill='%23666666'%3EInvalid Image%3C/text%3E%3C/svg%3E";
                    }}
                  />

                  {/* Info */}
                  <div className="p-4">
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{wallpaper.title}</h3>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {wallpaper.description}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(wallpaper)}
                        className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-700"
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(wallpaper._id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-red-700"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WallpaperManagement;
