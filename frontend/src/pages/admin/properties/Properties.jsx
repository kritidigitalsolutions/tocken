import { useEffect, useState } from "react";
import { getProperties, getPropertyDetails, updatePropertyStatus, deleteProperty, makePremium, removePremium } from "../../../api/admin.property.api";
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
  Ban,
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

  // Load properties
  useEffect(() => {
    loadProperties();
  }, []);

  // Filter properties based on search and listing type
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

  const loadProperties = async () => {
    try {
      setLoading(true);
      const res = await getProperties({ page: 1, limit: 100 });
      console.log("API Response:", res);
      const properties = res?.data?.data || res?.data?.properties || [];
      console.log("Properties loaded:", properties);
      if (properties.length > 0) {
        console.log("First property images:", properties[0].images);
      }
      setData(properties);
      setFilteredData(properties);
    } catch (err) {
      console.error("ERROR LOADING PROPERTIES:", err);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
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
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, status }));
    } catch (err) {
      console.error("ERROR UPDATING STATUS:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMakePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await makePremium(selectedProperty._id, { planName: "Premium", durationInDays: 30, boostRank: 1 });
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, isPremium: true }));
    } catch (err) {
      console.error("ERROR MAKING PREMIUM:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await removePremium(selectedProperty._id);
      await loadProperties();
      setPropertyDetails(prev => ({ ...prev, isPremium: false }));
    } catch (err) {
      console.error("ERROR REMOVING PREMIUM:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProperty || !window.confirm("Are you sure you want to delete this property?")) return;
    setActionLoading(true);
    try {
      await deleteProperty(selectedProperty._id);
      await loadProperties();
      closeDetailPanel();
    } catch (err) {
      console.error("ERROR DELETING PROPERTY:", err);
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
              className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isDark 
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
              const count = tab.id === "ALL" ? data.length : data.filter(p => p.listingType === tab.id).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedListingType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? `bg-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/30`
                      : isDark 
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive 
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
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-800/50 ${
                      isSelected 
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
                            {property.isPremium && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              property.status === "ACTIVE" 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                                : property.status === "DRAFT"
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
                  <p className={`text-lg font-semibold ${
                    propertyDetails.status === "ACTIVE" ? 'text-green-500' :
                    propertyDetails.status === "DRAFT" ? 'text-yellow-500' :
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
                    </div>
                  </div>
                </div>
              )}

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
                {propertyDetails.isPremium ? (
                  <button
                    onClick={handleRemovePremium}
                    disabled={actionLoading}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isDark 
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
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isDark 
                        ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900' 
                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    Make Premium
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange("BLOCKED")}
                  disabled={actionLoading || propertyDetails.status === "BLOCKED"}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isDark 
                      ? 'bg-slate-700 text-orange-400 hover:bg-slate-600' 
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  <Ban className="w-4 h-4" />
                  Block
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isDark 
                      ? 'bg-red-900/50 text-red-400 hover:bg-red-900' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
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
