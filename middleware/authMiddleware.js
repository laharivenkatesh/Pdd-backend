const jwt = require("jsonwebtoken");

// Verifies the Supabase JWT sent from the frontend
// Frontend must send: Authorization: Bearer <supabase_access_token>
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify using Supabase's JWT secret (from your Supabase dashboard → Settings → API → JWT Secret)
        const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

        // Supabase JWT payload: { sub: userId, email, role, ... }
        req.user = {
            id: decoded.sub,       // Supabase user UUID
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

module.exports = { protect };
