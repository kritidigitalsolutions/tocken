import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Home, TrendingUp, Eye, Star, Filter } from "lucide-react";
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
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>12,456</h3>
              <p className="text-yellow-500 text-sm flex items-center gap-1 mt-1">
                <Star size={14} />
                27.1% premium
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
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Views</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2.8M</h3>
              <p className="text-indigo-500 text-sm flex items-center gap-1 mt-1">
                <Eye size={14} />
                +24.5% views
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🏠 Property Categories</h3>
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>🗺️ Top Cities</h3>
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
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Listing Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg. Views per Property</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>247</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg. Response Time</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2.3 hrs</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Conversion Rate</span>
              <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>4.7%</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>💰 Price Analysis</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg. Property Value</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹45.2L</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Price Range (Most)</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>₹20-50L</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Premium Properties</span>
              <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>₹1Cr+</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>⭐ Quality Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Avg. Listing Score</span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>78.5/100</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>High Quality (80+)</span>
              <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>37.2%</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Needs Improvement</span>
              <span className={`font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>18.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyAnalytics;