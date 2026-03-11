import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import { getAllLeads } from "../../../api/admin.lead.api";

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "",
    assignedTo: "",
    page: 1,
    limit: 20
  });
  const { isDark } = useTheme();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;
      params.page = filters.page;
      params.limit = filters.limit;

      const res = await getAllLeads(params);
      console.log("ASSIGNED LEADS RESPONSE:", res.data);
      setLeads(res?.data?.data || []);
      setStats(res?.data?.stats || null);
    } catch (err) {
      console.error("ERROR FETCHING ASSIGNED LEADS", err);
      alert("Failed to fetch assigned leads");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.assignedTo, filters.page, filters.limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLeads();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      "NEW": isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800",
      "CONTACTED": isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800",
      "CLOSED": isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800"
    };
    return statusMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getLeadTypeColor = (leadType) => {
    const typeMap = {
      "BUYER": isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800",
      "RENTER": isDark ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-800"
    };
    return typeMap[leadType] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getUserTypeColor = (userType) => {
    const typeMap = {
      "AGENT": isDark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-100 text-emerald-800",
      "BUILDER": isDark ? "bg-orange-900/50 text-orange-300" : "bg-orange-100 text-orange-800",
      "INDIVIDUAL": isDark ? "bg-cyan-900/50 text-cyan-300" : "bg-cyan-100 text-cyan-800"
    };
    return typeMap[userType] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  if (loading && !leads.length) return <Loader />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Assigned Leads Overview
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          View all leads assigned to users (buyer/renter contacts)
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Assigned</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {stats?.total || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>New</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {stats?.new || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Contacted</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {stats?.contacted || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Closed</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {stats?.closed || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex gap-4 items-center flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className={`px-4 py-2 rounded-lg border ${isDark 
              ? 'bg-slate-700 border-slate-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Refresh
          </button>

          <div className="ml-auto">
            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Total: {leads.length} leads
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {!leads || leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              No assigned leads found
            </p>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {filters.status ? 'Try adjusting your filters' : 'Assigned leads will appear here when admin assigns buyer/renter contacts to users'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Assigned To
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Lead Type
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Buyer/Renter Details
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Requirement
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Property Ref
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Assigned Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className={`border-b transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => lead.assignedTo?._id && navigate(`/admin/users?userId=${lead.assignedTo._id}`)}
                        className="text-left group"
                      >
                        <div className={`font-medium group-hover:text-indigo-500 transition ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {lead.assignedTo?.name || "N/A"}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {lead.assignedTo?.phone || "N/A"}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getUserTypeColor(lead.assignedTo?.userType)}`}>
                          {lead.assignedTo?.userType || "N/A"}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getLeadTypeColor(lead.leadType)}`}>
                        {lead.leadType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lead.buyerName}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <a
                          href={`tel:${lead.phone}`}
                          className={`transition ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          {lead.phone}
                        </a>
                      </div>
                      <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        📍 {lead.city}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lead.requirement}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.propertyId ? (
                        <div>
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {lead.propertyId?.title || "Property"}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {lead.propertyId?.location?.city}, {lead.propertyId?.location?.locality}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                          No reference
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {new Date(lead.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-xs">
                        {new Date(lead.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Info */}
      {/* <div className={`mt-8 p-4 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          🔥 New Clean Lead System
        </h3>
        <div className={`text-sm space-y-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          <div>• ✅ Lead = Actual buyer/renter contact (not property)</div>
          <div>• ✅ Admin assigns real buyer/renter details to users</div>
          <div>• ✅ Property is only optional reference</div>
          <div>• ✅ Users manage lead status (NEW → CONTACTED → CLOSED)</div>
          <div>• ❌ No more property-based leads</div>
        </div>
      </div> */}
    </div>
  );
};

export default Leads;