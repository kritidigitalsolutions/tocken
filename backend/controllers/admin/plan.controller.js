const Plan = require("../../models/plans.model");
const User = require("../../models/user.model");

// CREATE plan
exports.createPlan = async (req, res) => {
  try {
    console.log("📝 Creating plan with data:", req.body);
    const plan = await Plan.create(req.body);
    console.log("✅ Plan created successfully:", plan.planName);
    res.status(201).json({ success: true, plan });
  } catch (err) {
    console.error("❌ Plan creation error:", err);
    res.status(500).json({ success: false, message: "Plan create failed" });
  }
};

// GET all plans (admin)
exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find();
    console.log("📋 Fetching plans, found:", plans.length, "plans");
    
    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error("❌ Error fetching plans:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch plans"
    });
  }
};

// UPDATE plan
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Plan updated",
      plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Plan update failed"
    });
  }
};

// DELETE plan
exports.deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Plan deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Plan delete failed"
    });
  }
};

// Get user subscriptions (admin view)
exports.getUserSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', userType, planId } = req.query;

    const filter = {};
    
    // Filter by plan subscription status
    if (status === 'active') {
      filter['planSubscription.isActive'] = true;
      filter['planSubscription.endDate'] = { $gte: new Date() };
    } else if (status === 'expired') {
      filter.$or = [
        { 'planSubscription.isActive': false },
        { 'planSubscription.endDate': { $lt: new Date() } }
      ];
    } else if (status === 'no-plan') {
      filter.activePlan = null;
    }

    // Filter by user type
    if (userType) {
      filter.userType = userType;
    }

    // Filter by specific plan
    if (planId) {
      filter.activePlan = planId;
    }

    const users = await User.find(filter)
      .populate('activePlan')
      .select('name firstName lastName phone userType activePlan planSubscription leadQuota createdAt')
      .sort({ 'planSubscription.endDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    // Get stats
    const stats = {
      total: await User.countDocuments({}),
      withActivePlan: await User.countDocuments({ 
        activePlan: { $ne: null }, 
        'planSubscription.isActive': true,
        'planSubscription.endDate': { $gte: new Date() }
      }),
      expired: await User.countDocuments({
        $or: [
          { 'planSubscription.isActive': false },
          { 'planSubscription.endDate': { $lt: new Date() } }
        ]
      }),
      noPlan: await User.countDocuments({ activePlan: null })
    };

    res.status(200).json({
      success: true,
      data: users,
      stats,
      pagination: {
        current: parseInt(page),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user subscriptions"
    });
  }
};

// Assign plan to user manually (admin)
exports.assignPlanToUser = async (req, res) => {
  try {
    const { userId, planId, validityDays } = req.body;

    const user = await User.findById(userId);
    const plan = await Plan.findById(planId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (validityDays || plan.validityDays));

    // Calculate quota reset date
    const quotaResetDate = new Date(startDate);
    quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
    quotaResetDate.setDate(1);

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
        leadQuota: {
          consumed: 0,
          limit: plan.leadsPerMonth,
          resetDate: quotaResetDate
        }
      },
      { new: true }
    ).populate('activePlan');

    res.status(200).json({
      success: true,
      message: "Plan assigned to user successfully",
      data: updatedUser
    });

  } catch (error) {
    console.error("Assign Plan Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to assign plan to user"
    });
  }
};
