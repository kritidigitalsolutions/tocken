const express = require("express");
const cors = require("cors");

const bannerRoutes = require("./routes/banner.routes");
const adminBannerRoutes = require("./routes/admin/banner.route");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes.js");
const legalRoutes = require("./routes/legal.routes");
const legalRoutesAdmin = require("./routes/admin/legal.routes.js");
const faqRoutes = require("./routes/faq.routes");
const faqAdminRoutes = require("./routes/admin/faq.routes");

// Admin auth route
const adminAuthRoutes = require("./routes/admin/auth.routes");

// admin routes
const adminUserRoutes = require("./routes/admin/user.routes");
const { isAuth } = require("./middleware/auth.middleware");
const { isAdmin } = require("./middleware/admin.middleware");

// plans for user
const userPlanRoutes = require("./routes/plan.routes");

// for admin panel plans
const adminPlanRoutes = require("./routes/admin/plan.routes");

// dashboard routes 
const dashboardRoutes = require("./routes/admin/dashboard.routes")

// property routes
const propertyRoutes = require("./routes/property.routes");

// for Admin PropertyRoutes.
const adminPropertyRoutes = require("./routes/admin/property.routes");

// 🔥 NEW CLEAN LEAD SYSTEM
const cleanLeadRoutes = require("./routes/leads.clean.routes");
const adminCleanLeadRoutes = require("./routes/admin/leads.clean.routes");

// 🗑️ OLD LEAD SYSTEM (DEPRECATED - DO NOT USE)
// const leadRoutes = require("./routes/lead.routes");
// const adminLeadRoutes = require("./routes/admin/lead.routes");
// const leadRequestRoutes = require("./routes/leadRequest.routes");
// const adminLeadRequestRoutes = require("./routes/admin/leadRequest.routes");

// bookmark routes
const bookmarkRoutes = require("./routes/bookmark.routes");

// admin bookmark routes
const adminBookmarkRoutes = require("./routes/admin/bookmark.routes");

// feedback routes
const feedbackRoutes = require("./routes/feedback.routes");

// admin feedback routes
const adminFeedbackRoutes = require("./routes/admin/feedback.routes");

// notification routes
const notificationRoutes = require("./routes/notification.routes");

// admin notification routes
const adminNotificationRoutes = require("./routes/admin/notification.routes");

// about us routes
const aboutUsRoutes = require("./routes/aboutUs.routes");

// admin about us routes
const adminAboutUsRoutes = require("./routes/admin/aboutUs.routes");

// admin deletion request routes
const adminDeletionRequestRoutes = require("./routes/admin/deletionRequest.routes");

// wallpaper routes
const wallpaperRoutes = require("./routes/wallpaper.routes");

// admin wallpaper routes
const adminWallpaperRoutes = require("./routes/admin/wallpaper.routes");

// location routes
const locationRoutes = require("./routes/location.routes.js");

// most popular cities routes
const mostPopularCitiesRoutes = require("./routes/mostPopularCities.routes");
const adminMostPopularCitiesRoutes = require("./routes/admin/mostPopularCities.routes");

// 🏗️ POST PROJECT routes
const projectRoutes = require("./routes/project.routes");
const adminProjectRoutes = require("./routes/admin/project.routes");

// 💳 PAYMENT routes
const paymentRoutes = require("./routes/payment.routes");
const adminPaymentRoutes = require("./routes/admin/payment.routes");

// cron job
const cron = require("node-cron");

const expirePremiumListings = require("./utils/premiumExpiry");

const app = express();

app.use(express.urlencoded({ extended: false }))

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json()); //  MUST BE BEFORE ROUTES
app.post("/test", (req, res) => {
  console.log("BODY:", req.body);
  res.json(req.body);
});


// this is for first time add new admin data
const bcrypt = require("bcryptjs");
const Admin = require("./models/admin.model");
const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await Admin.create({
    name: "Super Admin",
    email: "admin@realestate.com",
    password: hashedPassword
  });

  console.log("Admin created");
};
createAdmin().catch(err => console.log("Admin already exists or error:", err.message));


// Public banners (for users - GET only)
app.use("/api/banners", bannerRoutes);

// Admin banners (full CRUD)
app.use("/api/admin/banners", isAuth, isAdmin, adminBannerRoutes);

//user Authentication routes
app.use("/api/auth", authRoutes);
// User routes
app.use("/api/user", userRoutes);

// Legal routes (public) for get data only
app.use("/api/legal", legalRoutes);

// Legal routes (Admin) for upadate data
app.use("/api/admin/legal", isAuth, isAdmin, legalRoutesAdmin);

// PUBLIC FAQs
app.use("/api/faqs", faqRoutes);

// ADMIN FAQs
app.use("/api/admin/faqs", isAuth, isAdmin, faqAdminRoutes);

// for admin Auth routes and middleware, 
app.use("/api/admin/auth", adminAuthRoutes);

// admin routes / for all admin protected routes like is auth and is admin
app.use("/api/admin/users", isAuth, isAdmin, adminUserRoutes);

// user plan routes
app.use("/api/plans", userPlanRoutes);

// admin plan routes (protected)
app.use("/api/admin/plans", isAuth, isAdmin, adminPlanRoutes);

// admin dashboard (protected)
app.use("/api/admin/dashboard", isAuth, isAdmin, dashboardRoutes);

// location routes (public search, protected save)
app.use("/api/location", locationRoutes);

// public + user
app.use("/api/properties", propertyRoutes);

// admin
app.use(
  "/api/admin/properties",
  isAuth,
  isAdmin,
  adminPropertyRoutes
);

// 🔥 NEW CLEAN LEAD SYSTEM
app.use("/api/leads", cleanLeadRoutes);
app.use("/api/admin/leads", adminCleanLeadRoutes);

// 🗑️ OLD LEAD SYSTEM (REMOVED)
// app.use("/api/leads", isAuth, leadRoutes);
// app.use("/api/admin/leads", isAuth, isAdmin, adminLeadRoutes);
// app.use("/api/lead-requests", isAuth, leadRequestRoutes);
// app.use("/api/admin/lead-requests", isAuth, isAdmin, adminLeadRequestRoutes);

// user bookmarks/favorites
app.use("/api/bookmarks", bookmarkRoutes);

// admin bookmarks
app.use("/api/admin/bookmarks", isAuth, isAdmin, adminBookmarkRoutes);

// user feedback (public)
app.use("/api/feedback", feedbackRoutes);

// admin feedback
app.use("/api/admin/feedbacks", isAuth, isAdmin, adminFeedbackRoutes);

// user notifications
app.use("/api/notifications", notificationRoutes);

// admin notifications
app.use("/api/admin/notifications", isAuth, isAdmin, adminNotificationRoutes);

// about us (public)
app.use("/api/aboutus", aboutUsRoutes);

// admin about us
app.use("/api/admin/aboutus", isAuth, isAdmin, adminAboutUsRoutes);

// admin deletion requests
app.use("/api/admin/deletion-requests", isAuth, isAdmin, adminDeletionRequestRoutes);

// wallpapers (public)
app.use("/api/wallpapers", wallpaperRoutes);

// admin wallpapers
app.use("/api/admin/wallpapers", isAuth, isAdmin, adminWallpaperRoutes);

// most popular cities (public - for Flutter app)
app.use("/api/most-popular-cities", mostPopularCitiesRoutes);

// admin most popular cities
app.use("/api/admin/most-popular-cities", isAuth, isAdmin, adminMostPopularCitiesRoutes);

// 🏗️ POST PROJECT  (project data + developer data in one request)
// public + user (create, update, upload photos, developer profile)
app.use("/api/projects", projectRoutes);
// admin (full management)
app.use("/api/admin/projects", isAuth, isAdmin, adminProjectRoutes);

// 💳 PAYMENT GATEWAY (Razorpay)
// user: create-order → pay in app → verify
app.use("/api/payments", paymentRoutes);
// admin: view all payments + stats
app.use("/api/admin/payments", isAuth, isAdmin, adminPaymentRoutes);

// Scheduled Tasks
cron.schedule("0 * * * *", expirePremiumListings); // every hour

module.exports = app;
