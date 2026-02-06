const Banner = require("../../models/Banner.model");
const { uploadToFirebase, deleteFromFirebase } = require("../../utils/firebaseUpload");

exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error("Get banners error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    let { title, description, status } = req.body;

    status =
      status?.toLowerCase() === "active" ? "Active" : "Inactive";

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    // Upload to Firebase Storage
    const uploadResult = await uploadToFirebase(req.file, "banners");
    const imageUrl = uploadResult.url;

    const banner = await Banner.create({
      title,
      description,
      status,
      image: imageUrl,
      fileName: uploadResult.fileName  // Store for deletion later
    });

    res.status(201).json({
      success: true,
      banner
    });
  } catch (error) {
    console.error("Create banner error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, description, status } = req.body;

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (title) banner.title = title;
    if (description) banner.description = description;
    if (status) banner.status = status;

    // Update image only if a new one is provided
    if (req.file) {
      // Delete old image from Firebase if exists
      if (banner.fileName) {
        try {
          await deleteFromFirebase(banner.fileName);
        } catch (deleteError) {
          console.error("Error deleting old banner image:", deleteError);
        }
      }

      // Upload new image to Firebase Storage
      const uploadResult = await uploadToFirebase(req.file, "banners");
      banner.image = uploadResult.url;
      banner.fileName = uploadResult.fileName;
    }

    await banner.save();

    res.json({
      success: true,
      banner
    });
  } catch (error) {
    console.error("Update banner error:", error);
    res.status(500).json({ message: error.message });
  }
};


exports.toggleBannerStatus = async (req, res) => {
  try {
    console.log("🔄 Toggle banner request for ID:", req.params.id);

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      console.log("❌ Banner not found:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Banner not found"
      });
    }

    const oldStatus = banner.status;
    banner.status = banner.status === "Active" ? "Inactive" : "Active";
    await banner.save();

    console.log(`✅ Banner toggled: ${oldStatus} → ${banner.status}`);

    res.json({
      success: true,
      message: `Banner status changed to ${banner.status}`,
      status: banner.status,
      banner
    });
  } catch (error) {
    console.error("❌ Toggle banner status error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Delete image from Firebase Storage
    if (banner.fileName) {
      try {
        await deleteFromFirebase(banner.fileName);
      } catch (deleteError) {
        console.error("Error deleting banner image from Firebase:", deleteError);
      }
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully"
    });
  } catch (error) {
    console.error("Delete banner error:", error);
    res.status(500).json({ message: error.message });
  }
};


