const Transaction = require("../models/Transaction");
const Food = require("../models/Food");
const Notification = require("../models/Notification");

const updateFoodStatus = async (food) => {
    const ratio = food.booked_portions / food.feeds;
    if (ratio >= 1) {
        food.status = "reserved";
        food.realtime_status = "Not Available";
    } else if (ratio >= 0.5) {
        food.realtime_status = "Almost Gone";
    } else {
        food.realtime_status = "Still Available";
    }
    await food.save();
};

// GET /api/transactions
exports.getMyTransactions = async (req, res) => {
    try {
        const userId = req.user.id;
        const txs = await Transaction.find({
            $or: [{ donor_id: userId }, { collector_id: userId }],
        })
            .populate("food_id")
            .sort({ created_at: -1 });
        res.json({ success: true, data: txs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/transactions
exports.createTransaction = async (req, res) => {
    try {
        const { food_id, portions } = req.body;
        if (!food_id || !portions)
            return res.status(400).json({ success: false, message: "food_id and portions required" });

        const food = await Food.findById(food_id);
        if (!food) return res.status(404).json({ success: false, message: "Food not found" });
        if (food.status !== "available")
            return res.status(400).json({ success: false, message: "Food is not available" });
        if (food.user_id === req.user.id)
            return res.status(400).json({ success: false, message: "You cannot book your own food" });

        const available = food.feeds - food.booked_portions;
        if (portions > available)
            return res
                .status(400)
                .json({ success: false, message: `Only ${available} portions available` });

        const tx = await Transaction.create({
            food_id: food._id,
            donor_id: food.user_id,
            collector_id: req.user.id,
            portions,
        });

        food.booked_portions += portions;
        await updateFoodStatus(food);

        // Notify donor
        await Notification.create({
            user_id: food.user_id,
            food_id: food._id,
            title: "🍽️ New Portion Booking!",
            message: `User ${req.user.email} booked ${portions} portion(s) of "${food.name}".`,
        });

        // Notify collector
        await Notification.create({
            user_id: req.user.id,
            food_id: food._id,
            title: "✅ Booking Confirmed!",
            message: `You booked ${portions} portion(s) of "${food.name}" at ${food.address}.`,
        });

        res.status(201).json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/transactions/:id/collect
exports.markCollect = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (tx.collector_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });

        tx.collector_accepted = true;
        if (tx.donor_accepted) {
            tx.status = "completed";
            // Check if food is fully collected
            const food = await Food.findById(tx.food_id);
            if (food && food.booked_portions >= food.feeds) {
                food.status = "collected";
                await food.save();
            }
        }
        await tx.save();
        res.json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/transactions/:id/donate
exports.markDonate = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (tx.donor_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });

        tx.donor_accepted = true;
        if (tx.collector_accepted) {
            tx.status = "completed";
            const food = await Food.findById(tx.food_id);
            if (food && food.booked_portions >= food.feeds) {
                food.status = "collected";
                await food.save();
            }
        }
        await tx.save();
        res.json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/transactions/:id/cancel
exports.cancelTransaction = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (tx.collector_id !== req.user.id && tx.donor_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });
        if (tx.status !== "pending" && tx.status !== "accepted")
            return res.status(400).json({ success: false, message: "Cannot cancel this transaction" });

        tx.status = "cancelled";
        await tx.save();

        const food = await Food.findById(tx.food_id);
        if (food) {
            food.booked_portions = Math.max(0, food.booked_portions - tx.portions);
            await updateFoodStatus(food);
        }

        res.json({ success: true, data: tx });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/transactions/:id/location
exports.updateLocation = async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ success: false, message: "Transaction not found" });
        if (tx.collector_id !== req.user.id)
            return res.status(403).json({ success: false, message: "Not authorized" });

        const { lat, lng } = req.body;
        tx.collector_lat = lat;
        tx.collector_lng = lng;
        await tx.save();
        res.json({ success: true, data: { collector_lat: tx.collector_lat, collector_lng: tx.collector_lng } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};