import { useEffect, useState } from "react";
import { getAllBookmarks, getBookmarkStats } from "../../../api/admin.bookmark.api";
import Loader from "../../../components/common/Loader";
import { Bookmark, Eye, X, User, Phone, Calendar, Home } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { isDark } = useTheme();

  const categories = ["All", "RESIDENTIAL", "COMMERCIAL", "PG", "Co-Living", "Plot/Land"];

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookmarksRes, statsRes] = await Promise.all([
        getAllBookmarks({ category: selectedCategory }),
        getBookmarkStats()
      ]);
      setBookmarks(bookmarksRes?.data?.bookmarks || []);
      setStats(statsRes?.data?.stats || null);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const openPropertyModal = (property) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProperty(null);
  };

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Bookmark className="text-indigo-500" size={32} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>All Bookmarked Properties</h1>
        </div>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>View all properties bookmarked by users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Bookmarks</p>
          <p className="text-3xl font-bold text-indigo-400 mt-2">{stats?.total || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Users with Bookmarks</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{stats?.usersWithBookmarks || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Residential</p>
          <p className="text-3xl font-bold text-blue-400 mt-2">{stats?.byCategory?.RESIDENTIAL || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Commercial</p>
          <p className="text-3xl font-bold text-orange-400 mt-2">{stats?.byCategory?.COMMERCIAL || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>PG/Co-Living</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">
            {(stats?.byCategory?.PG || 0) + (stats?.byCategory?.["Co-Living"] || 0)}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat
                ? "bg-indigo-600 text-white"
                : isDark
                  ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                  : "bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {bookmarks && bookmarks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>User</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Phone</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Property Type</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Listing Type</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Category</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Location</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Price</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Bookmark Date</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookmarks.map((item) => (
                  <tr key={item._id} className={`border-b transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <User size={14} className="text-white" />
                        </div>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.user?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        <Phone size={14} className="text-green-400" />
                        {item.user?.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${isDark ? 'bg-cyan-900 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                        {item.property?.propertyType || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.property?.listingType === "RENT"
                          ? isDark ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-700"
                          : item.property?.listingType === "SELL"
                            ? isDark ? "bg-purple-900 text-purple-300" : "bg-purple-100 text-purple-700"
                            : item.property?.listingType === "LEASE"
                              ? isDark ? "bg-pink-900 text-pink-300" : "bg-pink-100 text-pink-700"
                              : isDark ? "bg-indigo-900 text-indigo-300" : "bg-indigo-100 text-indigo-700"
                        }`}>
                        {item.property?.listingType || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${item.property?.propertyType === "RESIDENTIAL"
                          ? isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
                          : item.property?.propertyType === "COMMERCIAL"
                            ? isDark ? "bg-orange-900 text-orange-300" : "bg-orange-100 text-orange-700"
                            : item.property?.propertyType === "PG"
                              ? isDark ? "bg-yellow-900 text-yellow-300" : "bg-yellow-100 text-yellow-700"
                              : item.property?.propertyType === "Co-Living"
                                ? isDark ? "bg-teal-900 text-teal-300" : "bg-teal-100 text-teal-700"
                                : isDark ? "bg-rose-900 text-rose-300" : "bg-rose-100 text-rose-700"
                        }`}>
                        {item.property?.propertyType || "N/A"}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <div>{item.property?.location?.city || "N/A"}</div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{item.property?.location?.locality || ""}</div>
                    </td>
                    <td className={`px-6 py-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₹{item.property?.pricing?.rentAmount?.toLocaleString() || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <Calendar size={14} />
                        {item.property?.createdAt
                          ? new Date(item.property.createdAt).toLocaleDateString()
                          : "N/A"
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openPropertyModal(item.property)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bookmark size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No bookmarks found</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Users haven't bookmarked any properties yet</p>
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      {showModal && selectedProperty && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${isDark ? 'bg-black/70' : 'bg-black/50'}`}>
          <div className={`rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-xl'}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Home className="text-indigo-500" size={24} />
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Property Details</h2>
              </div>
              <button
                onClick={closeModal}
                className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
              >
                <X className={isDark ? 'text-slate-400' : 'text-gray-500'} size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Property Images */}
              {selectedProperty.photos && selectedProperty.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedProperty.photos.slice(0, 6).map((photo, idx) => (
                    <img
                      key={idx}
                      src={photo.url}
                      alt={`Property ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Listing Type</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProperty.listingType}</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Property Type</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProperty.propertyType}</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Category</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProperty.propertyCategory}</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${selectedProperty.status === "ACTIVE"
                      ? isDark ? "bg-green-900 text-green-300" : "bg-green-100 text-green-700"
                      : isDark ? "bg-red-900 text-red-300" : "bg-red-100 text-red-700"
                    }`}>
                    {selectedProperty.status}
                  </span>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Price</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₹{selectedProperty.pricing?.rentAmount?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Deposit</p>
                  <p className={`font-semibold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    ₹{selectedProperty.pricing?.depositAmount?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Location</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedProperty.location?.society && `${selectedProperty.location.society}, `}
                  {selectedProperty.location?.locality && `${selectedProperty.location.locality}, `}
                  {selectedProperty.location?.city || "N/A"}
                </p>
              </div>

              {/* Residential Property Details */}
              {selectedProperty.residentialDetails && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Residential Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.residentialDetails.bhkType && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>BHK Type</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.bhkType}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.bathrooms && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Bathrooms</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.bathrooms}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.balconies && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Balconies</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.balconies}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.furnishType && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Furnishing</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.furnishType}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.totalFloors && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Total Floors</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.totalFloors}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.yourFloor && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Your Floor</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.yourFloor}</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.area?.builtUp && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Built Up Area</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.area.builtUp} sq.ft</p>
                      </div>
                    )}
                    {selectedProperty.residentialDetails.facing && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Facing</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.residentialDetails.facing}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Commercial Property Details */}
              {selectedProperty.commercialDetails && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Commercial Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.commercialDetails.constructionStatus && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Construction Status</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.commercialDetails.constructionStatus}</p>
                      </div>
                    )}
                    {selectedProperty.commercialDetails.washrooms && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Washrooms</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.commercialDetails.washrooms}</p>
                      </div>
                    )}
                    {selectedProperty.commercialDetails.ownership && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Ownership</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.commercialDetails.ownership}</p>
                      </div>
                    )}
                    {selectedProperty.commercialDetails.area?.builtUp && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Built Up Area</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.commercialDetails.area.builtUp} sq.ft</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PG Details */}
              {selectedProperty.pgDetails && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>PG Details</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.pgDetails.pgName && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>PG Name</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.pgDetails.pgName}</p>
                      </div>
                    )}
                    {selectedProperty.pgDetails.pgFor && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>PG For</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.pgDetails.pgFor}</p>
                      </div>
                    )}
                    {selectedProperty.pgDetails.roomSharingType && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Room Type</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.pgDetails.roomSharingType}</p>
                      </div>
                    )}
                    {selectedProperty.pgDetails.furnishType && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Furnishing</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.pgDetails.furnishType}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Co-Living Details */}
              {selectedProperty.coLivingDetails && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Co-Living Profile</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedProperty.coLivingDetails.name && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Name</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.coLivingDetails.name}</p>
                      </div>
                    )}
                    {selectedProperty.coLivingDetails.gender && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Gender</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.coLivingDetails.gender}</p>
                      </div>
                    )}
                    {selectedProperty.coLivingDetails.occupation && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Occupation</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.coLivingDetails.occupation}</p>
                      </div>
                    )}
                    {selectedProperty.coLivingDetails.lookingFor && (
                      <div>
                        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Looking For</p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>{selectedProperty.coLivingDetails.lookingFor}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProperty.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact */}
              {selectedProperty.contact && (
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                  <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Contact</p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedProperty.contact.phoneNumber || "N/A"}
                    {selectedProperty.contact.isPhonePrivate && (
                      <span className={`text-xs ml-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>(Private)</span>
                    )}
                  </p>
                </div>
              )}

              {/* Listing Score */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Listing Score</p>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 rounded-full h-3 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all"
                      style={{ width: `${selectedProperty.listingScore || 0}%` }}
                    />
                  </div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProperty.listingScore || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookmarks;
