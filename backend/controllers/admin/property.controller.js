const Property = require("../../models/property.model");
const User = require("../../models/user.model");
const FilterProperty = require("../../models/filterProperty.model");
const Lead = require("../../models/lead.model");
const logAudit = require("../../utils/auditLogger");
const { deleteFromFirebase } = require("../../utils/firebaseUpload");
const mongoose = require("mongoose");


exports.getPropertyBookmarks = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Find all users who have bookmarked this property
    const usersWithBookmarks = await User.find(
      { bookmarks: propertyId },
      { name: 1, phone: 1, email: 1, userType: 1 }
    );

    res.json({
      success: true,
      data: {
        propertyId,
        bookmarkCount: usersWithBookmarks.length,
        bookmarkedBy: usersWithBookmarks
      }
    });
  } catch (error) {
    console.error("ERROR FETCHING PROPERTY BOOKMARKS:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch property bookmarks"
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      timeFilter,
      sortBy = 'recent'
    } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Status filter (pending, active, rejected)
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    // Time-based filter (day, week, month)
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeFilter) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Build sort object
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'premium':
        sortOptions = { 
          isPremium: -1, 
          "premium.boostRank": -1, 
          createdAt: -1 
        };
        break;
      case 'score':
        sortOptions = { 
          listingScore: -1, 
          createdAt: -1 
        };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select("listingType propertyType propertyCategory pricing location status images listingScore createdAt userId isPremium premium description")
        .populate("userId", "name phone email")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),

      Property.countDocuments(filter)
    ]);

    // Get status stats
    const statusStats = await Property.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total: await Property.countDocuments(),
      active: statusStats.find(s => s._id === "ACTIVE")?.count || 0,
      pending: statusStats.find(s => s._id === "PENDING")?.count || 0,
      rejected: statusStats.find(s => s._id === "REJECTED")?.count || 0,
      premium: await Property.countDocuments({ isPremium: true })
    };

    // Debug log
    console.log("Properties fetched:", properties.length);
    if (properties.length > 0) {
      console.log("First property images:", properties[0].images);
    }

    res.json({
      success: true,
      data: properties,
      stats,
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

exports.getAllWithBookmarks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      timeFilter,
      sortBy = 'recent'
    } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Status filter (pending, active, rejected)
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    // Time-based filter (day, week, month)
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeFilter) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Build sort object
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'premium':
        sortOptions = { 
          isPremium: -1, 
          "premium.boostRank": -1, 
          createdAt: -1 
        };
        break;
      case 'score':
        sortOptions = { 
          listingScore: -1, 
          createdAt: -1 
        };
        break;
      case 'bookmarks':
        // Will be handled in aggregation pipeline
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Use aggregation to get bookmark counts
    const propertiesAgg = await Property.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'bookmarks',
          as: 'bookmarkedBy'
        }
      },
      {
        $addFields: {
          bookmarkCount: { $size: '$bookmarkedBy' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          userId: { $arrayElemAt: ['$user', 0] }
        }
      },
      {
        $project: {
          listingType: 1,
          propertyType: 1,
          propertyCategory: 1,
          pricing: 1,
          location: 1,
          status: 1,
          images: 1,
          listingScore: 1,
          createdAt: 1,
          isPremium: 1,
          premium: 1,
          description: 1,
          bookmarkCount: 1,
          'userId._id': 1,
          'userId.name': 1,
          'userId.phone': 1,
          'userId.email': 1
        }
      },
      ...(sortBy === 'bookmarks' 
        ? [{ $sort: { bookmarkCount: -1, createdAt: -1 } }]
        : [{ $sort: sortOptions }]
      ),
      { $skip: skip },
      { $limit: Number(limit) }
    ]);

    const total = await Property.countDocuments(filter);

    // Get status stats
    const statusStats = await Property.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total: await Property.countDocuments(),
      active: statusStats.find(s => s._id === "ACTIVE")?.count || 0,
      pending: statusStats.find(s => s._id === "PENDING")?.count || 0,
      rejected: statusStats.find(s => s._id === "REJECTED")?.count || 0,
      premium: await Property.countDocuments({ isPremium: true })
    };

    res.json({
      success: true,
      data: propertiesAgg,
      stats,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("ERROR FETCHING PROPERTIES WITH BOOKMARKS:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties with bookmarks"
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      timeFilter,
      sortBy = 'recent'
    } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};

    // Status filter (pending, active, rejected)
    if (status && status !== 'all') {
      filter.status = status.toUpperCase();
    }

    // Time-based filter (day, week, month)
    if (timeFilter && timeFilter !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeFilter) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      if (startDate) {
        filter.createdAt = { $gte: startDate };
      }
    }

    // Build sort object
    let sortOptions = {};
    switch (sortBy) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'premium':
        sortOptions = { 
          isPremium: -1, 
          "premium.boostRank": -1, 
          createdAt: -1 
        };
        break;
      case 'score':
        sortOptions = { 
          listingScore: -1, 
          createdAt: -1 
        };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .select("listingType propertyType propertyCategory pricing location status images listingScore createdAt userId isPremium premium description")
        .populate("userId", "name phone email")
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),

      Property.countDocuments(filter)
    ]);

    // Get status stats
    const statusStats = await Property.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const stats = {
      total: await Property.countDocuments(),
      active: statusStats.find(s => s._id === "ACTIVE")?.count || 0,
      pending: statusStats.find(s => s._id === "PENDING")?.count || 0,
      rejected: statusStats.find(s => s._id === "REJECTED")?.count || 0,
      premium: await Property.countDocuments({ isPremium: true })
    };

    // Debug log
    console.log("Properties fetched:", properties.length);
    if (properties.length > 0) {
      console.log("First property images:", properties[0].images);
    }

    res.json({
      success: true,
      data: properties,
      stats,
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
    const updateData = { status };
    
    // Set activatedAt when property is activated
    if (status === "ACTIVE") {
      updateData.activatedAt = new Date();
    }

    const property = await Property.findByIdAndUpdate(
      propertyId,
      updateData,
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
      adminId: new mongoose.Types.ObjectId(req.user.id),
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

// 🔹 Admin: restore soft deleted property
exports.restoreProperty = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    await logAudit({
      adminId: new mongoose.Types.ObjectId(req.user.id),
      action: "PROPERTY_RESTORED",
      entityType: "PROPERTY",
      entityId: property._id
    });

    res.json({ 
      success: true,
      message: "Property restored", 
      property 
    });
  } catch (error) {
    console.error("ERROR RESTORING PROPERTY:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore property",
      error: error.message
    });
  }
};

// 🔹 Admin: permanent delete property
exports.permanentDeleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // First, get the property to access image URLs
    const property = await Property.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Delete images from Firebase Storage
    if (property.images && property.images.length > 0) {
      console.log(`🗑️ Deleting ${property.images.length} images from Firebase storage...`);
      
      for (const imageUrl of property.images) {
        try {
          await deleteFromFirebase(imageUrl);
        } catch (error) {
          console.warn(`⚠️ Failed to delete image: ${imageUrl}`, error.message);
        }
      }
    }

    // Delete related leads (optional - uncomment if needed)
    const deletedLeads = await Lead.deleteMany({ listingId: propertyId });
    console.log(`🗑️ Deleted ${deletedLeads.deletedCount} related leads`);

    // Delete from FilterProperty collection
    const deletedFilterProperties = await FilterProperty.deleteMany({ originalPropertyId: propertyId });
    console.log(`🗑️ Deleted ${deletedFilterProperties.deletedCount} filter property records`);

    // Delete the property record permanently
    await Property.findByIdAndDelete(propertyId);

    // Log the audit action
    await logAudit({
      adminId: new mongoose.Types.ObjectId(req.user.id),
      action: "PROPERTY_PERMANENT_DELETE",
      entityType: "PROPERTY",
      entityId: propertyId,
      meta: { 
        deletedLeads: deletedLeads.deletedCount,
        title: property.title || 'Unknown',
        location: property.location?.displayName || 'Unknown'
      }
    });

    res.json({ 
      success: true,
      message: "Property permanently deleted",
      data: {
        propertyId,
        deletedLeads: deletedLeads.deletedCount,
        deletedImages: property.images?.length || 0,
        deletedFilterProperties: deletedFilterProperties.deletedCount
      }
    });
    
  } catch (error) {
    console.error("ERROR PERMANENT DELETE:", error);
    res.status(500).json({
      success: false,
      message: "Failed to permanently delete property",
      error: error.message
    });
  }
};

// 🔹 Admin: mark property as premium
exports.makePremium = async (req, res) => {
  try {
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

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    await logAudit({
      adminId: new mongoose.Types.ObjectId(req.user.id),
      action: "PROPERTY_APPROVED",
      entityType: "PROPERTY",
      entityId: property._id,
      meta: { planName }
    });

    res.json({
      success: true,
      message: "Property marked as premium",
      property
    });
  } catch (error) {
    console.error("ERROR MAKING PREMIUM:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark property as premium",
      error: error.message
    });
  }
};

// 🔹 Admin: remove premium status
exports.removePremium = async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      {
        isPremium: false,
        premium: {}
      },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    await logAudit({
      adminId: new mongoose.Types.ObjectId(req.user.id),
      action: "PROPERTY_APPROVED",
      entityType: "PROPERTY",
      entityId: property._id,
      meta: { reason: "Premium removed" }
    });

    res.json({
      success: true,
      message: "Premium removed",
      property
    });
  } catch (error) {
    console.error("ERROR REMOVING PREMIUM:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove premium",
      error: error.message
    });
  }
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
      adminId: new mongoose.Types.ObjectId(req.user.id),
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
