import { useEffect, useState } from "react";
import { fetchUsers, updateUser, deleteUser, togglePhonePrivacy } from "../../../api/user.api";
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
  MessageCircle
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
  };

  // Close detail panel
  const closeDetailPanel = () => {
    setSelectedUser(null);
  };

  // Toggle block/unblock
  const toggleBlock = async (user) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await updateUser(user._id, { isBlocked: !user.isBlocked });
      toast.success(user.isBlocked ? "User unblocked" : "User blocked");

      // Update local state
      const updatedUsers = users.map(u =>
        u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u
      );
      setUsers(updatedUsers);

      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...selectedUser, isBlocked: !user.isBlocked });
      }
    } catch (error) {
      toast.error("Update failed");
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
      setUsers(users.filter(u => u._id !== userId));
      if (selectedUser?._id === userId) {
        closeDetailPanel();
      }
    } catch (error) {
      toast.error("Delete failed");
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
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(date).toLocaleDateString();
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
      <Toaster position="top-right" />

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

      {/* RIGHT PANEL - User Details */}
      {selectedUser && (
        <div className={`hidden lg:flex flex-1 flex-col ${isDark ? 'bg-slate-800/50' : 'bg-white'}`}>

          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              User Details
            </h2>
            <button
              onClick={closeDetailPanel}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                </div>
              </div>
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

            {/* Properties Count - if available */}
            {selectedUser.propertiesCount !== undefined && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Home className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <div>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Properties Listed</p>
                    <p className={`font-medium text-lg ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                      {selectedUser.propertiesCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
                    Unblock User
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Block User
                  </>
                )}
              </button>
              <button
                onClick={() => handleDelete(selectedUser._id)}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete User
              </button>
            </div>
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
