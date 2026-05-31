const Transaction = require("../models/Transaction");
const Food = require("../models/Food");

const computeStats = async (userId) => {
    const allTxs = await Transaction.find({
        $or: [{ donor_id: userId }, { collector_id: userId }],
    });

    const completed = allTxs.filter((t) => t.status === "completed");
    const asCollector = completed.filter((t) => t.collector_id === userId);
    const asDonor = completed.filter((t) => t.donor_id === userId);

    const mealsCollected = asCollector.length * 5;
    const postsMade = asDonor.length;
    const pickupSuccess = allTxs.length
        ? Math.round((completed.length / allTxs.length) * 100)
        : 0;

    const badges = [];
    if (postsMade > 0) badges.push("Consistent Provider");
    if (mealsCollected > 0) badges.push("Regular Helper");
    if (pickupSuccess >= 90 && completed.length > 0) badges.push("Top Contributor");
    if (mealsCollected > 10) badges.push("Quick Rescuer");

    return { mealsCollected, postsMade, pickupSuccess, badges, totalTransactions: allTxs.length };
};

// GET /api/users/profile
exports.getProfile = async (req, res) => {
    try {
        const stats = await computeStats(req.user.id);
        res.json({
            success: true,
            data: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name || "",
                phone: req.user.phone || "",
                avatar: req.user.avatar || "",
                ...stats,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/users/profile
exports.updateProfile = async (req, res) => {
    try {
        const User = require("../models/User");
        const { name, phone, avatar } = req.body;
        const updated = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, avatar },
            { new: true, select: "-__v" }
        );
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/users/:id
exports.getPublicProfile = async (req, res) => {
    try {
        const User = require("../models/User");
        const user = await User.findOne({ supabaseId: req.params.id }).select(
            "name email phone avatar created_at"
        );
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const stats = await computeStats(req.params.id);
        res.json({ success: true, data: { ...user.toObject(), ...stats } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};