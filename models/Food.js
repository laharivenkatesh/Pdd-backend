const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
    {
        user_id: { type: String, required: true }, // Supabase user UUID
        name: { type: String, required: true, trim: true },
        image: { type: String, default: "" },
        feeds: { type: Number, required: true, min: 1 },
        booked_portions: { type: Number, default: 0 },
        price: { type: Number, default: 0 },
        expiry_hours: { type: Number, required: true },
        prepared_at: { type: String, default: "" },
        address: { type: String, required: true },
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
        category: { type: String, default: "Other" },
        tags: [{ type: String }],
        purpose: { type: String, enum: ["humans", "animals", "both"], default: "humans" },
        safe_for_animals: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["available", "reserved", "collected"],
            default: "available",
        },
        realtime_status: {
            type: String,
            enum: ["Still Available", "Almost Gone", "Not Available"],
            default: "Still Available",
        },
        quantity: { type: String, default: "" },
        notes: { type: String, default: "" },
        allow_split: { type: Boolean, default: true },
        is_expired: { type: Boolean, default: false },
        hard_expired: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Virtual: expiry timestamp
FoodSchema.virtual("expiry_time").get(function () {
    return new Date(this.created_at.getTime() + this.expiry_hours * 60 * 60 * 1000);
});

// Virtual: hard expiry timestamp
FoodSchema.virtual("hard_expiry_time").get(function () {
    return new Date(this.created_at.getTime() + this.expiry_hours * 2 * 60 * 60 * 1000);
});

module.exports = mongoose.model("Food", FoodSchema);