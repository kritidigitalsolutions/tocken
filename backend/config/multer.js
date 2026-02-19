const multer = require("multer");

// Use memory storage for Firebase upload
// Files will be stored in memory as Buffer and then uploaded to Firebase Storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  console.log("Multer received file:", {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    encoding: file.encoding
  });
  
  const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/jfif"];
  
  // Also check file extension as fallback
  const fileExtension = file.originalname.split('.').pop().toLowerCase();
  const allowedExtensions = ["jpg", "jpeg", "png", "webp", "jfif"];
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    console.error("File rejected - mimetype:", file.mimetype, "extension:", fileExtension);
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

module.exports = upload;
