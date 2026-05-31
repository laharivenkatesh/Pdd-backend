const cron = require("node-cron");
const Food = require("../models/Food");

// Runs every 30 minutes
const startExpireJob = () => {
    cron.schedule("*/30 * * * *", async () => {
        const now = new Date();
        console.log(`[CronJob] Running food expiry check at ${now.toISOString()}`);

        try {
            const foods = await Food.find({ hard_expired: false, status: { $ne: "collected" } });

            for (const food of foods) {
                const expiry = new Date(food.created_at.getTime() + food.expiry_hours * 60 * 60 * 1000);
                const hardExpiry = new Date(food.created_at.getTime() + food.expiry_hours * 2 * 60 * 60 * 1000);

                if (now >= hardExpiry) {
                    food.hard_expired = true;
                    food.realtime_status = "Not Available";
                    await food.save();
                    console.log(`[CronJob] Hard-expired: ${food.name} (${food._id})`);
                } else if (now >= expiry && !food.is_expired) {
                    food.is_expired = true;
                    await food.save();
                    console.log(`[CronJob] Soft-expired: ${food.name} (${food._id})`);
                }
            }
        } catch (err) {
            console.error("[CronJob] Error in food expiry job:", err.message);
        }
    });

    console.log("[CronJob] Food expiry job scheduled (every 30 min)");
};

module.exports = startExpireJob;