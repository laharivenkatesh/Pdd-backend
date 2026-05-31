const cron = require("node-cron");
const supabase = require("../config/supabase");

// Runs every 30 minutes — marks expired food in Supabase
const startExpireJob = () => {
    cron.schedule("*/30 * * * *", async () => {
        const now = new Date().toISOString();
        console.log(`[CronJob] Running food expiry check at ${now}`);

        try {
            // Fetch all non-hard-expired food that hasn't been collected
            const { data: foods, error } = await supabase
                .from("foods")
                .select("id, created_at, expiry_hours, is_expired, hard_expired, status")
                .eq("hard_expired", false)
                .neq("status", "collected");

            if (error) throw error;

            const nowMs = Date.now();

            for (const food of foods) {
                const createdAt = new Date(food.created_at).getTime();
                const expiryMs = food.expiry_hours * 60 * 60 * 1000;
                const softExpiry = createdAt + expiryMs;
                const hardExpiry = createdAt + expiryMs * 2;

                if (nowMs >= hardExpiry) {
                    await supabase
                        .from("foods")
                        .update({ hard_expired: true, realtime_status: "Not Available" })
                        .eq("id", food.id);
                    console.log(`[CronJob] Hard-expired food: ${food.id}`);
                } else if (nowMs >= softExpiry && !food.is_expired) {
                    await supabase
                        .from("foods")
                        .update({ is_expired: true })
                        .eq("id", food.id);
                    console.log(`[CronJob] Soft-expired food: ${food.id}`);
                }
            }
        } catch (err) {
            console.error("[CronJob] Error:", err.message);
        }
    });

    console.log("[CronJob] Food expiry job scheduled (every 30 min)");
};

module.exports = startExpireJob;