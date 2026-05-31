const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getNotifications,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
} = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.patch("/read-all", protect, markAllRead);
router.patch("/:id/read", protect, markRead);
router.delete("/", protect, clearAll);
router.delete("/:id", protect, deleteNotification);

module.exports = router;