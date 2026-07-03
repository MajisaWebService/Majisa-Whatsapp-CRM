export const checkRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin || !roles.includes(req.admin.role)) {
            return res.status(403).json({
                success: false,
                message: "Access Denied: Insufficient administrative privileges."
            });
        }
        next();
    };
};
