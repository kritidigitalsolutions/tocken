import { useEffect, useState } from "react";
import { fetchUsers, updateUser, deleteUser, togglePhonePrivacy } from "../../../api/user.api";
import { getUserProperties, updatePropertyStatus, getPropertyDetails, makePremium, removePremium, deleteProperty } from "../../../api/admin.property.api";
import { getUserProjects, updateProjectStatus, toggleFeatured as toggleProjectFeatured, deleteProject as deleteProjectAdmin } from "../../../api/admin.project.api";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import toast, { Toaster } from "react-hot-toast";
import {
  Users as UsersIcon,
  User,
  Phone,
  PhoneOff,
  Shield,
  ShieldOff,
  Trash2,
  Crown,
  Building2,
  X,
  Search,
  RefreshCw,
  Filter,
  ChevronRight,
  Calendar,
  Clock,
  Home,
  MessageCircle,
  Eye,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Image as ImageIcon,
  Key,
  Tag,
  Star,
  FolderKanban,
} from "lucide-react";

const defaultAvatar = "https://www.pngall.com/wp-content/uploads/15/User-PNG-Images-HD.png";

const Users = () => {
  const { isDark } = useTheme();

  // States
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // New states for properties view
  const [viewMode, setViewMode] = useState("details"); // "details" | "properties" | "projects"
  const [userProperties, setUserProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesStats, setPropertiesStats] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);

  // New states for projects view
  const [userProjects, setUserProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [userProjectsStats, setUserProjectsStats] = useState(null);

  // User type filter tabs
  const userTypeTabs = [
    { id: "All", label: "All Users", icon: Filter, color: "indigo" },
    { id: "AGENT", label: "Agents", icon: UsersIcon, color: "purple" },
    { id: "BUILDER", label: "Builders", icon: Building2, color: "blue" },
    { id: "INDIVIDUAL", label: "Individual", icon: User, color: "green" }
  ];

  // Status filter tabs
  const statusTabs = [
    { id: "ALL", label: "All", color: "slate" },
    { id: "ACTIVE", label: "Active", color: "green" },
    { id: "BLOCKED", label: "Blocked", color: "red" },
    { id: "PREMIUM", label: "Premium", color: "yellow" }
  ];

  // Get user type color
  const getUserTypeColor = (type) => {
    const colors = {
      AGENT: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
      BUILDER: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400", border: "border-blue-200 dark:border-blue-800" },
      INDIVIDUAL: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400", border: "border-green-200 dark:border-green-800" }
    };
    return colors[type] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" };
  };

  // Load users
  useEffect(() => {
    loadData();
  }, []);

  // Filter users based on search, type and status
  useEffect(() => {
    let filtered = users;

    // Filter by user type
    if (selectedUserType !== "All") {
      filtered = filtered.filter(u => u.userType === selectedUserType);
    }

    // Filter by status
    if (selectedStatus === "ACTIVE") {
      filtered = filtered.filter(u => !u.isBlocked);
    } else if (selectedStatus === "BLOCKED") {
      filtered = filtered.filter(u => u.isBlocked);
    } else if (selectedStatus === "PREMIUM") {
      filtered = filtered.filter(u => u.activePlan);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query) ||
        u.phone?.includes(query) ||
        u.userType?.toLowerCase().includes(query) ||
        u.gstNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [selectedUserType, selectedStatus, searchQuery, users]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers({ userType: "All" });
      const allUsers = res?.data?.users || [];
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      setStats(res?.data?.stats || null);
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error("Failed to load users");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle user click
  const handleUserClick = (user) => {
    setSelectedUser(user);
    if (viewMode === "properties") {
      loadUserProperties(user._id);
    }
    if (viewMode === "projects") {
      loadUserProjects(user._id);
    }
  };

  // Close detail panel
  const closeDetailPanel = () => {
    setSelectedUser(null);
    setViewMode("details");
    setUserProperties([]);
    setSelectedProperty(null);
    setPropertyModalOpen(false);
    setUserProjects([]);
    setUserProjectsStats(null);
  };

  // Load user properties
  const loadUserProperties = async (userId) => {
    try {
      setPropertiesLoading(true);
      const res = await getUserProperties(userId);
      setUserProperties(res?.data?.properties || []);
      setPropertiesStats(res?.data?.stats || null);
    } catch (error) {
      console.error("Error loading user properties:", error);
      toast.error("Failed to load properties");
      setUserProperties([]);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Handle view properties click
  const handleViewProperties = async () => {
    if (!selectedUser) return;
    setViewMode("properties");
    await loadUserProperties(selectedUser._id);
  };

  // Load user projects
  const loadUserProjects = async (userId) => {
    try {
      setProjectsLoading(true);
      const res = await getUserProjects(userId);
      setUserProjects(res?.data?.data?.projects || []);
      setUserProjectsStats(res?.data?.data?.stats || null);
    } catch (error) {
      toast.error("Failed to load projects");
      setUserProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Handle view projects click
  const handleViewProjects = async () => {
    if (!selectedUser) return;
    setViewMode("projects");
    await loadUserProjects(selectedUser._id);
  };

  // Handle project status change
  const handleProjectStatusChange = async (projectId, newStatus) => {
    setActionLoading(true);
    try {
      await updateProjectStatus(projectId, newStatus);
      const label = newStatus === "ACTIVE" ? "approved" : newStatus === "REJECTED" ? "rejected" : "updated";
      toast.success(`Project ${label} successfully`);
      setUserProjects(prev => prev.map(p => p._id === projectId ? { ...p, adminStatus: newStatus } : p));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update project status");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle project featured toggle
  const handleProjectToggleFeatured = async (projectId, currentFeatured) => {
    setActionLoading(true);
    try {
      await toggleProjectFeatured(projectId);
      toast.success(!currentFeatured ? "Project marked as featured" : "Project removed from featured");
      setUserProjects(prev => prev.map(p => p._id === projectId ? { ...p, isFeatured: !p.isFeatured } : p));
    } catch (err) {
      toast.error("Failed to update featured status");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle project delete
  const handleProjectDelete = async (projectId, projectName) => {
    if (!window.confirm(`⚠️ Permanently delete "${projectName}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await deleteProjectAdmin(projectId);
      toast.success("Project deleted permanently");
      setUserProjects(prev => prev.filter(p => p._id !== projectId));
      setUserProjectsStats(prev => prev ? { ...prev, total: Math.max(0, (prev.total || 1) - 1) } : prev);
    } catch (err) {
      toast.error("Failed to delete project");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle property click - open modal with full details
  const handlePropertyClick = async (property) => {
    setSelectedProperty(property);
    setPropertyModalOpen(true);
    setDetailsLoading(true);
    
    try {
      const res = await getPropertyDetails(property._id);
      const fullProperty = res?.data?.property || res?.data || property;
      setPropertyDetails(fullProperty);
    } catch (error) {
      console.error("Error loading property details:", error);
      setPropertyDetails(property);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close property modal
  const closePropertyModal = () => {
    setPropertyModalOpen(false);
    setSelectedProperty(null);
    setPropertyDetails(null);
  };

  // Handle property status change
  const handlePropertyStatusChange = async (propertyId, newStatus) => {
    try {
      setActionLoading(true);
      await updatePropertyStatus(propertyId, newStatus);
      toast.success(`Property status changed to ${newStatus}`);
      
      // Update local state
      setUserProperties(prev => 
        prev.map(p => p._id === propertyId ? { ...p, status: newStatus } : p)
      );
      
      if (selectedProperty?._id === propertyId) {
        setSelectedProperty({ ...selectedProperty, status: newStatus });
        setPropertyDetails(prev => prev ? { ...prev, status: newStatus } : prev);
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update status";
      toast.error(errorMessage);
      console.error("Status update error:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle make premium
  const handleMakePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await makePremium(selectedProperty._id, { planName: "Premium", durationInDays: 30, boostRank: 1 });
      toast.success("Property marked as Premium");
      
      setUserProperties(prev => 
        prev.map(p => p._id === selectedProperty._id ? { ...p, isPremium: true } : p)
      );
      setPropertyDetails(prev => prev ? { ...prev, isPremium: true } : prev);
    } catch (err) {
      toast.error("Failed to make premium");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle remove premium
  const handleRemovePremium = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await removePremium(selectedProperty._id);
      toast.success("Premium removed");
      
      setUserProperties(prev => 
        prev.map(p => p._id === selectedProperty._id ? { ...p, isPremium: false } : p)
      );
      setPropertyDetails(prev => prev ? { ...prev, isPremium: false } : prev);
    } catch (err) {
      toast.error("Failed to remove premium");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete property (permanent delete)
  const handleDeleteProperty = async () => {
    if (!selectedProperty || !window.confirm("⚠️ Are you sure you want to PERMANENTLY delete this property? This action cannot be undone and will remove all property data, images, and related leads.")) return;
    setActionLoading(true);
    try {
      await deleteProperty(selectedProperty._id);
      toast.success("Property permanently deleted");
      
      setUserProperties(prev => prev.filter(p => p._id !== selectedProperty._id));
      closePropertyModal();
    } catch (err) {
      toast.error("Failed to delete property");
    } finally {
      setActionLoading(false);
    }
  };

  // Get listing type icon
  const getListingIcon = (type) => {
    const icons = { RENT: Key, SELL: Tag, PG: Building2, CO_LIVING: UsersIcon };
    return icons[type] || Home;
  };

  // Get listing type color
  const getListingColor = (type) => {
    const colors = {
      RENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
      SELL: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
      CO_LIVING: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
      PG: { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-600 dark:text-orange-400" }
    };
    return colors[type] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400" };
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

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      PENDING: { bg: "bg-yellow-100 dark:bg-yellow-900/50", text: "text-yellow-700 dark:text-yellow-400", icon: AlertCircle },
      ACTIVE: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-700 dark:text-green-400", icon: CheckCircle },
      REJECTED: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-700 dark:text-red-400", icon: XCircle }
    };
    return colors[status] || colors.PENDING;
  };

  // Format price
  const formatPrice = (property) => {
    if (property.listingType === "RENT") {
      return property.pricing?.rent?.rentAmount 
        ? `₹${property.pricing.rent.rentAmount.toLocaleString()}/mo`
        : "Price N/A";
    }
    return property.pricing?.sell?.expectedPrice
      ? `₹${property.pricing.sell.expectedPrice.toLocaleString()}`
      : "Price N/A";
  };

  // Toggle block/unblock
  const toggleBlock = async (user) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const newBlockStatus = !user.isBlocked;
      const response = await updateUser(user._id, { isBlocked: newBlockStatus });
      
      // Get updated user from response
      const updatedUser = response?.data?.user || { ...user, isBlocked: newBlockStatus };
      
      // Update local state immediately
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u._id === user._id ? updatedUser : u
        )
      );

      // Update selected user if open
      if (selectedUser?._id === user._id) {
        setSelectedUser(updatedUser);
      }
      
      toast.success(newBlockStatus ? "User blocked successfully" : "User unblocked successfully");
    } catch (error) {
      console.error("Block/Unblock error:", error);
      toast.error(error?.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    setActionLoading(true);
    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
      if (selectedUser?._id === userId) {
        closeDetailPanel();
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle phone privacy
  const handlePhonePrivacyToggle = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await togglePhonePrivacy(selectedUser._id, !selectedUser.isPhonePrivate);
      const updatedUsers = users.map(u =>
        u._id === selectedUser._id ? { ...u, isPhonePrivate: !selectedUser.isPhonePrivate } : u
      );
      setUsers(updatedUsers);
      setSelectedUser({ ...selectedUser, isPhonePrivate: !selectedUser.isPhonePrivate });
      toast.success(
        !selectedUser.isPhonePrivate
          ? "Phone number set to private"
          : "Phone number set to public"
      );
    } catch (error) {
      toast.error("Failed to update phone privacy");
    } finally {
      setActionLoading(false);
    }
  };

  // Get counts for tabs
  const getTypeCount = (type) => {
    if (type === "All") return users.length;
    return users.filter(u => u.userType === type).length;
  };

  const getStatusCount = (status) => {
    if (status === "ALL") return filteredUsers.length;
    if (status === "ACTIVE") return users.filter(u => !u.isBlocked && (selectedUserType === "All" || u.userType === selectedUserType)).length;
    if (status === "BLOCKED") return users.filter(u => u.isBlocked && (selectedUserType === "All" || u.userType === selectedUserType)).length;
    if (status === "PREMIUM") return users.filter(u => u.activePlan && (selectedUserType === "All" || u.userType === selectedUserType)).length;
    return 0;
  };

  if (loading) return <Loader />;

  return (
    <div className={`h-[calc(100vh-100px)] flex ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#000000',
            border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`
          },
          success: {
            style: {
              background: '#10b981',
              color: '#ffffff'
            }
          },
          error: {
            style: {
              background: '#ef4444',
              color: '#ffffff'
            }
          }
        }}
      />

      {/* LEFT PANEL - User List */}
      <div className={`w-full ${selectedUser ? 'lg:w-[420px]' : ''} flex flex-col border-r ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>

        {/* Search Bar */}
        <div className={`p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search by name, phone, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${isDark
                ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
            />
            <button
              onClick={loadData}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 transition ${isDark ? 'text-slate-400' : 'text-gray-400'}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Type Tabs */}
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {userTypeTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedUserType === tab.id;
              const count = getTypeCount(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedUserType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${isActive
                    ? `bg-indigo-600 text-white shadow-lg shadow-indigo-500/30`
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

        {/* Status Tabs */}
        <div className={`px-4 py-2 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex gap-2">
            {statusTabs.map((tab) => {
              const isActive = selectedStatus === tab.id;
              const count = getStatusCount(tab.id);

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive
                    ? tab.id === "ACTIVE" ? 'bg-green-600 text-white'
                      : tab.id === "BLOCKED" ? 'bg-red-600 text-white'
                        : tab.id === "PREMIUM" ? 'bg-yellow-500 text-white'
                          : 'bg-slate-600 text-white'
                    : isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Summary - Compact */}
        <div className={`px-4 py-3 grid grid-cols-4 gap-2 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{stats?.total || 0}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats?.active || 0}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Active</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats?.blocked || 0}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Blocked</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats?.withPlan || 0}</p>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Premium</p>
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
              {filteredUsers.map((user) => {
                const colors = getUserTypeColor(user.userType);
                const isSelected = selectedUser?._id === user._id;

                return (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className={`p-4 cursor-pointer transition-all ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                      } ${isSelected
                        ? isDark ? 'bg-slate-800 border-l-4 border-indigo-500' : 'bg-indigo-50 border-l-4 border-indigo-500'
                        : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = defaultAvatar;
                          }}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 flex-shrink-0"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                          <User className={`w-6 h-6 ${colors.text}`} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.name || "Unknown User"}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {formatTimeAgo(user.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 mb-1">
                          <Phone className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            {user.phone || "No phone"}
                          </span>
                        </div>
                        {user.username && (
                          <div className="flex items-center gap-1 mb-1">
                            <User className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                            <span className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              @{user.username}
                            </span>
                          </div>
                        )}
                        <div className="mb-1">
                          <span className={`text-xs font-mono ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            ID: {user._id}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {user.userType?.replace(/_/g, " ") || "N/A"}
                          </span>
                          <div className="flex items-center gap-2">
                            {user.activePlan && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${user.isBlocked
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                              }`}>
                              {user.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <UsersIcon className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No users found
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {searchQuery ? "Try a different search" : "Users will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - User Details / Properties */}
      {selectedUser && (
        <div className={`hidden lg:flex flex-1 flex-col ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>

          {/* Header with Tabs */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              {(viewMode === "properties" || viewMode === "projects") && (
                <button
                  onClick={() => setViewMode("details")}
                  className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {viewMode === "details" ? "User Details" : viewMode === "properties" ? `${selectedUser.name}'s Properties` : `${selectedUser.name}'s Projects`}
              </h2>
            </div>
            <button
              onClick={closeDetailPanel}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* View Toggle Tabs */}
          <div className={`flex gap-2 p-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setViewMode("details")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === "details"
                  ? "bg-indigo-600 text-white"
                  : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <User className="w-4 h-4" />
              Details
            </button>
            <button
              onClick={handleViewProperties}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === "properties"
                  ? "bg-indigo-600 text-white"
                  : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Home className="w-4 h-4" />
              Properties
              {propertiesStats?.total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  viewMode === "properties" ? "bg-white/20" : isDark ? "bg-slate-600" : "bg-gray-200"
                }`}>
                  {propertiesStats.total}
                </span>
              )}
            </button>
            <button
              onClick={handleViewProjects}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                viewMode === "projects"
                  ? "bg-indigo-600 text-white"
                  : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Projects
              {userProjectsStats?.total > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  viewMode === "projects" ? "bg-white/20" : isDark ? "bg-slate-600" : "bg-gray-200"
                }`}>
                  {userProjectsStats.total}
                </span>
              )}
            </button>
          </div>

          {/* ===== DETAILS VIEW ===== */}
          {viewMode === "details" && (
            <>
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* User Header Card */}
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {selectedUser.profileImage ? (
                      <img
                        src={selectedUser.profileImage}
                        alt={selectedUser.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = defaultAvatar;
                        }}
                        className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-500"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${getUserTypeColor(selectedUser.userType).bg}`}>
                        <User className={`w-10 h-10 ${getUserTypeColor(selectedUser.userType).text}`} />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getUserTypeColor(selectedUser.userType).bg} ${getUserTypeColor(selectedUser.userType).text}`}>
                          {selectedUser.userType?.replace(/_/g, " ") || "N/A"}
                        </span>
                        {selectedUser.activePlan && (
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400 flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Premium
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${selectedUser.isBlocked
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          }`}>
                          {selectedUser.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </div>

                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedUser.name || "Unknown User"}
                      </h3>

                      <div className="flex items-center gap-1 mt-1">
                        <Phone className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {selectedUser.phone || "No phone"}
                        </span>
                        {selectedUser.isPhonePrivate && (
                          <span className="ml-2 text-xs text-orange-500 flex items-center gap-1">
                            <PhoneOff className="w-3 h-3" /> Private
                          </span>
                        )}
                      </div>
                      {selectedUser.username && (
                        <div className="flex items-center gap-1 mt-1">
                          <User className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                          <span className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            @{selectedUser.username}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* User ID Display */}
                <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Key className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>User ID</span>
                  </div>
                  <p className={`text-sm font-mono font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selectedUser._id}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Joined</span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Last Updated</span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Phone Privacy Toggle */}
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedUser.isPhonePrivate ? (
                        <PhoneOff className="w-5 h-5 text-orange-500" />
                      ) : (
                        <Phone className="w-5 h-5 text-green-500" />
                      )}
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone Privacy</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {selectedUser.isPhonePrivate ? "Phone number is hidden from others" : "Phone number is visible to others"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePhonePrivacyToggle}
                  disabled={actionLoading}
                  className={`relative w-14 h-7 rounded-full transition-colors ${selectedUser.isPhonePrivate ? "bg-orange-500" : "bg-green-500"
                    } disabled:opacity-50`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${selectedUser.isPhonePrivate ? "left-8" : "left-1"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* GST Number */}
            {selectedUser.gstNumber && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Building2 className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>GST Number</p>
                    <p className={`font-mono font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
                      {selectedUser.gstNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Active Plan */}
            <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <Crown className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Active Plan</p>
                  {selectedUser.activePlan ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          {selectedUser.activePlan.name}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          ₹{selectedUser.activePlan.price} • {selectedUser.activePlan.duration} days
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                        Active
                      </span>
                    </div>
                  ) : (
                    <p className={isDark ? 'text-slate-500' : 'text-gray-400'}>No active plan</p>
                  )}
                </div>
              </div>
            </div>

            {/* View Properties Button */}
            <button
              onClick={handleViewProperties}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              <Eye className="w-4 h-4" />
              View All Properties
            </button>
            <button
              onClick={handleViewProjects}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition ${
                isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              View All Projects
            </button>
          </div>

              {/* Action Buttons */}
              <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => toggleBlock(selectedUser)}
                    disabled={actionLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition ${selectedUser.isBlocked
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedUser.isBlocked ? (
                      <>
                        <Shield className="w-4 h-4" />
                        Unblock
                      </>
                    ) : (
                      <>
                        <ShieldOff className="w-4 h-4" />
                        Block
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedUser._id)}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===== PROPERTIES VIEW ===== */}
          {viewMode === "properties" && (
            <>
              {/* Properties Stats */}
              {propertiesStats && (
                <div className={`px-4 py-3 grid grid-cols-4 gap-2 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{propertiesStats.total || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{propertiesStats.byStatus?.ACTIVE || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Active</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{propertiesStats.byStatus?.PENDING || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Pending</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{propertiesStats.byStatus?.REJECTED || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Rejected</p>
                  </div>
                </div>
              )}

              {/* Properties List */}
              <div className="flex-1 overflow-y-auto">
                {propertiesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : userProperties.length > 0 ? (
                  <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                    {userProperties.map((property) => {
                      const statusColor = getStatusColor(property.status);
                      const StatusIcon = statusColor.icon;

                      return (
                        <div
                          key={property._id}
                          onClick={() => handlePropertyClick(property)}
                          className={`p-4 cursor-pointer transition-all ${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}
                        >
                          <div className="flex gap-3">
                            {/* Property Image */}
                            <div className={`w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                              {property.images?.[0]?.url ? (
                                <img
                                  src={property.images[0].url}
                                  alt="Property"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className={`w-8 h-8 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>

                            {/* Property Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  property.listingType === "RENT" 
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400"
                                    : property.listingType === "SELL"
                                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400"
                                    : property.listingType === "PG"
                                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400"
                                    : "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400"
                                }`}>
                                  {property.listingType}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${statusColor.bg} ${statusColor.text}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {property.status}
                                </span>
                                {property.isPremium && (
                                  <Crown className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>

                              <p className={`text-sm font-medium mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {property.propertyCategory || property.propertyType || "Property"}
                              </p>

                              <div className="flex items-center gap-1 mb-1">
                                <MapPin className={`w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                <span className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                  {property.location?.locality || property.location?.city || "Location N/A"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-semibold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                  {formatPrice(property)}
                                </span>
                                <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                              </div>
                            </div>
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
                      This user hasn't listed any properties yet
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ===== PROJECTS VIEW ===== */}
          {viewMode === "projects" && (
            <>
              {/* Projects Stats */}
              {userProjectsStats && (
                <div className={`px-4 py-3 grid grid-cols-4 gap-2 border-b ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{userProjectsStats.total || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{userProjectsStats.active || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Active</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{userProjectsStats.pending || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Pending</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-lg font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{userProjectsStats.rejected || 0}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Rejected</p>
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto">
                {projectsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : userProjects.length > 0 ? (
                  <div className={`divide-y ${isDark ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                    {userProjects.map((project) => {
                      const statusColor = {
                        ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
                        PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400",
                        REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
                      }[project.adminStatus] || "bg-gray-100 text-gray-600";
                      return (
                        <div key={project._id} className={`p-4 ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-gray-50'}`}>
                          <div className="flex gap-3 mb-3">
                            <div className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                              {project.uploadImage?.[0] ? (
                                <img src={project.uploadImage[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <FolderKanban className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{project.adminStatus}</span>
                                {project.isFeatured && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-current" /> Featured
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{project.nameOfProject}</p>
                              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {project.projectLocation?.city}{project.projectLocation?.state ? `, ${project.projectLocation.state}` : ""}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{project.projectStatus}</p>
                            </div>
                          </div>
                          {/* Action Buttons */}
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              onClick={() => handleProjectStatusChange(project._id, "ACTIVE")}
                              disabled={actionLoading || project.adminStatus === "ACTIVE"}
                              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <CheckCircle className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleProjectStatusChange(project._id, "REJECTED")}
                              disabled={actionLoading || project.adminStatus === "REJECTED"}
                              className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                            <button
                              onClick={() => handleProjectToggleFeatured(project._id, project.isFeatured)}
                              disabled={actionLoading}
                              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
                                project.isFeatured
                                  ? isDark ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/80" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                            >
                              <Star className={`w-3 h-3 ${project.isFeatured ? "fill-current" : ""}`} />
                              {project.isFeatured ? "Unfeature" : "Feature"}
                            </button>
                            <button
                              onClick={() => handleProjectDelete(project._id, project.nameOfProject)}
                              disabled={actionLoading}
                              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition ${
                                isDark ? "bg-red-900/50 text-red-400 hover:bg-red-900/80" : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <FolderKanban className={`w-10 h-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
                    </div>
                    <p className={`text-lg font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No projects found</p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>This user hasn't posted any projects yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== PROPERTY DETAIL MODAL ===== */}
      {propertyModalOpen && selectedProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Property Details
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={closePropertyModal}
                  className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            {detailsLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
              </div>
            ) : propertyDetails ? (
              <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-4 space-y-4">
                
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      {formatTimeAgo(propertyDetails.updatedAt)}
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

                {/* RESIDENTIAL Details */}
                {propertyDetails.residentialDetails && (propertyDetails.listingType === "RENT" || propertyDetails.listingType === "SELL") && propertyDetails.propertyType === "RESIDENTIAL" && (
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <Home className="w-4 h-4" /> Residential Details
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
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
                      {propertyDetails.residentialDetails.totalFloors && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Total Floors</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.totalFloors}</p>
                        </div>
                      )}
                      {propertyDetails.residentialDetails.constructionStatus && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Construction</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.constructionStatus}</p>
                        </div>
                      )}
                      {propertyDetails.residentialDetails.ageOfProperty && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Age</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.ageOfProperty}</p>
                        </div>
                      )}
                      {propertyDetails.residentialDetails.ownership && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Ownership</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.residentialDetails.ownership}</p>
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
                      </div>
                    )}

                    {/* Area Details */}
                    {propertyDetails.residentialDetails.area && (
                      <div className={`mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                        <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Area</p>
                        <div className="flex gap-4">
                          {propertyDetails.residentialDetails.area.builtUp?.value && (
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Built-up: {propertyDetails.residentialDetails.area.builtUp.value} {propertyDetails.residentialDetails.area.builtUp.unit}
                            </span>
                          )}
                          {propertyDetails.residentialDetails.area.carpet?.value && (
                            <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              Carpet: {propertyDetails.residentialDetails.area.carpet.value} {propertyDetails.residentialDetails.area.carpet.unit}
                            </span>
                          )}
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
                    <div className="grid grid-cols-3 gap-3">
                      {propertyDetails.commercialDetails.propertyType && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Type</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.commercialDetails.propertyType}</p>
                        </div>
                      )}
                      {propertyDetails.commercialDetails.constructionStatus && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Construction</p>
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
                    </div>
                  </div>
                )}

                {/* PG Details */}
                {propertyDetails.pgDetails && propertyDetails.listingType === "PG" && (
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <Building2 className="w-4 h-4" /> PG Details
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {propertyDetails.pgDetails.pgName && (
                        <div className={`p-3 rounded-lg col-span-3 ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
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
                      {propertyDetails.pgDetails.noticePeriod && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Notice Period</p>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{propertyDetails.pgDetails.noticePeriod} days</p>
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
                  </div>
                )}

                {/* CO-LIVING Details */}
                {propertyDetails.coLivingDetails && propertyDetails.listingType === "CO_LIVING" && (
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <UsersIcon className="w-4 h-4" /> Co-Living Details
                    </h4>
                    
                    {/* Profile */}
                    <div className="flex items-center gap-4 mb-4">
                      {propertyDetails.coLivingDetails.profileImage && (
                        <img src={propertyDetails.coLivingDetails.profileImage} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
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

                    <div className="grid grid-cols-3 gap-3">
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
                  </div>
                )}

                {/* PRICING Details */}
                {propertyDetails.pricing && (
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      <Tag className="w-4 h-4" /> Pricing Details
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {propertyDetails.pricing.rent?.rentAmount && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Rent Amount</p>
                          <p className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>₹{propertyDetails.pricing.rent.rentAmount.toLocaleString()}/mo</p>
                        </div>
                      )}
                      {propertyDetails.pricing.sell?.expectedPrice && (
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-white border border-gray-100'}`}>
                          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Expected Price</p>
                          <p className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>₹{propertyDetails.pricing.sell.expectedPrice.toLocaleString()}</p>
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
                    </div>

                    {/* Negotiable Flag */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(propertyDetails.pricing.rent?.isNegotiable || propertyDetails.pricing.sell?.isNegotiable) && (
                        <span className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700'}`}>
                          Negotiable
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Images */}
                {propertyDetails.images && propertyDetails.images.length > 0 && (
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Photos ({propertyDetails.images.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {propertyDetails.images.slice(0, 8).map((img, idx) => {
                        const imageUrl = typeof img === 'string' ? img : img?.url;
                        const isPrimary = typeof img === 'object' && img?.isPrimary;
                        
                        return (
                          <div key={idx} className={`relative aspect-square rounded-lg overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                            {imageUrl ? (
                              <img src={imageUrl} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className={`w-6 h-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
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
                )}
              </div>
            ) : null}

            {/* Action Buttons */}
            {propertyDetails && (
              <div className={`p-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handlePropertyStatusChange(selectedProperty._id, "ACTIVE")}
                    disabled={actionLoading || propertyDetails.status === "ACTIVE"}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handlePropertyStatusChange(selectedProperty._id, "REJECTED")}
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
                        isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
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
                        isDark ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      Make Premium
                    </button>
                  )}
                  <button
                    onClick={handleDeleteProperty}
                    disabled={actionLoading}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isDark ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {actionLoading ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State for Right Panel */}
      {!selectedUser && (
        <div className={`hidden lg:flex flex-1 flex-col items-center justify-center ${isDark ? 'bg-slate-800/30' : 'bg-gray-50'}`}>
          <div className="text-center max-w-md p-8">
            <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-white border border-gray-200'}`}>
              <MessageCircle className={`w-16 h-16 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Click User To View
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Select a user from the list to view details and manage their account
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
