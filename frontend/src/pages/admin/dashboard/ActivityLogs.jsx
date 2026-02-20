import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Activity, Clock, Search, Filter, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { getActivityLogs } from "../../../api/admin.dashboard.api";

const ActivityLogs = () => {
  const [activities, setActivities] = useState([]);
  const [activityStats, setActivityStats] = useState(null);
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
        setActivityStats(response.data?.stats || null);
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        setActivities([]);
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
    if (action?.includes('CREATED')) return CheckCircle;
    if (action?.includes('DELETED') || action?.includes('PERMANENT')) return AlertCircle;
    if (action?.includes('UPDATE') || action?.includes('APPROVED') || action?.includes('REJECTED') || action?.includes('BLOCKED') || action?.includes('RESTORED')) return FileText;
    return Activity;
  };

  const getActivityColor = (action) => {
    if (action?.includes('CREATED')) return 'text-green-400';
    if (action?.includes('DELETED') || action?.includes('PERMANENT')) return 'text-red-400';
    if (action?.includes('UPDATE') || action?.includes('APPROVED') || action?.includes('REJECTED') || action?.includes('BLOCKED') || action?.includes('RESTORED')) return 'text-blue-400';
    return 'text-gray-400';
  };

  // Build distribution from real stats
  // const activityDistribution = activityStats?.activityDistribution || [];
  const totalActivities = activityStats?.total || 0;
  const createCount = activityStats?.createCount || 0;
  const updateCount = activityStats?.updateCount || 0;
  const deleteCount = activityStats?.deleteCount || 0;

  // Slotted pattern for display - merge into 8 groups of 3 hours
  const slottedPattern = activityStats?.slottedPattern || Array.from({ length: 8 }, (_, i) => ({
    slot: `${String(i * 3).padStart(2, '0')}:00-${String((i + 1) * 3).padStart(2, '0')}:00`,
    count: 0
  }));
  const maxSlotCount = Math.max(...slottedPattern.map(s => s.count), 1);

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
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : totalActivities.toLocaleString()}
              </h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <Clock size={14} />
                All time audit logs
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
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Created Actions</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : createCount.toLocaleString()}
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <CheckCircle size={14} />
                {totalActivities > 0 ? ((createCount / totalActivities) * 100).toFixed(1) : 0}% of total
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Update Actions</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : updateCount.toLocaleString()}
              </h3>
              <p className="text-purple-500 text-sm flex items-center gap-1 mt-1">
                <FileText size={14} />
                {totalActivities > 0 ? ((updateCount / totalActivities) * 100).toFixed(1) : 0}% updates
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
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Delete Events</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {loading ? "..." : deleteCount.toLocaleString()}
              </h3>
              <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                <AlertCircle size={14} />
                {totalActivities > 0 ? ((deleteCount / totalActivities) * 100).toFixed(1) : 0}% deletes
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
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark
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
              className={`px-4 py-2 rounded-lg border ${isDark
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="all">All Activities</option>
              <option value="CREATED">Created</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DELETED">Deleted</option>
              <option value="LEAD_STATUS">Lead Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Log Table */}
      <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Activity Timeline ({filteredActivities.length} activities)
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
                              {activity.action?.replace(/_/g, ' ') || 'Unknown Action'}
                            </p>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'} mt-1`}>
                            By: {activity.userId?.name || activity.adminId?.name || 'System'}
                          </p>

                          {activity.details && (
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mt-1`}>
                              {activity.details}
                            </p>
                          )}

                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            Entity: {activity.entityType} {activity.entityId ? `â€¢ ID: ${activity.entityId}` : ''}
                          </p>
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Activity Distribution</h3>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : activityStats?.breakdown && activityStats.breakdown.length > 0 ? (
            <div className="space-y-4">
              {activityStats.breakdown.slice(0, 6).map((item, idx) => {
                const pct = totalActivities > 0 ? ((item.count / totalActivities) * 100).toFixed(1) : 0;
                const colorClasses = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-gray-500'];
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colorClasses[idx % colorClasses.length]}`} />
                      <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {(item.action || 'UNKNOWN').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{item.count}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No activity data available</p>
          )}
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Hourly Activity Pattern</h3>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : (
            <div className="space-y-3">
              {slottedPattern.map((item, idx) => {
                const barWidth = maxSlotCount > 0 ? (item.count / maxSlotCount) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className={`text-xs font-medium w-24 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {item.slot}
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
                      {item.count}
                    </span>
                  </div>
                );
              })}
              {slottedPattern.every(s => s.count === 0) && (
                <p className={`text-center py-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  No activity pattern data yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
