const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getMyTransactions,
    createTransaction,
    markCollect,
    markDonate,
    cancelTransaction,
    updateLocation,
} = require("../controllers/transactionController");

router.get("/", protect, getMyTransactions);
router.post("/", protect, createTransaction);
router.patch("/:id/collect", protect, markCollect);
router.patch("/:id/donate", protect, markDonate);
router.patch("/:id/cancel", protect, cancelTransaction);
router.patch("/:id/location", protect, updateLocation);

module.exports = router;