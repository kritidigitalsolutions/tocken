import { useEffect, useState, useCallback } from "react";
import api from "../../../api/api";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    page: 1,
    limit: 20
  });
  const { isDark } = useTheme();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search);
      params.append("page", filters.page);
      params.append("limit", filters.limit);

      const res = await api.get(`/admin/leads?${params.toString()}`);
      console.log("ADMIN LEADS RESPONSE:", res.data);
      setLeads(res?.data?.data || []);
      setStats(res?.data?.stats || null);
    } catch (err) {
      console.error("ERROR FETCHING LEADS", err);
      alert("Failed to fetch leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.page, filters.search, filters.limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleMarkSpam = async (leadId, isSpam) => {
    try {
      await api.patch(`/admin/leads/${leadId}/spam`, { isSpam });
      console.log(`Lead marked as ${isSpam ? 'spam' : 'not spam'}`);
      fetchLeads();
    } catch (err) {
      console.error("Error marking spam:", err);
      alert("Failed to update lead");
    }
  };

  const getSourceBadgeColor = (source) => {
    const sourceMap = {
      "CALL": isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800",
      "WHATSAPP": isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800",
      "FORM": isDark ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-800"
    };
    return sourceMap[source] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getStatusColor = (status) => {
    const statusMap = {
      "NEW": isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800",
      "CONTACTED": isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800",
      "FOLLOW_UP": isDark ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800",
      "CLOSED": isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800",
      "LOST": isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"
    };
    return statusMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Leads Management</h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage all customer leads and inquiries</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats?.total || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>New</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats?.new || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Contacted</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{stats?.contacted || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Follow-up</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{stats?.followUp || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Closed</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>{stats?.closed || 0}</p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Lost</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stats?.lost || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-6 border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              placeholder="Search by buyer name or phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${isDark
                ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </form>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className={`px-4 py-2 rounded-lg border ${isDark
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="CLOSED">Closed</option>
            <option value="LOST">Lost</option>
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {!leads || leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No leads found</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {filters.status || filters.search ? 'Try adjusting your filters' : 'New leads will appear here when customers inquire'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Property</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Owner</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Buyer</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Phone</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Source</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Date</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className={`border-b transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lead.propertyId?.location?.locality || "N/A"}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {lead.propertyId?.location?.city} • {lead.propertyId?.propertyCategory}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lead.ownerId?.name || `${lead.ownerId?.firstName} ${lead.ownerId?.lastName}`}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {lead.ownerId?.userType}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {lead.buyerName}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`tel:${lead.phone}`}
                        className={`transition ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSourceBadgeColor(lead.source)}`}>
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleMarkSpam(lead._id, !lead.isSpam)}
                        className={`px-3 py-1 rounded text-sm font-medium transition ${lead.isSpam
                          ? isDark ? 'bg-green-900/50 text-green-300 hover:bg-green-900' : 'bg-green-100 text-green-800 hover:bg-green-200'
                          : isDark ? 'bg-red-900/50 text-red-300 hover:bg-red-900' : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                      >
                        {lead.isSpam ? 'Unmark Spam' : 'Mark Spam'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
