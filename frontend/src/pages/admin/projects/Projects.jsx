import { useEffect, useState, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getProjects,
  getProjectDetails,
  updateProjectStatus,
  toggleFeatured,
  deleteProject,
} from "../../../api/admin.project.api";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import {
  Search, RefreshCw, Building2, MapPin, Phone, Mail,
  Calendar, CheckCircle, XCircle, Star, Trash2, X,
  ChevronRight, Clock, Filter, Home, Briefcase, Store,
  Factory, FolderKanban, MessageCircle, KeySquare, Users,
  AlertCircle, Image, Layers, Compass, Map, ExternalLink, FileText,
} from "lucide-react";

/* ─── Type tabs ─── */
const PROJECT_TYPE_TABS = [
  { id: "ALL",         label: "ALL",         icon: Filter,    activeBg: "bg-indigo-600" },
  { id: "Residential", label: "Residential", icon: Home,      activeBg: "bg-blue-600"   },
  { id: "Commercial",  label: "Commercial",  icon: Briefcase, activeBg: "bg-purple-600" },
  { id: "Industrial",  label: "Industrial",  icon: Factory,   activeBg: "bg-orange-600" },
  { id: "Retail",      label: "Retail",      icon: Store,     activeBg: "bg-pink-600"   },
];

/* ─── Helpers ─── */
const TYPE_COLORS = {
  Residential: { bg: "bg-blue-100 dark:bg-blue-900/50",   text: "text-blue-600 dark:text-blue-400",   border: "border-blue-200 dark:border-blue-800"   },
  Commercial:  { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400", border: "border-purple-200 dark:border-purple-800" },
};

// projectType is now an array e.g. ["Residential"] — use first entry for color
const getTypeColors = (typeArr) => {
  const t = Array.isArray(typeArr) ? typeArr[0] : typeArr;
  return TYPE_COLORS[t] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", border: "border-gray-200 dark:border-gray-700" };
};
const getTypeIcon  = (typeArr) => {
  const t = Array.isArray(typeArr) ? typeArr[0] : typeArr;
  return (PROJECT_TYPE_TABS.find(t2 => t2.id === t)?.icon) || Building2;
};

const formatTimeAgo = (date) => {
  if (!date) return "";
  const h = Math.floor((Date.now() - new Date(date)) / 3600000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-IN");
};

// const formatPrice = (p) => {
//   if (!p?.min && !p?.max) return "Price on request";
//   const u = p.unit || "LAKH";
//   if (p.min && p.max) return `₹${p.min} – ${p.max} ${u}`;
//   if (p.min) return `From ₹${p.min} ${u}`;
//   return `Up to ₹${p.max} ${u}`;
// };

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

/* ═══════════════════════════════════════════════════ MAIN ═══════════════════════════════════════════════════ */
const Projects = () => {
  const { isDark } = useTheme();

  const [data, setData]                           = useState([]);
  const [filteredData, setFilteredData]           = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [searchQuery, setSearchQuery]             = useState("");
  const [selectedTypeTab, setSelectedTypeTab]     = useState("ALL");
  const [selectedProject, setSelectedProject]     = useState(null);
  const [projectDetails, setProjectDetails]       = useState(null);
  const [detailsLoading, setDetailsLoading]       = useState(false);
  const [actionLoading, setActionLoading]         = useState(false);
  const [statusFilter, setStatusFilter]           = useState("all");
  const [timeFilter, setTimeFilter]               = useState("all");
  const [sortBy, setSortBy]                       = useState("recent");
  const [showFeaturedOnly, setShowFeaturedOnly]   = useState(false);
  const [stats, setStats]                         = useState({ total: 0, pending: 0, active: 0, rejected: 0, blocked: 0, featured: 0 });
  const [rejectModal, setRejectModal]             = useState(false);
  const [rejectReason, setRejectReason]           = useState("");

  /* ─── Load ─── */
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 200 };
      if (statusFilter !== "all") params.adminStatus = statusFilter;
      if (timeFilter   !== "all") params.timeFilter = timeFilter;
      if (sortBy)                 params.sortBy     = sortBy;
      const res      = await getProjects(params);
      const projects = res?.data?.data?.projects || res?.data?.projects || [];
      const s        = res?.data?.data?.stats    || {};
      setData(projects);
      setStats(s);
    } catch {
      toast.error("Failed to load projects");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, timeFilter, sortBy]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ─── Client filter ─── */
  useEffect(() => {
    let f = [...data];
    if (selectedTypeTab !== "ALL") {
      const tabId = selectedTypeTab.toLowerCase();
      f = f.filter(p =>
        Array.isArray(p.projectType)
          ? p.projectType.some(t => t.toLowerCase() === tabId)
          : p.projectType?.toLowerCase() === tabId
      );
    }
    if (showFeaturedOnly) f = f.filter(p => p.isFeatured);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      f = f.filter(p =>
        p.nameOfProject?.toLowerCase().includes(q) ||
        p.developer?.nameOfBusiness?.toLowerCase().includes(q) ||
        p.projectLocation?.city?.toLowerCase().includes(q) ||
        p.projectLocation?.state?.toLowerCase().includes(q)
      );
    }
    setFilteredData(f);
  }, [data, selectedTypeTab, showFeaturedOnly, searchQuery]);

  /* ─── Open detail ─── */
  const handleProjectClick = async (project) => {
    setSelectedProject(project);
    setDetailsLoading(true);
    setProjectDetails(null);
    try {
      const res = await getProjectDetails(project._id);
      setProjectDetails(res?.data?.data || res?.data);
    } catch {
      setProjectDetails(project);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetail = () => { setSelectedProject(null); setProjectDetails(null); };

  /* ─── Status change ─── */
  const handleStatusChange = async (status, extra = {}) => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      await updateProjectStatus(selectedProject._id, status, extra);
      const label = status === "ACTIVE" ? "approved" : status === "REJECTED" ? "rejected" : status === "BLOCKED" ? "blocked" : "updated";
      toast.success(`Project ${label}`);
      setRejectModal(false);
      setRejectReason("");
      await loadProjects();
      setProjectDetails(prev => prev ? { ...prev, adminStatus: status } : prev);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Featured toggle ─── */
  const handleToggleFeatured = async () => {
    if (!selectedProject) return;
    try {
      await toggleFeatured(selectedProject._id);
      toast.success("Featured status updated");
      await loadProjects();
      setProjectDetails(prev => prev ? { ...prev, isFeatured: !prev.isFeatured } : prev);
    } catch {
      toast.error("Failed to update featured");
    }
  };

  /* ─── Delete ─── */
  const handleDelete = async () => {
    if (!selectedProject || !window.confirm("⚠️ Permanently delete this project? This cannot be undone.")) return;
    setActionLoading(true);
    try {
      await deleteProject(selectedProject._id);
      toast.success("Project permanently deleted");
      await loadProjects();
      closeDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader />;

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className={`h-[calc(100vh-100px)] flex ${isDark ? "bg-slate-900" : "bg-gray-50"}`}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? "#1e293b" : "#ffffff",
            color: isDark ? "#e2e8f0" : "#1f2937",
            border: `1px solid ${isDark ? "#475569" : "#e5e7eb"}`,
            borderRadius: "10px",
            fontSize: "14px",
          },
          success: { style: { background: isDark ? "#064e3b" : "#ecfdf5", color: isDark ? "#86efac" : "#065f46", border: `1px solid ${isDark ? "#047857" : "#6ee7b7"}` } },
          error:   { style: { background: isDark ? "#7f1d1d" : "#fef2f2", color: isDark ? "#fca5a5" : "#991b1b", border: `1px solid ${isDark ? "#dc2626" : "#fecaca"}` } },
        }}
      />

      {/* ══════════════ LEFT PANEL ══════════════ */}
      <div className={`w-full ${selectedProject ? "lg:w-[420px]" : ""} flex flex-col border-r ${isDark ? "border-slate-700" : "border-gray-200"}`}>

        {/* Search + Refresh */}
        <div className={`p-4 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search by project name, builder, city..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isDark ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
              }`}
            />
            <button
              onClick={loadProjects}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 transition ${isDark ? "text-slate-400" : "text-gray-400"}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className={`px-4 py-3 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PROJECT_TYPE_TABS.map(tab => {
              const Icon    = tab.icon;
              const isActive = selectedTypeTab === tab.id;
              const count   = tab.id === "ALL" ? data.length : data.filter(p => {
                const tid = tab.id.toLowerCase();
                return Array.isArray(p.projectType)
                  ? p.projectType.some(t => t.toLowerCase() === tid)
                  : p.projectType?.toLowerCase() === tid;
              }).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTypeTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? `${tab.activeBg} text-white shadow-lg`
                      : isDark
                        ? "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className={`px-4 py-3 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
          <div className="space-y-3">

            {/* Dropdowns row */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending ({stats.pending || 0})</option>
                <option value="ACTIVE">Active ({stats.active || 0})</option>
                <option value="REJECTED">Rejected ({stats.rejected || 0})</option>
                <option value="BLOCKED">Blocked ({stats.blocked || 0})</option>
              </select>

              <select
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              >
                <option value="all">All Time</option>
                <option value="today">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={`px-3 py-1.5 rounded-lg border text-xs ${isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
              >
                <option value="recent">Recent First</option>
                <option value="oldest">Oldest First</option>
                <option value="featured">Featured First</option>
              </select>
            </div>

            {/* Featured toggle */}
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-gray-600"}`}>Show Featured Only</span>
              <button
                onClick={() => setShowFeaturedOnly(v => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showFeaturedOnly ? "bg-amber-500" : isDark ? "bg-slate-700" : "bg-gray-200"}`}
              >
                <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${showFeaturedOnly ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 text-xs">
              <span className={isDark ? "text-slate-400" : "text-gray-500"}>
                Total: <span className="font-semibold">{stats.total || 0}</span>
              </span>
              <span className={isDark ? "text-slate-400" : "text-gray-500"}>
                Featured: <span className="font-semibold text-amber-500">{stats.featured || 0}</span>
              </span>
              <span className={isDark ? "text-slate-400" : "text-gray-500"}>
                Showing: <span className="font-semibold">{filteredData.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          {filteredData.length > 0 ? (
            <div className={`divide-y ${isDark ? "divide-slate-700/50" : "divide-gray-100"}`}>
              {filteredData.map(project => {
                const Icon       = getTypeIcon(project.projectType);
                const colors     = getTypeColors(project.projectType);
                const isSelected = selectedProject?._id === project._id;
                const coverImg   = project.uploadImage?.[0] || null;
                return (
                  <div
                    key={project._id}
                    onClick={() => handleProjectClick(project)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? isDark ? "bg-slate-800 border-l-4 border-indigo-500" : "bg-indigo-50 border-l-4 border-indigo-500"
                        : isDark ? "hover:bg-slate-800/60" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      {coverImg ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={coverImg} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg} border ${colors.border}`}>
                          <Icon className={`w-6 h-6 ${colors.text}`} />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-0.5">
                          <span className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                            {project.nameOfProject}
                          </span>
                          <span className={`text-xs flex-shrink-0 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                            {formatTimeAgo(project.createdAt)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mb-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                          {project.developer?.nameOfBusiness || "No developer info"}
                        </p>
                        <div className="flex items-center gap-1 mb-1.5">
                          <MapPin className={`w-3 h-3 flex-shrink-0 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                          <span className={`text-xs truncate ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            {project.projectLocation?.fullAddress || project.projectLocation?.city || "Location not specified"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                            {Array.isArray(project.projectType) ? project.projectType.join(" · ") : (project.projectType || "")}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {project.isFeatured && (
                              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                <Star className="w-2.5 h-2.5 fill-current" /> Featured
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              project.adminStatus === "ACTIVE"   ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" :
                              project.adminStatus === "PENDING"  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400" :
                              project.adminStatus === "BLOCKED"  ? "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400" :
                                                              "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                            }`}>
                              {project.adminStatus}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${isDark ? "text-slate-600" : "text-gray-300"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-slate-800" : "bg-gray-100"}`}>
                <FolderKanban className={`w-10 h-10 ${isDark ? "text-slate-600" : "text-gray-400"}`} />
              </div>
              <p className={`text-base font-medium ${isDark ? "text-slate-400" : "text-gray-500"}`}>No projects found</p>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>
                {searchQuery ? "Try a different search term" : "Projects will appear here"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      {selectedProject ? (
        <div className={`hidden lg:flex flex-1 flex-col ${isDark ? "bg-slate-800/30" : "bg-white"}`}>

          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-slate-700" : "border-gray-200"}`}>
            <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Project Details</h2>
            <button
              onClick={closeDetail}
              className={`p-2 rounded-lg transition ${isDark ? "hover:bg-slate-700 text-slate-400" : "hover:bg-gray-100 text-gray-500"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {detailsLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader /></div>
          ) : projectDetails ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* ── Project Header Card ── */}
              <div className={`rounded-2xl p-5 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                <div className="flex items-start gap-4">
                  {(() => {
                    const Icon   = getTypeIcon(projectDetails.projectType);
                    const colors = getTypeColors(projectDetails.projectType);
                    const cover  = projectDetails.uploadImage?.[0];
                    return cover ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={cover} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                        <Icon className={`w-8 h-8 ${colors.text}`} />
                      </div>
                    );
                  })()}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(Array.isArray(projectDetails.projectType) ? projectDetails.projectType : [projectDetails.projectType]).filter(Boolean).map((t, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded-lg text-xs font-medium ${getTypeColors([t]).bg} ${getTypeColors([t]).text}`}>
                          {t}
                        </span>
                      ))}
                      {projectDetails.isFeatured && (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> Featured
                        </span>
                      )}
                    </div>
                    <h3 className={`text-xl font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {projectDetails.nameOfProject}
                    </h3>
                    {(projectDetails.developer?.companyName || projectDetails.developer?.name) && (
                      <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                        by {projectDetails.developer.nameOfBusiness}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                      <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
                        {projectDetails.projectLocation?.fullAddress || [projectDetails.projectLocation?.city, projectDetails.projectLocation?.state, projectDetails.projectLocation?.country].filter(Boolean).join(", ") || "Not specified"}
                      </span>
                    </div>
                    <p className={`text-sm font-semibold mt-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                      {projectDetails.projectStatus || "Status N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Admin Status + Launch Status ── */}
              <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                <div>
                  <p className={`text-xs mb-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Admin Status</p>
                  <p className={`text-lg font-bold ${
                    projectDetails.adminStatus === "ACTIVE"   ? "text-green-500" :
                    projectDetails.adminStatus === "PENDING"  ? "text-yellow-500" :
                    projectDetails.adminStatus === "REJECTED" ? "text-red-500"   : "text-gray-400"
                  }`}>{projectDetails.adminStatus || "PENDING"}</p>
                </div>
                <div className="text-right">
                  <p className={`text-xs mb-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Launch Status</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${isDark ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
                    <Layers className="w-3 h-3" />
                    {projectDetails.projectStatus || "N/A"}
                  </span>
                </div>
              </div>

              {/* ── Developer Info ── */}
              {/* ── Posted By (User Account) ── */}
              {projectDetails.developer?.userId && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-indigo-900/20 border border-indigo-800/50" : "bg-indigo-50 border border-indigo-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                    <Users className="w-3.5 h-3.5" /> Posted By (User Account)
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isDark ? "bg-indigo-800/60" : "bg-indigo-100"}`}>
                      {projectDetails.developer.userId.profileImage ? (
                        <img src={projectDetails.developer.userId.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className={`text-sm font-bold ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>
                          {(projectDetails.developer.userId.name || "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                        {projectDetails.developer.userId.name || "—"}
                      </p>
                      {projectDetails.developer.userId.phone && (
                        <span className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                          <Phone className="w-3 h-3" /> {projectDetails.developer.userId.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`mt-3 px-3 py-2 rounded-lg ${isDark ? "bg-slate-800" : "bg-white border border-indigo-100"}`}>
                    <p className={`text-xs mb-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>User ID</p>
                    <p className={`text-xs font-mono font-medium break-all ${isDark ? "text-green-400" : "text-green-700"}`}>
                      {projectDetails.developer.userId._id}
                    </p>
                  </div>
                </div>
              )}

              {projectDetails.developer ? (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Developer</h4>
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? "bg-indigo-900/40" : "bg-indigo-100"}`}>
                      {projectDetails.developer.logo ? (
                        <img src={projectDetails.developer.logo} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className={`text-base font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                        {(projectDetails.developer.nameOfBusiness || "D")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {projectDetails.developer.nameOfBusiness}
                      </p>
                      {projectDetails.developer.nameOfAuthorisedPerson && (
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>{projectDetails.developer.nameOfAuthorisedPerson}{projectDetails.developer.designation ? ` · ${projectDetails.developer.designation}` : ""}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-1">
                        {projectDetails.developer.mobileNo && (
                          <span className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            <Phone className="w-3 h-3" /> {projectDetails.developer.mobileNo}
                          </span>
                        )}
                        {projectDetails.developer.email && (
                          <span className={`text-xs flex items-center gap-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                            <Mail className="w-3 h-3" /> {projectDetails.developer.email}
                          </span>
                        )}
                      </div>
                      {projectDetails.developer.websiteLink && (
                        <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-gray-400"}`}>{projectDetails.developer.websiteLink}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl p-4 ${isDark ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Developer</p>
                  <p className="text-red-500 font-semibold text-sm">Developer not linked</p>
                </div>
              )}

              {/* ── Developer Documents ── */}
              {(projectDetails.developer?.businessPANUpload || projectDetails.developer?.reraCertificateUpload || projectDetails.developer?.gstCertificateUpload) && (() => {
                const docs = [
                  { key: "businessPANUpload",      label: "PAN Card",            url: projectDetails.developer.businessPANUpload },
                  { key: "reraCertificateUpload",  label: "RERA Certificate",    url: projectDetails.developer.reraCertificateUpload },
                  { key: "gstCertificateUpload",   label: "GST Certificate",     url: projectDetails.developer.gstCertificateUpload },
                ].filter(d => d.url);
                const isPdf = (url) => url?.toLowerCase().includes(".pdf") || url?.toLowerCase().includes("application%2fpdf");
                return (
                  <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      <FileText className="w-3.5 h-3.5" /> Developer Documents ({docs.length})
                    </h4>
                    <div className="space-y-2">
                      {docs.map(({ key, label, url }) => (
                        <a key={key} href={url} target="_blank" rel="noreferrer"
                          className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                            isDark ? "bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}>
                          {isPdf(url) ? (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-red-900/40" : "bg-red-100"}`}>
                              <FileText className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              <img src={url} alt={label} className="w-full h-full object-cover" onError={e => { e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline></svg></div>'; }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{label}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${isPdf(url) ? isDark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-600" : isDark ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-100 text-indigo-600"}`}>
                              {isPdf(url) ? "PDF" : "Image"}
                            </span>
                          </div>
                          <ExternalLink className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── Project ID ── */}
              <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <KeySquare className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>Project ID</span>
                </div>
                <p className={`text-sm font-mono font-medium ${isDark ? "text-green-400" : "text-green-600"}`}>{projectDetails._id}</p>
              </div>

              {/* ── Dates Grid ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>Posted On</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{fmtDate(projectDetails.createdAt)}</p>
                </div>
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className={`w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                    <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>{projectDetails.activatedAt ? "Approved On" : "Possession Date"}</span>
                  </div>
                  <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {fmtDate(projectDetails.activatedAt || projectDetails.possessionDate)}
                  </p>
                </div>
              </div>

              {/* ── Description ── */}
              {projectDetails.description && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Description</h4>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-gray-700"}`}>{projectDetails.description}</p>
                </div>
              )}

              {/* ── Rejection reason ── */}
              {projectDetails.rejectionReason && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-1 text-red-600 dark:text-red-400">Rejection Reason</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{projectDetails.rejectionReason}</p>
                </div>
              )}

              {/* ── RERA Info ── */}
              {projectDetails.developer?.reraNo && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <AlertCircle className="w-3.5 h-3.5" /> RERA
                  </h4>
                  <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                    <p className={`font-mono font-medium text-sm ${isDark ? "text-green-400" : "text-green-700"}`}>{projectDetails.developer.reraNo}</p>
                  </div>
                </div>
              )}

              {/* ── Project Stats ── */}
              <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  <Layers className="w-3.5 h-3.5" /> Project Info
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total Floors",  value: projectDetails.noOfFloor },
                    { label: "Total Towers",  value: projectDetails.noOfTower },
                    { label: "Launch Date",   value: fmtDate(projectDetails.launchDate) },
                    { label: "Possession",    value: fmtDate(projectDetails.possessionDate) },
                  ].map(({ label, value }) => value && (
                    <div key={label} className={`p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>{label}</p>
                      <p className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {projectDetails.projectLocation?.fullAddress && (
                  <div className={`mt-2 p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                    <p className={`text-xs mb-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Full Address</p>
                    <p className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{projectDetails.projectLocation.fullAddress}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {projectDetails.projectLocation?.city && (
                    <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>City</p>
                      <p className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{projectDetails.projectLocation.city}</p>
                    </div>
                  )}
                  {projectDetails.projectLocation?.state && (
                    <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>State</p>
                      <p className={`font-medium text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{projectDetails.projectLocation.state}</p>
                    </div>
                  )}
                </div>
                {(projectDetails.projectLocation?.latitude || projectDetails.projectLocation?.longitude) && (
                  <div className={`mt-2 p-3 rounded-lg ${isDark ? "bg-slate-700/60" : "bg-white border border-gray-100"}`}>
                    <p className={`text-xs mb-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Coordinates</p>
                    <p className={`text-sm font-mono ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                      {projectDetails.projectLocation.latitude}, {projectDetails.projectLocation.longitude}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Configurations ── */}
              {Array.isArray(projectDetails.projectConfiguration) && projectDetails.projectConfiguration.length > 0 && (() => {
                const isPdf = (url) => url?.toLowerCase().includes(".pdf") || url?.toLowerCase().includes("application%2fpdf");
                return (
                  <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      <Layers className="w-3.5 h-3.5" /> Configurations ({projectDetails.projectConfiguration.length})
                    </h4>
                    <div className="space-y-2">
                      {projectDetails.projectConfiguration.map((item, idx) => (
                        <div key={idx} className={`rounded-xl border ${isDark ? "bg-slate-700/50 border-slate-600" : "bg-white border-gray-100"}`}>
                          {/* Header row */}
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                                {item.type}
                              </span>
                              {item.details?.areaRangeSqft?.min != null && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? "bg-slate-600 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
                                  {item.details.areaRangeSqft.min}
                                  {item.details.areaRangeSqft.max && item.details.areaRangeSqft.max !== item.details.areaRangeSqft.min
                                    ? `–${item.details.areaRangeSqft.max}` : ""} sqft
                                </span>
                              )}
                            </div>
                            {item.details?.priceRange?.min != null && (
                              <span className={`text-sm font-bold flex-shrink-0 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                                ₹{(item.details.priceRange.min / 100000).toLocaleString()}
                                {item.details.priceRange.max && item.details.priceRange.max !== item.details.priceRange.min
                                  ? `–${(item.details.priceRange.max / 100000).toLocaleString()}` : ""}L
                              </span>
                            )}
                          </div>
                          {/* Floor plan row */}
                          {item.details?.floorPlanFile && (
                            <div className={`px-3 pb-2.5 border-t ${isDark ? "border-slate-600" : "border-gray-100"}`}>
                              <a href={item.details.floorPlanFile} target="_blank" rel="noreferrer"
                                className={`mt-2 flex items-center gap-2.5 p-2 rounded-lg transition ${
                                  isDark ? "bg-slate-600/60 hover:bg-slate-600" : "bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200"
                                }`}>
                                <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                                  isPdf(item.details.floorPlanFile)
                                    ? isDark ? "bg-red-900/50" : "bg-red-100"
                                    : isDark ? "bg-indigo-900/50" : "bg-indigo-100"
                                }`}>
                                  <FileText className={`w-3.5 h-3.5 ${
                                    isPdf(item.details.floorPlanFile)
                                      ? isDark ? "text-red-400" : "text-red-600"
                                      : isDark ? "text-indigo-400" : "text-indigo-600"
                                  }`} />
                                </div>
                                <span className={`text-xs font-medium flex-1 ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                                  Floor Plan — {item.type}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  isPdf(item.details.floorPlanFile)
                                    ? isDark ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-600"
                                    : isDark ? "bg-indigo-900/40 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                                }`}>
                                  {isPdf(item.details.floorPlanFile) ? "PDF" : "Image"}
                                </span>
                                <ExternalLink className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-slate-500" : "text-gray-400"}`} />
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* ── Amenities ── */}
              {projectDetails.amenities?.length > 0 && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    Amenities ({projectDetails.amenities.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.amenities.map((a, i) => (
                      <span key={i} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-white border border-gray-200 text-gray-700"}`}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}



              {/* ── eBrochure ── */}
              {projectDetails.eBrochure && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <FileText className="w-3.5 h-3.5" /> eBrochure / Project PDF
                  </h4>
                  <a href={projectDetails.eBrochure} target="_blank" rel="noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl border transition ${isDark ? "bg-slate-700/50 border-slate-600 hover:bg-slate-700" : "bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? "bg-red-900/40" : "bg-red-100"}`}>
                      <FileText className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Project Brochure</p>
                      <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>Tap to open PDF in new tab</p>
                    </div>
                    <ExternalLink className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  </a>
                </div>
              )}

              {/* ── Images ── */}
              {(projectDetails.uploadImage?.length > 0 || projectDetails.otherImages?.length > 0) && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <Image className="w-3.5 h-3.5" /> Photos ({(projectDetails.uploadImage?.length || 0) + (projectDetails.otherImages?.length || 0)})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Main / Cover Images */}
                    {/* {projectDetails.uploadImage?.map((url, i) => (
                      <a key={`main-${i}`} href={url} target="_blank" rel="noreferrer" className="relative aspect-square rounded-xl overflow-hidden block group">
                        <img src={url} alt={`main-${i}`} className="w-full h-full object-cover transition group-hover:brightness-90" onError={e => { e.target.style.display = "none"; }} />
                        {i === 0 && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-lg font-medium">Cover</div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))} */}
                    {/* Other / Gallery Images */}
                    {projectDetails.otherImages?.map((url, i) => (
                      <a key={`other-${i}`} href={url} target="_blank" rel="noreferrer" className="relative aspect-square rounded-xl overflow-hidden block group">
                        <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover transition group-hover:brightness-90" onError={e => { e.target.style.display = "none"; }} />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition">
                          <ExternalLink className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Key Highlights ── */}
              {projectDetails.projectFeature?.keyHighlights?.length > 0 && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <Layers className="w-3.5 h-3.5" /> Key Highlights
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.projectFeature.keyHighlights.map((h, i) => (
                      <span key={i} className={`text-xs px-3 py-1.5 rounded-full font-medium ${isDark ? "bg-indigo-900/40 text-indigo-300" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
                        ✦ {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Location Map ── */}
              {(projectDetails.projectLocation?.latitude && projectDetails.projectLocation?.longitude) && (
                <div className={`rounded-xl overflow-hidden border ${isDark ? "border-slate-700" : "border-gray-200"}`}>
                  <div className={`flex items-center justify-between px-4 py-2.5 ${isDark ? "bg-slate-800" : "bg-gray-50"}`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                      <Map className="w-3.5 h-3.5" /> Location Map
                    </h4>
                    <a
                      href={`https://www.google.com/maps?q=${projectDetails.projectLocation.latitude},${projectDetails.projectLocation.longitude}`}
                      target="_blank" rel="noreferrer"
                      className={`text-xs flex items-center gap-1 ${isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-700"}`}
                    >
                      <ExternalLink className="w-3 h-3" /> Open in Maps
                    </a>
                  </div>
                  <iframe
                    title="project-location"
                    className="w-full border-0"
                    height="200"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${projectDetails.projectLocation.latitude},${projectDetails.projectLocation.longitude}&z=15&output=embed&hl=en`}
                  />
                </div>
              )}

              {/* ── Connectivity (String array) ── */}
              {projectDetails.connectivity?.length > 0 && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800 border border-slate-700" : "bg-gray-50 border border-gray-200"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                    <Compass className="w-3.5 h-3.5" /> Connectivity
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {projectDetails.connectivity.map((item, i) => (
                      <span key={i} className={`text-xs px-3 py-1.5 rounded-lg ${isDark ? "bg-slate-700 text-slate-300" : "bg-white border border-gray-200 text-gray-700"}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin note */}
              {projectDetails.adminNote && (
                <div className={`rounded-xl p-4 ${isDark ? "bg-slate-700/50 border border-slate-600" : "bg-blue-50 border border-blue-100"}`}>
                  <h4 className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isDark ? "text-slate-300" : "text-blue-700"}`}>Admin Note</h4>
                  <p className={`text-sm ${isDark ? "text-slate-300" : "text-blue-800"}`}>{projectDetails.adminNote}</p>
                </div>
              )}

            </div>
          ) : null}

          {/* ── Action Buttons ── */}
          {projectDetails && (
            <div className={`p-4 border-t ${isDark ? "border-slate-700 bg-slate-900/50" : "border-gray-200 bg-gray-50"}`}>

              {/* Row 1: Approve / Reject */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={actionLoading || projectDetails.adminStatus === "ACTIVE"}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  {projectDetails.adminStatus === "ACTIVE" ? "Approved ✓" : "Approve"}
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  disabled={actionLoading || projectDetails.adminStatus === "REJECTED"}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <XCircle className="w-4 h-4" />
                  {projectDetails.adminStatus === "REJECTED" ? "Rejected ✓" : "Reject"}
                </button>
              </div>

              {/* Row 2: Feature / Delete */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleToggleFeatured}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    projectDetails.isFeatured
                      ? isDark ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/80" : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Star className={`w-4 h-4 ${projectDetails.isFeatured ? "fill-current" : ""}`} />
                  {projectDetails.isFeatured ? "Unfeature" : "Feature"}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isDark ? "bg-red-900/50 text-red-400 hover:bg-red-900/80" : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  {actionLoading ? "…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Empty state (no project selected) ── */
        <div className={`hidden lg:flex flex-1 flex-col items-center justify-center ${isDark ? "bg-slate-800/20" : "bg-gray-50"}`}>
          <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${isDark ? "bg-slate-800" : "bg-white border border-gray-200"}`}>
            <MessageCircle className={`w-14 h-14 ${isDark ? "text-slate-600" : "text-gray-300"}`} />
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Click Project To View</h3>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
            Select a project from the list to view details and manage it
          </p>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`rounded-2xl border p-6 w-full max-w-md shadow-2xl ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Reject Project</h3>
            <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-gray-500"}`}>Provide a reason (optional — sent to the user):</p>
            <textarea
              rows={4}
              className={`w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400" : "bg-white border-gray-200"
              }`}
              placeholder="e.g. Incomplete information, invalid RERA number, duplicate listing…"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(false); setRejectReason(""); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition ${
                  isDark ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >Cancel</button>
              <button
                onClick={() => handleStatusChange("REJECTED", { rejectionReason: rejectReason })}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-60"
              >{actionLoading ? "Rejecting…" : "Confirm Reject"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
