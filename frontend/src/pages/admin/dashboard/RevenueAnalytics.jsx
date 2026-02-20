import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { DollarSign, TrendingUp, CreditCard, Wallet, BarChart3 } from "lucide-react";
import { getDashboardAnalytics } from "../../../api/admin.dashboard.api";

const RevenueAnalytics = () => {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const response = await getDashboardAnalytics({ period: "30" });
        setRevenueData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch revenue analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading revenue analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <DollarSign className="text-green-500" size={32} />
          Revenue Analytics Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Financial performance and subscription insights
        </p>
      </div>

      {/* Revenue Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Revenue</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{((revenueData?.revenue?.total || 0) / 100000).toFixed(1)}L
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                {revenueData?.period?.days || 30} days
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <DollarSign className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Monthly Revenue</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(() => {
                  const trend = revenueData?.revenue?.monthlyTrend;
                  if (!trend || trend.length === 0) return '₹0';
                  const lastMonth = trend[trend.length - 1]?.revenue || 0;
                  return lastMonth >= 100000
                    ? `₹${(lastMonth / 100000).toFixed(1)}L`
                    : `₹${(lastMonth / 1000).toFixed(0)}K`;
                })()}
              </h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <BarChart3 size={14} />
                {revenueData?.revenue?.monthlyTrend?.slice(-1)[0]?.month || 'Current'} month
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <BarChart3 className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active Subscriptions</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(revenueData?.revenue?.activeSubscriptionsCount || revenueData?.overview?.totalActiveSubscriptions || 0).toLocaleString()}
              </h3>
              <p className="text-purple-500 text-sm flex items-center gap-1 mt-1">
                <CreditCard size={14} />
                Active plan users
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <CreditCard className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Avg. Transaction Value</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{revenueData?.revenue?.avgTransactionValue?.toLocaleString() || '0'}
              </h3>
              <p className="text-yellow-500 text-sm flex items-center gap-1 mt-1">
                <Wallet size={14} />
                per purchase
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'}`}>
              <Wallet className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>💳 Revenue by Plan Type</h3>
          <div className="space-y-4">
            {(revenueData?.topPerformers?.plansBuyers && revenueData.topPerformers.plansBuyers.slice(0, 5).map((item, idx) => {
              const total = revenueData.topPerformers.plansBuyers.reduce((sum, plan) => sum + plan.revenue, 0);
              const percentage = total > 0 ? ((item.revenue / total) * 100).toFixed(1) : 0;
              const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500', 'bg-gray-500'];
              const color = colors[idx % colors.length];
              
              return (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${color}`} />
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item._id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      ₹{(item.revenue / 1000).toFixed(0)}K
                    </span>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              );
            })) || (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No revenue data available
              </p>
            )}
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📈 Monthly Revenue Trend (Last 6 Months)</h3>
          <div className="space-y-3">
            {revenueData?.revenue?.monthlyTrend && revenueData.revenue.monthlyTrend.length > 0 ? (
              revenueData.revenue.monthlyTrend.map((item, idx) => (
                <div key={item._id || idx} className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                    {item.month} {item.year}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.revenue >= 100000
                        ? `₹${(item.revenue / 100000).toFixed(1)}L`
                        : `₹${(item.revenue / 1000).toFixed(0)}K`}
                    </span>
                    <span className="text-green-500 text-sm font-medium">
                      {item.purchases} subs
                    </span>
                  </div>
                </div>
              ))
            ) : revenueData?.revenue?.dailyRevenue && revenueData.revenue.dailyRevenue.length > 0 ? (
              revenueData.revenue.dailyRevenue.slice(-6).map((item, idx) => {
                const date = new Date(item._id);
                const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        ₹{(item.revenue / 1000).toFixed(0)}K
                      </span>
                      <span className="text-green-500 text-sm font-medium">{item.purchases} subs</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={`text-center py-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                No revenue data available for this period
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>💳 Recent Plan Subscriptions</h3>
        <div className="space-y-3">
          {(revenueData?.revenue?.recentTransactions && revenueData.revenue.recentTransactions.length > 0) ? (
            revenueData.revenue.recentTransactions.map((transaction, idx) => (
              <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
                <div className={`w-3 h-3 rounded-full ${transaction.isActive ? 'bg-green-400' : 'bg-gray-400'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {transaction.userName || 'Unknown User'} ({transaction.userType || 'User'})
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Plan: {transaction.planName} • Started: {transaction.startDate ? new Date(transaction.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`text-lg font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                  ₹{(transaction.planPrice || 0).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className={`text-center py-6 text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              No recent subscription data available
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;