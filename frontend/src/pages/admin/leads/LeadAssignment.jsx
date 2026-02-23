import { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import Loader from "../../../components/common/Loader";
import { assignLead, assignLeadBulk, getUserQuota, getSubscriptionUsersCount } from "../../../api/admin.lead.api";
import api from "../../../api/api";

const LeadAssignment = () => {
  const [formData, setFormData] = useState({
    assignedTo: "",
    buyerName: "",
    phone: "",
    city: "",
    requirement: "",
    leadType: "BUYER",
    propertyId: ""
  });
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedUserQuota, setSelectedUserQuota] = useState(null);
  const [subscriptionUsersCount, setSubscriptionUsersCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    fetchUsers();
    fetchProperties();
    fetchSubscriptionUsersCount();
  }, []);

  const fetchUsers = async () => {
    try {
      // Try multiple endpoints to make sure we get users
      let res;
      try {
        res = await api.get("/admin/users");
        console.log("Admin users API response:", res.data);
        const allUsers = res.data?.users || res.data?.data || [];
        
        // Filter for relevant user types
        const filteredUsers = allUsers.filter(user => 
          ['AGENT', 'BUILDER', 'INDIVIDUAL'].includes(user.userType)
        );
        
        console.log("Filtered users:", filteredUsers);
        setUsers(filteredUsers);
      } catch (error) {
        console.log("Admin users API failed, trying alternative...");
        res = await api.get("/users");
        console.log("Users via /users endpoint:", res.data);
        
        const allUsers = res.data?.users || res.data?.data || [];
        const filteredUsers = allUsers.filter(user => 
          ['AGENT', 'BUILDER', 'INDIVIDUAL'].includes(user.userType)
        );
        
        setUsers(filteredUsers);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await api.get("/admin/properties?status=ACTIVE&limit=100");
      setProperties(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  const fetchSubscriptionUsersCount = async () => {
    try {
      const res = await getSubscriptionUsersCount();
      setSubscriptionUsersCount(res.data?.data);
      console.log("Subscription users count:", res.data?.data);
    } catch (err) {
      console.error("Error fetching subscription users count:", err);
      setSubscriptionUsersCount(null);
    }
  };

  const handleUserChange = async (userId) => {
    setFormData(prev => ({ ...prev, assignedTo: userId }));
    
    // If bulk assignment is selected, clear the quota info
    if (userId === "ALL_SUBSCRIPTION_USERS") {
      setSelectedUserQuota(null);
      return;
    }
    
    if (userId) {
      try {
        setLoading(true);
        const res = await getUserQuota(userId);
        setSelectedUserQuota(res.data?.data);
      } catch (err) {
        console.error("Error fetching user quota:", err);
        setSelectedUserQuota(null);
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedUserQuota(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.assignedTo || !formData.buyerName || !formData.phone || !formData.city || !formData.requirement) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      
      // Check if bulk assignment is selected
      const isBulkAssignment = formData.assignedTo === "ALL_SUBSCRIPTION_USERS";
      
      const payload = {
        ...formData,
        propertyId: formData.propertyId || null
      };
      
      // Remove assignedTo for bulk assignment as it's not needed
      if (isBulkAssignment) {
        delete payload.assignedTo;
      }
      
      let res;
      if (isBulkAssignment) {
        res = await assignLeadBulk(payload);
      } else {
        res = await assignLead(payload);
      }
      
      // Show detailed result for bulk assignment
      if (isBulkAssignment) {
        const { successfulAssignments, failedAssignments, ineligibleUsers } = res.data.data;
        let message = `✅ Lead assigned to ${successfulAssignments} users!\n`;
        
        if (failedAssignments > 0) {
          message += `\n⚠️ Failed: ${failedAssignments} users`;
        }
        
        if (ineligibleUsers > 0) {
          message += `\n❌ Skipped: ${ineligibleUsers} users (no quota)`;
        }
        
        alert(message);
      } else {
        alert("Lead assigned successfully! 🎉");
      }
      
      // Reset form
      setFormData({
        assignedTo: "",
        buyerName: "",
        phone: "",
        city: "",
        requirement: "",
        leadType: "BUYER",
        propertyId: ""
      });
      setSelectedUserQuota(null);
      
      // Refresh subscription users count if it was a bulk assignment
      if (isBulkAssignment) {
        await fetchSubscriptionUsersCount();
      }
      
      console.log("Lead assigned:", res.data);
      
    } catch (err) {
      console.error("Error assigning lead:", err);
      alert(err.response?.data?.message || "Failed to assign lead");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = formData.assignedTo === "ALL_SUBSCRIPTION_USERS" 
    ? { isBulkAssignment: true } 
    : users.find(u => u._id === formData.assignedTo);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Assign Lead to User
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Assign actual buyer/renter contacts to users
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Lead Assignment Form */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Lead Details
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* User Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Assign To User *
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => handleUserChange(e.target.value)}
                    required
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">
                      {users.length === 0 ? 'Loading users...' : 'Select User'}
                    </option>
                    
                    {/* Bulk Assignment Option */}
                    {subscriptionUsersCount && subscriptionUsersCount.eligibleUsers > 0 && (
                      <option value="ALL_SUBSCRIPTION_USERS" className="font-bold">
                        All Subscription Users ({subscriptionUsersCount.eligibleUsers} users)
                      </option>
                    )}
                    
                    {users.length > 0 ? (
                      users.map(user => {
                        const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                        const displayText = `${userName} (${user.userType}) - ID: ${user._id.slice(-6)} - ${user.phone || 'No Phone'}`;
                        
                        return (
                          <option key={user._id} value={user._id}>
                            {displayText}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>No users found</option>
                    )}
                  </select>
                  {users.length === 0 && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Loading users...
                    </p>
                  )}
                  {users.length > 0 && (
                    <p className={`text-sm mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      ✓ {users.length} users loaded successfully
                    </p>
                  )}
                </div>

                {/* Lead Type */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Lead Type *
                  </label>
                  <select
                    value={formData.leadType}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadType: e.target.value }))}
                    required
                    className={`w-full p-3 border rounded-lg ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="BUYER">Buyer</option>
                    <option value="RENTER">Renter</option>
                  </select>
                </div>

                {/* Buyer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Buyer/Renter Name *
                    </label>
                    <input
                      type="text"
                      value={formData.buyerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, buyerName: e.target.value }))}
                      required
                      placeholder="e.g., Rahul Sharma"
                      className={`w-full p-3 border rounded-lg ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      required
                      placeholder="e.g., 9876543210"
                      className={`w-full p-3 border rounded-lg ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                    placeholder="e.g., Noida"
                    className={`w-full p-3 border rounded-lg ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Requirement Description *
                  </label>
                  <textarea
                    value={formData.requirement}
                    onChange={(e) => setFormData(prev => ({ ...prev, requirement: e.target.value }))}
                    required
                    placeholder="e.g., 2BHK apartment for family, budget 30-40 lakhs"
                    rows={3}
                    className={`w-full p-3 border rounded-lg ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Property Reference (Optional) */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    Property Reference (Optional)
                  </label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyId: e.target.value }))}
                    className={`w-full p-3 border rounded-lg ${isDark 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">No property reference</option>
                    {properties.map(property => (
                      <option key={property._id} value={property._id}>
                        {property.title} - {property.location?.city}, {property.location?.locality}
                      </option>
                    ))}
                  </select>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Property is just a reference, not required. Lead exists independently.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting || !selectedUser}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                  >
                    {submitting ? "Assigning Lead..." : "Assign Lead"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        assignedTo: "",
                        buyerName: "",
                        phone: "",
                        city: "",
                        requirement: "",
                        leadType: "BUYER",
                        propertyId: ""
                      });
                      setSelectedUserQuota(null);
                    }}
                    className={`px-6 py-3 border rounded-lg transition ${isDark 
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Clear
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* User Info & Quota */}
          <div>
            <div className={`rounded-lg p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Selected User Info
              </h2>

              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : selectedUser?.isBulkAssignment ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
                    <h3 className={`font-semibold text-lg mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>
                      🎯 Bulk Assignment
                    </h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                      This lead will be assigned to all users with active subscription plans
                    </p>
                    
                    {subscriptionUsersCount && (
                      <div className="space-y-2 text-sm">
                        <div className={`flex justify-between p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                          <span className="font-medium">Total Users with Plans:</span>
                          <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {subscriptionUsersCount.totalUsersWithPlans}
                          </span>
                        </div>
                        <div className={`flex justify-between p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                          <span className="font-medium">Eligible Users:</span>
                          <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            {subscriptionUsersCount.eligibleUsers}
                          </span>
                        </div>
                        <div className={`flex justify-between p-2 rounded ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                          <span className="font-medium">Users Out of Quota:</span>
                          <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {subscriptionUsersCount.ineligibleUsers}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={`mt-4 p-3 rounded text-xs ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>
                      <p className="font-medium mb-1">ℹ️ How it works:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Lead will be sent to all eligible users</li>
                        <li>Users without quota will be skipped</li>
                        <li>Each user's quota will be consumed</li>
                        <li>All users will receive notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : selectedUser ? (
                <div className="space-y-4">
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.name}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {selectedUser.phone} • {selectedUser.email}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                      selectedUser.userType === 'AGENT' ? 'bg-emerald-100 text-emerald-800' :
                      selectedUser.userType === 'BUILDER' ? 'bg-orange-100 text-orange-800' :
                      'bg-cyan-100 text-cyan-800'
                    }`}>
                      {selectedUser.userType}
                    </span>
                  </div>

                  {selectedUserQuota ? (
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Plan & Quota Details
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Plan:</span>{' '}
                          {selectedUserQuota.plan?.name || "No Plan"}
                        </div>
                        <div>
                          <span className="font-medium">Monthly Limit:</span>{' '}
                          {selectedUserQuota.plan?.leadsPerMonth === 0 
                            ? "Unlimited" 
                            : (selectedUserQuota.plan?.leadsPerMonth || 0)
                          }
                        </div>
                        <div>
                          <span className="font-medium">Consumed:</span>{' '}
                          {selectedUserQuota.quota?.consumed || 0}
                        </div>
                        <div>
                          <span className="font-medium">Remaining:</span>{' '}
                          <span className={`font-medium ${
                            selectedUserQuota.quota?.remaining === 0 
                              ? 'text-red-600' 
                              : selectedUserQuota.quota?.remaining === "Unlimited"
                              ? 'text-green-600'
                              : selectedUserQuota.quota?.remaining > 10
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}>
                            {selectedUserQuota.quota?.remaining}
                          </span>
                        </div>
                      </div>

                      {selectedUserQuota.quota?.remaining === 0 && (
                        <div className={`mt-3 p-2 rounded text-xs ${isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800'}`}>
                          ⚠️ User has exhausted their quota!
                        </div>
                      )}

                      {!selectedUserQuota.plan && (
                        <div className={`mt-3 p-2 rounded text-xs ${isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
                          ⚠️ User has no active plan!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg text-center ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        Loading quota details...
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`p-8 text-center ${isDark ? 'bg-slate-700' : 'bg-gray-50'} rounded-lg`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Select a user to view their details and quota information
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className={`mt-6 rounded-lg p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Quick Tips
              </h3>
              
              <div className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                <div>• Lead = Actual buyer/renter contact</div>
                <div>• Property reference is optional</div>
                <div>• Check user quota before assignment</div>
                <div>• Users with unlimited plans can receive unlimited leads</div>
                <div>• Lead assignment consumes user quota</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LeadAssignment;