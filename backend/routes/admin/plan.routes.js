const express = require("express");
const router = express.Router();

const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  getUserSubscriptions,
  assignPlanToUser
} = require("../../controllers/admin/plan.controller");

router.post("/", createPlan);
router.get("/", getPlans);
router.put("/:id", updatePlan);
router.delete("/:id", deletePlan);

// User subscription management
router.get("/subscriptions", getUserSubscriptions);
router.post("/assign", assignPlanToUser);

module.exports = router;
