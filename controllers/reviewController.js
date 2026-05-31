const Review = require("../models/Review");
const Food = require("../models/Food");
const { body, validationResult } = require("express-validator");

// GET /api/reviews/:foodId
exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ food_id: req.params.foodId }).sort({ created_at: -1 });
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/reviews
exports.createReview = [
    body("food_id").notEmpty().withMessage("food_id is required"),
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1–5"),
    body("comment").optional().isString(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const { food_id, rating, comment } = req.body;

            const food = await Food.findById(food_id);
            if (!food) return res.status(404).json({ success: false, message: "Food not found" });
            if (food.user_id === req.user.id)
                return res.status(400).json({ success: false, message: "Cannot review your own listing" });

            const existing = await Review.findOne({ food_id, user_id: req.user.id });
            if (existing)
                return res.status(400).json({ success: false, message: "You already reviewed this listing" });

            const review = await Review.create({
                food_id,
                user_id: req.user.id,
                user_name: req.user.name || req.user.email,
                rating,
                comment: comment || "",
            });

            res.status(201).json({ success: true, data: review });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
];