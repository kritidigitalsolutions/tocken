const express = require("express");
const router = express.Router();
const { getPlansAndFAQs, buyPlan, getUserPlan, getUserPlanStatus } = require("../controllers/plan.controller");
// const { getPlansAndFAQs, buyPlan, getUserPlan } = require("../controllers/plan.controller");
const isAuth = require("../middleware/auth.middleware");

router.get("/", getPlansAndFAQs);
router.post("/buy", isAuth, buyPlan);
router.get("/my", isAuth, getUserPlan);
router.get("/status", isAuth, getUserPlanStatus);

module.exports = router;
   