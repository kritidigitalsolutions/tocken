import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import { 
  getAllLeadRequests, 
  approveLeadRequest, 
  rejectLeadRequest, 
  getUserQuota 
} from "../../../api/admin.lead.api";

const LeadRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: "PENDING",
    page: 1,
    limit: 20
  });
  const [actionLoading, setActionLoading] = useState({});
  const [userQuotaModal, setUserQuotaModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const { isDark } = useTheme();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllLeadRequests(filters);
      console.log("LEAD REQUESTS RESPONSE:", res.data);
      setRequests(res?.data?.data || []);
      setStats(res?.data?.stats || null);
    } catch (err) {
      console.error("ERROR FETCHING LEAD REQUESTS", err);
      alert("Failed to fetch lead requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      setActionLoading(prev => ({ ...prev, [requestId]: true }));
      
      const adminNotes = prompt("Add approval notes (optional):");
      
      await approveLeadRequest(requestId, { 
        adminNotes: adminNotes || "Approved by admin" 
      });
      
      alert("Lead request approved successfully!");
      fetchRequests();
    } catch (err) {
      console.error("Error approving request:", err);
      alert(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [rejectModal.id]: true }));
      
      await rejectLeadRequest(rejectModal.id, {
        rejectionReason: rejectModal.reason
      });
      
      alert("Lead request rejected successfully!");
      setRejectModal(null);
      fetchRequests();
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(prev => ({ ...prev, [rejectModal.id]: false }));
    }
  };

  const checkUserQuota = async (userId, userName) => {
    try {
      setLoading(true);
      const res = await getUserQuota(userId);
      setUserQuotaModal({
        userName,
        data: res.data?.data
      });
    } catch (err) {
      console.error("Error fetching user quota:", err);
      alert("Failed to fetch user quota");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      "PENDING": isDark ? "bg-yellow-900/50 text-yellow-300" : "bg-yellow-100 text-yellow-800",
      "APPROVED": isDark ? "bg-green-900/50 text-green-300" : "bg-green-100 text-green-800",
      "REJECTED": isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-800"
    };
    return statusMap[status] || (isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800");
  };

  const getLeadTypeColor = (leadType) => {
    const typeMap = {
      "BUYERS": isDark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-800",
      "RENTERS": isDark ? "bg-purple-900/50 text-purple-300" : "bg-purple-100 text-purple-800",
      "BOTH": isDark ? "bg-indigo-900/50 text-indigo-300" : "bg-indigo-100 text-indigo-800"
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

  if (loading && !requests.length) return <Loader />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Lead Requests Management
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Review and approve user lead requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Pending</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {stats?.pending || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Approved</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {stats?.approved || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Rejected</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {stats?.rejected || 0}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>This Month</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {requests.filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth()).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex gap-4 items-center">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className={`px-4 py-2 rounded-lg border ${isDark 
              ? 'bg-slate-700 border-slate-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {!requests || requests.length === 0 ? (
          <div className="p-12 text-center">
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No lead requests found</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              {filters.status ? 'Try adjusting your filters' : 'New lead requests will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    User
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Lead Type
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Cities & Properties
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Plan & Quota
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Date
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request._id} className={`border-b transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => request.requestedBy?._id && navigate(`/admin/users?userId=${request.requestedBy._id}`)}
                        className="text-left group"
                      >
                        <div className={`font-medium group-hover:text-indigo-500 transition ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {request.requestedBy?.name || "N/A"}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {request.requestedBy?.phone}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getUserTypeColor(request.requestedBy?.userType)}`}>
                          {request.requestedBy?.userType}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getLeadTypeColor(request.leadType)}`}>
                        {request.leadType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <strong>Cities:</strong> {request.dealingCities.join(", ")}
                      </div>
                      <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <strong>Types:</strong> {request.propertyTypes.join(", ")}
                      </div>
                      {request.budgetRange?.min > 0 && (
                        <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          <strong>Budget:</strong> ₹{(request.budgetRange.min / 100000).toFixed(1)}L - ₹{(request.budgetRange.max / 100000).toFixed(1)}L
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <strong>Plan:</strong> {request.requestedBy?.activePlan?.planName || "No Plan"}
                      </div>
                      <div className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        <strong>Quota:</strong> {request.requestedBy?.leadQuota?.consumed || 0}/{request.requestedBy?.activePlan?.leadsPerMonth || 0}
                      </div>
                      <button
                        onClick={() => checkUserQuota(request.requestedBy?._id, request.requestedBy?.name)}
                        className={`text-xs mt-1 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition`}
                      >
                        View Details
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      {request.rejectionReason && (
                        <div className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                          {request.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {new Date(request.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-xs">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {request.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(request._id)}
                              disabled={actionLoading[request._id]}
                              className={`px-3 py-1 rounded text-sm font-medium transition ${isDark 
                                ? 'bg-green-900/50 text-green-300 hover:bg-green-900 disabled:opacity-50' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50'
                              }`}
                            >
                              {actionLoading[request._id] ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => setRejectModal({ id: request._id, reason: "" })}
                              disabled={actionLoading[request._id]}
                              className={`px-3 py-1 rounded text-sm font-medium transition ${isDark 
                                ? 'bg-red-900/50 text-red-300 hover:bg-red-900 disabled:opacity-50' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50'
                              }`}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === "APPROVED" && (
                          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            Ready for lead assignment
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Quota Modal */}
      {userQuotaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              User Quota Details - {userQuotaModal.userName}
            </h3>
            
            <div className="space-y-3">
              <div>
                <span className="font-medium">User Type:</span> {userQuotaModal.data?.userType}
              </div>
              <div>
                <span className="font-medium">Plan:</span> {userQuotaModal.data?.plan?.name || "No Plan"}
              </div>
              <div>
                <span className="font-medium">Monthly Limit:</span> {
                  userQuotaModal.data?.plan?.leadsPerMonth === 0 
                    ? "Unlimited" 
                    : (userQuotaModal.data?.plan?.leadsPerMonth || 0)
                }
              </div>
              <div>
                <span className="font-medium">Consumed:</span> {userQuotaModal.data?.quota?.consumed || 0}
              </div>
              <div>
                <span className="font-medium">Remaining:</span> {userQuotaModal.data?.quota?.remaining || 0}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setUserQuotaModal(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Reject Lead Request
            </h3>
            
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Enter rejection reason..."
              className={`w-full p-3 border rounded-lg ${isDark 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectModal.reason.trim() || actionLoading[rejectModal.id]}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg transition"
              >
                {actionLoading[rejectModal.id] ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadRequests;