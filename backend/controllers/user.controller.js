const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const Property = require("../models/property.model");
const { uploadToFirebase, deleteFromFirebase } = require("../utils/firebaseUpload");

/**
 * HELPER: Generate Unique Username
 * Automatically generates a unique username from firstName and lastName
 * Includes: letters, numbers, and underscores
 * Example: "John Doe" = "john_doe" or "john_doe1", "john_doe2" if taken
 */

const generateUsername = async () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const generateRandomeLetters = (length = 4) => {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result;
  };
  let username;
  do {
    const randomLetters = generateRandomeLetters(4);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    username = `${randomLetters}${randNum}`;
  } while (await User.findOne({ username }));

  return username;
}


// ✅ GET user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



/**
 * COMPLETE USER PROFILE (for new users after OTP verification)
 * POST /api/user/profile-info
 * Body: { phone, userType, firstName, lastName, email }
 * File: profileImage (multipart/form-data)
 */
exports.completeProfile = async (req, res) => {
  try {
    const { phone, userType, firstName, lastName, email } = req.body;

    // Validation
    if (!phone || !userType || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "phone, userType, firstName, and lastName are required"
      });
    }

    // Validate userType
    const validUserTypes = ["INDIVIDUAL", "AGENT", "BUILDER"];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userType. Must be INDIVIDUAL, AGENT, or BUILDER"
      });
    }

    // Format phone number for consistency
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
    const formattedPhone = '+' + cleanPhone;

    // Debug: Log everything received
    console.log("======= COMPLETE PROFILE REQUEST =======");
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("File received:", req.file ? "YES" : "NO");
    if (req.file) {
      console.log("File Info:", {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size + " bytes"
      });
    }
    console.log("=========================================");

    // Handle profile image upload to Firebase
    let profileImageUrl = "";

    if (req.file) {
      try {
        console.log("⏳ Uploading to Firebase Storage...");
        const uploadResult = await uploadToFirebase(req.file, "profile-images");
        profileImageUrl = uploadResult.url;
        console.log("✅ Upload successful:", profileImageUrl);
      } catch (uploadError) {
        console.error("❌ Firebase upload error:", uploadError.message);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
          error: uploadError.message
        });
      }
    } else {
      console.log("⚠️ No file received in request");
    }

    // Check if user already exists
    let user = await User.findOne({ phone: formattedPhone });

    if (!user) {
      const username = await generateUsername(firstName, lastName);
      // Create new user
      user = await User.create({
        phone: formattedPhone,
        userType,
        firstName,
        lastName,
        email: email || "",
        profileImage: profileImageUrl,
        name: `${firstName} ${lastName}`,
        username
      });
    } else {
      // Update existing user
      const updateData = {
        userType,
        firstName,
        lastName,
        email: email || "",
        name: `${firstName} ${lastName}`
      };

      // Only update profileImage if new one is uploaded
      if (profileImageUrl) {
        // Delete old profile image from Firebase if exists
        if (user.profileImage) {
          try {
            await deleteFromFirebase(user.profileImage);
          } catch (deleteError) {
            console.error("Error deleting old profile image:", deleteError);
          }
        }
        updateData.profileImage = profileImageUrl;
      }

      user = await User.findByIdAndUpdate(
        user._id,
        updateData,
        { new: true, runValidators: true }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        phone: user.phone,
        role: "USER"
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Profile completed successfully",
      token,
      user: user
    });

  } catch (error) {
    console.error("Complete profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/**
 * UPDATE user profile
 * PATCH /api/user/profile-update
 * Body: { firstName, lastName, gstNumber }
 * File: profileImage (optional, multipart/form-data)
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, gstNumber } = req.body;

    // Get current user to check for existing profile image
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Build update data
    const updateData = {
      firstName,
      lastName,
      gstNumber,
      name: `${firstName} ${lastName}`,
    };

    // Handle profile image upload to Firebase
    if (req.file) {
      try {
        // Delete old profile image from Firebase if exists
        if (currentUser.profileImage) {
          try {
            await deleteFromFirebase(currentUser.profileImage);
          } catch (deleteError) {
            console.error("Error deleting old profile image:", deleteError);
          }
        }

        // Upload new image to Firebase
        const uploadResult = await uploadToFirebase(req.file, "profile-images");
        updateData.profileImage = uploadResult.url;
      } catch (uploadError) {
        console.error("Profile image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image"
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-__v");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};




/**
 * TOGGLE PHONE PRIVACY
 * PATCH /api/user/phone-privacy
 * 
 * Toggle phone number visibility (public/private)
 */
exports.togglePhonePrivacy = async (req, res) => {
  try {
    const { isPhonePrivate } = req.body;

    if (typeof isPhonePrivate !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPhonePrivate must be true or false"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isPhonePrivate },
      { new: true }
    ).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: isPhonePrivate
        ? "Phone number is now private"
        : "Phone number is now public",
      isPhonePrivate: user.isPhonePrivate
    });

  } catch (error) {
    console.error("Toggle phone privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * GET PHONE PRIVACY STATUS
 * GET /api/user/phone-privacy
 */
exports.getPhonePrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("isPhonePrivate");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      isPhonePrivate: user.isPhonePrivate || false
    });

  } catch (error) {
    console.error("Get phone privacy error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * REQUEST ACCOUNT DELETION
 * POST /api/user/request-deletion
 * 
 * User requests to delete their account
 */
exports.requestAccountDeletion = async (req, res) => {
  try {
    const { reason, feedback } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Please select a reason for deletion"
      });
    }

    if (!feedback || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide feedback (minimum 10 characters)"
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already requested
    if (user.deletionRequest?.status === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "You already have a pending deletion request"
      });
    }

    user.deletionRequest = {
      status: "PENDING",
      reason,
      feedback: feedback.trim(),
      requestedAt: new Date()
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Account deletion request submitted. Our team will review it shortly.",
      deletionRequest: user.deletionRequest
    });

  } catch (error) {
    console.error("Request deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * CANCEL DELETION REQUEST
 * DELETE /api/user/cancel-deletion
 * 
 * User cancels their deletion request
 */
// exports.cancelDeletionRequest = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found"
//       });
//     }

//     if (user.deletionRequest?.status !== "PENDING") {
//       return res.status(400).json({
//         success: false,
//         message: "No pending deletion request to cancel"
//       });
//     }

//     user.deletionRequest = {
//       status: "NONE",
//       reason: null,
//       feedback: null,
//       requestedAt: null
//     };

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Deletion request cancelled successfully"
//     });

//   } catch (error) {
//     console.error("Cancel deletion error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };

/**
 * GET DELETION REQUEST STATUS
 * GET /api/user/deletion-status
 */
exports.getDeletionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("deletionRequest");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      deletionRequest: user.deletionRequest || { status: "NONE" }
    });

  } catch (error) {
    console.error("Get deletion status error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


exports.saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    // Validate FCM token format
    if (typeof fcmToken !== 'string' || fcmToken.length < 50) {
      console.warn("⚠️  Invalid FCM token format received:", fcmToken?.substring(0, 30));
      return res.status(400).json({
        success: false,
        message: "Invalid FCM token format. Token should be a long string from Firebase."
      });
    }

    console.log("📝 Saving FCM token for user:", req.user.id, "Token:", fcmToken.substring(0, 30) + "...");

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fcmToken },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "FCM token saved successfully",
      tokenPreview: fcmToken.substring(0, 30) + "..."
    });
  } catch (error) {
    console.error("Save FCM token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save FCM token",
      error: error.message
    });
  }
};

/**
 * TRACK PROPERTY VIEW
 * POST /api/user/property-view
 * Body: { propertyId }
 */
exports.trackPropertyView = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required"
      });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Get MostVisited model
    const MostVisited = require("../models/mostVisited.model");

    // Find or create MostVisited entry for this property
    let visitRecord = await MostVisited.findOne({ propertyId });

    if (visitRecord) {
      // Check if user already viewed this property
      const existingViewer = visitRecord.recentViewers?.find(
        (viewer) => viewer.userId?.toString() === userId
      );

      if (existingViewer) {
        // Update existing viewer's timestamp
        existingViewer.viewedAt = new Date();
      } else {
        // Add new viewer
        if (!visitRecord.recentViewers) {
          visitRecord.recentViewers = [];
        }
        visitRecord.recentViewers.push({
          userId,
          viewedAt: new Date()
        });
        visitRecord.uniqueViewers = (visitRecord.uniqueViewers || 0) + 1;
      }

      // Increment total views
      visitRecord.totalViews = (visitRecord.totalViews || 0) + 1;
      visitRecord.lastViewedAt = new Date();

      // Keep only last 50 viewers
      if (visitRecord.recentViewers.length > 50) {
        visitRecord.recentViewers = visitRecord.recentViewers.slice(-50);
      }

      await visitRecord.save();
    } else {
      // Create new visit record
      visitRecord = await MostVisited.create({
        propertyId,
        totalViews: 1,
        uniqueViewers: 1,
        lastViewedAt: new Date(),
        recentViewers: [{
          userId,
          viewedAt: new Date()
        }]
      });
    }

    res.status(200).json({
      success: true,
      message: "Property view tracked successfully",
      totalViews: visitRecord.totalViews,
      uniqueViewers: visitRecord.uniqueViewers
    });

  } catch (error) {
    console.error("Track property view error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track property view",
      error: error.message
    });
  }
};

/**
 * DEBUG MOST VISITED (for debugging MostVisited collection)
 * GET /api/user/debug-most-visited
 */
exports.debugMostVisited = async (req, res) => {
  try {
    const MostVisited = require("../models/mostVisited.model");

    const allEntries = await MostVisited.find()
      .populate({
        path: "propertyId",
        populate: {
          path: "userId",
          select: "name phone email"
        }
      })
      .populate({
        path: "recentViewers.userId",
        select: "name phone email"
      })
      .sort({ totalViews: -1 })
      .lean();

    const debugData = allEntries.map(entry => ({
      _id: entry._id,
      propertyId: entry.propertyId?._id,
      propertyTitle: entry.propertyId?.title,
      propertyStatus: entry.propertyId?.status,
      propertyDeleted: entry.propertyId?.isDeleted,
      totalViews: entry.totalViews,
      uniqueViewers: entry.uniqueViewers,
      lastViewedAt: entry.lastViewedAt,
      recentViewers: entry.recentViewers?.map(viewer => ({
        userId: viewer.userId?._id,
        userName: viewer.userId?.name,
        viewedAt: viewer.viewedAt
      }))
    }));

    res.status(200).json({
      success: true,
      message: "Debug data for MostVisited collection",
      totalEntries: allEntries.length,
      data: debugData
    });
  } catch (error) {
    console.error("Debug most visited error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch debug data",
      error: error.message
    });
  }
};

/**
 * GET MOST VISITED PROPERTIES
 * GET /api/user/most-visited-properties?limit=20&minViews=2
 * 
 * Returns properties with highest view counts with complete data
 */
exports.getMostVisitedProperties = async (req, res) => {
  try {
    const { limit = 20, minViews = 2 } = req.query;
    const maxLimit = 20;

    const MostVisited = require("../models/mostVisited.model");

    // Get most visited properties with minimum view threshold
    const mostVisited = await MostVisited.find({
      totalViews: { $gte: parseInt(minViews) }
    })
      .populate({
        path: "propertyId",
        match: {
          status: "ACTIVE",
          isDeleted: false
        },
        populate: {
          path: "userId",
          select: "name phone profileImage email"
        }
      })
      .sort({ totalViews: -1, lastViewedAt: -1 })
      .limit(Math.min(parseInt(limit), maxLimit))
      .lean();

    console.log("🔍 Raw MostVisited entries found:", mostVisited.length);

    // Filter valid admin-approved properties and return complete property data
    const validProperties = mostVisited
      .filter(item => item.propertyId) // Only properties that are approved
      .map(item => {
        const property = item.propertyId;

        // Return complete property object with visit stats
        return {
          ...property, // Spread all property fields
          _visitStats: {
            totalViews: item.totalViews,
            uniqueViewers: item.uniqueViewers,
            lastViewedAt: item.lastViewedAt
          }
        };
      });

    console.log("✅ Valid active properties:", validProperties.length);

    res.status(200).json({
      success: true,
      count: validProperties.length,
      message: `Top ${validProperties.length} most visited properties (minimum ${minViews} views)`,
      data: validProperties
    });
  } catch (error) {
    console.error("❌ Get most visited properties error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most visited properties",
      error: error.message
    });
  }
};

/**
 * GET RECENTLY ADDED PROPERTIES (Simple API)
 * GET /api/user/recently-added-properties?limit=10
 * 
 * Returns properties recently activated by admin with complete data
 * Simple API without complex filters
 */
exports.getRecentlyAddedProperties = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log("🔍 Fetching recently added properties, limit:", limit);

    // Query - get all active properties with complete data
    const properties = await Property.find({
      status: "ACTIVE",
      isDeleted: false
    })
      .populate("userId", "name firstName lastName phone email userType profileImage")
      .sort({ createdAt: -1 }) // Newest first
      .limit(parseInt(limit))
      .lean(); // Convert to plain JavaScript objects

    console.log("📊 Found properties:", properties.length);

    res.status(200).json({
      success: true,
      count: properties.length,
      message: `Found ${properties.length} recently added properties`,
      data: properties // Return complete property objects
    });

  } catch (error) {
    console.error("❌ Get recently added properties error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recently added properties",
      error: error.message
    });
  }
};

/**
 * GET MOST LIKED PROPERTIES (Global Bookmarks Analysis)
 * GET /api/user/most-liked-properties?limit=10
 * 
 * Returns properties with highest bookmark counts globally with complete data
 */
exports.getMostLikedProperties = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    console.log("🔍 Analyzing global bookmark data for most liked properties...");

    // Get all users with bookmarks 
    const users = await User.find({
      bookmarks: { $exists: true, $ne: [] }
    })
      .select("bookmarks")
      .lean();

    console.log("📊 Found users with bookmarks:", users.length);

    // Count bookmarks for each property
    const bookmarkCounts = {};

    for (const user of users) {
      if (user.bookmarks && user.bookmarks.length > 0) {
        for (const propertyId of user.bookmarks) {
          const propId = propertyId.toString();
          bookmarkCounts[propId] = (bookmarkCounts[propId] || 0) + 1;
        }
      }
    }

    console.log("🏆 Properties with bookmarks:", Object.keys(bookmarkCounts).length);

    // Sort by bookmark count and get top properties
    const sortedProperties = Object.entries(bookmarkCounts)
      .sort(([, countA], [, countB]) => countB - countA) // Descending order
      .slice(0, parseInt(limit))
      .map(([propertyId, count]) => ({ propertyId, bookmarkCount: count }));

    console.log("📈 Top bookmarked properties:", sortedProperties);

    // Get complete property details  
    const propertyIds = sortedProperties.map(p => p.propertyId);

    const properties = await Property.find({
      _id: { $in: propertyIds },
      status: "ACTIVE",
      isDeleted: false
    })
      .populate("userId", "name firstName lastName phone email userType profileImage")
      .lean();

    console.log("✅ Found active properties:", properties.length);

    // Add bookmark count to each property and sort by bookmark count
    const propertiesWithBookmarks = properties
      .map(property => {
        const bookmarkInfo = sortedProperties.find(p => p.propertyId === property._id.toString());
        return {
          ...property, // Spread all property fields
          _bookmarkStats: {
            totalBookmarks: bookmarkInfo?.bookmarkCount || 0,
            bookmarkRank: sortedProperties.findIndex(p => p.propertyId === property._id.toString()) + 1
          }
        };
      })
      .sort((a, b) => b._bookmarkStats.totalBookmarks - a._bookmarkStats.totalBookmarks);

    console.log("🎯 Properties with bookmark counts:", propertiesWithBookmarks.length);

    res.status(200).json({
      success: true,
      count: propertiesWithBookmarks.length,
      message: `Found ${propertiesWithBookmarks.length} most liked properties`,
      data: propertiesWithBookmarks // Return complete property objects with bookmark stats
    });

  } catch (error) {
    console.error("❌ Get most liked properties error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch most liked properties",
      error: error.message
    });
  }
};

/**
 * GET MOST POPULAR CITIES
 * GET /api/user/most-popular-cities?limit=5&propertiesPerCity=10
 * 
 * Returns properties from cities with highest property counts
 * Cities with most properties are considered "popular"
 */
exports.getMostPopularCities = async (req, res) => {
  try {
    const {
      limit = 5,              // Number of top cities to return
      propertiesPerCity = 10  // Properties per city
    } = req.query;

    console.log("🏙️ Analyzing most popular cities by property count...");

    // Aggregate properties by city to find most popular cities
    const cityCounts = await Property.aggregate([
      {
        $match: {
          status: "ACTIVE",
          isDeleted: false,
          "location.city": { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$location.city",
          propertyCount: { $sum: 1 }
        }
      },
      {
        $sort: { propertyCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    console.log("📊 Top cities by property count:", cityCounts);

    if (cityCounts.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No cities found with properties",
        data: []
      });
    }

    // Get top city names
    const topCityNames = cityCounts.map(city => city._id);

    // Get properties from these top cities
    const properties = await Property.find({
      status: "ACTIVE",
      isDeleted: false,
      "location.city": { $in: topCityNames }
    })
      .populate("userId", "name firstName lastName phone email userType profileImage")
      .sort({ isPremium: -1, createdAt: -1 }) // Premium first, then newest
      .lean();

    console.log("✅ Total properties from top cities:", properties.length);

    // Group properties by city and limit per city
    const propertiesByCity = {};

    topCityNames.forEach(city => {
      propertiesByCity[city] = [];
    });

    // Distribute properties to respective cities (with limit per city)
    properties.forEach(property => {
      const city = property.location?.city;
      if (city && propertiesByCity[city] && propertiesByCity[city].length < parseInt(propertiesPerCity)) {
        propertiesByCity[city].push(property);
      }
    });

    // Format response with city statistics
    // const cityData = topCityNames.map(cityName => {
    //   const cityInfo = cityCounts.find(c => c._id === cityName);
    //   return {
    //     cityName: cityName,
    //     totalProperties: cityInfo?.propertyCount || 0,
    //     propertiesShown: propertiesByCity[cityName]?.length || 0,
    //     properties: propertiesByCity[cityName] || []
    //   };
    // });

    // Flatten all properties for main data array
    // const allProperties = Object.values(propertiesByCity).flat();

    // console.log("🎯 Total properties to return:", allProperties.length);

    res.status(200).json({
      success: true,
      // count: allProperties.length,
      message: `Found properties from ${topCityNames.length} most popular cities`,
      // data: allProperties, // Complete property objects
      // cityBreakdown: cityData, // City-wise breakdown
      topCities: cityCounts.map(c => ({
        city: c._id,
        totalProperties: c.propertyCount
      }))
    });

  } catch (error) {
    console.error("❌ Get most popular cities error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch properties from popular cities",
      error: error.message
    });
  }
};
