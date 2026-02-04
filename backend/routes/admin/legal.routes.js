const express = require("express");
const router = express.Router();

const { upsertLegal } = require("../../controllers/admin/legal.controller");


// CREATE / UPDATE privacy or terms
router.put("/:type", upsertLegal);

module.exports = router;