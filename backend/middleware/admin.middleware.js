const Admin = require("../models/admin.model");

const ALLOWED_ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

const normalizeRole = (role) => String(role || "").trim().toUpperCase();

const isAdmin  = async (req, res, next) => {
  const normalizedRole = normalizeRole(req.user?.role);
  console.log("isAdmin middleware - User role:", req.user?.role, "normalized:", normalizedRole);

  if (ALLOWED_ADMIN_ROLES.has(normalizedRole)) {
    req.user.role = normalizedRole;
    console.log("isAdmin passed - Admin user");
    return next();
  }

  try {
    const adminId = req.user?._id || req.user?.id;
    if (!adminId) {
      console.log("isAdmin failed - No user id in token");
      return res.status(403).json({ message: "Admin access only" });
    }

    const admin = await Admin.findById(adminId).select("role");
    if (!admin) {
      console.log("isAdmin failed - Admin not found for token id");
      return res.status(403).json({ message: "Admin access only" });
    }

    const dbRole = normalizeRole(admin.role || "ADMIN");
    if (!ALLOWED_ADMIN_ROLES.has(dbRole)) {
      console.log("isAdmin failed - Admin DB role is not allowed:", dbRole);
      return res.status(403).json({ message: "Admin access only" });
    }

    req.user.role = dbRole;
    console.log("isAdmin passed - Admin user (DB role fallback)");
    next();
  } catch (error) {
    console.log("isAdmin error:", error.message);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

module.exports = isAdmin;
module.exports.isAdmin = isAdmin;
