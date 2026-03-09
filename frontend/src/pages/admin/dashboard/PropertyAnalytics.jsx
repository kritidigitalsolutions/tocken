import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Home, TrendingUp, Eye, Star, Filter, Building2, FolderKanban, CheckCircle, Clock } from "lucide-react";
import { getDashboardAnalytics } from "../../../api/admin.dashboard.api";

const PropertyAnalytics = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [propertyData, setPropertyData] = useState(null);

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardAnalytics({ period: "30" });
        setPropertyData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch property analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading property analytics...</p>
        </div>
      </div>
    );
  }

  const totalActive = propertyData?.charts?.propertiesByStatus?.ACTIVE || 0;
  const totalProperties = propertyData?.overview?.totalProperties || 0;
  const activeRate = totalProperties > 0 ? ((totalActive / totalProperties) * 100).toFixed(1) : 0;

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Home className="text-purple-500" size={32} />
          Property Analytics Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Real estate listings performance and insights
        </p>
      </div>

      {/* Property Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Properties</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {propertyData?.overview?.totalProperties?.toLocaleString() || '0'}
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                +{propertyData?.statistics?.propertyGrowth || 0}% growth
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <Home className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Listings</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(propertyData?.charts?.propertiesByStatus?.ACTIVE || 0).toLocaleString()}
              </h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <Filter size={14} />
                {activeRate}% active rate
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <Filter className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Premium Properties</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(propertyData?.overview?.premiumProperties || 0).toLocaleString()}
              </h3>
              <p className="text-yellow-500 text-sm flex items-center gap-1 mt-1">
                <Star size={14} />
                {totalProperties > 0 ? (((propertyData?.overview?.premiumProperties || 0) / totalProperties * 100).toFixed(1)) : 0}% premium
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'}`}>
              <Star className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Properties</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(propertyData?.charts?.propertiesByStatus?.ACTIVE || 0).toLocaleString()}
              </h3>
              <p className="text-indigo-500 text-sm flex items-center gap-1 mt-1">
                <Eye size={14} />
                {activeRate}% of total
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
              <Eye className="text-indigo-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Property Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Property Categories</h3>
          <div className="space-y-4">
            {(propertyData?.charts?.topCategories && propertyData.charts.topCategories.slice(0, 5).map((item, idx) => {
              const total = propertyData.charts.topCategories.reduce((sum, cat) => sum + cat.value, 0);
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-orange-500'];
              const color = colors[idx % colors.length];
              
              return (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${color}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {item.value.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })) || (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No property category data available
              </p>
            )}
          </div>
        </div>

        {/* Top Cities */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Cities</h3>
          <div className="space-y-3">
            {(propertyData?.charts?.topCities && propertyData.charts.topCities.slice(0, 6).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-500' : idx === 2 ? 'bg-orange-600' : 'bg-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {item.value.toLocaleString()}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    properties
                  </div>
                </div>
              </div>
            ))) || (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No city data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Property Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Listing Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Total Properties</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalProperties.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Active Listings</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(propertyData?.charts?.propertiesByStatus?.ACTIVE || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Active Rate</span>
              <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{activeRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Property Growth</span>
              <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>+{propertyData?.statistics?.propertyGrowth || 0}%</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Status Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(propertyData?.charts?.propertiesByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>{status}</span>
                <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {count.toLocaleString()}
                  <span className={`text-xs font-normal ml-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    ({totalProperties > 0 ? ((count / totalProperties) * 100).toFixed(1) : 0}%)
                  </span>
                </span>
              </div>
            ))}
            {Object.keys(propertyData?.charts?.propertiesByStatus || {}).length === 0 && (
              <p className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No status data available</p>
            )}
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Quality Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Premium Properties</span>
              <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {(propertyData?.overview?.premiumProperties || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Premium Rate</span>
              <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {totalProperties > 0
                  ? (((propertyData?.overview?.premiumProperties || 0) / totalProperties) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Total Categories</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {propertyData?.charts?.topCategories?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Cities Covered</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {propertyData?.charts?.topCities?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PROJECT ANALYTICS SECTION ─── */}
      <div className="mt-10">
        <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Building2 className="text-indigo-500" size={28} />
          Project Analytics
        </h2>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Projects</p>
                <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {propertyData?.projects?.total?.toLocaleString() || '0'}
                </h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>All time projects</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                <Building2 className="text-indigo-500" size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Projects</p>
                <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {propertyData?.projects?.active?.toLocaleString() || '0'}
                </h3>
                <p className="text-green-500 text-xs flex items-center gap-1 mt-1">
                  <CheckCircle size={12} /> Approved &amp; live
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
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pending Review</p>
                <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {propertyData?.projects?.pending?.toLocaleString() || '0'}
                </h3>
                <p className="text-yellow-500 text-xs flex items-center gap-1 mt-1">
                  <Clock size={12} /> Awaiting approval
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'}`}>
                <Clock className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Featured Projects</p>
                <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {propertyData?.projects?.featured?.toLocaleString() || '0'}
                </h3>
                <p className="text-yellow-500 text-xs flex items-center gap-1 mt-1">
                  <Star size={12} /> Premium featured
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'}`}>
                <Star className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Project Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* By Status */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Projects by Status</h3>
            <div className="space-y-3">
              {Object.entries(propertyData?.projects?.byStatus || {}).map(([status, count], idx) => {
                const total = propertyData?.projects?.total || 1;
                const pct = ((count / total) * 100).toFixed(1);
                const colors = { ACTIVE: 'bg-green-500', PENDING: 'bg-yellow-500', REJECTED: 'bg-red-500', BLOCKED: 'bg-gray-500' };
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{status}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{count} ({pct}%)</span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div className={`h-2 rounded-full ${colors[status] || 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(propertyData?.projects?.byStatus || {}).length === 0 && (
                <p className={`text-center text-sm py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No project data available</p>
              )}
            </div>
          </div>

          {/* By Type */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Projects by Type</h3>
            <div className="space-y-3">
              {(propertyData?.projects?.byType || []).slice(0, 6).map((item, idx) => {
                const total = (propertyData?.projects?.byType || []).reduce((s, t) => s + t.value, 0) || 1;
                const pct = ((item.value / total) * 100).toFixed(1);
                const tColors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
                return (
                  <div key={item.name}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{item.name}</span>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value} ({pct}%)</span>
                    </div>
                    <div className={`w-full rounded-full h-2 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div className={`h-2 rounded-full ${tColors[idx % tColors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {(propertyData?.projects?.byType || []).length === 0 && (
                <p className={`text-center text-sm py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No type data available</p>
              )}
            </div>
          </div>

          {/* Project Top Cities */}
          <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Top Cities (Projects)</h3>
            <div className="space-y-3">
              {(propertyData?.projects?.topCities || []).slice(0, 6).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-indigo-400'
                    }`}>{idx + 1}</div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</span>
                  </div>
                  <span className={`text-sm font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.value}</span>
                </div>
              ))}
              {(propertyData?.projects?.topCities || []).length === 0 && (
                <p className={`text-center text-sm py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>No city data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Projects Table */}
        {(propertyData?.projects?.recent || []).length > 0 && (
          <div className={`rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <FolderKanban size={20} className="text-indigo-400" /> Recently Added Projects
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Project</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Type</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>City</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                    <th className={`text-left px-6 py-3 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyData.projects.recent.map((proj, idx) => (
                    <tr key={proj._id || idx} className={`border-b last:border-0 ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className={`px-6 py-3 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{proj.nameOfProject}</td>
                      <td className={`px-6 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        {(Array.isArray(proj.projectType) ? proj.projectType.join(', ') : proj.projectType) || 'N/A'}
                      </td>
                      <td className={`px-6 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{proj.projectLocation?.city || 'N/A'}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          proj.adminStatus === 'ACTIVE' ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800') :
                          proj.adminStatus === 'PENDING' ? (isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800') :
                          (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800')
                        }`}>{proj.adminStatus}</span>
                      </td>
                      <td className={`px-6 py-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {new Date(proj.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyAnalytics;