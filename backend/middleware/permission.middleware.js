const Admin = require("../models/admin.model");

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Fetch admin from DB to get permissions
      const admin = await Admin.findById(req.user.id).select("permissions");
      
      if (!admin) {
        return res.status(403).json({
          message: "Access denied: admin not found"
        });
      }

      if (!admin.permissions || !admin.permissions.includes(requiredPermission)) {
        return res.status(403).json({
          message: "Access denied: insufficient permissions"
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error.message);
      return res.status(500).json({
        message: "Permission check failed",
        error: error.message
      });
    }
  };
};
