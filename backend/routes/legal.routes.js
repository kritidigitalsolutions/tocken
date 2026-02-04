const express = require("express");
const router = express.Router();

const {
  getLegal,
} = require("../controllers/legal.controller");

// GET privacy or terms
router.get("/:type", getLegal);


module.exports = router;
