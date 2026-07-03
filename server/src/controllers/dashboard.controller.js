import Customer from "../models/Customer.js";
import Project from "../models/Project.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import Notification from "../models/Notification.js";
import { getWhatsAppStatus } from "../services/whatsapp.service.js";

// Reusable filter to identify qualified customer leads who completed details input
const LEAD_FILTER = {
    isDeleted: { $ne: true },
    name: { $ne: "", $exists: true, $nin: ["WhatsApp Contact", "Admin/Bot"] },
    company: { $ne: "", $exists: true },
    email: { $ne: "", $exists: true },
    phone: { $ne: "", $exists: true }
};

// Retrieve complete summary data for the dashboard card grid
export const getDashboardStats = async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments(LEAD_FILTER);
        
        // Today's leads
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaysLeads = await Customer.countDocuments({
            ...LEAD_FILTER,
            createdAt: { $gte: startOfToday }
        });

        // Leads by status
        const newLeads = await Customer.countDocuments({ ...LEAD_FILTER, status: "New Lead" });
        const inProgressLeads = await Customer.countDocuments({ ...LEAD_FILTER, status: "In Progress" });

        // Today's messages
        const todaysMessages = await Message.countDocuments({
            createdAt: { $gte: startOfToday }
        });

        // Active chats (non-archived chats)
        const activeChats = await Chat.countDocuments({ isArchived: { $ne: true } });

        // Projects
        const completedProjects = await Project.countDocuments({ status: "COMPLETED" });
        const activeProjects = await Project.countDocuments({ status: { $in: ["NOT_STARTED", "IN_PROGRESS"] } });

        // Revenue overview
        const revenueResult = await Project.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const realizedResult = await Project.aggregate([
            { $match: { status: "COMPLETED" } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const realizedRevenue = realizedResult[0]?.total || 0;

        // WhatsApp connection status (from service)
        const whatsappStatus = getWhatsAppStatus();

        // Recent conversations (last 5 chats)
        const recentConversations = await Chat.find()
            .populate("customer")
            .sort({ updatedAt: -1 })
            .limit(5);

        // Recent notifications (last 5)
        const recentNotifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // --- CHART DATA GENERATION ---
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Lead growth trend (last 6 months)
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

        // Revenue trend (last 6 months)
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

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const leadsTrend = [];
        const revenueTrend = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const label = `${monthNames[m - 1]} ${y}`;

            const leadMatch = leadsByMonth.find(item => item._id.month === m && item._id.year === y);
            leadsTrend.push({
                label,
                count: leadMatch ? leadMatch.count : 0
            });

            const revMatch = revenueByMonth.find(item => item._id.month === m && item._id.year === y);
            revenueTrend.push({
                label,
                revenue: revMatch ? revMatch.revenue : 0
            });
        }

        // Service Distribution (Top 5 requested)
        const serviceDistribution = await Customer.aggregate([
            { $match: { ...LEAD_FILTER, service: { $ne: "" } } },
            { $group: { _id: "$service", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);

        // Customer Status Distribution
        const statusDistribution = await Customer.aggregate([
            { $match: LEAD_FILTER },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                cards: {
                    totalCustomers,
                    todaysLeads,
                    newLeads,
                    inProgressLeads,
                    todaysMessages,
                    activeChats,
                    completedProjects,
                    activeProjects,
                    totalRevenue,
                    realizedRevenue
                },
                whatsappStatus,
                recentConversations,
                recentNotifications,
                charts: {
                    leadsTrend,
                    revenueTrend,
                    serviceDistribution,
                    statusDistribution
                }
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
