const Plan = require("../models/plans.model");
const FAQ = require("../models/faq.model");
const User = require("../models/user.model");

exports.getPlansAndFAQs = async (req, res) => {
  const { userType } = req.query;

  const plans = await Plan.find({ userType, isActive: true });
  const faqs = await FAQ.find({ userType, isActive: true });

  res.json({
    success: true,
    plans,
    faqs
  });
};


// for buy plan
exports.buyPlan = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated"
      });
    }

    const userId = req.user.id;
    const { planId } = req.body;

    // Validate plan exists and is active
    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({
        success: false,
        message: "Plan not available"
      });
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if plan is suitable for user type
    if (plan.userType !== user.userType) {
      return res.status(400).json({
        success: false,
        message: `This plan is for ${plan.userType} users only`
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.validityDays);

    // Calculate quota reset date (first day of next month)
    const quotaResetDate = new Date(startDate);
    quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
    quotaResetDate.setDate(1);

    // Update user with plan subscription
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        activePlan: plan._id,
        planSubscription: {
          startDate,
          endDate,
          isActive: true,
          autoRenewal: false
        },
        planUsageQuota: {
          consumed: 0,
          limit: plan.planLimit || 0,
          resetDate: quotaResetDate
        }
      },
      { new: true }
    ).populate('activePlan');

    res.status(200).json({
      success: true,
      message: "Plan purchased successfully",
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          userType: updatedUser.userType,
          activePlan: updatedUser.activePlan,
          planSubscription: updatedUser.planSubscription,
          planUsageQuota: updatedUser.planUsageQuota
        }
      }
    });

  } catch (error) {
    console.error("Plan Purchase Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to purchase plan. Please try again."
    });
  }
};

// Get user's current plan and subscription details
exports.getUserPlan = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated"
      });
    }

    const user = await User.findById(req.user.id)
      .populate('activePlan')
      .select('activePlan planSubscription planUsageQuota userType');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if plan is expired
    let isExpired = false;
    if (user.planSubscription && user.planSubscription.endDate) {
      isExpired = new Date() > user.planSubscription.endDate;
      
      // If expired, update subscription status
      if (isExpired && user.planSubscription.isActive) {
        await User.findByIdAndUpdate(user._id, {
          'planSubscription.isActive': false,
          'planUsageQuota.limit': 0
        });
        user.planSubscription.isActive = false;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        activePlan: user.activePlan,
        planSubscription: user.planSubscription,
        planUsageQuota: user.planUsageQuota,
        userType: user.userType,
        isExpired,
        hasActivePlan: user.activePlan && user.planSubscription && user.planSubscription.isActive && !isExpired
      }
    });

  } catch (error) {
    console.error("Get User Plan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan information"
    });
  }
};

exports.getUserPlanStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated"
      });
    }

    const user = await User.findById(req.user.id)
      .populate('activePlan')
      .select('activePlan planSubscription planUsageQuota userType');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if plan is expired
    let isExpired = false;
    if (user.planSubscription && user.planSubscription.endDate) {
      isExpired = new Date() > user.planSubscription.endDate;
      
      // If expired, update subscription status
      if (isExpired && user.planSubscription.isActive) {
        await User.findByIdAndUpdate(user._id, {
          'planSubscription.isActive': false,
          'planUsageQuota.limit': 0
        });
        user.planSubscription.isActive = false;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        userType: user.userType,
        isExpired,
        hasActivePlan: user.activePlan && user.planSubscription && user.planSubscription.isActive && !isExpired
      }
    });

  } catch (error) {
    console.error("Get User Plan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch plan information"
    });
  }
};
