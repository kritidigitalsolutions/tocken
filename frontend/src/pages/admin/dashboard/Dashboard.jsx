import { useEffect, useState, useCallback } from "react";
import { getDashboardAnalytics, getVisitorStats, getActivityLogs } from "../../../api/admin.dashboard.api";
import { useTheme } from "../../../context/ThemeContext";
import {
  Users, Home, PhoneCall, TrendingUp, Activity, DollarSign, Eye, 
  Award, MapPin, Clock, BarChart3, PieChart, 
  Target, Star, Crown, Bookmark, RefreshCw, Filter
} from "lucide-react";

// 📊 Stat Card Component 
const StatCard = ({ title, value, icon: Icon, color = "indigo", isDark, growth, subtitle }) => {
  const colorClasses = {
    indigo: { 
      bg: isDark ? "bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/30" : "bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-200",
      icon: isDark ? "text-indigo-400" : "text-indigo-600",
      value: isDark ? "text-indigo-300" : "text-indigo-700"
    },
    green: { 
      bg: isDark ? "bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30" : "bg-gradient-to-br from-green-50 to-green-100/50 border-green-200",
      icon: isDark ? "text-green-400" : "text-green-600",
      value: isDark ? "text-green-300" : "text-green-700"
    },
    red: { 
      bg: isDark ? "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30" : "bg-gradient-to-br from-red-50 to-red-100/50 border-red-200",
      icon: isDark ? "text-red-400" : "text-red-600",
      value: isDark ? "text-red-300" : "text-red-700"
    },
    purple: { 
      bg: isDark ? "bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30" : "bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200",
      icon: isDark ? "text-purple-400" : "text-purple-600",
      value: isDark ? "text-purple-300" : "text-purple-700"
    },
    yellow: { 
      bg: isDark ? "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30" : "bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200",
      icon: isDark ? "text-yellow-400" : "text-yellow-600",
      value: isDark ? "text-yellow-300" : "text-yellow-700"
    },
    blue: { 
      bg: isDark ? "bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30" : "bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200",
      icon: isDark ? "text-blue-400" : "text-blue-600",
      value: isDark ? "text-blue-300" : "text-blue-700"
    }
  };

  const style = colorClasses[color];

  return (
    <div className={`${style.bg} rounded-2xl p-6 border backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon size={20} className={style.icon} />
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{title}</p>
          </div>
          <h3 className={`text-3xl font-bold ${style.value} mb-1`}>{value ?? 0}</h3>
          {subtitle && (
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{subtitle}</p>
          )}
          {growth !== undefined && (
            <div className="flex items-center mt-2">
              <TrendingUp size={14} className={growth >= 0 ? 'text-green-500' : 'text-red-500'} />
              <span className={`text-sm ml-1 ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth > 0 ? '+' : ''}{growth}%
              </span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg}`}>
          <Icon size={24} className={style.icon} />
        </div>
      </div>
    </div>
  );
};

// 📈 Advanced Chart Component
const ChartCard = ({ title, data, type = "bar", isDark }) => {
  const maxValue = Math.max(...(data?.map(d => d.value) || [1]));
  
  return (
    <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
      isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200 shadow-sm'
    } hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        {type === "bar" && <BarChart3 size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />}
        {type === "pie" && <PieChart size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />}
      </div>
      
      {type === "bar" && (
        <div className="space-y-4">
          {data?.map((item, idx) => (
            <div key={idx} className="group">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  {item.name || item.label || item._id}
                </span>
                <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  {item.value?.toLocaleString()}
                </span>
              </div>
              <div className={`w-full rounded-full h-3 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'} group-hover:bg-gradient-to-r from-slate-300 to-slate-400 transition-all`}>
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === "pie" && (
        <div className="grid grid-cols-2 gap-3">
          {data?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: `hsl(${idx * 60}, 70%, 50%)` }}
              />
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {item.name || item.label || item._id}: {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 📋 Activity Log Component
const ActivityLogCard = ({ logs, isDark }) => {
  return (
    <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
      isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          📋 Recent Activity
        </h3>
        <Activity size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {logs?.map((log, idx) => (
          <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
            isDark ? 'bg-slate-700/30' : 'bg-gray-50'
          } hover:bg-opacity-80 transition-all`}>
            <div className={`w-2 h-2 rounded-full mt-2 ${
              log.action?.includes('CREATE') ? 'bg-green-400' :
              log.action?.includes('UPDATE') ? 'bg-blue-400' :
              log.action?.includes('DELETE') ? 'bg-red-400' : 'bg-gray-400'
            }`} />
            <div className="flex-1">
              <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className="font-medium">{log.userId?.name || 'System'}</span> {log.action}
              </p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🏆 Top Performers Component
const TopPerformersCard = ({ title, data, icon: Icon, isDark }) => {
  return (
    <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
      isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <Icon size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
      </div>
      
      <div className="space-y-3">
        {data?.slice(0, 5).map((item, idx) => (
          <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? 'bg-slate-700/30' : 'bg-gray-50'
          } hover:bg-opacity-80 transition-all`}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                idx === 0 ? 'bg-yellow-500' :
                idx === 1 ? 'bg-gray-400' :
                idx === 2 ? 'bg-orange-600' : 
                isDark ? 'bg-slate-600' : 'bg-gray-200'
              }`}>
                <span className="text-xs font-bold text-white">{idx + 1}</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                {item._id || item.name || 'Unknown'}
              </span>
            </div>
            <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {item.count?.toLocaleString() || item.revenue?.toLocaleString() || item.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const { isDark } = useTheme();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [analyticsRes, visitorsRes, activitiesRes] = await Promise.all([
        getDashboardAnalytics({ period }),
        getVisitorStats({ period: "7" }),
        getActivityLogs({ limit: 10 })
      ]);
      
      setAnalytics(analyticsRes.data?.data);
      setVisitors(visitorsRes.data?.data);
      setActivities(activitiesRes.data?.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>Loading comprehensive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 space-y-8 ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              🎯 Admin Dashboard
            </h1>
            <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              Comprehensive analytics and insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className={isDark ? 'text-slate-400' : 'text-gray-500'} />
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isDark ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>
            </div>
            
            <button 
              onClick={fetchDashboardData}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                isDark ? 'bg-slate-800 border-slate-600 hover:bg-slate-700' : 'bg-white border-gray-300 hover:bg-gray-50'
              } transition-all`}
            >
              <RefreshCw size={16} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview */}
      <section>
        <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Target size={24} className="text-indigo-500" />
          Overview Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          <StatCard
            title="Total Users"
            value={analytics?.overview?.totalUsers}
            icon={Users}
            color="blue"
            isDark={isDark}
            growth={analytics?.statistics?.userGrowth}
            subtitle="Active platform users"
          />
          <StatCard
            title="Properties"
            value={analytics?.overview?.totalProperties}
            icon={Home}
            color="green"
            isDark={isDark}
            growth={analytics?.statistics?.propertyGrowth}
            subtitle="Total listings"
          />
          <StatCard
            title="Leads"
            value={analytics?.overview?.totalLeads}
            icon={PhoneCall}
            color="indigo"
            isDark={isDark}
            growth={analytics?.statistics?.leadGrowth}
            subtitle="Customer inquiries"
          />
          <StatCard
            title="Revenue"
            value={`₹${(analytics?.revenue?.total || 0).toLocaleString()}`}
            icon={DollarSign}
            color="yellow"
            isDark={isDark}
            subtitle={`${analytics?.revenue?.transactions || 0} transactions`}
          />
          <StatCard
            title="Visitors"
            value={visitors?.totalVisitors?.toLocaleString()}
            icon={Eye}
            color="purple"
            isDark={isDark}
            subtitle={`${visitors?.uniqueVisitors?.toLocaleString()} unique`}
          />
          <StatCard
            title="Conversion"
            value={`${analytics?.statistics?.conversionRate || 0}%`}
            icon={TrendingUp}
            color="red"
            isDark={isDark}
            subtitle="Lead to sale rate"
          />
        </div>
      </section>

      {/* Charts Section */}
      <section>
        <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <BarChart3 size={24} className="text-purple-500" />
          Analytics & Charts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <ChartCard
            title="📊 Users by Type"
            data={Object.entries(analytics?.charts?.usersByType || {}).map(([key, value]) => ({
              name: key,
              value
            }))}
            type="bar"
            isDark={isDark}
          />
          <ChartCard
            title="🏠 Properties by Status"
            data={Object.entries(analytics?.charts?.propertiesByStatus || {}).map(([key, value]) => ({
              name: key,
              value
            }))}
            type="bar"
            isDark={isDark}
          />
          <ChartCard
            title="📞 Leads by Status"
            data={Object.entries(analytics?.charts?.leadsByStatus || {}).map(([key, value]) => ({
              name: key,
              value
            }))}
            type="bar"
            isDark={isDark}
          />
        </div>
      </section>

      {/* Top Performers */}
      <section>
        <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Award size={24} className="text-yellow-500" />
          Top Performers
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          <TopPerformersCard
            title="🏆 Top Cities"
            data={analytics?.topPerformers?.cities}
            icon={MapPin}
            isDark={isDark}
          />
          <TopPerformersCard
            title="🏢 Top Categories"
            data={analytics?.topPerformers?.categories}
            icon={Home}
            isDark={isDark}
          />
          <TopPerformersCard
            title="💎 Premium Plans"
            data={analytics?.topPerformers?.plansBuyers}
            icon={Crown}
            isDark={isDark}
          />
          <TopPerformersCard
            title="📈 Active Subscriptions"
            data={analytics?.topPerformers?.activeSubscriptions}
            icon={Star}
            isDark={isDark}
          />
        </div>
      </section>

      {/* Recent Activity & Detailed Stats */}
      <section>
        <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Clock size={24} className="text-green-500" />
          Recent Activity & Statistics
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Activity Logs */}
          <div className="xl:col-span-2">
            <ActivityLogCard logs={activities} isDark={isDark} />
          </div>
          
          {/* Additional Statistics */}
          <div className="space-y-6">
            {/* Bookmark Stats */}
            <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🔖 Bookmark Statistics
                </h3>
                <Bookmark size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Total Bookmarks</span>
                  <span className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                    {analytics?.statistics?.bookmarks?.totalBookmarks || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Users with Bookmarks</span>
                  <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {analytics?.statistics?.bookmarks?.usersWithBookmarks || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg per User</span>
                  <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round(analytics?.statistics?.bookmarks?.avgBookmarksPerUser || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Visitor Stats */}
            <div className={`rounded-2xl p-6 border backdrop-blur-sm ${
              isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  👁️ Visitor Analytics
                </h3>
                <Eye size={20} className={isDark ? 'text-slate-400' : 'text-gray-400'} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Page Views</span>
                  <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    {visitors?.pageViews?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Bounce Rate</span>
                  <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {visitors?.bounceRate}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg Session</span>
                  <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {visitors?.avgSessionDuration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Analytics */}
      {analytics?.revenue?.dailyRevenue?.length > 0 && (
        <section>
          <h2 className={`text-2xl font-semibold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <DollarSign size={24} className="text-green-500" />
            Revenue Analytics
          </h2>
          <ChartCard
            title="💰 Daily Revenue Trend"
            data={analytics?.revenue?.dailyRevenue?.map(item => ({
              name: new Date(item._id).toLocaleDateString(),
              value: item.revenue
            }))}
            type="bar"
            isDark={isDark}
          />
        </section>
      )}
    </div>
  );
};

export default Dashboard;
