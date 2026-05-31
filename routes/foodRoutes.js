const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getAllFoods,
    getMyFoods,
    getExpiredFoods,
    getFoodById,
    createFood,
    updateFood,
    deleteFood,
} = require("../controllers/foodController");

router.get("/", getAllFoods);
router.get("/my", protect, getMyFoods);
router.get("/expired", getExpiredFoods);
router.get("/:id", getFoodById);
router.post("/", protect, createFood);
router.patch("/:id", protect, updateFood);
router.delete("/:id", protect, deleteFood);

module.exports = router;