const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        user_id: { type: String, required: true }, // Supabase user UUID
        user_name: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "" },
    },
    { timestamps: { createdAt: "created_at", updatedAt: false } }
);

// One review per user per food
ReviewSchema.index({ food_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model("Review", ReviewSchema);