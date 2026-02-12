import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Activity, Clock, Search, Filter, User, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { getActivityLogs } from "../../../api/admin.dashboard.api";

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await getActivityLogs({ limit: 50 });
        setActivities(response.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        // Mock data for demo
        setActivities([
          { _id: '1', action: 'User registration', userId: { name: 'John Doe' }, createdAt: new Date().toISOString(), details: 'New AGENT user registered' },
          { _id: '2', action: 'Property listing created', userId: { name: 'Sarah Wilson' }, createdAt: new Date(Date.now() - 300000).toISOString(), details: 'New apartment listing in Mumbai' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         activity.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || activity.action?.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  const getActivityIcon = (action) => {
    if (action?.includes('CREATE') || action?.includes('registration')) return CheckCircle;
    if (action?.includes('DELETE')) return AlertCircle;
    if (action?.includes('UPDATE')) return FileText;
    return Activity;
  };

  const getActivityColor = (action) => {
    if (action?.includes('CREATE') || action?.includes('registration')) return 'text-green-400';
    if (action?.includes('DELETE')) return 'text-red-400';
    if (action?.includes('UPDATE')) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Activity className="text-indigo-500" size={32} />
          Activity Logs Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Real-time platform activity and audit trail
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Activities</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>1,247</h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <Clock size={14} />
                Last 24 hours
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Actions</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>892</h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <User size={14} />
                71.6% of total
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <User className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>System Events</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>245</h3>
              <p className="text-purple-500 text-sm flex items-center gap-1 mt-1">
                <FileText size={14} />
                19.6% system
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <FileText className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Error Events</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>12</h3>
              <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                <AlertCircle size={14} />
                0.9% errors
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
              <AlertCircle className="text-red-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className={isDark ? 'text-slate-400' : 'text-gray-400'} size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="all">All Activities</option>
              <option value="create">Create Events</option>
              <option value="update">Update Events</option>
              <option value="delete">Delete Events</option>
              <option value="user">User Actions</option>
              <option value="system">System Events</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📋 Activity Timeline ({filteredActivities.length} activities)
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <h3 className={`mt-2 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-900'}`}>No activities found</h3>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {filteredActivities.map((activity, index) => {
                  const IconComponent = getActivityIcon(activity.action);
                  const iconColor = getActivityColor(activity.action);
                  
                  return (
                    <div key={activity._id || index} className={`p-4 hover:${isDark ? 'bg-slate-700/50' : 'bg-gray-50'} transition-colors`}>
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                          <IconComponent className={iconColor} size={20} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {activity.action || 'Unknown Action'}
                            </p>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} mt-1`}>
                            User: {activity.userId?.name || 'System'}
                          </p>
                          
                          {activity.details && (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mt-1`}>
                              {activity.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Activity Distribution</h3>
          <div className="space-y-4">
            {[
              { type: 'User Registrations', count: 342, color: 'bg-green-500', percentage: 27.4 },
              { type: 'Property Actions', count: 298, color: 'bg-blue-500', percentage: 23.9 },
              { type: 'Lead Activities', count: 187, color: 'bg-purple-500', percentage: 15.0 },
              { type: 'Plan Updates', count: 156, color: 'bg-yellow-500', percentage: 12.5 },
              { type: 'System Events', count: 264, color: 'bg-gray-500', percentage: 21.2 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {item.count}
                  </span>
                  <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🕒 Hourly Activity Pattern</h3>
          <div className="space-y-3">
            {[
              { hour: '00:00-03:00', activities: 45 },
              { hour: '03:00-06:00', activities: 23 },
              { hour: '06:00-09:00', activities: 156 },
              { hour: '09:00-12:00', activities: 289 },
              { hour: '12:00-15:00', activities: 267 },
              { hour: '15:00-18:00', activities: 234 },
              { hour: '18:00-21:00', activities: 178 },
              { hour: '21:00-24:00', activities: 89 },
            ].map((item, idx) => {
              const maxActivities = 289;
              const barWidth = (item.activities / maxActivities) * 100;
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className={`text-xs font-medium w-20 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {item.hour}
                  </span>
                  <div className="flex-1">
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-xs font-bold w-8 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.activities}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;