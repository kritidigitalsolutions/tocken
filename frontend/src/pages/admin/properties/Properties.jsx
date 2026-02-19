import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getProperties, getPropertiesWithBookmarks, getPropertyBookmarks, getPropertyDetails, updatePropertyStatus, deleteProperty, makePremium, removePremium } from "../../../api/admin.property.api";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import {
  Search,
  RefreshCw,
  Home,
  Key,
  Tag,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Crown,
  Trash2,
  X,
  ChevronRight,
  MessageCircle,
  Clock,
  Filter
} from "lucide-react";

const Properties = () => {
  const { isDark } = useTheme();

  // States
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedListingType, setSelectedListingType] = useState("ALL");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // New filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, rejected: 0, premium: 0 });

  // Listing type tabs with icons
  const listingTabs = [
    { id: "ALL", label: "ALL", icon: Filter, color: "indigo" },
    { id: "RENT", label: "Rent", icon: Key, color: "blue" },
    { id: "SELL", label: "Sell", icon: Tag, color: "green" },
    { id: "CO_LIVING", label: "Co-living", icon: Users, color: "purple" },
    { id: "PG", label: "PG", icon: Building2, color: "orange" }
  ];

  // Get icon for listing type
  const getListingIcon = (type) => {
    const tab = listingTabs.find(t => t.id === type);
    return tab ? tab.icon : Home;
  };

  // Get color for listing type
  const getListingColor = (type) => {
    const colors = {
      RENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
      SELL: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" },
      CO_LIVING: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
      PG: { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-600 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800" }
    };
    return colors[type] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" };
  };

  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 100 };
      
      // Always apply filters
      if (statusFilter !== 'all') params.status = statusFilter;
      if (timeFilter !== 'all') params.timeFilter = timeFilter;
      if (sortBy) params.sortBy = sortBy;
      
      // Use appropriate API based on whether we want bookmark data
      const res = showBookmarks 
        ? await getPropertiesWithBookmarks(params)
        : await getProperties(params);
        
      console.log("API Response:", res);
      const properties = res?.data?.data || res?.data?.properties || [];
      console.log("Properties loaded:", properties);
      if (properties.length > 0) {
        console.log("First property images:", properties[0].images);
      }
      
      setData(properties);
      
      // Update stats if available
      if (res?.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("ERROR LOADING PROPERTIES:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, timeFilter, sortBy, showBookmarks]);

  // Load properties whenever filters change
  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Filter properties based on search and listing type (for client-side filtering)
  useEffect(() => {
    let filtered = data;

    // Filter by listing type
    if (selectedListingType !== "ALL") {
      filtered = filtered.filter(p => p.listingType === selectedListingType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.location?.city?.toLowerCase().includes(query) ||
        p.location?.locality?.toLowerCase().includes(query) ||
        p.propertyCategory?.toLowerCase().includes(query) ||
        p.propertyType?.toLowerCase().includes(query) ||
        p.listingType?.toLowerCase().includes(query) ||
        p.userId?.name?.toLowerCase().includes(query) ||
        p.userId?.phone?.includes(query)
      );
    }

    setFilteredData(filtered);
  }, [selectedListingType, searchQuery, data]);

  // View bookmark details for a property
  const [bookmarkDetails, setBookmarkDetails] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const handleViewBookmarks = async (propertyId) => {
    setBookmarkLoading(true);
    try {
      const res = await getPropertyBookmarks(propertyId);
      setBookmarkDetails(res.data.data);
      toast.success(`Found ${res.data.data.bookmarkCount} bookmarks`);
    } catch (err) {
      console.error("ERROR LOADING BOOKMARKS:", err);
      toast.error("Failed to load bookmark details");
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Load property details
  const handlePropertyClick = async (property) => {
    setSelectedProperty(property);
    setDetailsLoading(true);
    try {
      const res = await getPropertyDetails(property._id);
      console.log("=== FULL API RESPONSE ===");
      console.log("res:", res);
      console.log("res.data:", res?.data);
      console.log("res.data.property:", res?.data?.property);
      console.log("res.data.property.images:", res?.data?.property?.images);

      const propertyData = res?.data?.property || res?.data;
      console.log("propertyData to set:", propertyData);
      console.log("propertyData.images:", propertyData?.images);

      setPropertyDetails(propertyData);
    } catch (err) {
      console.error("ERROR LOADING PROPERTY DETAILS:", err);
      setPropertyDetails(property);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close detail panel
  const closeDetailPanel = () => {
    setSelectedProperty(null);
    setPropertyDetails(null);
  };

  // Admin actions
  const handleStatusChange = async (status) => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await updatePropertyStatus(selectedProperty._id, status);
      toast.success(`Property status changed to ${status}`);
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, status }));
    } catch (err) {
      console.error("ERROR UPDATING STATUS:", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMakePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await makePremium(selectedProperty._id, { planName: "Premium", durationInDays: 30, boostRank: 1 });
      toast.success("Property marked as Premium");
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, isPremium: true }));
    } catch (err) {
      console.error("ERROR MAKING PREMIUM:", err);
      toast.error("Failed to make premium");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await removePremium(selectedProperty._id);
      toast.success("Premium removed");
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, isPremium: false }));
    } catch (err) {
      console.error("ERROR REMOVING PREMIUM:", err);
      toast.error("Failed to remove premium");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty || !window.confirm("⚠️ Are you sure you want to PERMANENTLY delete this property? This action cannot be undone and will remove all property data, images, and related leads.")) return;
    setActionLoading(true);
    try {
      await deleteProperty(selectedProperty._id);
      toast.success("Property permanently deleted");
      await loadProperties();
      closeDetailPanel();
    } catch (err) {
      console.error("ERROR DELETING PROPERTY:", err);
      toast.error("Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  // Format price
  const formatPrice = (property) => {
    const price = property?.pricing?.rent?.rentAmount ||
      property?.pricing?.sell?.expectedPrice ||
      property?.pricing?.salePrice;
    if (!price) return "N/A";
    return `₹${price.toLocaleString()}`;
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) return <Loader />;

  return (
    <div className={`h-[calc(100vh-100px)] flex ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#1f2937',
            border: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`,
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            style: {
              background: isDark ? '#064e3b' : '#ecfdf5',
              color: isDark ? '#86efac' : '#065f46',
              border: `1px solid ${isDark ? '#047857' : '#6ee7b7'}`,
            },
            iconTheme: {
              primary: isDark ? '#10b981' : '#10b981',
              secondary: isDark ? '#064e3b' : '#ecfdf5',
            },
          },
          error: {
            style: {
              background: isDark ? '#7f1d1d' : '#fef2f2',
              color: isDark ? '#fca5a5' : '#991b1b',
              border: `1px solid ${isDark ? '#dc2626' : '#fecaca'}`,
            },
            iconTheme: {
              primary: '#dc2626',
              secondary: isDark ? '#7f1d1d' : '#fef2f2',
            },
          },
        }}
      />

      {/* LEFT PANEL - Property List */}
      <div className={`w-full ${selectedProperty ? 'lg:w-[400px]' : ''} flex flex-col border-r ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>

        {/* Search Bar */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search by location, type, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
            />
            <button
              onClick={loadProperties}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 transition ${isDark ? 'text-slate-400' : 'text-gray-400'}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Listing Type Tabs */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {listingTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedListingType === tab.id;
              const count = tab.id === "ALL" ? filteredData.length : filteredData.filter(p => p.listingType === tab.id).length;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedListingType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${isActive
                      ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/30`
                      : isDark
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive
                      ? 'bg-white/20'
                      : isDark ? 'bg-slate-700' : 'bg-gray-100'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="space-y-3">
            {/* Status Filter Row */}
            <div className="flex gap-2 text-sm">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                  }`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="active">Active ({stats.active})</option>
                <option value="rejected">Rejected ({stats.rejected})</option>
              </select>

              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                  }`}
              >
                <option value="all">All Time</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                  }`}
              >
                <option value="recent">Recent First</option>
                <option value="premium">Premium First</option>
                <option value="score">High Score First</option>
                {showBookmarks && <option value="bookmarks">Most Bookmarked</option>}
              </select>
            </div>

            {/* Toggle Bookmark View */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Show Bookmark Count
              </span>
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showBookmarks
                    ? 'bg-indigo-600'
                    : isDark ? 'bg-slate-700' : 'bg-gray-200'
                  }`}
              >
                <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${showBookmarks ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex gap-4 text-xs">
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Total: <span className="font-medium">{stats.total}</span>
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Premium: <span className="font-medium text-yellow-500">{stats.premium}</span>
              </span>
              <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                Showing: <span className="font-medium">{filteredData.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Property List */}
        <div className="flex-1 overflow-y-auto">
          {filteredData.length > 0 ? (
            <div className="divide-y divide-slate-700/50">
              {filteredData.map((property) => {
                const Icon = getListingIcon(property.listingType);
                const colors = getListingColor(property.listingType);
                const isSelected = selectedProperty?._id === property._id;

                // Get primary image or first image
                const getPrimaryImage = () => {
                  if (!property.images || property.images.length === 0) return null;
                  const primaryImg = property.images.find(img => img?.isPrimary);
                  const firstImg = primaryImg || property.images[0];
                  return typeof firstImg === 'string' ? firstImg : firstImg?.url;
                };
                const thumbnailUrl = getPrimaryImage();

                return (
                  <div
                    key={property._id}
                    onClick={() => handlePropertyClick(property)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-800/50 ${isSelected
                        ? isDark ? 'bg-slate-800 border-l-4 border-indigo-500' : 'bg-indigo-50 border-l-4 border-indigo-500'
                        : ''
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail or Icon */}
                      {thumbnailUrl ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} ${colors.border} border`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {property.propertyCategory || property.listingType}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatTimeAgo(property.createdAt)}
                          </span>
                        </div>
                        <div className="mb-1">
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            ID: {property._id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span className={`text-sm truncate ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            {property.location?.locality || property.location?.city || "Location not specified"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {formatPrice(property)}
                          </span>
                          <div className="flex items-center gap-2">
                            {showBookmarks && property.bookmarkCount !== undefined && (
                              <span className={`text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400 flex items-center gap-1`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                </svg>
                                {property.bookmarkCount}
                              </span>
                            )}
                            {property.isPremium && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${property.status === "ACTIVE"
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                : property.status === "PENDING"
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                              }`}>
                              {property.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <Home className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No properties found
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {searchQuery ? "Try a different search" : "Properties will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Property Details */}
      {selectedProperty && (
        <div className={`hidden lg:flex flex-1 flex-col ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>

          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Property Details
            </h2>
            <button
              onClick={closeDetailPanel}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {detailsLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader />
            </div>
          ) : propertyDetails ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">

              {/* Property Header Card */}
              <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getListingColor(propertyDetails.listingType).bg}`}>
                    {(() => {
                      const Icon = getListingIcon(propertyDetails.listingType);
                      return <Icon className={`w-8 h-8 ${getListingColor(propertyDetails.listingType).text}`} />;
                    })()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getListingColor(propertyDetails.listingType).bg} ${getListingColor(propertyDetails.listingType).text}`}>
                        {propertyDetails.listingType}
                      </span>
                      {propertyDetails.propertyType && (
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                          {propertyDetails.propertyType}
                        </span>
                      )}
                      {propertyDetails.isPremium && (
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 flex items-center gap-1">
                          <Crown className="w-3 h-3" /> Premium
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {propertyDetails.propertyCategory || propertyDetails.listingType}
                    </h3>

                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        {[propertyDetails.location?.locality, propertyDetails.location?.city].filter(Boolean).join(", ") || "Location not specified"}
                      </span>
                    </div>

                    <div className={`text-2xl font-bold mt-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {formatPrice(propertyDetails)}
                      {propertyDetails.listingType === "RENT" && <span className="text-sm font-normal opacity-60">/month</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Current Status</p>
                  <p className={`text-lg font-semibold ${propertyDetails.status === "ACTIVE" ? 'text-green-500' :
                      propertyDetails.status === "PENDING" ? 'text-yellow-500' :
                        propertyDetails.status === "REJECTED" ? 'text-red-500' : 'text-gray-500'
                    }`}>
                    {propertyDetails.status}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Listing Score</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-24 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${propertyDetails.listingScore || 0}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {propertyDetails.listingScore || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Owner Info */}
              {propertyDetails.userId && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Owner Details</h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                      <span className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {propertyDetails.userId?.name?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {propertyDetails.userId?.name || "Unknown User"}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {propertyDetails.userId?.phone && (
                          <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            <Phone className="w-3 h-3" /> {propertyDetails.userId.phone}
                          </span>
                        )}
                        {propertyDetails.userId?.email && (
                          <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            <Mail className="w-3 h-3" /> {propertyDetails.userId.email}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          User ID: {propertyDetails.userId?._id || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property ID Display */}
              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Key className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Property ID</span>
                </div>
                <p className={`text-sm font-mono font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  {propertyDetails._id}
                </p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Created</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(propertyDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Updated</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {new Date(propertyDetails.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {propertyDetails.description && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Description</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {propertyDetails.description}
                  </p>
                </div>
              )}

              {/* ===== DYNAMIC PROPERTY TYPE DETAILS ===== */}

              {/* RESIDENTIAL Details */}
              {propertyDetails.residentialDetails && (propertyDetails.listingType === "RENT" || propertyDetails.listingType === "SELL") && propertyDetails.propertyType === "RESIDENTIAL" && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <Home className="w-4 h-4" /> Residential Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {propertyDetails.residentialDetails.bhkType && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>BHK Type</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.bhkType}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.bathrooms && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Bathrooms</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.bathrooms}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.balconies && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Balconies</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.balconies}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.facing && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Facing</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.facing}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.flooring && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Flooring</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.flooring}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.ownership && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Ownership</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.ownership}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.totalFloors && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total Floors</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.totalFloors}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.yourFloor && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Your Floor</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.yourFloor}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.constructionStatus && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Construction Status</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.constructionStatus}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.ageOfProperty && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Age of Property</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.ageOfProperty}</p>
                      </div>
                    )}
                    {propertyDetails.residentialDetails.availableFrom && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Available From</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.availableFrom}</p>
                      </div>
                    )}
                  </div>

                  {/* Furnishing */}
                  {propertyDetails.residentialDetails.furnishing?.type && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Furnishing</p>
                      <span className={`px-2 py-1 rounded text-sm ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                        {propertyDetails.residentialDetails.furnishing.type}
                      </span>
                      {propertyDetails.residentialDetails.furnishing.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {propertyDetails.residentialDetails.furnishing.amenities.map((a, i) => (
                            <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                              {a.name} {a.quantity && `(${a.quantity})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Area Details */}
                  {propertyDetails.residentialDetails.area && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Area</p>
                      <div className="flex gap-4">
                        {propertyDetails.residentialDetails.area.builtUp?.value && (
                          <div>
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Built-up: {propertyDetails.residentialDetails.area.builtUp.value} {propertyDetails.residentialDetails.area.builtUp.unit}
                            </span>
                          </div>
                        )}
                        {propertyDetails.residentialDetails.area.carpet?.value && (
                          <div>
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Carpet: {propertyDetails.residentialDetails.area.carpet.value} {propertyDetails.residentialDetails.area.carpet.unit}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Preferred Tenants */}
                  {propertyDetails.residentialDetails.preferredTenants?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Preferred Tenants</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.residentialDetails.preferredTenants.map((t, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* COMMERCIAL Details */}
              {propertyDetails.commercialDetails && propertyDetails.propertyType === "COMMERCIAL" && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <Building2 className="w-4 h-4" /> Commercial Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {propertyDetails.commercialDetails.propertyType && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Property Type</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.propertyType}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.constructionStatus && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Construction Status</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.constructionStatus}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.washrooms && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Washrooms</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.washrooms}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.locationHub && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Location Hub</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.locationHub}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.zoneType && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Zone Type</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.zoneType}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.propertyCondition && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Condition</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.propertyCondition}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.totalFloors && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total Floors</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.totalFloors}</p>
                      </div>
                    )}
                    {propertyDetails.commercialDetails.yourFloor && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Your Floor</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.yourFloor}</p>
                      </div>
                    )}
                  </div>

                  {/* Office Setup */}
                  {propertyDetails.commercialDetails.officeSetup && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Office Setup</p>
                      <div className="flex gap-4">
                        {propertyDetails.commercialDetails.officeSetup.cabins && (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Cabins: {propertyDetails.commercialDetails.officeSetup.cabins}
                          </span>
                        )}
                        {propertyDetails.commercialDetails.officeSetup.meetingRooms && (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Meeting Rooms: {propertyDetails.commercialDetails.officeSetup.meetingRooms}
                          </span>
                        )}
                        {propertyDetails.commercialDetails.officeSetup.seats && (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Seats: {propertyDetails.commercialDetails.officeSetup.seats}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suitable For */}
                  {propertyDetails.commercialDetails.suitableFor?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Suitable For</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.commercialDetails.suitableFor.map((s, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fire Safety */}
                  {propertyDetails.commercialDetails.fireSafety?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Fire Safety</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.commercialDetails.fireSafety.map((f, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PG Details */}
              {propertyDetails.pgDetails && propertyDetails.listingType === "PG" && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <Building2 className="w-4 h-4" /> PG Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {propertyDetails.pgDetails.pgName && (
                      <div className={`p-3 rounded-lg col-span-2 ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>PG Name</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.pgName}</p>
                      </div>
                    )}
                    {propertyDetails.pgDetails.pgFor && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>PG For</p>
                        <p className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.pgFor}</p>
                      </div>
                    )}
                    {propertyDetails.pgDetails.managedBy && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Managed By</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.managedBy}</p>
                      </div>
                    )}
                    {propertyDetails.pgDetails.totalFloors && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total Floors</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.totalFloors}</p>
                      </div>
                    )}
                    {propertyDetails.pgDetails.noticePeriod && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Notice Period</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.noticePeriod} days</p>
                      </div>
                    )}
                    {propertyDetails.pgDetails.availableFrom && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Available From</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.availableFrom}</p>
                      </div>
                    )}
                  </div>

                  {/* Room Types */}
                  {propertyDetails.pgDetails.roomTypes?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Room Types</p>
                      <div className="space-y-2">
                        {propertyDetails.pgDetails.roomTypes.map((room, i) => (
                          <div key={i} className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-slate-600/50' : 'bg-gray-50'}`}>
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{room.sharingType}</span>
                            <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>₹{room.rentAmount?.toLocaleString()}/month</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Food */}
                  {propertyDetails.pgDetails.food?.included && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Food Included</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.pgDetails.food.meals?.map((meal, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
                            {meal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Suited For */}
                  {propertyDetails.pgDetails.bestSuitedFor?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Best Suited For</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.pgDetails.bestSuitedFor.map((s, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Included Services */}
                  {propertyDetails.pgDetails.includedServices?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Included Services</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.pgDetails.includedServices.map((s, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CO-LIVING Details */}
              {propertyDetails.coLivingDetails && propertyDetails.listingType === "CO_LIVING" && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <Users className="w-4 h-4" /> Co-Living Details
                  </h4>

                  {/* Profile Section */}
                  <div className="flex items-center gap-4 mb-4">
                    {propertyDetails.coLivingDetails.profileImage && (
                      <img
                        src={propertyDetails.coLivingDetails.profileImage}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      {propertyDetails.coLivingDetails.name && (
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.name}</p>
                      )}
                      {propertyDetails.coLivingDetails.gender && (
                        <p className={`text-sm capitalize ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{propertyDetails.coLivingDetails.gender}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {propertyDetails.coLivingDetails.occupation && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Occupation</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.occupation}</p>
                      </div>
                    )}
                    {propertyDetails.coLivingDetails.bhk && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>BHK</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.bhk}</p>
                      </div>
                    )}
                    {propertyDetails.coLivingDetails.lookingToShiftBy && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Looking to Shift By</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.lookingToShiftBy}</p>
                      </div>
                    )}
                    {propertyDetails.coLivingDetails.partnerGender && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Partner Gender</p>
                        <p className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.partnerGender}</p>
                      </div>
                    )}
                  </div>

                  {/* Budget Range */}
                  {propertyDetails.coLivingDetails.budgetRange && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Budget Range</p>
                      <p className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        ₹{propertyDetails.coLivingDetails.budgetRange.min?.toLocaleString()} - ₹{propertyDetails.coLivingDetails.budgetRange.max?.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Languages & Hobbies */}
                  {propertyDetails.coLivingDetails.languages && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Languages</p>
                      <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.coLivingDetails.languages}</p>
                    </div>
                  )}

                  {/* Preferences */}
                  {propertyDetails.coLivingDetails.preferences?.length > 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Preferences</p>
                      <div className="flex flex-wrap gap-2">
                        {propertyDetails.coLivingDetails.preferences.map((p, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Links */}
                  {(propertyDetails.coLivingDetails.instagramLink || propertyDetails.coLivingDetails.FacebookLink || propertyDetails.coLivingDetails.LinkedInLink) && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Social Links</p>
                      <div className="flex gap-2">
                        {propertyDetails.coLivingDetails.instagramLink && (
                          <a href={propertyDetails.coLivingDetails.instagramLink} target="_blank" rel="noopener noreferrer" className="text-pink-500 text-sm hover:underline">Instagram</a>
                        )}
                        {propertyDetails.coLivingDetails.FacebookLink && (
                          <a href={propertyDetails.coLivingDetails.FacebookLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">Facebook</a>
                        )}
                        {propertyDetails.coLivingDetails.LinkedInLink && (
                          <a href={propertyDetails.coLivingDetails.LinkedInLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">LinkedIn</a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRICING Details */}
              {propertyDetails.pricing && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    <Tag className="w-4 h-4" /> Pricing Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {propertyDetails.pricing.rent?.rentAmount && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Rent Amount</p>
                        <p className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>₹{propertyDetails.pricing.rent.rentAmount.toLocaleString()}/month</p>
                      </div>
                    )}
                    {propertyDetails.pricing.sell?.expectedPrice && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Expected Price</p>
                        <p className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>₹{propertyDetails.pricing.sell.expectedPrice.toLocaleString()}</p>
                      </div>
                    )}
                    {propertyDetails.pricing.sell?.pricePerSqrFt && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Price/Sq.Ft</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{propertyDetails.pricing.sell.pricePerSqrFt.toLocaleString()}</p>
                      </div>
                    )}
                    {propertyDetails.pricing.securityDeposit?.amount && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Security Deposit</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>₹{propertyDetails.pricing.securityDeposit.amount.toLocaleString()}</p>
                      </div>
                    )}
                    {propertyDetails.pricing.lockInPeriod?.month && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Lock-in Period</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pricing.lockInPeriod.month} months</p>
                      </div>
                    )}
                    {propertyDetails.pricing.noticePeriod && (
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Notice Period</p>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pricing.noticePeriod} days</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Charges */}
                  {propertyDetails.pricing.addMore && (
                    <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Additional Charges</p>
                      <div className="flex flex-wrap gap-3">
                        {propertyDetails.pricing.addMore.maintenanceCharge && (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Maintenance: ₹{propertyDetails.pricing.addMore.maintenanceCharge.toLocaleString()}
                          </span>
                        )}
                        {propertyDetails.pricing.addMore.bookingAmount && (
                          <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Booking: ₹{propertyDetails.pricing.addMore.bookingAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Negotiable & Other Flags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {propertyDetails.pricing.rent?.isNegotiable && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                        Negotiable
                      </span>
                    )}
                    {propertyDetails.pricing.sell?.isNegotiable && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                        Negotiable
                      </span>
                    )}
                    {propertyDetails.pricing.rent?.isElectricity && (
                      <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`}>
                        Electricity Included
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Images - Debug Section */}
              {(() => {
                console.log("=== IMAGE DEBUG ===");
                console.log("propertyDetails:", propertyDetails);
                console.log("propertyDetails.images:", propertyDetails?.images);
                console.log("images length:", propertyDetails?.images?.length);
                console.log("images type:", typeof propertyDetails?.images);
                if (propertyDetails?.images && propertyDetails.images.length > 0) {
                  console.log("First image:", propertyDetails.images[0]);
                  console.log("First image type:", typeof propertyDetails.images[0]);
                }
                return null;
              })()}

              {/* Images */}
              {propertyDetails.images && propertyDetails.images.length > 0 ? (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Photos ({propertyDetails.images.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {propertyDetails.images.slice(0, 6).map((img, idx) => {
                      // Handle both object format {url, publicId} and string format
                      const imageUrl = typeof img === 'string' ? img : img?.url;
                      const isPrimary = typeof img === 'object' && img?.isPrimary;

                      console.log(`Image ${idx}:`, img, "URL:", imageUrl);

                      return (
                        <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log("Image load error for:", imageUrl);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => console.log("Image loaded:", imageUrl)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No image</span>
                            </div>
                          )}
                          {isPrimary && (
                            <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Photos</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                    No images available !
                    {/* (images: {JSON.stringify(propertyDetails?.images)}) */}
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          {propertyDetails && (
            <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={actionLoading || propertyDetails.status === "ACTIVE"}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange("REJECTED")}
                  disabled={actionLoading || propertyDetails.status === "REJECTED"}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleViewBookmarks(propertyDetails._id)}
                  disabled={bookmarkLoading}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${isDark
                      ? 'bg-purple-900/50 text-purple-400 hover:bg-purple-900'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                  </svg>
                  {bookmarkLoading ? 'Loading...' : 'View Bookmarks'}
                </button>
                {propertyDetails.isPremium ? (
                  <button
                    onClick={handleRemovePremium}
                    disabled={actionLoading}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${isDark
                        ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                  >
                    <Crown className="w-4 h-4" />
                    Remove Premium
                  </button>
                ) : (
                  <button
                    onClick={handleMakePremium}
                    disabled={actionLoading}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${isDark
                        ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900'
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                  >
                    <Crown className="w-4 h-4" />
                    Make Premium
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${isDark
                      ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {actionLoading ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>

              {/* Bookmark Details */}
              {bookmarkDetails && (
                <div className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-purple-50'}`}>
                  <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Bookmarked by {bookmarkDetails.bookmarkCount} users:
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {bookmarkDetails.bookmarkedBy.map((user) => (
                      <div key={user._id} className={`flex items-center justify-between p-2 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.name}
                          </span>
                          <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                            {user.userType}
                          </span>
                        </div>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {user.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setBookmarkDetails(null)}
                    className={`mt-2 text-xs ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition`}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State for Right Panel */}
      {!selectedProperty && (
        <div className={`hidden lg:flex flex-1 flex-col items-center justify-center ${isDark ? 'bg-slate-800/30' : 'bg-gray-50'}`}>
          <div className="text-center max-w-md p-8">
            <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}>
              <MessageCircle className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Click Property To View
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Select a property from the list to view details and manage it
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
