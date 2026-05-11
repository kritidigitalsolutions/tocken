const axios        = require("axios");
const Payment      = require("../models/payment.model");
const Plan         = require("../models/plans.model");
const User         = require("../models/user.model");
const Notification = require("../models/notification.model");
const { sendPushNotification } = require("../utils/fcm.service");

// ─────────────────────────────────────────────────────────────
//  PhonePe Config  (from .env)
//  PHONEPE_CLIENT_ID      = SU2506051830126509239028
//  PHONEPE_CLIENT_SECRET  = fe89fc12-aed6-4c78-847a-ec1f6h676987
//  PHONEPE_CLIENT_VERSION = 1
//  PHONEPE_REDIRECT_URL   = http://localhost:5173/payment/status
//  PHONEPE_ENV            = SANDBOX | PRODUCTION
// ─────────────────────────────────────────────────────────────
const IS_SANDBOX = (process.env.PHONEPE_ENV || "SANDBOX").toUpperCase() !== "PRODUCTION";

const BASE_URL = IS_SANDBOX
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
  : "https://api.phonepe.com/apis/pg";

const AUTH_URL = IS_SANDBOX
  ? "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token"
  : "https://api.phonepe.com/apis/identity-manager/v1/oauth/token";

// ── In-memory token cache (avoids hitting auth API on every request) ──
let _tokenCache = { token: null, expiresAt: 0 };

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  // Reuse if token is still valid (with 60-second buffer)
  if (_tokenCache.token && _tokenCache.expiresAt > now + 60) {
    return _tokenCache.token;
  }

  const params = new URLSearchParams({
    client_id:      process.env.PHONEPE_CLIENT_ID,
    client_secret:  process.env.PHONEPE_CLIENT_SECRET,
    client_version: process.env.PHONEPE_CLIENT_VERSION || "1",
    grant_type:     "client_credentials"
  });

  const { data } = await axios.post(AUTH_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  _tokenCache = {
    token:     data.access_token,
    expiresAt: data.expires_at || (now + 7 * 24 * 3600)
  };

  return _tokenCache.token;
}

// ── Helper: send plan-purchase notification (FCM + DB) ───────────────────────
async function sendPlanPurchaseNotification(user, plan, endDate) {
  try {
    const title   = "Plan Activated! 🎉";
    const message = `Your ${plan.planName} plan is now active. Valid until ${endDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}.`;

    // 1. Save to Notification collection (visible in app notification centre)
    await Notification.create({
      title,
      message,
      type:       "PLAN",
      targetUser: user._id,
      isRead:     false,
      sentAt:     new Date(),
      isActive:   true,
      metadata:   { planId: plan._id }
    });

    // 2. Push notification via FCM (if user has FCM token)
    if (user.fcmToken) {
      await sendPushNotification({
        token: user.fcmToken,
        title,
        body:  message,
        data:  {
          type:      "PLAN_ACTIVATED",
          planId:    plan._id.toString(),
          planName:  plan.planName,
          validUntil: endDate.toISOString()
        }
      });
    }
  } catch (err) {
    // Never fail the main flow due to notification error
    console.error("Notification send error (non-critical):", err.message);
  }
}
//  POST /api/payments/create-order
//  Body: { planId, redirectBaseUrl? }
//  Returns: { merchantOrderId, redirectUrl }   ← redirect user here
// ═══════════════════════════════════════════════════════
exports.createOrder = async (req, res) => {
  try {
    const { planId, redirectBaseUrl } = req.body;
    if (!planId)
      return res.status(400).json({ success: false, message: "planId is required" });

    const [plan, user] = await Promise.all([
      Plan.findById(planId),
      User.findById(req.user.id)
    ]);

    if (!plan || !plan.isActive)
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });
    // if (plan.userType !== user.userType)
    //   return res.status(400).json({ success: false, message: `This plan is for ${plan.userType} users only` });

    const amountPaise = Math.round((plan.price || 0) * 100);
    if (amountPaise < 100)
      return res.status(400).json({ success: false, message: "Plan price must be at least ₹1" });

    // Unique merchant order ID
    const merchantOrderId = `ORD_${user._id}_${Date.now()}`;

    // Redirect URL — include merchantOrderId so frontend can poll status
    const redirectBase = typeof redirectBaseUrl === "string" && redirectBaseUrl.trim()
      ? redirectBaseUrl.trim()
      : process.env.PHONEPE_REDIRECT_URL;
    const normalizedBase = redirectBase?.replace(/\/+$/, "");
    if (!normalizedBase) {
      return res.status(500).json({ success: false, message: "PHONEPE_REDIRECT_URL is not configured" });
    }

    const redirectUrl = `${normalizedBase}/${merchantOrderId}`;

    // ── Get PhonePe access token ──
    const token = await getAccessToken();

    // ── Create PhonePe order ──
    const ppRes = await axios.post(
      `${BASE_URL}/checkout/v2/pay`,
      {
        merchantOrderId,
        amount: amountPaise,
        expireAfter: 1200, // 20 minutes
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: `Purchase ${plan.planName} plan`,
          merchantUrls: { redirectUrl }
        },
        metaInfo:  {
          udf1: user._id.toString(),
          udf2: plan._id.toString(),
          udf3: plan.planName
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${token}`
        }
      }
    );

    const ppData = ppRes.data;

    // ── Save pending payment record ──
    await Payment.create({
      user:            user._id,
      plan:            plan._id,
      merchantOrderId,
      phonepeOrderId:  ppData.orderId || null,
      amount:          amountPaise,
      status:          "PENDING",
      planSnapshot: {
        planName:      plan.planName,
        price:         plan.price,
        validityDays:  plan.validityDays,
        leadsPerMonth: plan.planLimit || 0,
        userType:      plan.userType
      }
    });

    res.status(201).json({
      success: true,
      message: "Order created. Redirect user to redirectUrl.",
      data: {
        merchantOrderId,
        phonepeOrderId: ppData.orderId,
        redirectUrl:    ppData.redirectUrl,   // PhonePe checkout page
        amount:         amountPaise,
        planName:       plan.planName
      }
    });
  } catch (err) {
    console.error("PHONEPE CREATE ORDER ERROR:", err?.response?.data || err.message);
    res.status(500).json({
      success: false,
      message:  "Failed to create payment order",
      error:    err?.response?.data || err.message
    });
  }
};

// ═══════════════════════════════════════════════════════
//  STEP 2 — Check Order Status & Activate Plan
//  GET /api/payments/status/:merchantOrderId
//  Called by frontend after PhonePe redirects back
// ═══════════════════════════════════════════════════════
exports.checkStatus = async (req, res) => {
  try {
    const { merchantOrderId } = req.params;

    // Find local payment record
    const payment = await Payment.findOne({ merchantOrderId }).populate("plan");
    if (!payment)
      return res.status(404).json({ success: false, message: "Payment record not found" });

    // Already activated → return immediately
    if (payment.status === "SUCCESS") {
      const user = await User.findById(payment.user).populate("activePlan").select("activePlan planSubscription planUsageQuota");
      return res.json({ success: true, message: "Plan already activated", data: { status: "SUCCESS", planSubscription: user?.planSubscription, planUsageQuota: user?.planUsageQuota } });
    }

    // ── Ask PhonePe for latest status ──
    const token = await getAccessToken();
    const statusRes = await axios.get(
      `${BASE_URL}/checkout/v2/order/${merchantOrderId}/status`,
      { headers: { "Authorization": `O-Bearer ${token}` } }
    );
    const ppStatus = statusRes.data;

    // Store raw response
    payment.gatewayResponse = ppStatus;

    // ── PhonePe states: PENDING | COMPLETED | FAILED | CANCELLED ──
    if (ppStatus.state === "COMPLETED") {
      const plan      = payment.plan;
      const startDate = new Date();
      const endDate   = new Date();
      endDate.setDate(startDate.getDate() + plan.validityDays);
      const quotaResetDate = new Date(startDate);
      quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
      quotaResetDate.setDate(1);

      const updatedUser = await User.findByIdAndUpdate(payment.user, {
        activePlan:       plan._id,
        planSubscription: { startDate, endDate, isActive: true, autoRenewal: false },
        planUsageQuota:   { consumed: 0, limit: plan.planLimit || 0, resetDate: quotaResetDate }
      }, { new: true });

      // ── Notify user ──
      await sendPlanPurchaseNotification(updatedUser, plan, endDate);

      // Extract PhonePe transaction ID from response
      payment.phonepeTransactionId = ppStatus.paymentDetails?.[0]?.transactionId || null;
      payment.status               = "SUCCESS";
      await payment.save();

      console.log("\n✅ PAYMENT SUCCESSFUL (checkStatus)");
      console.log("─────────────────────────────────────────");
      console.log("Merchant Order ID  :", merchantOrderId);
      console.log("PhonePe Order ID   :", ppStatus.orderId);
      console.log("Transaction ID     :", payment.phonepeTransactionId);
      console.log("User ID            :", payment.user);
      console.log("Plan               :", plan.planName);
      console.log("Amount (paise)     :", payment.amount, `(₹${payment.amount / 100})`);
      console.log("Plan Valid Until   :", endDate.toLocaleString("en-IN"));
      console.log("PhonePe Response   :", JSON.stringify(ppStatus, null, 2));
      console.log("─────────────────────────────────────────\n");

      return res.json({
        success: true,
        message: "Payment successful! Plan activated.",
        data: {
          status:      "SUCCESS",
          planName:    plan.planName,
          validUntil:  endDate,
          planUsageQuota: { consumed: 0, limit: plan.planLimit || 0 }
        }
      });
    }

    if (ppStatus.state === "FAILED" || ppStatus.state === "CANCELLED") {
      payment.status        = "FAILED";
      payment.failureReason = ppStatus.errorCode || ppStatus.state;
      await payment.save();
      return res.status(402).json({
        success: false,
        message: `Payment ${ppStatus.state.toLowerCase()}`,
        data:    { status: ppStatus.state }
      });
    }

    // Still PENDING → user hasn't paid yet
    await payment.save();
    return res.json({
      success: true,
      message: "Payment pending",
      data:    { status: "PENDING" }
    });

  } catch (err) {
    console.error("PHONEPE STATUS CHECK ERROR:", err?.response?.data || err.message);
    res.status(500).json({ success: false, message: "Status check failed", error: err?.response?.data || err.message });
  }
};

// ═══════════════════════════════════════════════════════
//  PhonePe Webhook  (optional — server-side auto-capture)
//  POST /api/payments/webhook
//  PhonePe POSTs here on payment.captured / payment.failed
// ═══════════════════════════════════════════════════════
exports.webhook = async (req, res) => {
  try {
    const event = req.body;
    // PhonePe webhook payload contains merchantOrderId
    const merchantOrderId = event?.payload?.merchantOrderId || event?.merchantOrderId;

    if (!merchantOrderId) return res.status(200).json({ received: true });

    const payment = await Payment.findOne({ merchantOrderId }).populate("plan");
    if (!payment || payment.status === "SUCCESS") return res.status(200).json({ received: true });

    const state = event?.payload?.state || event?.state;

    if (state === "COMPLETED") {
      const plan      = payment.plan;
      const startDate = new Date();
      const endDate   = new Date();
      endDate.setDate(startDate.getDate() + plan.validityDays);
      const quotaResetDate = new Date(startDate);
      quotaResetDate.setMonth(quotaResetDate.getMonth() + 1);
      quotaResetDate.setDate(1);

      await User.findByIdAndUpdate(payment.user, {
        activePlan:       plan._id,
        planSubscription: { startDate, endDate, isActive: true, autoRenewal: false },
        planUsageQuota:   { consumed: 0, limit: plan.planLimit || 0, resetDate: quotaResetDate }
      });

      // ── Notify user (webhook path) ──
      const notifUser = await User.findById(payment.user).select("fcmToken");
      if (notifUser) await sendPlanPurchaseNotification(notifUser, plan, endDate);

      payment.status        = "SUCCESS";
      payment.gatewayResponse = event;
      await payment.save();

      console.log("\n✅ PAYMENT SUCCESSFUL (webhook)");
      console.log("─────────────────────────────────────────");
      console.log("Merchant Order ID  :", merchantOrderId);
      console.log("User ID            :", payment.user);
      console.log("Plan               :", plan.planName);
      console.log("Amount (paise)     :", payment.amount, `(₹${payment.amount / 100})`);
      console.log("Plan Valid Until   :", endDate.toLocaleString("en-IN"));
      console.log("Webhook Payload    :", JSON.stringify(event, null, 2));
      console.log("─────────────────────────────────────────\n");
    }

    if (state === "FAILED" || state === "CANCELLED") {
      payment.status        = "FAILED";
      payment.failureReason = state;
      payment.gatewayResponse = event;
      await payment.save();
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
//  Get My Payment History
//  GET /api/payments/my-history
// ═══════════════════════════════════════════════════════
exports.getMyHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate("plan", "planName price validityDays userType")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
//  ADMIN — Get All Payments
//  GET /api/admin/payments?status=SUCCESS&page=1&limit=20
// ═══════════════════════════════════════════════════════
exports.adminGetAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, userId } = req.query;
    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (userId) filter.user   = userId;

    const total    = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter)
      .populate("user", "name phone email userType")
      .populate("plan", "planName price validityDays userType")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: { payments, total, page: Number(page), totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═══════════════════════════════════════════════════════
//  ADMIN — Payment Stats
//  GET /api/admin/payments/stats
// ═══════════════════════════════════════════════════════
exports.adminStats = async (req, res) => {
  try {
    const [revenueAgg, totalSuccess, totalPending, totalFailed] = await Promise.all([
      Payment.aggregate([{ $match: { status: "SUCCESS" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.countDocuments({ status: "SUCCESS" }),
      Payment.countDocuments({ status: "PENDING" }),
      Payment.countDocuments({ status: "FAILED" })
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthly = await Payment.aggregate([
      { $match: { status: "SUCCESS", createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: (revenueAgg[0]?.total || 0) / 100,
        totalSuccess,
        totalPending,
        totalFailed,
        monthly: monthly.map(m => ({
          month:   `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
          revenue: m.revenue / 100,
          count:   m.count
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
