import AnalyticsService from "../services/AnalyticsService.js";

// Fetch complete system analytical reporting metrics
export const getAnalyticsStats = async (req, res, next) => {
    try {
        const stats = await AnalyticsService.getAnalyticsStats();
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
