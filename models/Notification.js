const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        user_id: { type: String, required: true }, // Supabase user UUID
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: "Food", default: null },
        title: { type: String, required: true },
        message: { type: String, required: true },
        is_read: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "created_at", updatedAt: false } }
);

module.exports = mongoose.model("Notification", NotificationSchema);