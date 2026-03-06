const express = require("express");
const router  = express.Router();
const c       = require("../../controllers/payment.controller");

// ── Admin Payment Routes (/api/admin/payments) ──
// All routes already protected by isAuth + isAdmin in app.js

router.get("/",       c.adminGetAll);   // GET all payments (filter: ?status=SUCCESS&page=1)
router.get("/stats",  c.adminStats);    // GET revenue stats + monthly breakdown

module.exports = router;
