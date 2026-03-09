const Project   = require("../../models/project.model");
const Developer = require("../../models/developer.model");
const User       = require("../../models/user.model");
const Notification = require("../../models/notification.model");
const { sendPushNotification } = require("../../utils/fcm.service");
const logAudit = require("../../utils/auditLogger");
const { deleteFromFirebase } = require("../../utils/firebaseUpload");

// ─────────────────────────────────────────────────────────────
// Helper – notify developer's linked user account
// ─────────────────────────────────────────────────────────────
async function notifyDeveloper(developerId, title, body, data = {}) {
  try {
    const dev = await Developer.findById(developerId).select("userId");
    if (!dev?.userId) return;

    await Notification.create({ title, message: body, type: "PROJECT", targetUser: dev.userId });

    const user = await User.findById(dev.userId).select("fcmToken");
    if (user?.fcmToken) {
      await sendPushNotification({ token: user.fcmToken, title, body, data });
    }
  } catch (e) {
    console.error("Notification error:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 1  Get All Projects  (filters + pagination + stats)
// ─────────────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      adminStatus, projectType, city,
      timeFilter, search, sortBy = "recent"
    } = req.query;

    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const filter = {};

    if (adminStatus && adminStatus !== "all")  filter.adminStatus  = adminStatus.toUpperCase();
    if (city)        filter["projectLocation.city"] = { $regex: city, $options: "i" };
    if (search)      filter.$text              = { $search: search };

    // projectType is an array in the model
    if (projectType && projectType !== "all")
      filter.projectType = { $in: [projectType.charAt(0).toUpperCase() + projectType.slice(1).toLowerCase()] };

    if (timeFilter && timeFilter !== "all") {
      const map = { today: 1, week: 7, month: 30, year: 365 };
      const days = map[timeFilter];
      if (days) {
        const from = new Date(); from.setDate(from.getDate() - days);
        filter.createdAt = { $gte: from };
      }
    }

    const sortMap = {
      recent:   { createdAt: -1 },
      oldest:   { createdAt: 1 },
      featured: { isFeatured: -1, createdAt: -1 }
    };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort(sortMap[sortBy] || { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("developer", "nameOfBusiness nameOfAuthorisedPerson logo mobileNo email websiteLink reraNo isApproved")
        .select("-__v"),
      Project.countDocuments(filter)
    ]);

    const [pending, active, rejected, blocked, featured] = await Promise.all([
      Project.countDocuments({ adminStatus: "PENDING" }),
      Project.countDocuments({ adminStatus: "ACTIVE" }),
      Project.countDocuments({ adminStatus: "REJECTED" }),
      Project.countDocuments({ adminStatus: "BLOCKED" }),
      Project.countDocuments({ isFeatured: true })
    ]);

    res.json({
      success: true,
      data: {
        projects,
        stats: { total: await Project.countDocuments(), pending, active, rejected, blocked, featured },
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    console.error("ADMIN - ERROR FETCHING PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2  Get Single Project
// ─────────────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate({
        path: "developer",
        select: "nameOfBusiness nameOfAuthorisedPerson logo mobileNo email websiteLink reraNo gstNo developerProfileDescription businessPAN businessPANUpload reraCertificateUpload gstCertificateUpload isApproved userId",
        populate: {
          path: "userId",
          select: "_id name phone profileImage"
        }
      })
      .select("-__v");

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("ADMIN - ERROR FETCHING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to fetch project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3  Update Admin Status  (PENDING → ACTIVE | REJECTED | BLOCKED)
// ─────────────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status, rejectionReason, adminNote } = req.body;

    if (!["PENDING", "ACTIVE", "REJECTED"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const prev = project.adminStatus;
    project.adminStatus = status;
    if (adminNote) project.adminNote = adminNote;

    if (status === "ACTIVE") {
      project.activatedAt     = new Date();
      project.rejectionReason = null;
    } else if (status === "REJECTED") {
      project.rejectionReason = rejectionReason || "Does not meet our guidelines.";
      project.activatedAt     = null;
    }

    await project.save();

    const notifMap = {
      ACTIVE:   { title: "Project Approved!", body: `Your project "${project.nameOfProject}" is now live.` },
      REJECTED: { title: "Project Rejected",  body: `"${project.nameOfProject}" was rejected. Reason: ${project.rejectionReason}` },
      PENDING:  { title: "Project Under Review", body: `"${project.nameOfProject}" is under review.` }
    };
    const notif = notifMap[status];
    if (notif) await notifyDeveloper(project.developer, notif.title, notif.body, { projectId: project._id.toString() });

    await logAudit({
      action: "PROJECT_STATUS_CHANGED",
      entityType: "Project",
      entityId: project._id,
      adminId: req.user?.id,
      meta: { from: prev, to: status, projectName: project.nameOfProject }
    });

    res.json({ success: true, message: `Status updated to ${status}`, data: project });
  } catch (error) {
    console.error("ADMIN - ERROR UPDATING STATUS:", error);
    res.status(500).json({ success: false, message: "Failed to update status", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 4  Toggle Featured
// ─────────────────────────────────────────────────────────────
exports.toggleFeatured = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.isFeatured = !project.isFeatured;
    project.featuredAt = project.isFeatured ? new Date() : null;
    await project.save();

    res.json({
      success: true,
      message: project.isFeatured ? "Marked as featured" : "Removed from featured",
      data: { isFeatured: project.isFeatured }
    });
  } catch (error) {
    console.error("ADMIN - ERROR TOGGLING FEATURED:", error);
    res.status(500).json({ success: false, message: "Failed to toggle featured", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 5  Update Project  (admin can edit any field)
// ─────────────────────────────────────────────────────────────
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate("developer", "nameOfBusiness nameOfAuthorisedPerson logo mobileNo email");

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    res.json({ success: true, message: "Project updated", data: project });
  } catch (error) {
    console.error("ADMIN - ERROR UPDATING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to update project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 6  Delete Project  (permanently)
// ─────────────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // if (project.mainImageFileName) {
    //   try { await deleteFromFirebase(project.mainImageFileName); } catch (e) { /* ignore */ }
    // }

    await logAudit({
      action: "PROJECT_DELETED",
      entityType: "Project",
      entityId: project._id,
      adminId: req.user?.id,
      meta: { projectName: project.nameOfProject }
    });

    await project.deleteOne();

    res.json({ success: true, message: "Project deleted permanently" });
  } catch (error) {
    console.error("ADMIN - ERROR DELETING PROJECT:", error);
    res.status(500).json({ success: false, message: "Failed to delete project", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 7  Get Projects by Developer
// ─────────────────────────────────────────────────────────────
exports.getDeveloperProjects = async (req, res) => {
  try {
    const { developerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      Project.find({ developer: developerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("-__v"),
      Project.countDocuments({ developer: developerId })
    ]);

    res.json({
      success: true,
      data: { projects, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } }
    });
  } catch (error) {
    console.error("ADMIN - ERROR FETCHING DEVELOPER PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch projects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 8  Get Projects by User ID  (finds developer linked to userId)
// ─────────────────────────────────────────────────────────────
exports.getProjectsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find developer account linked to this user
    const developer = await Developer.findOne({ userId }).select("_id");
    if (!developer) {
      return res.json({
        success: true,
        data: { projects: [], stats: { total: 0, pending: 0, active: 0, rejected: 0 }, pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } }
      });
    }

    const [projects, total, pending, active, rejected] = await Promise.all([
      Project.find({ developer: developer._id })
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit))
        .select("nameOfProject projectStatus projectType adminStatus isFeatured projectLocation uploadImage createdAt"),
      Project.countDocuments({ developer: developer._id }),
      Project.countDocuments({ developer: developer._id, adminStatus: "PENDING" }),
      Project.countDocuments({ developer: developer._id, adminStatus: "ACTIVE" }),
      Project.countDocuments({ developer: developer._id, adminStatus: "REJECTED" }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        stats: { total, pending, active, rejected },
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    console.error("ADMIN - ERROR FETCHING USER PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user projects", error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 8  Get Projects by User ID  (finds developer linked to userId)
// ─────────────────────────────────────────────────────────────
exports.getProjectsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50, adminStatus } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find developer account linked to this user
    const developer = await Developer.findOne({ userId }).select("_id");
    if (!developer) {
      return res.json({
        success: true,
        data: { projects: [], stats: { total: 0, pending: 0, active: 0, rejected: 0 }, pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } }
      });
    }

    const filter = { developer: developer._id };
    if (adminStatus && adminStatus !== "all") filter.adminStatus = adminStatus.toUpperCase();

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("developer", "nameOfBusiness logo mobileNo email isApproved")
        .select("-__v"),
      Project.countDocuments(filter)
    ]);

    const [pending, active, rejected] = await Promise.all([
      Project.countDocuments({ developer: developer._id, adminStatus: "PENDING" }),
      Project.countDocuments({ developer: developer._id, adminStatus: "ACTIVE" }),
      Project.countDocuments({ developer: developer._id, adminStatus: "REJECTED" }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        stats: { total, pending, active, rejected },
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      }
    });
  } catch (error) {
    console.error("ADMIN - ERROR FETCHING USER PROJECTS:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user projects", error: error.message });
  }
};
