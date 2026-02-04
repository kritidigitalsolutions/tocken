const User = require("../../models/user.model");

// ✅ GET ALL USERS (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { userType } = req.query;
    
    // Build filter
    const filter = {};
    if (userType && userType !== "All") {
      filter.userType = userType;
    }

    const users = await User.find(filter)
      .select("-__v")
      .populate("activePlan", "name price duration")
      .sort({ createdAt: -1 });

    // Get stats
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$userType",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const activeUsers = await User.countDocuments({ isBlocked: false });
    const usersWithPlan = await User.countDocuments({ activePlan: { $ne: null } });

    res.status(200).json({
      success: true,
      users,
      stats: {
        total: totalUsers,
        blocked: blockedUsers,
        active: activeUsers,
        withPlan: usersWithPlan,
        byUserType: stats.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch users"
    });
  }
};

// ✅ UPDATE USER (block / plan)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: false }
    ).populate("activePlan", "name price duration");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "User update failed"
    });
  }
};


exports.blockUser = async (req, res) =>{
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );  

    res.status(200).json({
      success: true,
      message: "User blocked successfully",
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "User block failed"
    });
  }
};
exports.deleteUser = async (req, res) =>{
  try {
    const user = await User.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "User delete failed"
    });
  }
};