const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/auth.middleware");
const {
  getBookmarks,
  addBookmark,
  removeBookmark,
  checkBookmark
} = require("../controllers/bookmark.controller");

// All routes require authentication
router.use(isAuth);

// ── UNIFIED BOOKMARK ROUTES ─────────────────────────────────
// GET    /bookmarks              → get all bookmarks (property + project)
// POST   /bookmarks/:type/:id    → add bookmark      (type = property | project)
// DELETE /bookmarks/:type/:id    → remove bookmark
// GET    /bookmarks/:type/:id/check → check if bookmarked

router.get("/", getBookmarks);
router.post("/:type/:id", addBookmark);
router.delete("/:type/:id", removeBookmark);
router.get("/:type/:id/check", checkBookmark);

module.exports = router;
