const express = require("express");
const router  = express.Router();
const controller = require("../../controllers/admin/project.controller");
const adminAuth  = require("../../middleware/admin.middleware");
const permit     = require("../../middleware/permission.middleware");

// All projects (filters + pagination + stats)
router.get("/", adminAuth, controller.getAll);

// Projects by a specific developer
router.get("/developer/:developerId", adminAuth, controller.getDeveloperProjects);

// Projects by a specific user account (via their linked developer)
router.get("/user/:userId", adminAuth, controller.getProjectsByUser);

// Single project
router.get("/:id", adminAuth, controller.getOne);

// Update any field
router.put("/:id", adminAuth, controller.updateProject);

// Change admin status
router.patch("/:id/status", adminAuth, controller.updateStatus);

// Toggle featured
router.patch("/:id/featured", adminAuth, controller.toggleFeatured);

// Delete permanently
router.delete("/:id", adminAuth, permit("PROPERTY_DELETE"), controller.deleteProject);

module.exports = router;

