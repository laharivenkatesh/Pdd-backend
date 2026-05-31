const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
    {
        food_id: { type: mongoose.Schema.Types.ObjectId, ref: "Food", required: true },
        donor_id: { type: String, required: true },     // Supabase user UUID
        collector_id: { type: String, required: true }, // Supabase user UUID
        status: {
            type: String,
            enum: ["pending", "accepted", "completed", "cancelled"],
            default: "pending",
        },
        portions: { type: Number, required: true, min: 1 },
        donor_accepted: { type: Boolean, default: false },
        collector_accepted: { type: Boolean, default: false },
        collector_lat: { type: Number, default: null },
        collector_lng: { type: Number, default: null },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("Transaction", TransactionSchema);