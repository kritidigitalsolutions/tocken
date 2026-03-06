const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    action: {
      type: String,
      enum: [
        // Property
        "PROPERTY_CREATED",
        "PROPERTY_APPROVED",
        "PROPERTY_REJECTED",
        "PROPERTY_BLOCKED",
        "PROPERTY_DELETED",
        "PROPERTY_PERMANENT_DELETE",
        "PROPERTY_RESTORED",
        "PHOTO_DELETED",
        "LEAD_STATUS_UPDATED",
        // Project
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "PROJECT_STATUS_CHANGED",
        "PROJECT_FEATURED_TOGGLED",
        "PROJECT_DELETED",
        // Developer
        "DEVELOPER_APPROVED",
        "DEVELOPER_REJECTED"
      ],
      required: true
    },

    entityType: {
      type: String,
      enum: ["PROPERTY", "LEAD", "PHOTO", "Project", "Developer"],
      required: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    meta: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
