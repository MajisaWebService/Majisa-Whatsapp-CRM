import jwt from "jsonwebtoken";

const generateToken = (adminId, sessionId = null) => {
    const payload = { id: adminId };
    if (sessionId) {
        payload.sessionId = sessionId;
    }
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "15m"
        }
    );
};

export default generateToken;