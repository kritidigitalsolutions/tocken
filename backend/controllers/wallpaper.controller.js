const Wallpaper = require("../models/wallpaper.model");
const { uploadToFirebase, deleteFromFirebase } = require("../utils/firebaseUpload");

/**
 * GET All Wallpapers
 * GET /api/wallpapers
 */
exports.getAllWallpapers = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

        const skip = (page - 1) * limit;

        const wallpapers = await Wallpaper.find()
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Wallpaper.countDocuments();

        res.status(200).json({
            success: true,
            wallpapers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get all wallpapers error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET Single Wallpaper
 * GET /api/wallpapers/:id
 */
exports.getWallpaperById = async (req, res) => {
    try {
        const { id } = req.params;

        const wallpaper = await Wallpaper.findById(id);

        if (!wallpaper) {
            return res.status(404).json({
                success: false,
                message: "Wallpaper not found"
            });
        }

        res.status(200).json({
            success: true,
            wallpaper
        });
    } catch (error) {
        console.error("Get wallpaper by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET All Wallpapers (Admin)
 * GET /api/admin/wallpapers
 */
exports.getAllWallpapersAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

        const skip = (page - 1) * limit;

        const wallpapers = await Wallpaper.find()
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Wallpaper.countDocuments();

        res.status(200).json({
            success: true,
            wallpapers,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get all wallpapers (admin) error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * CREATE Wallpaper (Admin)
 * POST /api/admin/wallpapers
 */
exports.createWallpaper = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Image is required"
            });
        }

        // Upload to Firebase Storage
        const uploadResult = await uploadToFirebase(req.file, "wallpapers");

        const wallpaper = await Wallpaper.create({
            title: title || "",
            description: description || "",
            image: uploadResult.url,
            fileName: uploadResult.fileName  // Store for deletion later
        });

        res.status(201).json({
            success: true,
            message: "Wallpaper created successfully",
            wallpaper
        });
    } catch (error) {
        console.error("Create wallpaper error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * UPDATE Wallpaper (Admin)
 * PUT /api/admin/wallpapers/:id
 */
exports.updateWallpaper = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description } = req.body;

        let wallpaper = await Wallpaper.findById(id);

        if (!wallpaper) {
            return res.status(404).json({
                success: false,
                message: "Wallpaper not found"
            });
        }

        // Prepare update data
        const updateData = {
            title: title || wallpaper.title,
            description: description !== undefined ? description : wallpaper.description
        };

        // Only update image if a new file was uploaded
        if (req.file) {
            // Delete old image from Firebase if exists
            if (wallpaper.fileName) {
                try {
                    await deleteFromFirebase(wallpaper.fileName);
                } catch (deleteError) {
                    console.error("Error deleting old wallpaper image:", deleteError);
                }
            }

            // Upload new image to Firebase Storage
            const uploadResult = await uploadToFirebase(req.file, "wallpapers");
            updateData.image = uploadResult.url;
            updateData.fileName = uploadResult.fileName;
        }

        wallpaper = await Wallpaper.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Wallpaper updated successfully",
            wallpaper
        });
    } catch (error) {
        console.error("Update wallpaper error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * DELETE Wallpaper (Admin)
 * DELETE /api/admin/wallpapers/:id
 */
exports.deleteWallpaper = async (req, res) => {
    try {
        const { id } = req.params;

        const wallpaper = await Wallpaper.findById(id);

        if (!wallpaper) {
            return res.status(404).json({
                success: false,
                message: "Wallpaper not found"
            });
        }

        // Delete image from Firebase Storage
        if (wallpaper.fileName) {
            try {
                await deleteFromFirebase(wallpaper.fileName);
            } catch (deleteError) {
                console.error("Error deleting wallpaper image from Firebase:", deleteError);
            }
        }

        await Wallpaper.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Wallpaper deleted successfully"
        });
    } catch (error) {
        console.error("Delete wallpaper error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

