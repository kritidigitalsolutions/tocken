const express    = require("express");
const router     = express.Router();
const controller = require("../controllers/developer.controller");
const auth       = require("../middleware/auth.middleware");
const upload     = require("../middleware/multer.middleware");

// Register developer profile (first time)
router.post("/register", auth, controller.registerDeveloper);

// Get my developer profile
router.get("/me", auth, controller.getMyProfile);

// Update my developer profile
router.put("/me", auth, controller.updateMyProfile);

// Upload logo
router.post("/me/logo", auth, upload.single("logo"), controller.uploadLogo);

// Upload Business PAN document
router.post("/me/pan", auth, upload.single("panDocument"), controller.uploadBusinessPAN);

// Upload RERA Certificate
router.post("/me/rera", auth, upload.single("reraCertificate"), controller.uploadReraCertificate);

// Upload GST Certificate
router.post("/me/gst", auth, upload.single("gstCertificate"), controller.uploadGstCertificate);

module.exports = router;
