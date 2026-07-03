import Customer from "../models/Customer.js";
import Project from "../models/Project.js";
import Message from "../models/Message.js";
import Settings from "../models/Settings.js";

// Reusable filter to identify qualified customer leads who completed details input
const LEAD_FILTER = {
    isDeleted: { $ne: true },
    name: { $ne: "", $exists: true, $nin: ["WhatsApp Contact", "Admin/Bot"] },
    company: { $ne: "", $exists: true },
    email: { $ne: "", $exists: true },
    phone: { $ne: "", $exists: true }
};

// Fetch complete system analytical reporting metrics
export const getAnalyticsStats = async (req, res) => {
    try {
        // Fetch global settings overrides
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }

        // 1. Leads and Conversion Summary
        const totalLeads = await Customer.countDocuments(LEAD_FILTER);
        const completedProjects = await Project.countDocuments({ status: "COMPLETED" });
        const conversionRate = totalLeads > 0 ? Math.round((completedProjects / totalLeads) * 100) : 0;

        // 2. Revenue Details
        const revenueResult = await Project.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalPipelineRevenue = revenueResult[0]?.total || 0;

        const realizedResult = await Project.aggregate([
            { $match: { status: "COMPLETED" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const realizedRevenue = realizedResult[0]?.total || 0;

        const ongoingResult = await Project.aggregate([
            { $match: { status: "IN_PROGRESS" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const ongoingRevenue = ongoingResult[0]?.total || 0;

        // 3. Leads Growth (Last 6 Months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const leadsByMonth = await Customer.aggregate([
            { $match: { ...LEAD_FILTER, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const leadsChartData = [];
        const revenueChartData = [];

        // Fetch monthly revenue for last 6 months
        const revenueByMonth = await Project.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" }
                }
            }
        ]);

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const label = `${monthNames[m - 1]} ${y}`;

            const leadMatch = leadsByMonth.find(item => item._id.month === m && item._id.year === y);
            leadsChartData.push({
                label,
                count: leadMatch ? leadMatch.count : 0
            });

            const revMatch = revenueByMonth.find(item => item._id.month === m && item._id.year === y);
            revenueChartData.push({
                label,
                revenue: revMatch ? revMatch.revenue : 0
            });
        }

        // 4. Service Distribution & Revenue
        const serviceDistribution = await Customer.aggregate([
            { $match: { ...LEAD_FILTER, service: { $ne: "" } } },
            { $group: { _id: "$service", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $project: { service: "$_id", count: 1, _id: 0 } }
        ]);

        const serviceRevenue = await Project.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "customer",
                    foreignField: "_id",
                    as: "customerInfo"
                }
            },
            { $unwind: "$customerInfo" },
            {
                $group: {
                    _id: "$customerInfo.service",
                    revenue: { $sum: "$totalAmount" },
                    count: { $sum: 1 }
                }
            },
            { $project: { service: "$_id", revenue: 1, count: 1, _id: 0 } }
        ]);

        // 5. Customer Lead Status Distribution
        const statusDistribution = await Customer.aggregate([
            { $match: LEAD_FILTER },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { status: "$_id", count: 1, _id: 0 } }
        ]);

        // 6. Executive Performance
        const executivePerformance = await Customer.aggregate([
            { $match: { ...LEAD_FILTER, assignedTo: { $ne: "" } } },
            {
                $group: {
                    _id: "$assignedTo",
                    leadsHandled: { $sum: 1 },
                    convertedLeads: {
                        $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: "projects",
                    let: { execName: "$_id" },
                    pipeline: [
                        {
                            $lookup: {
                                from: "customers",
                                localField: "customer",
                                foreignField: "_id",
                                as: "cust"
                            }
                        },
                        { $unwind: "$cust" },
                        { $match: { $expr: { $eq: ["$cust.assignedTo", "$$execName"] } } },
                        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
                    ],
                    as: "projectRevenue"
                }
            },
            {
                $project: {
                    executive: "$_id",
                    leadsHandled: 1,
                    convertedLeads: 1,
                    revenueGenerated: { $ifNull: [{ $arrayElemAt: ["$projectRevenue.totalRevenue", 0] }, 0] },
                    _id: 0
                }
            },
            { $sort: { revenueGenerated: -1 } }
        ]);

        // 7. Get Average response/closing time overrides or defaults
        const manualResponse = settings.manualAvgResponseTime || "15 mins";
        const manualCycle = settings.manualAvgCycleTime || "7 Days";

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalLeads,
                    completedProjects,
                    conversionRate,
                    totalPipelineRevenue,
                    realizedRevenue,
                    ongoingRevenue,
                    avgResponseTimeStr: manualResponse,
                    avgClosingTimeStr: manualCycle
                },
                charts: {
                    leadsTrend: leadsChartData,
                    revenueTrend: revenueChartData,
                    serviceDistribution,
                    serviceRevenue,
                    statusDistribution
                },
                executivePerformance
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
