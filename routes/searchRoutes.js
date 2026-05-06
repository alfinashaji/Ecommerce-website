const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// This must be "/" (the root of the search path)
router.get("/", searchController.universalSearch);

module.exports = router;
