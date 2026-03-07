const express = require("express");
const router  = express.Router();
const c      = require("../controllers/project.controller");  // single controller
const auth   = require("../middleware/auth.middleware");
// const upload    = require("../middleware/multer.middleware");
const uploadDoc = require("../middleware/multer.middleware").uploadDoc;

// ════════════════════════════════════════════════════════════
//  PUBLIC  (no auth)
// ════════════════════════════════════════════════════════════
router.get("/",    c.getAllProjects);     // list all active projects
router.get("/:id", c.getProjectById);    // single project detail

// ════════════════════════════════════════════════════════════
//  DEVELOPER PROFILE  — /api/projects/developer/me
//  PUT  /developer/me         → update text/JSON data
//  PATCH /developer/me/uploads → upload files (logo | panDocument | reraCertificate | gstCertificate)
// ════════════════════════════════════════════════════════════
router.get("/developer/me", auth, c.getMyDeveloperProfile);
router.patch("/developer/me", auth, c.updateMyDeveloperProfile);
router.patch("/developer/me/uploads", auth, uploadDoc.any(), c.uploadDeveloperFiles);

// ════════════════════════════════════════════════════════════x
//  MY PROJECTS  — /api/projects/user/my
// ════════════════════════════════════════════════════════════
router.get("/user/my", auth, c.getMyProjects);

// ════════════════════════════════════════════════════════════
//  PROJECT CRUD
//  POST & PUT support multipart/form-data:
//    field: data = JSON string with all project + developer fields
//    files: mainImage | gallery[] | brochure | floorPlan (+ configType text field)
//  OR plain application/json (no files)
// ════════════════════════════════════════════════════════════
router.post("/",      auth, uploadDoc.any(), c.createProject);   // create
router.put("/:id",    auth, uploadDoc.any(), c.updateProject);   // update
router.delete("/:id", auth,                 c.deleteProject);    // delete (only PENDING)

// ════════════════════════════════════════════════════════════
//  PROJECT MEDIA UPLOADS
//  PATCH /:id/uploads  → all file uploads in one request
//    mainImage          → replaces cover photo
//    gallery            → appends to gallery (repeat key for multiple)
//    brochure           → replaces eBrochure PDF
//    floorPlan          → floor plan (also send: configType as text field)
//  DELETE /:id/gallery/:index → remove a gallery image by index
// ════════════════════════════════════════════════════════════
router.patch("/:id/uploads",         auth, uploadDoc.any(), c.handleProjectUploads);
router.delete("/:id/gallery/:index", auth,                  c.deleteGalleryImage);

module.exports = router;
