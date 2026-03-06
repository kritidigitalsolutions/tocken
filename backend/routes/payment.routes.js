const express = require("express");
const router  = express.Router();
const c       = require("../controllers/payment.controller");
const auth    = require("../middleware/auth.middleware");

// ── User Payment Routes (/api/payments) ──

// Step 1: Backend calls PhonePe, returns redirectUrl
router.post("/create-order", auth, c.createOrder);

// Step 2: Frontend calls this after PhonePe redirects back (with ?merchantOrderId=xxx)
//         Backend polls PhonePe status → activates plan if COMPLETED
router.get("/status/:merchantOrderId", auth, c.checkStatus);

// PhonePe Webhook (no auth — server-to-server)
router.post("/webhook", c.webhook);

// User's own payment history
router.get("/my-history", auth, c.getMyHistory);

module.exports = router;

