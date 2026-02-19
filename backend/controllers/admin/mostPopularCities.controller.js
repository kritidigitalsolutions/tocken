// const Property = require("../../models/property.model");
const FilterProperty = require("../../models/filterProperty.model");
const MostPopularCities = require("../../models/mostPopularCities.model");
const { uploadToFirebase, deleteFromFirebase } = require("../../utils/firebaseUpload");

/**
 * ✅ GET MOST POPULAR CITIES FROM DATABASE
 * Returns cities with their property counts and images from MostPopularCities collection
 */
exports.getMostPopularCities = async (req, res) => {
  try {
    const { limit = 10, activeOnly = true } = req.query;

    // Build filter
    const filter = {};
    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    // Get cities from database sorted by total properties
    const cities = await MostPopularCities.find(filter)
      .sort({ totalProperties: -1 })
      .limit(parseInt(limit))
      .select("-__v");

    res.status(200).json({
      success: true,
      message: `Found ${cities.length} most popular cities`,
      topCities: cities.map(city => ({
        _id: city._id,
        city: city.city,
        totalProperties: city.totalProperties,
        imageUrl: city.imageUrl,
        isActive: city.isActive,
        lastUpdated: city.lastUpdated
      }))
    });
  } catch (error) {
    console.error("Get most popular cities error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch popular cities"
    });
  }
};

/**
 * ✅ SYNC CITIES FROM ACTIVE PROPERTIES (FilterProperty Collection)
 * Aggregates active properties by city and counts UNIQUE originalPropertyIds
 */
exports.syncCitiesFromProperties = async (req, res) => {
  try {
    // Aggregate ACTIVE properties by city from FilterProperty collection
    // Using $addToSet to ensure we count only unique originalPropertyIds
    const citiesData = await FilterProperty.aggregate([
      {
        $match: {
          "location.city": { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$location.city",
          uniqueProperties: { $addToSet: "$originalPropertyId" }
        }
      },
      {
        $project: {
          _id: 1,
          totalProperties: { $size: "$uniqueProperties" }
        }
      },
      {
        $sort: { totalProperties: -1 }
      }
    ]);

    if (citiesData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active properties found in filterProperty collection",
        synced: 0
      });
    }

    // Update or create entries in MostPopularCities
    const syncPromises = citiesData.map(async (cityData) => {
      const existingCity = await MostPopularCities.findOne({ city: cityData._id });

      if (existingCity) {
        // Update property count, keep existing image
        existingCity.totalProperties = cityData.totalProperties;
        existingCity.lastUpdated = Date.now();
        await existingCity.save();
        return { updated: true, city: cityData._id, count: cityData.totalProperties };
      } else {
        // Create new entry without image
        await MostPopularCities.create({
          city: cityData._id,
          totalProperties: cityData.totalProperties,
          imageUrl: null,
          imageName: null,
          isActive: true
        });
        return { created: true, city: cityData._id, count: cityData.totalProperties };
      }
    });

    const results = await Promise.all(syncPromises);
    const created = results.filter(r => r.created).length;
    const updated = results.filter(r => r.updated).length;

    res.status(200).json({
      success: true,
      message: "Cities synced successfully from active properties (unique count)",
      synced: citiesData.length,
      created,
      updated,
      topCities: citiesData.slice(0, 10).map(c => ({
        city: c._id,
        totalProperties: c.totalProperties
      }))
    });
  } catch (error) {
    console.error("Sync cities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync cities from active properties"
    });
  }
};

/**
 * ✅ UPLOAD CITY IMAGE
 * Admin uploads image for a specific city
 */
exports.uploadCityImage = async (req, res) => {
  try {
    const { id } = req.params;

    // Debug logging
    console.log("Upload request received for city:", id);
    console.log("File present:", !!req.file);
    if (req.file) {
      console.log("File details:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // Check if file is provided
    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({
        success: false,
        message: "Please upload an image file"
      });
    }

    // Find the city
    const city = await MostPopularCities.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    // Delete old image from Firebase if exists
    if (city.imageName) {
      try {
        await deleteFromFirebase(city.imageName);
      } catch (error) {
        console.warn("Old image deletion failed:", error.message);
      }
    }

    // Upload new image to Firebase
    const uploadResult = await uploadToFirebase(req.file, "most-popular-cities");

    // Update city with new image
    city.imageUrl = uploadResult.url;
    city.imageName = uploadResult.fileName;
    city.lastUpdated = Date.now();
    await city.save();

    res.status(200).json({
      success: true,
      message: "City image uploaded successfully",
      city: {
        _id: city._id,
        city: city.city,
        totalProperties: city.totalProperties,
        imageUrl: city.imageUrl,
        isActive: city.isActive
      }
    });
  } catch (error) {
    console.error("Upload city image error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload city image"
    });
  }
};

/**
 * ✅ UPDATE CITY STATUS (Active/Inactive)
 */
exports.updateCityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: "isActive field must be a boolean"
      });
    }

    const city = await MostPopularCities.findByIdAndUpdate(
      id,
      { isActive, lastUpdated: Date.now() },
      { new: true }
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `City ${isActive ? 'activated' : 'deactivated'} successfully`,
      city
    });
  } catch (error) {
    console.error("Update city status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update city status"
    });
  }
};

/**
 * ✅ DELETE CITY IMAGE
 */
exports.deleteCityImage = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await MostPopularCities.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    // Delete image from Firebase if exists
    if (city.imageName) {
      try {
        await deleteFromFirebase(city.imageName);
      } catch (error) {
        console.warn("Image deletion from Firebase failed:", error.message);
      }
    }

    // Update city - remove image references
    city.imageUrl = null;
    city.imageName = null;
    city.lastUpdated = Date.now();
    await city.save();

    res.status(200).json({
      success: true,
      message: "City image deleted successfully",
      city
    });
  } catch (error) {
    console.error("Delete city image error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete city image"
    });
  }
};

/**
 * ✅ DELETE CITY ENTRY
 */
exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    const city = await MostPopularCities.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found"
      });
    }

    // Delete image from Firebase if exists
    if (city.imageName) {
      try {
        await deleteFromFirebase(city.imageName);
      } catch (error) {
        console.warn("Image deletion from Firebase failed:", error.message);
      }
    }

    await MostPopularCities.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "City deleted successfully"
    });
  } catch (error) {
    console.error("Delete city error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete city"
    });
  }
};
