import { useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { FileBarChart, Download, Calendar, Filter, TrendingUp, FileText, BarChart3, X, Eye, Building2 } from "lucide-react";
import { getDashboardAnalytics } from "../../../api/admin.dashboard.api";

const Reports = () => {
  const { isDark } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [reportType, setReportType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newReportType, setNewReportType] = useState("analytics");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardAnalytics({ period: selectedPeriod });
        setStatsData(response.data.data);
      } catch (error) {
        console.error("Failed to fetch report statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedPeriod]);

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

  const initialReports = [
    {
      id: 1,
      title: "Monthly Analytics Report",
      description: "Comprehensive monthly performance and user analytics",
      type: "analytics",
      size: "Dynamic",
      lastGenerated: today,
      status: "ready",
      data: null
    },
    {
      id: 2,
      title: "Revenue Report",
      description: "Financial performance and subscription analytics",
      type: "financial",
      size: "Dynamic",
      lastGenerated: today,
      status: "ready",
      data: null
    },
    {
      id: 3,
      title: "Property Listings Report",
      description: "Property performance and market insights",
      type: "property",
      size: "Dynamic",
      lastGenerated: yesterday,
      status: "ready",
      data: null
    },
    {
      id: 4,
      title: "User Activity Report",
      description: "User engagement and behavior analysis",
      type: "user",
      size: "Dynamic",
      lastGenerated: yesterday,
      status: "ready",
      data: null
    },
    {
      id: 5,
      title: "Lead Conversion Report",
      description: "Lead generation and conversion analytics",
      type: "leads",
      size: "Dynamic",
      lastGenerated: twoDaysAgo,
      status: "ready",
      data: null
    },
    {
      id: 6,
      title: "Project Analytics Report",
      description: "Real estate project listings, status, and growth insights",
      type: "project",
      size: "Dynamic",
      lastGenerated: today,
      status: "ready",
      data: null
    }
  ];

  const [reports, setReports] = useState(initialReports);

  // Generate Report Function
  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      
      // Fetch data for the report
      const response = await getDashboardAnalytics({ period: selectedPeriod });
      const data = response.data.data;
      
      // Create new report
      const reportTitles = {
        analytics: "Analytics Report",
        financial: "Financial Report",
        property: "Property Report",
        user: "User Activity Report",
        leads: "Lead Conversion Report",
        project: "Project Analytics Report"
      };
      
      const reportDescriptions = {
        analytics: "Comprehensive performance and user analytics",
        financial: "Financial performance and subscription analytics",
        property: "Property performance and market insights",
        user: "User engagement and behavior analysis",
        leads: "Lead generation and conversion analytics",
        project: "Real estate project listings, status, and growth insights"
      };
      
      const newReport = {
        id: reports.length + 1,
        title: reportTitles[newReportType],
        description: reportDescriptions[newReportType],
        type: newReportType,
        size: `${(Math.random() * 2 + 1).toFixed(1)} MB`,
        lastGenerated: new Date().toISOString().split('T')[0],
        status: "ready",
        data: data,
        period: selectedPeriod
      };
      
      setReports(prev => [newReport, ...prev]);
      alert(`✅ ${reportTitles[newReportType]} generated successfully!`);
    } catch (error) {
      console.error("Failed to generate report:", error);
      alert("❌ Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Download Report Function
  const handleDownloadReport = async (report) => {
    try {
      let reportData = report.data;
      
      // If report doesn't have data, fetch it
      if (!reportData) {
        const response = await getDashboardAnalytics({ period: selectedPeriod });
        reportData = response.data.data;
      }
      
      // Generate CSV data
      let csvContent = "";
      
      if (report.type === "analytics") {
        csvContent += `Analytics Report - ${report.lastGenerated}\n\n`;
        csvContent += `Total Users,${reportData?.overview?.totalUsers || 0}\n`;
        csvContent += `Total Properties,${reportData?.overview?.totalProperties || 0}\n`;
        csvContent += `Active Properties,${reportData?.overview?.activeProperties || 0}\n`;
        csvContent += `User Growth,${reportData?.statistics?.userGrowth || 0}%\n`;
        csvContent += `Property Growth,${reportData?.statistics?.propertyGrowth || 0}%\n`;
      } else if (report.type === "financial") {
        csvContent += `Financial Report - ${report.lastGenerated}\n\n`;
        csvContent += `Total Revenue,₹${reportData?.revenue?.total || 0}\n`;
        csvContent += `Total Transactions,${reportData?.revenue?.transactions || 0}\n`;
        csvContent += `Average Transaction Value,₹${reportData?.revenue?.avgTransactionValue || 0}\n`;
        csvContent += `Period,${reportData?.period?.days || 30} days\n`;
      } else if (report.type === "property") {
        csvContent += `Property Report - ${report.lastGenerated}\n\n`;
        csvContent += `Total Properties,${reportData?.overview?.totalProperties || 0}\n`;
        csvContent += `Active Properties,${reportData?.overview?.activeProperties || 0}\n`;
        csvContent += `Pending Properties,${reportData?.overview?.pendingProperties || 0}\n`;
      } else if (report.type === "user") {
        csvContent += `User Activity Report - ${report.lastGenerated}\n\n`;
        csvContent += `Total Users,${reportData?.overview?.totalUsers || 0}\n`;
        csvContent += `Premium Users,${reportData?.overview?.premiumUsers || 0}\n`;
        csvContent += `Free Users,${reportData?.overview?.freeUsers || 0}\n`;
        csvContent += `User Growth,${reportData?.statistics?.userGrowth || 0}%\n`;
      } else if (report.type === "project") {
        csvContent += `Project Analytics Report - ${report.lastGenerated}\n\n`;
        csvContent += `Total Projects,${reportData?.projects?.total || 0}\n`;
        csvContent += `Active Projects,${reportData?.projects?.active || 0}\n`;
        csvContent += `Pending Projects,${reportData?.projects?.pending || 0}\n`;
        csvContent += `Featured Projects,${reportData?.projects?.featured || 0}\n`;
        csvContent += `Rejected Projects,${reportData?.projects?.rejected || 0}\n`;
        if (reportData?.projects?.byType?.length > 0) {
          csvContent += `\nProjects by Type\n`;
          reportData.projects.byType.forEach(t => {
            csvContent += `${t.name},${t.value}\n`;
          });
        }
        if (reportData?.projects?.topCities?.length > 0) {
          csvContent += `\nTop Cities (Projects)\n`;
          reportData.projects.topCities.forEach(c => {
            csvContent += `${c.name},${c.value}\n`;
          });
        }
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.title.replace(/ /g, '_')}_${report.lastGenerated}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download report:", error);
      alert("❌ Failed to download report. Please try again.");
    }
  };

  // View Report Function
  const handleViewReport = async (report) => {
    try {
      let reportData = report.data;
      
      // If report doesn't have data, fetch it
      if (!reportData) {
        const response = await getDashboardAnalytics({ period: selectedPeriod });
        reportData = response.data.data;
        
        // Update report with data
        setReports(prev => prev.map(r => 
          r.id === report.id ? { ...r, data: reportData } : r
        ));
      }
      
      setSelectedReport({ ...report, data: reportData });
      setViewModalOpen(true);
    } catch (error) {
      console.error("Failed to load report data:", error);
      alert("❌ Failed to load report data. Please try again.");
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'ready':
        return (
          <span className={`${baseClasses} ${isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-800'}`}>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            Ready
          </span>
        );
      case 'generating':
        return (
          <span className={`${baseClasses} ${isDark ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'}`}>
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
            Generating
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            Unknown
          </span>
        );
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'analytics': return BarChart3;
      case 'financial': return TrendingUp;
      case 'property': return FileBarChart;
      case 'user': return FileText;
      case 'leads': return TrendingUp;
      case 'project': return Building2;
      default: return FileBarChart;
    }
  };

  const filteredReports = reports.filter(report => 
    reportType === 'all' || report.type === reportType
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${isDark ? 'bg-slate-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FileBarChart className="text-blue-500" size={32} />
          Reports Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
          Generate and manage comprehensive business reports
        </p>
      </div>

      {/* Report Generation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Users</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {statsData?.overview?.totalUsers?.toLocaleString() || '0'}
              </h3>
              <p className="text-blue-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                +{statsData?.statistics?.userGrowth || 0}% growth
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <FileBarChart className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Properties</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {statsData?.overview?.totalProperties?.toLocaleString() || '0'}
              </h3>
              <p className="text-green-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                +{statsData?.statistics?.propertyGrowth || 0}% growth
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-50'}`}>
              <Download className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Revenue</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{((statsData?.revenue?.total || 0) / 100000).toFixed(1)}L
              </h3>
              <p className="text-purple-500 text-sm flex items-center gap-1 mt-1">
                <Calendar size={14} />
                {statsData?.period?.days || 30} days
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <Calendar className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Transactions</p>
              <h3 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {statsData?.revenue?.transactions?.toLocaleString() || '0'}
              </h3>
              <p className="text-yellow-500 text-sm flex items-center gap-1 mt-1">
                <TrendingUp size={14} />
                subscriptions
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-yellow-500/20' : 'bg-yellow-50'}`}>
              <TrendingUp className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Controls */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Generate New Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Report Type
            </label>
            <select
              value={newReportType}
              onChange={(e) => setNewReportType(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="analytics">Analytics Report</option>
              <option value="financial">Financial Report</option>
              <option value="property">Property Report</option>
              <option value="user">User Activity Report</option>
              <option value="leads">Lead Conversion Report</option>
              <option value="project">Project Analytics Report</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last 12 months</option>
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleGenerateReport}
              disabled={generating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Filters */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Available Reports</h3>
          
          <div className="flex items-center gap-2">
            <Filter className={isDark ? 'text-slate-400' : 'text-gray-400'} size={20} />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className={`px-4 py-2 rounded-lg border ${
                isDark 
                  ? 'bg-slate-700 border-slate-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="all">All Reports</option>
              <option value="analytics">Analytics</option>
              <option value="financial">Financial</option>
              <option value="property">Property</option>
              <option value="user">User Activity</option>
              <option value="leads">Lead Reports</option>
              <option value="project">Project Reports</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = getReportIcon(report.type);
          
          return (
            <div key={report.id} className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm hover:shadow-lg transition-all duration-300`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    report.type === 'analytics' ? 'bg-blue-500/20' :
                    report.type === 'financial' ? 'bg-green-500/20' :
                    report.type === 'property' ? 'bg-purple-500/20' :
                    report.type === 'user' ? 'bg-yellow-500/20' :
                    report.type === 'project' ? 'bg-indigo-500/20' : 'bg-indigo-500/20'
                  }`}>
                    <IconComponent className={
                      report.type === 'analytics' ? 'text-blue-500' :
                      report.type === 'financial' ? 'text-green-500' :
                      report.type === 'property' ? 'text-purple-500' :
                      report.type === 'user' ? 'text-yellow-500' :
                      report.type === 'project' ? 'text-indigo-500' : 'text-indigo-500'
                    } size={24} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {report.title}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
                      {report.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                        Size: {report.size}
                      </span>
                      <span className={isDark ? 'text-slate-400' : 'text-gray-500'}>
                        Generated: {report.lastGenerated}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(report.status)}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownloadReport(report)}
                  disabled={report.status !== 'ready'}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    report.status === 'ready'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : isDark 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Download size={16} />
                  {report.status === 'ready' ? 'Download' : 'Generating...'}
                </button>
                
                <button 
                  onClick={() => handleViewReport(report)}
                  disabled={report.status !== 'ready'}
                  className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 flex items-center gap-2 ${
                    report.status === 'ready'
                      ? isDark 
                        ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Eye size={16} />
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Schedule - Dynamic based on actual stats */}
      <div className={`rounded-2xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>📅 Report Summary</h3>
        
        <div className="space-y-3">
          <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Users in System</span>
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {statsData?.overview?.totalUsers?.toLocaleString() || '0'}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Properties Listed</span>
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {statsData?.overview?.totalProperties?.toLocaleString() || '0'}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-400" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Subscriptions</span>
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {statsData?.overview?.totalActiveSubscriptions?.toLocaleString() || '0'}
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Revenue (Period)</span>
            </div>
            <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              ₹{((statsData?.revenue?.total || 0) / 100000).toFixed(2)}L
            </span>
          </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-indigo-400" />
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Leads Captured</span>
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {statsData?.overview?.totalLeads?.toLocaleString() || '0'}
            </span>
          </div>

          <div className={`p-3 rounded-lg border-l-4 border-indigo-500 ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'} mt-2`}>
            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              📅 Data period: <span className="font-semibold">{statsData?.period?.days || selectedPeriod} days</span>
              {statsData?.period?.startDate && (
                <span className="ml-2 text-xs">
                  ({new Date(statsData.period.startDate).toLocaleDateString()} – {new Date().toLocaleDateString()})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* View Report Modal */}
      {viewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedReport.title}
                </h3>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Generated on {selectedReport.lastGenerated}
                </p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                }`}
              >
                <X size={24} className={isDark ? 'text-slate-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview Section */}
              <div>
                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  📊 Overview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Total Users</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedReport.data?.overview?.totalUsers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Properties</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedReport.data?.overview?.totalProperties?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Revenue</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₹{((selectedReport.data?.revenue?.total || 0) / 100000).toFixed(1)}L
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Transactions</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedReport.data?.revenue?.transactions?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              {selectedReport.type === 'analytics' && (
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    📈 Growth Statistics
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>User Growth</p>
                      <p className="text-xl font-bold mt-1 text-green-500">
                        +{selectedReport.data?.statistics?.userGrowth || 0}%
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                    }`}>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Property Growth</p>
                      <p className="text-xl font-bold mt-1 text-green-500">
                        +{selectedReport.data?.statistics?.propertyGrowth || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Details */}
              {selectedReport.type === 'financial' && (
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    💰 Financial Details
                  </h4>
                  <div className="space-y-3">
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Total Revenue</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ₹{selectedReport.data?.revenue?.total?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                    }`}>
                      <div className="flex justify-between items-center">
                        <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Avg Transaction Value</span>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ₹{selectedReport.data?.revenue?.avgTransactionValue?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Property Details */}
              {selectedReport.type === 'property' && selectedReport.data?.charts?.topCategories && (
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🏢 Top Categories
                  </h4>
                  <div className="space-y-2">
                    {selectedReport.data.charts.topCategories.slice(0, 5).map((cat, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${
                        isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{cat.name}</span>
                          <div className="flex items-center gap-3">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {cat.count}
                            </span>
                            <span className="text-sm text-green-500">{cat.percentage}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Details */}
              {selectedReport.type === 'user' && selectedReport.data?.charts?.usersByType && (
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    👥 Users by Type
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(selectedReport.data.charts.usersByType).map(([type, count]) => (
                      <div key={type} className={`p-4 rounded-lg text-center ${
                        isDark ? 'bg-slate-700/50' : 'bg-gray-50'
                      }`}>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {count}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Details */}
              {selectedReport.type === 'project' && (
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    🏗️ Project Stats
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: 'Total', value: selectedReport.data?.projects?.total || 0, color: 'text-indigo-500' },
                      { label: 'Active', value: selectedReport.data?.projects?.active || 0, color: 'text-green-500' },
                      { label: 'Pending', value: selectedReport.data?.projects?.pending || 0, color: 'text-yellow-500' },
                      { label: 'Featured', value: selectedReport.data?.projects?.featured || 0, color: 'text-purple-500' },
                    ].map(item => (
                      <div key={item.label} className={`p-4 rounded-lg text-center ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{item.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {(selectedReport.data?.projects?.byType || []).length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>By Type:</p>
                      {selectedReport.data.projects.byType.map((t, idx) => (
                        <div key={idx} className={`flex justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                          <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{t.name}</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Period Info */}
              <div className={`p-4 rounded-lg border-l-4 border-indigo-500 ${
                isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'
              }`}>
                <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                  📅 Report Period: <span className="font-semibold">{selectedReport.data?.period?.days || 30} days</span>
                  {selectedReport.data?.period?.startDate && selectedReport.data?.period?.endDate && (
                    <span className="ml-2">
                      ({new Date(selectedReport.data.period.startDate).toLocaleDateString()} - {new Date(selectedReport.data.period.endDate).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownloadReport(selectedReport)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Report
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className={`px-6 py-3 rounded-lg border font-medium transition-all duration-200 ${
                    isDark 
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;