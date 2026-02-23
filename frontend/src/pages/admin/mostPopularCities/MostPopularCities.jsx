import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import toast, { Toaster } from "react-hot-toast";

import {
    MapPin,
    RefreshCw,
    Upload,
    Eye,
    EyeOff,
    Image as ImageIcon,
    Building2,
    CheckCircle,
    Trash2,
    X
} from "lucide-react";
import {
    getMostPopularCities,
    syncCitiesFromProperties,
    uploadCityImage,
    updateCityStatus,
    deleteCityImage,
} from "../../../api/admin.mostPopularCities.api";

const MostPopularCities = () => {
    const { isDark } = useTheme();

    // States
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Load cities on mount
    useEffect(() => {
        loadCities();
    }, []);

    // Load cities from database
    const loadCities = async () => {
        try {
            setLoading(true);
            const response = await getMostPopularCities({ activeOnly: false });
            setCities(response.topCities || []);
        } catch (error) {
            console.error("Load cities error:", error);
            toast.error(error.message || "Failed to load cities");
        } finally {
            setLoading(false);
        }
    };

    // Sync cities from properties
    const handleSync = async () => {
        try {
            setSyncing(true);
            const response = await syncCitiesFromProperties();
            toast.success(response.message || "Cities synced successfully");
            await loadCities(); // Reload cities
        } catch (error) {
            console.error("Sync error:", error);
            toast.error(error.message || "Failed to sync cities");
        } finally {
            setSyncing(false);
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size should be less than 5MB");
                return;
            }

            setSelectedFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload city image
    const handleUploadImage = async () => {
        if (!selectedFile || !selectedCity) {
            toast.error("Please select a file");
            return;
        }

        // Debug logging
        console.log("Uploading file:", {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            lastModified: selectedFile.lastModified
        });

        try {
            setUploading(true);
            const response = await uploadCityImage(selectedCity._id, selectedFile);
            toast.success(response.message || "Image uploaded successfully");

            // Update city in list
            setCities(cities.map(city =>
                city._id === selectedCity._id ? response.city : city
            ));

            // Close modal and reset
            setUploadModalOpen(false);
            setSelectedCity(null);
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    // Toggle city status
    const handleToggleStatus = async (city) => {
        try {
            setActionLoading(true);
            const newStatus = !city.isActive;
            const response = await updateCityStatus(city._id, newStatus);
            toast.success(response.message);

            // Update city in list
            setCities(cities.map(c =>
                c._id === city._id ? response.city : c
            ));
        } catch (error) {
            console.error("Toggle status error:", error);
            toast.error(error.message || "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    // Delete city image
    const handleDeleteImage = async (city) => {
        if (!window.confirm(`Delete image for ${city.city}?`)) return;

        try {
            setActionLoading(true);
            const response = await deleteCityImage(city._id);
            toast.success(response.message);

            // Update city in list
            setCities(cities.map(c =>
                c._id === city._id ? response.city : c
            ));
        } catch (error) {
            console.error("Delete image error:", error);
            toast.error(error.message || "Failed to delete image");
        } finally {
            setActionLoading(false);
        }
    };

    // Open upload modal
    const openUploadModal = (city) => {
        setSelectedCity(city);
        setUploadModalOpen(true);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    return (
        <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} p-6`}>
            <Toaster position="top-right" />

            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <MapPin className="text-indigo-500" size={32} />
                            Most Popular Cities
                        </h1>
                        <p className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                            Manage city images for Flutter app
                        </p>
                    </div>

                    {/* Sync Button */}
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isDark
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                            : "bg-indigo-500 hover:bg-indigo-600 text-white"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing..." : "Sync from Active Properties"}
                    </button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center h-64">
                    <Loader />
                </div>
            )}

            {/* Cities Grid */}
            {!loading && (
                <div className="max-w-7xl mx-auto">
                    {cities.length === 0 ? (
                        <div className={`text-center py-12 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"}`}>
                            <MapPin size={48} className={`mx-auto mb-4 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                            <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                No cities found. Click "Sync from Active Properties" to load cities.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cities.map((city) => (
                                <div
                                    key={city._id}
                                    className={`rounded-lg overflow-hidden shadow-lg transition-all hover:shadow-xl ${isDark ? "bg-gray-800" : "bg-white"
                                        }`}
                                >
                                    {/* City Image */}
                                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                                        {city.imageUrl ? (
                                            <img
                                                src={city.imageUrl}
                                                alt={city.city}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon size={64} className="text-white opacity-50" />
                                            </div>
                                        )}

                                        {/* Status Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${city.isActive
                                                    ? "bg-green-500 text-white"
                                                    : "bg-red-500 text-white"
                                                    }`}
                                            >
                                                {city.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* City Info */}
                                    <div className="p-5">
                                        <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {city.city}
                                        </h3>

                                        <div className="flex items-center gap-2 mb-4">
                                            <Building2 size={16} className="text-indigo-500" />
                                            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                                {city.totalProperties} Properties
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-2">
                                            {/* Upload/Change Image */}
                                            <button
                                                onClick={() => openUploadModal(city)}
                                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isDark
                                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    : "bg-indigo-500 hover:bg-indigo-600 text-white"
                                                    }`}
                                            >
                                                <Upload size={16} />
                                                {city.imageUrl ? "Change" : "Upload"}
                                            </button>

                                            {/* Toggle Status */}
                                            <button
                                                onClick={() => handleToggleStatus(city)}
                                                disabled={actionLoading}
                                                className={`px-4 py-2 rounded-lg font-medium transition-all ${city.isActive
                                                    ? isDark
                                                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                                                        : "bg-yellow-500 hover:bg-yellow-600 text-white"
                                                    : isDark
                                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                                        : "bg-green-500 hover:bg-green-600 text-white"
                                                    } disabled:opacity-50`}
                                            >
                                                {city.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>

                                            {/* Delete Image */}
                                            {city.imageUrl && (
                                                <button
                                                    onClick={() => handleDeleteImage(city)}
                                                    disabled={actionLoading}
                                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${isDark
                                                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                                                        : "bg-orange-500 hover:bg-orange-600 text-white"
                                                        } disabled:opacity-50`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Modal */}
            {uploadModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full rounded-lg p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                                Upload Image for {selectedCity?.city}
                            </h2>
                            <button
                                onClick={() => {
                                    setUploadModalOpen(false);
                                    setSelectedCity(null);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                                className={`p-2 rounded-lg ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
                            >
                                <X size={24} className={isDark ? "text-gray-400" : "text-gray-600"} />
                            </button>
                        </div>

                        {/* File Input */}
                        <div className="mb-4">
                            <label
                                className={`block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${isDark
                                    ? "border-gray-600 hover:border-indigo-500 bg-gray-700"
                                    : "border-gray-300 hover:border-indigo-500 bg-gray-50"
                                    }`}
                            >
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Upload size={48} className={`mx-auto mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`} />
                                <p className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                    Click to upload image
                                </p>
                                <p className={`text-sm mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                                    JPG, PNG, WEBP (Max 5MB)
                                </p>
                            </label>
                        </div>

                        {/* Preview */}
                        {previewUrl && (
                            <div className="mb-4">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-full h-64 object-cover rounded-lg"
                                />
                                <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                    {selectedFile?.name}
                                </p>
                            </div>
                        )}

                        {/* Upload Button */}
                        <button
                            onClick={handleUploadImage}
                            disabled={!selectedFile || uploading}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${isDark
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-indigo-500 hover:bg-indigo-600 text-white"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={20} />
                                    Upload Image
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MostPopularCities;
