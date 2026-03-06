const AuditLog = require("../models/auditLog.model");

const logAudit = async ({
  adminId,
  action,
  entityType,
  entityId,
  meta = {}
}) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      entityType,
      entityId,
      meta
    });
  } catch (err) {
    // Audit failures should never crash the main operation
    console.error("[AuditLog] Failed to write audit log:", err.message, { action, entityType });
  }
};

module.exports = logAudit;
