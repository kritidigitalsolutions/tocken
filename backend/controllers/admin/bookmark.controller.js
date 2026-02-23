const User = require("../../models/user.model");
const Property = require("../../models/property.model");

// GET all bookmarks across all users (Admin)
exports.getAllBookmarks = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    console.log("📚 Fetching bookmarks - Category filter:", category);

    // Find all users with bookmarks
    const users = await User.find({ bookmarks: { $exists: true, $ne: [] } })
      .populate({
        path: "bookmarks",
        match: {
          isDeleted: false,
          ...(category && category !== "All" && { propertyType: category })
        },
        populate: {
          path: "userId",
          select: "name phone email"
        }
      })
      .select("name phone bookmarks");

    // Flatten and format the data
    const allBookmarks = [];
    
    for (const user of users) {
      for (const property of user.bookmarks) {
        if (property) { // Filter out null (non-matching category)
          allBookmarks.push({
            _id: `${user._id}_${property._id}`,
            user: {
              _id: user._id,
              name: user.name,
              phone: user.phone
            },
            property: property,
            bookmarkedAt: property.createdAt // We'll use property creation as approximation
          });
        }
      }
    }

    console.log(`✅ Found ${allBookmarks.length} bookmarks`);

    // Get bookmarkedAt from user's bookmark array order (most recent first)
    // Since we don't have a separate bookmark model with timestamp, we'll sort by property creation
    allBookmarks.sort((a, b) => new Date(b.property.createdAt) - new Date(a.property.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedBookmarks = allBookmarks.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: allBookmarks.length,
      page: parseInt(page),
      totalPages: Math.ceil(allBookmarks.length / limit),
      bookmarks: paginatedBookmarks
    });
  } catch (error) {
    console.error("Admin get all bookmarks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookmarks"
    });
  }
};

// GET bookmark stats (Admin)
exports.getBookmarkStats = async (req, res) => {
  try {
    const users = await User.find({ bookmarks: { $exists: true, $ne: [] } })
      .populate({
        path: "bookmarks",
        match: { isDeleted: false },
        select: "propertyType listingType"
      });

    let total = 0;
    const byCategory = {};
    const byListingType = {};

    for (const user of users) {
      for (const property of user.bookmarks) {
        if (property) {
          total++;
          
          // Count by property type (RESIDENTIAL, COMMERCIAL, etc.)
          const cat = property.propertyType || "Unknown";
          byCategory[cat] = (byCategory[cat] || 0) + 1;
          
          // Count by listing type
          const type = property.listingType || "Unknown";
          byListingType[type] = (byListingType[type] || 0) + 1;
        }
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        total,
        byCategory,
        byListingType,
        usersWithBookmarks: users.length
      }
    });
  } catch (error) {
    console.error("Admin get bookmark stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookmark stats"
    });
  }
};
