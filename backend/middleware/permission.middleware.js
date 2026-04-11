const Admin = require("../models/admin.model");
const permissionsMap = require("../utils/permissions");

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

module.exports = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Fetch admin from DB to get role + permissions
      const admin = await Admin.findById(req.user.id).select("role permissions");
      
      if (!admin) {
        return res.status(403).json({
          message: "Access denied: admin not found"
        });
      }

      const role = normalizeRole(admin.role || req.user?.role || "ADMIN");
      // Super admin always has access for admin actions.
      if (role === "SUPER_ADMIN") {
        return next();
      }

      const dbPermissions = Array.isArray(admin.permissions) ? admin.permissions : [];
      // Backward compatibility: use role defaults when DB permissions are missing.
      const effectivePermissions = dbPermissions.length
        ? dbPermissions
        : (permissionsMap[role] || []);

      if (!effectivePermissions.includes(requiredPermission)) {
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
