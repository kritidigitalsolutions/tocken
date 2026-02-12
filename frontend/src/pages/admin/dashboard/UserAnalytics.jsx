import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Users, TrendingUp, UserPlus, UserCheck, UserMinus, Activity } from "lucide-react";
import { getDashboardAnalytics } from "../../../api/admin.dashboard.api";

const UserAnalytics = () => {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        // Use comprehensive dashboard analytics to get user data
        const response = await getDashboardAnalytics({ period: "30" });
        setUserStats(response.data.data); // The data is nested in response.data.data
      } catch (error) {
        console.error("Failed to fetch user analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Users className="text-indigo-500" size={32} />
          User Analytics Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Comprehensive user behavior and growth insights
        </p>
      </div>

      {/* User Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Users</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userStats?.overview?.totalUsers?.toLocaleString() || '0'}
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                +{userStats?.statistics?.userGrowth || 0}% vs last period
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <Users className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>New Users ({userStats?.period?.days || 30}d)</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userStats?.recentActivity?.users?.length || 0}
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                +{userStats?.statistics?.userGrowth || 0}% growth
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <UserPlus className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Users</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {userStats?.topPerformers?.activeSubscriptions?.length || 0}
              </h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <Activity size={14} />
                Active subscriptions
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <UserCheck className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Churn Rate</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2.4%</h3>
              <p className="text-red-500 text-sm flex items-center gap-1 mt-1">
                <UserMinus size={14} />
                -0.3% improvement
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
              <UserMinus className="text-red-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* User Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>👥 User Distribution by Type</h3>
          <div className="space-y-4">
            {(userStats?.charts?.usersByType && Object.entries(userStats.charts.usersByType).map(([type, count], idx) => {
              const total = Object.values(userStats.charts.usersByType).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-orange-500'];
              const color = colors[idx % colors.length];
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${color}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {count.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })) || (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No user type data available
              </p>
            )}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📈 Growth Trend (Last 6 Months)</h3>
          <div className="space-y-3">
            {[
              { month: 'Jan', users: 8500, growth: 12.3 },
              { month: 'Feb', users: 9200, growth: 8.2 },
              { month: 'Mar', users: 10100, growth: 9.8 },
              { month: 'Apr', users: 11200, growth: 10.9 },
              { month: 'May', users: 11900, growth: 6.3 },
              { month: 'Jun', users: 12847, growth: 7.9 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {item.month}
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.users.toLocaleString()}
                  </span>
                  <span className="text-green-500 text-sm font-medium">
                    +{item.growth}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🔄 Recent User Activity</h3>
        <div className="space-y-3">
          {(userStats?.recentActivity?.users && userStats.recentActivity.users.map((user, idx) => (
            <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1">
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  New user registration
                </p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {user.name} ({user.userType})
                </p>
              </div>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))) || (
            <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              No recent activity data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnalytics;