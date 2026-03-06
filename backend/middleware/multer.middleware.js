const multer = require("multer");

// Use memory storage — files kept as Buffer and uploaded to Firebase
const storage = multer.memoryStorage();

// ── Image-only filter (cover photo, gallery, logo)
const imageFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"), false);
  }
};

// ── Document filter — images + PDF (brochure, PAN, RERA, GST)
const docFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg", "image/png", "image/jpg", "image/webp",
    "application/pdf"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files or PDF files are allowed"), false);
  }
};

// Default upload — images only
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Document upload — images + PDF
const uploadDoc = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

module.exports = upload;
module.exports.uploadDoc = uploadDoc;

