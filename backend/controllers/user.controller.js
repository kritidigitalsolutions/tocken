const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
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
      gstNumber
      // name: `${firstName} ${lastName}`,
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
exports.cancelDeletionRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.deletionRequest?.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "No pending deletion request to cancel"
      });
    }

    user.deletionRequest = {
      status: "NONE",
      reason: null,
      feedback: null,
      requestedAt: null
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Deletion request cancelled successfully"
    });

  } catch (error) {
    console.error("Cancel deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

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
        const Property = require("../models/property.model");
        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                success: false,
                message: "Property not found"
            });
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if property already in mostVisitedProperties
        const existingView = user.mostVisitedProperties.find(
            (v) => v.property.toString() === propertyId
        );

        if (existingView) {
            // Increment view count
            existingView.viewCount += 1;
            existingView.lastViewedAt = new Date();
        } else {
            // Add new viewed property
            user.mostVisitedProperties.push({
                property: propertyId,
                viewCount: 1,
                lastViewedAt: new Date()
            });
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Property view tracked successfully",
            viewCount: existingView ? existingView.viewCount : 1
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
 * GET MOST VISITED PROPERTIES
 * GET /api/user/most-visited-properties?limit=10&sortBy=viewCount
 */
exports.getMostVisitedProperties = async (req, res) => {
    try {
        const { limit = 10, sortBy = "viewCount" } = req.query;
        const userId = req.user.id;

        const user = await User.findById(userId).populate({
            path: "mostVisitedProperties.property",
            select: "title price location images lifeCycleStage propertyType propertySubType description"
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Sort by viewCount or lastViewedAt
        let sortedProperties = [...user.mostVisitedProperties];
        
        if (sortBy === "viewCount") {
            sortedProperties.sort((a, b) => b.viewCount - a.viewCount);
        } else if (sortBy === "recent") {
            sortedProperties.sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt));
        }

        // Apply limit
        sortedProperties = sortedProperties.slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            count: sortedProperties.length,
            properties: sortedProperties.map(v => ({
                ...v.property.toObject(),
                viewCount: v.viewCount,
                lastViewedAt: v.lastViewedAt
            }))
        });
    } catch (error) {
        console.error("Get most visited properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch most visited properties",
            error: error.message
        });
    }
};

/**
 * CLEAR MOST VISITED PROPERTIES
 * DELETE /api/user/most-visited-properties
 */
exports.clearMostVisitedProperties = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByIdAndUpdate(
            userId,
            { mostVisitedProperties: [] },
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
            message: "Most visited properties cleared successfully"
        });
    } catch (error) {
        console.error("Clear most visited properties error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear most visited properties",
            error: error.message
        });
    }
};
