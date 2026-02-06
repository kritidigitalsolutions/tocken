const { bucket } = require("../config/firebase");
const path = require("path");

/**
 * Upload a file to Firebase Storage
 * @param {Object} file - Multer file object (with buffer)
 * @param {String} folder - Folder name in Firebase Storage (e.g., "banners", "properties", "wallpapers")
 * @returns {Object} - { url, fileName }
 */
const uploadToFirebase = async (file, folder = "uploads") => {
    try {
        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, "_");
        const fileName = `${folder}/${timestamp}_${originalName}`;

        // Create file reference in bucket
        const fileRef = bucket.file(fileName);

        // Upload buffer to Firebase Storage
        await fileRef.save(file.buffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        // Make the file publicly accessible
        await fileRef.makePublic();

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return {
            url: publicUrl,
            fileName: fileName,
            success: true
        };
    } catch (error) {
        console.error("Firebase upload error:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

/**
 * Upload multiple files to Firebase Storage
 * @param {Array} files - Array of Multer file objects
 * @param {String} folder - Folder name in Firebase Storage
 * @returns {Array} - Array of { url, fileName }
 */
const uploadMultipleToFirebase = async (files, folder = "uploads") => {
    try {
        const uploadPromises = files.map(file => uploadToFirebase(file, folder));
        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error("Firebase multiple upload error:", error);
        throw new Error(`Failed to upload files: ${error.message}`);
    }
};

/**
 * Delete a file from Firebase Storage
 * @param {String} fileName - Full path of file in storage (e.g., "banners/123456_image.jpg")
 */
const deleteFromFirebase = async (fileName) => {
    try {
        // If fileName is a full URL, extract the path
        if (fileName.startsWith("https://")) {
            const bucketName = bucket.name;
            const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
            const match = fileName.match(urlPattern);
            if (match) {
                fileName = match[1];
            }
        }

        const fileRef = bucket.file(fileName);
        await fileRef.delete();

        return { success: true, message: "File deleted successfully" };
    } catch (error) {
        console.error("Firebase delete error:", error);
        // Don't throw error if file doesn't exist
        if (error.code === 404) {
            return { success: true, message: "File already deleted or not found" };
        }
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

module.exports = {
    uploadToFirebase,
    uploadMultipleToFirebase,
    deleteFromFirebase
};
