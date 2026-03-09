const User = require("../models/user.model");
const Property = require("../models/property.model");
const Project = require("../models/project.model");

// ─── CONFIG MAP (type → model + user field) ───────────────────────────────────
const TYPE_CONFIG = {
  property: {
    Model: Property,
    userField: "bookmarks",
    label: "Property",
    exists: (doc) => doc && !doc.isDeleted,
    // optional populate match filter from query params
    matchFromQuery: (query) => ({
      isDeleted: false,
      ...(query.category && query.category !== "All" && { propertyCategory: query.category })
    })
  },
  project: {
    Model: Project,
    userField: "projectBookmarks",
    label: "Project",
    exists: (doc) => !!doc,
    matchFromQuery: (query) => ({
      ...(query.filter && query.filter !== "All" && { projectType: query.filter })
    })
  }
};

const getConfig = (type, res) => {
  const config = TYPE_CONFIG[type];
  if (!config) {
    res.status(400).json({ success: false, message: `Invalid type '${type}'. Use 'property' or 'project'` });
    return null;
  }
  return config;
};

// GET all bookmarks (property + project both)
// GET /bookmarks
exports.getBookmarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate({
        path: "bookmarks",
        match: { isDeleted: false },
        select: "-__v"
      })
      .populate({
        path: "projectBookmarks",
        select: "-__v"
      });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const propertyBookmarks = (user.bookmarks || []).filter(Boolean);
    const projectBookmarks = (user.projectBookmarks || []).filter(Boolean);

    res.status(200).json({
      success: true,
      propertyBookmarks: {
        count: propertyBookmarks.length,
        data: propertyBookmarks
      },
      projectBookmarks: {
        count: projectBookmarks.length,
        data: projectBookmarks
      }
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookmarks" });
  }
};

// ADD bookmark
// POST /bookmarks/:type/:id
exports.addBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const config = getConfig(type, res);
    if (!config) return;

    const item = await config.Model.findById(id);
    if (!config.exists(item)) {
      return res.status(404).json({ success: false, message: `${config.label} not found` });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if ((user[config.userField] || []).some(existingId => existingId.toString() === id)) {
      return res.status(400).json({ success: false, message: `${config.label} already bookmarked` });
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { [config.userField]: id } }, { new: true });

    res.status(200).json({ success: true, message: `${config.label} bookmarked successfully` });
  } catch (error) {
    console.error("Add bookmark error:", error);
    res.status(500).json({ success: false, message: "Failed to add bookmark" });
  }
};

// REMOVE bookmark
// DELETE /bookmarks/:type/:id
exports.removeBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const config = getConfig(type, res);
    if (!config) return;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!(user[config.userField] || []).some(existingId => existingId.toString() === id)) {
      return res.status(404).json({ success: false, message: `${config.label} not in bookmarks` });
    }

    await User.findByIdAndUpdate(userId, { $pull: { [config.userField]: id } }, { new: true });

    res.status(200).json({ success: true, message: `${config.label} bookmark removed successfully` });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    res.status(500).json({ success: false, message: "Failed to remove bookmark" });
  }
};

// CHECK if bookmarked
// GET /bookmarks/:type/:id/check
exports.checkBookmark = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const config = getConfig(type, res);
    if (!config) return;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isBookmarked = (user[config.userField] || []).some(existingId => existingId.toString() === id);

    res.status(200).json({ success: true, isBookmarked });
  } catch (error) {
    console.error("Check bookmark error:", error);
    res.status(500).json({ success: false, message: "Failed to check bookmark status" });
  }
};
