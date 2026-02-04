const Property = require("../../models/property.model");
const FilterProperty = require("../../models/filterProperty.model");
const Lead = require("../../models/lead.model");
const logAudit = require("../../utils/auditLogger");


exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      Property.find()
        .select("listingType propertyType propertyCategory pricing location status images listingScore createdAt userId isPremium premium description")
        .populate("userId", "name phone email")
        .sort({
          isPremium: -1,
          "premium.boostRank": -1,
          listingScore: -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(Number(limit)),

      Property.countDocuments()
    ]);

    // Debug log
    console.log("Properties fetched:", properties.length);
    if (properties.length > 0) {
      console.log("First property images:", properties[0].images);
    }

    res.json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("ERROR FETCHING PROPERTIES:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties"
    });
  }
};

// 🔹 Admin: single property (details page)
exports.getOne = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate("userId", "name phone email");

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Debug log
    console.log("Property ID:", req.params.id);
    console.log("Property Images:", property.images);

    // (future ready) Leads count
    const leadsCount = await Lead.countDocuments({
      listingId: property._id
    });

    res.json({
      success: true,
      property,
      leadsCount
    });
  } catch (error) {
    console.error("ERROR FETCHING PROPERTY:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property details"
    });
  }
};

// 🔹 Admin: approve / reject / block
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const propertyId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    // Valid statuses
    const validStatuses = ["PENDING", "ACTIVE", "REJECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Update status in main Property collection
    const property = await Property.findByIdAndUpdate(
      propertyId,
      { status },
      { new: true }
    ).populate("userId", "name phone email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // If status is ACTIVE, copy to FilterProperty collection
    if (status === "ACTIVE") {
      // Check if already exists in filter collection
      const existingFilter = await FilterProperty.findOne({ originalPropertyId: propertyId });

      const filterData = {
        originalPropertyId: property._id,
        userId: property.userId._id || property.userId,
        listingType: property.listingType,
        propertyType: property.propertyType,
        propertyCategory: property.propertyCategory,
        residentialDetails: property.residentialDetails,
        commercialDetails: property.commercialDetails,
        pgDetails: property.pgDetails,
        coLivingDetails: property.coLivingDetails,
        pricing: property.pricing,
        location: property.location,
        contact: property.contact,
        images: property.images,
        description: property.description,
        listingScore: property.listingScore,
        isPremium: property.isPremium,
        premium: property.premium,
        originalCreatedAt: property.createdAt,
        approvedAt: new Date(),
        approvedBy: req.user._id || req.user.id
      };

      if (existingFilter) {
        // Update existing filter property
        await FilterProperty.findByIdAndUpdate(existingFilter._id, filterData);
        console.log("✅ FilterProperty UPDATED for:", propertyId);
      } else {
        // Create new filter property
        await FilterProperty.create(filterData);
        console.log("✅ FilterProperty CREATED for:", propertyId);
      }
    } 
    // If status is NOT ACTIVE (REJECTED/BLOCKED/PENDING), remove from FilterProperty
    else {
      const deleted = await FilterProperty.findOneAndDelete({ originalPropertyId: propertyId });
      if (deleted) {
        console.log("🗑️ FilterProperty REMOVED for:", propertyId);
      }
    }

    // Log audit
    await logAudit({
      adminId: req.user._id || req.user.id,
      action: status === "ACTIVE" ? "PROPERTY_APPROVED" : status === "REJECTED" ? "PROPERTY_REJECTED" : "PROPERTY_CREATED",
      entityType: "PROPERTY",
      entityId: property._id,
      meta: { newStatus: status }
    });

    res.json({
      success: true,
      message: `Property status updated to ${status}`,
      property
    });
  } catch (error) {
    console.error("ERROR UPDATING STATUS:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property status",
      error: error.message
    });
  }
};

// 🔹 Admin: soft delete
exports.softDeleteProperty = async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id || req.user.id
    },
    { new: true }
  );

  await logAudit({
    adminId: req.user._id || req.user.id,
    action: "PROPERTY_DELETED",
    entityType: "PROPERTY",
    entityId: property._id
  });

  res.json({ message: "Property soft deleted", property });
};

// 🔹 Admin: restore soft deleted property
exports.restoreProperty = async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    },
    { new: true }
  );

  await logAudit({
    adminId: req.user._id || req.user.id,
    action: "PROPERTY_RESTORED",
    entityType: "PROPERTY",
    entityId: property._id
  });

  res.json({ message: "Property restored", property });
};

// 🔹 Admin: mark property as premium
exports.makePremium = async (req, res) => {
  const { planName, durationInDays, boostRank } = req.body;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + durationInDays);

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    {
      isPremium: true,
      premium: {
        startDate,
        endDate,
        planName,
        boostRank
      }
    },
    { new: true }
  );

  await logAudit({
    adminId: req.user._id || req.user.id,
    action: "PROPERTY_APPROVED",
    entityType: "PROPERTY",
    entityId: property._id,
    meta: { planName }
  });

  res.json({
    message: "Property marked as premium",
    property
  });
};


// 🔹 Admin: remove premium status
exports.removePremium = async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    {
      isPremium: false,
      premium: {}
    },
    { new: true }
  );

  await logAudit({
    adminId: req.user._id || req.user.id,
    action: "PROPERTY_APPROVED",
    entityType: "PROPERTY",
    entityId: property._id,
    meta: { reason: "Premium removed" }
  });

  res.json({
    message: "Premium removed",
    property
  });
};

// 🔹 Admin: Get all properties of a specific user
exports.getUserProperties = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const mongoose = require("mongoose");

    const [properties, total] = await Promise.all([
      Property.find({ userId, isDeleted: false })
        .select("listingType propertyType propertyCategory pricing location status images listingScore createdAt isPremium premium description residentialDetails commercialDetails pgDetails coLivingDetails")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Property.countDocuments({ userId, isDeleted: false })
    ]);

    // Group by status
    const statusCounts = await Property.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total,
      byStatus: {}
    };
    statusCounts.forEach(s => {
      stats.byStatus[s._id] = s.count;
    });

    res.json({
      success: true,
      properties,
      stats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("ERROR FETCHING USER PROPERTIES:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user properties",
      error: error.message
    });
  }
};

// 🔹 Admin: Update property details
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.userId;
    delete updates.createdAt;

    const property = await Property.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("userId", "name phone email");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // If property is ACTIVE, also update in FilterProperty
    if (property.status === "ACTIVE") {
      await FilterProperty.findOneAndUpdate(
        { originalPropertyId: property._id },
        {
          $set: {
            listingType: property.listingType,
            propertyType: property.propertyType,
            propertyCategory: property.propertyCategory,
            residentialDetails: property.residentialDetails,
            commercialDetails: property.commercialDetails,
            pgDetails: property.pgDetails,
            coLivingDetails: property.coLivingDetails,
            pricing: property.pricing,
            location: property.location,
            contact: property.contact,
            images: property.images,
            description: property.description,
            listingScore: property.listingScore,
            isPremium: property.isPremium,
            premium: property.premium
          }
        }
      );
    }

    // Log audit
    await logAudit({
      adminId: req.user._id || req.user.id,
      action: "PROPERTY_APPROVED",
      entityType: "PROPERTY",
      entityId: property._id,
      meta: { updatedFields: Object.keys(updates) }
    });

    res.json({
      success: true,
      message: "Property updated successfully",
      property
    });
  } catch (error) {
    console.error("ERROR UPDATING PROPERTY:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update property",
      error: error.message
    });
  }
};
