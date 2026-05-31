const Food = require("../models/Food");
const Transaction = require("../models/Transaction");
const { body, validationResult } = require("express-validator");

// Helper: compute realtime_status
const computeRealtimeStatus = (food) => {
    const ratio = food.booked_portions / food.feeds;
    if (ratio >= 1) return "Not Available";
    if (ratio >= 0.5) return "Almost Gone";
    return "Still Available";
};

// GET /api/foods
exports.getAllFoods = async (req, res) => {
    try {
        const { status, category, lat, lng, radius = 10 } = req.query;
        const query = { hard_expired: false };

        if (status) query.status = status;
        if (category) query.category = category;

        let foods = await Food.find(query).sort({ created_at: -1 });

        // Filter by radius if lat/lng provided
        if (lat && lng) {
            const R = 6371; // Earth radius km
            foods = foods.filter((f) => {
                if (!f.lat || !f.lng) return true;
                const dLat = ((f.lat - parseFloat(lat)) * Math.PI) / 180;
                const dLng = ((f.lng - parseFloat(lng)) * Math.PI) / 180;
                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos((parseFloat(lat) * Math.PI) / 180) *
                    Math.cos((f.lat * Math.PI) / 180) *
                    Math.sin(dLng / 2) ** 2;
                const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return dist <= parseFloat(radius);
            });
        }

        res.json({ success: true, data: foods });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/foods/my
exports.getMyFoods = async (req, res) => {
    try {
        const foods = await Food.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json({ success: true, data: foods });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/foods/expired
exports.getExpiredFoods = async (req, res) => {
    try {
        const foods = await Food.find({
            is_expired: true,
            hard_expired: false,
        }).sort({ created_at: -1 });
        res.json({ success: true, data: foods });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/foods/:id
exports.getFoodById = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) return res.status(404).json({ success: false, message: "Food not found" });
        res.json({ success: true, data: food });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/foods
exports.createFood = [
    body("name").notEmpty().withMessage("Name is required"),
    body("feeds").isInt({ min: 1 }).withMessage("Feeds must be a positive integer"),
    body("expiry_hours").isNumeric().withMessage("Expiry hours must be a number"),
    body("address").notEmpty().withMessage("Address is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ success: false, errors: errors.array() });

        try {
            const food = await Food.create({ ...req.body, user_id: req.user.id });
            res.status(201).json({ success: true, data: food });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },
];

// PATCH /api/foods/:id
exports.updateFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) return res.status(404).json({ success: false, message: "Food not found" });
        if (food.user_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });

        const allowed = ["status", "realtime_status", "notes", "image", "tags"];
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) food[key] = req.body[key];
        });

        food.realtime_status = computeRealtimeStatus(food);
        await food.save();
        res.json({ success: true, data: food });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/foods/:id
exports.deleteFood = async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) return res.status(404).json({ success: false, message: "Food not found" });
        if (food.user_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });

        // Cancel all pending transactions for this food
        await Transaction.updateMany(
            { food_id: food._id, status: { $in: ["pending", "accepted"] } },
            { status: "cancelled" }
        );

        await food.deleteOne();
        res.json({ success: true, message: "Food listing deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};