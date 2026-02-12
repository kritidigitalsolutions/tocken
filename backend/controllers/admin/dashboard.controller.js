const User = require("../../models/user.model");
const Property = require("../../models/property.model");
const Lead = require("../../models/lead.model");
const Plan = require("../../models/plans.model");
const Notification = require("../../models/notification.model");
const AuditLog = require("../../models/auditLog.model");

/**
 * 🎯 COMPREHENSIVE ADMIN DASHBOARD ANALYTICS
 * GET /api/admin/dashboard/analytics
 */
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { period = "30" } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // PARALLEL DATA FETCHING FOR PERFORMANCE
    const [
      // 📊 CORE STATISTICS
      totalUsers,
      totalProperties,
      totalLeads,
      totalPlans,
      
      // 💰 REVENUE & TRANSACTIONS  
      planPurchases,
      revenueData,
      
      // 📈 RECENT ACTIVITY
      recentUsers,
      recentProperties,
      recentLeads,
      recentActivity,
      
      // 🏆 TOP PERFORMERS
      topCities,
      topCategories,
      topPlansBuyers,
      activeSubscriptions,
      
      // 📋 DETAILED ANALYTICS
      usersByType,
      propertiesByStatus,
      leadsByStatus,
      bookmarkStats
    ] = await Promise.all([
      // Core counts
      User.countDocuments(),
      Property.countDocuments({ isDeleted: false }),
      Lead.countDocuments(),
      Plan.countDocuments(),
      
      // Revenue & Transactions
      User.aggregate([
        { $match: { "planSubscription.purchaseDate": { $gte: startDate } } },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: "$planSubscription.amountPaid" },
            count: { $sum: 1 }
          } 
        }
      ]),
      
      User.aggregate([
        { $match: { "planSubscription.purchaseDate": { $gte: startDate } } },
        {
          $group: {
            _id: { 
              $dateToString: { 
                format: "%Y-%m-%d", 
                date: "$planSubscription.purchaseDate" 
              } 
            },
            revenue: { $sum: "$planSubscription.amountPaid" },
            purchases: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]),
      
      // Recent Data
      User.find({ createdAt: { $gte: startDate } })
        .select("name userType createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
        
      Property.find({ createdAt: { $gte: startDate }, isDeleted: false })
        .populate("userId", "name")
        .select("propertyCategory location.city listingType status createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
        
      Lead.find({ createdAt: { $gte: startDate } })
        .populate("assignedTo", "name")
        .select("leadType status city createdAt")
        .sort({ createdAt: -1 })
        .limit(5),
        
      AuditLog.find({ createdAt: { $gte: startDate } })
        .populate("adminId", "name")
        .sort({ createdAt: -1 })
        .limit(10),
        
      // Top Performers
      Property.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$location.city", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      Property.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$propertyCategory", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      User.aggregate([
        { $match: { "planSubscription.planId": { $exists: true } } },
        { 
          $lookup: {
            from: "plans",
            localField: "planSubscription.planId",
            foreignField: "_id",
            as: "plan"
          }
        },
        { $unwind: "$plan" },
        {
          $group: {
            _id: "$plan.name",
            count: { $sum: 1 },
            revenue: { $sum: "$planSubscription.amountPaid" }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),
      
      User.aggregate([
        { 
          $match: { 
            "planSubscription.isActive": true,
            "planSubscription.expiryDate": { $gte: new Date() }
          } 
        },
        {
          $lookup: {
            from: "plans",
            localField: "planSubscription.planId", 
            foreignField: "_id",
            as: "plan"
          }
        },
        { $unwind: "$plan" },
        {
          $group: {
            _id: "$plan.name",
            count: { $sum: 1 },
            totalValue: { $sum: "$plan.price" }
          }
        }
      ]),
      
      // Detailed Analytics
      User.aggregate([
        { $group: { _id: "$userType", count: { $sum: 1 } } }
      ]),
      
      Property.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      Lead.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      User.aggregate([
        { $match: { bookmarks: { $exists: true, $ne: [] } } },
        {
          $project: {
            bookmarkCount: { $size: "$bookmarks" }
          }
        },
        {
          $group: {
            _id: null,
            totalBookmarks: { $sum: "$bookmarkCount" },
            usersWithBookmarks: { $sum: 1 },
            avgBookmarksPerUser: { $avg: "$bookmarkCount" }
          }
        }
      ])
    ]);

    // 🎨 FORMAT RESPONSE DATA
    const analytics = {
      // 📊 OVERVIEW STATS
      overview: {
        totalUsers,
        totalProperties,
        totalLeads,
        totalPlans,
        revenue: planPurchases[0]?.totalRevenue || 0,
        transactions: planPurchases[0]?.count || 0
      },

      // 💹 REVENUE ANALYTICS
      revenue: {
        total: planPurchases[0]?.totalRevenue || 0,
        transactions: planPurchases[0]?.count || 0,
        dailyRevenue: revenueData,
        avgTransactionValue: planPurchases[0]?.count 
          ? Math.round((planPurchases[0]?.totalRevenue || 0) / planPurchases[0]?.count)
          : 0
      },

      // 📈 CHARTS DATA
      charts: {
        usersByType: usersByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        
        propertiesByStatus: propertiesByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        
        topCategories: topCategories.map(item => ({
          name: item._id || "Unknown",
          value: item.count
        })),
        
        topCities: topCities.map(item => ({
          name: item._id || "Unknown", 
          value: item.count
        }))
      },

      // 🏆 TOP PERFORMERS
      topPerformers: {
        cities: topCities.slice(0, 5),
        categories: topCategories.slice(0, 5),
        plansBuyers: topPlansBuyers,
        activeSubscriptions
      },

      // 📋 RECENT ACTIVITY
      recentActivity: {
        users: recentUsers,
        properties: recentProperties,
        leads: recentLeads,
        logs: recentActivity
      },

      // 📊 STATISTICS
      statistics: {
        bookmarks: bookmarkStats[0] || { 
          totalBookmarks: 0, 
          usersWithBookmarks: 0, 
          avgBookmarksPerUser: 0 
        },
        conversionRate: totalLeads > 0 ? ((planPurchases[0]?.count || 0) / totalLeads * 100).toFixed(2) : 0,
        userGrowth: await calculateGrowthRate('users', daysAgo),
        propertyGrowth: await calculateGrowthRate('properties', daysAgo),
        leadGrowth: await calculateGrowthRate('leads', daysAgo)
      },

      // 📅 PERIOD INFO
      period: {
        days: daysAgo,
        startDate,
        endDate: new Date()
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error("❌ Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
      error: error.message
    });
  }
};

/**
 * 📈 CALCULATE GROWTH RATE HELPER
 */
const calculateGrowthRate = async (type, days) => {
  try {
    const currentPeriod = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const previousPeriod = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000);

    let Model;
    let filter = {};
    
    switch (type) {
      case 'users':
        Model = User;
        break;
      case 'properties':
        Model = Property;
        filter = { isDeleted: false };
        break;
      case 'leads':
        Model = Lead;
        break;
      default:
        return 0;
    }

    const [currentCount, previousCount] = await Promise.all([
      Model.countDocuments({ createdAt: { $gte: currentPeriod }, ...filter }),
      Model.countDocuments({ 
        createdAt: { $gte: previousPeriod, $lt: currentPeriod }, 
        ...filter 
      })
    ]);

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    
    return Math.round(((currentCount - previousCount) / previousCount) * 100);
  } catch (error) {
    console.error(`Growth rate calculation error for ${type}:`, error);
    return 0;
  }
};

/**
 * 🎯 GET VISITOR STATISTICS
 * GET /api/admin/dashboard/visitors
 */
exports.getVisitorStats = async (req, res) => {
  try {
    const { period = "7" } = req.query;
    const daysAgo = parseInt(period);

    // Mock visitor data - In real app, this would come from analytics service
    const visitorStats = {
      totalVisitors: Math.floor(Math.random() * 10000) + 5000,
      uniqueVisitors: Math.floor(Math.random() * 7000) + 3000,
      pageViews: Math.floor(Math.random() * 25000) + 15000,
      bounceRate: (Math.random() * 30 + 40).toFixed(1), // 40-70%
      avgSessionDuration: "2:34",
      
      // Daily breakdown
      dailyStats: Array.from({ length: daysAgo }, (_, i) => {
        const date = new Date(Date.now() - (daysAgo - i - 1) * 24 * 60 * 60 * 1000);
        return {
          date: date.toISOString().split('T')[0],
          visitors: Math.floor(Math.random() * 500) + 200,
          pageViews: Math.floor(Math.random() * 1200) + 600
        };
      }),
      
      // Top pages
      topPages: [
        { page: "/properties", views: Math.floor(Math.random() * 3000) + 2000 },
        { page: "/dashboard", views: Math.floor(Math.random() * 2000) + 1500 },
        { page: "/leads", views: Math.floor(Math.random() * 1500) + 1000 },
        { page: "/plans", views: Math.floor(Math.random() * 1000) + 800 },
        { page: "/bookmarks", views: Math.floor(Math.random() * 800) + 600 }
      ]
    };

    res.status(200).json({
      success: true,
      data: visitorStats
    });

  } catch (error) {
    console.error("❌ Visitor stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch visitor statistics"
    });
  }
};

/**
 * 📋 GET ACTIVITY LOGS
 * GET /api/admin/dashboard/activity
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    
    const filter = {};
    if (type && type !== 'all') {
      filter.action = new RegExp(type, 'i');
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("adminId", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
        
      AuditLog.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current: parseInt(page),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total
      }
    });
  } catch (error) {
    console.error("❌ Activity logs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs"
    });
  }
};

/**
 * 🔄 BACKWARD COMPATIBLE OLD DASHBOARD DATA METHOD
 * GET /api/admin/dashboard
 */
exports.getDashboardData = async (req, res) => {
  try {
    // Legacy endpoint - simplified version for backward compatibility
    const [
      totalUsers,
      totalProperties,
      totalLeads,
      totalPlans,
      blockedUsers,
      premiumUsers,
      activeProperties,
      recentLeads
    ] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments({ isDeleted: false }),
      Lead.countDocuments(),
      Plan.countDocuments(),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ isPremium: true }),
      Property.countDocuments({ status: "ACTIVE", isDeleted: false }),
      Lead.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
    ]);

    const activeUsers = totalUsers - blockedUsers;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        blockedUsers,
        premiumUsers,
        totalProperties,
        activeProperties,
        totalLeads,
        recentLeads,
        totalPlans
      }
    });

  } catch (error) {
    console.error("❌ Legacy dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Dashboard data error",
      error: error.message
    });
  }
};
