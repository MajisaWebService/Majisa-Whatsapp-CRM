import DashboardService from "../services/DashboardService.js";

// Retrieve complete summary data for the dashboard card grid
export const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await DashboardService.getDashboardStats();
        return res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
