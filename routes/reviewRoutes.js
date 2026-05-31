const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getReviews, createReview } = require("../controllers/reviewController");

router.get("/:foodId", getReviews);
router.post("/", protect, createReview);

module.exports = router;