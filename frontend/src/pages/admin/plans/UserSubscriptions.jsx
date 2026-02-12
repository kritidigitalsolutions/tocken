import { useEffect, useState, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserPlus, 
  AlertTriangle
} from "lucide-react";
import Loader from "../../../components/common/Loader";
import api from "../../../api/api";

const UserSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    userType: '',
    planId: '',
    page: 1,
    limit: 20
  });
  const { isDark } = useTheme();

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get(`/admin/plans/subscriptions?${params.toString()}`);
      setSubscriptions(res.data.data || []);
      setStats(res.data.stats || {});
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchPlans = useCallback(async () => {
    try {
      console.log("🔄 Fetching plans...");
      console.log("🔑 Token exists:", !!localStorage.getItem("adminToken"));
      const res = await api.get('/admin/plans');
      console.log("📋 Plans response:", res.data);
      console.log("✅ Plans response success:", res.data.success);
      setPlans(res.data.plans || []);
      console.log("📝 Plans set to state:", res.data.plans?.length || 0, "plans");
    } catch (error) {
      console.error("❌ Error fetching plans:", error.response?.data || error.message);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
  }, [fetchSubscriptions, fetchPlans]);

  const assignPlan = async (userId, planId, validityDays) => {
    try {
      await api.post('/admin/plans/assign', {
        userId,
        planId,
        validityDays: parseInt(validityDays)
      });
      
      setShowAssignModal(false);
      setSelectedUser(null);
      fetchSubscriptions();
      
      alert("Plan assigned successfully!");
    } catch (error) {
      console.error("Error assigning plan:", error);
      alert("Failed to assign plan");
    }
  };

  const getStatusBadge = (user) => {
    const hasActivePlan = user.activePlan && 
      user.planSubscription && 
      user.planSubscription.isActive &&
      new Date(user.planSubscription.endDate) > new Date();

    if (!user.activePlan) {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
        }`}>
          <XCircle size={12} />
          No Plan
        </span>
      );
    }

    if (hasActivePlan) {
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'
        }`}>
          <CheckCircle size={12} />
          Active
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'
      }`}>
        <AlertTriangle size={12} />
        Expired
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) return <Loader />;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          User Subscriptions
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Manage user plan subscriptions and assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
            }`}>
              <Users size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Total Users</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
            }`}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Active Plans</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.withActivePlan || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
            }`}>
              <Clock size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Expired</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.expired || 0}
              </p>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <XCircle size={24} />
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No Plan</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stats?.noPlan || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-6 border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            className={`px-4 py-2 rounded-lg border ${isDark
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">All Status</option>
            <option value="active">Active Plans</option>
            <option value="expired">Expired Plans</option>
            <option value="no-plan">No Plan</option>
          </select>

          <select
            value={filters.userType}
            onChange={(e) => setFilters({...filters, userType: e.target.value, page: 1})}
            className={`px-4 py-2 rounded-lg border ${isDark
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">All User Types</option>
            <option value="AGENT">Agents</option>
            <option value="BUILDER">Builders</option>
            <option value="INDIVIDUAL">Individuals</option>
            <option value="SELLER">Sellers</option>
            <option value="LANDLORD">Landlords</option>
          </select>

          <select
            value={filters.planId}
            onChange={(e) => setFilters({...filters, planId: e.target.value, page: 1})}
            className={`px-4 py-2 rounded-lg border ${isDark
              ? 'bg-slate-700 border-slate-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">All Plans</option>
            {plans.map(plan => (
              <option key={plan._id} value={plan._id}>
                {plan.planName} ({plan.userType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className={`rounded-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              No users found
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
                    Type
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Current Plan
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Valid Until
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Lead Quota
                  </th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((user) => (
                  <tr key={user._id} className={`border-b transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {user.name || `${user.firstName} ${user.lastName}`}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {user.userType}
                    </td>
                    <td className="px-6 py-4">
                      {user.activePlan ? (
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.activePlan.planName}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            ₹{user.activePlan.price}
                          </div>
                        </div>
                      ) : (
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          No Plan
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {user.planSubscription?.endDate ? formatDate(user.planSubscription.endDate) : 'N/A'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {user.leadQuota ? (
                        <span>
                          {user.leadQuota.consumed || 0}/{user.leadQuota.limit || 0}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
                      >
                        <UserPlus size={14} />
                        Assign Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Plan Modal */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Assign Plan to {selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const planId = e.target.planId.value;
              const validityDays = e.target.validityDays.value;
              if (planId && validityDays) {
                assignPlan(selectedUser._id, planId, validityDays);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Select Plan
                  </label>
                  <select
                    name="planId"
                    required
                    className={`w-full px-4 py-2 rounded-lg border ${isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Choose a plan</option>
                    {(() => {
                      console.log("🔍 Filtering plans for user:", selectedUser.userType);
                      console.log("📋 All plans:", plans);
                      const filteredPlans = plans.filter(plan => plan.userType === selectedUser.userType);
                      console.log("🎯 Filtered plans for", selectedUser.userType, ":", filteredPlans);
                      return filteredPlans.map(plan => (
                        <option key={plan._id} value={plan._id}>
                          {plan.planName} - ₹{plan.price} ({plan.validityDays} days)
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Validity Days
                  </label>
                  <input
                    type="number"
                    name="validityDays"
                    placeholder="30"
                    required
                    className={`w-full px-4 py-2 rounded-lg border ${isDark
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
                >
                  Assign Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUser(null);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg transition ${isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSubscriptions;