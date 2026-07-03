import CustomerRepository from "../repositories/CustomerRepository.js";
import ProjectRepository from "../repositories/ProjectRepository.js";
import ChatRepository from "../repositories/ChatRepository.js";
import Notification from "../models/Notification.js";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import { getWhatsAppStatus } from "./whatsapp.service.js";

const LEAD_FILTER = {
    isDeleted: { $ne: true },
    name: { $ne: "", $exists: true, $nin: ["WhatsApp Contact", "Admin/Bot"] },
    company: { $ne: "", $exists: true },
    email: { $ne: "", $exists: true },
    phone: { $ne: "", $exists: true }
};

class DashboardService {
    async getDashboardStats() {
        const totalCustomers = await CustomerRepository.count(LEAD_FILTER);
        
        // Today's leads
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaysLeads = await CustomerRepository.count({
            ...LEAD_FILTER,
            createdAt: { $gte: startOfToday }
        });

        // Leads by status (New Leads include both "New Lead" and "Talk to Executive" states)
        const newLeads = await CustomerRepository.count({ ...LEAD_FILTER, status: { $in: ["New Lead", "Talk to Executive"] } });
        const inProgressLeads = await CustomerRepository.count({ ...LEAD_FILTER, status: "In Progress" });
        const talkToExecutiveLeads = await CustomerRepository.count({ ...LEAD_FILTER, status: "Talk to Executive" });

        // Today's messages
        const todaysMessages = await Message.countDocuments({
            createdAt: { $gte: startOfToday }
        });

        // Active chats (non-archived chats)
        const activeChats = await ChatRepository.countChats({ isArchived: { $ne: true } });

        // Projects
        const completedProjects = await ProjectRepository.count({ status: "COMPLETED" });
        const activeProjects = await ProjectRepository.count({ status: { $in: ["NOT_STARTED", "IN_PROGRESS"] } });

        // Revenue overview
        const revenueResult = await ProjectRepository.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        const realizedResult = await ProjectRepository.aggregate([
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
        const leadsByMonth = await CustomerRepository.aggregate([
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
        const revenueByMonth = await ProjectRepository.aggregate([
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
        const serviceDistribution = await CustomerRepository.aggregate([
            { $match: { ...LEAD_FILTER, service: { $ne: "" } } },
            { $group: { _id: "$service", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);

        // Customer Status Distribution
        const statusDistribution = await CustomerRepository.aggregate([
            { $match: LEAD_FILTER },
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);

        return {
            cards: {
                totalCustomers,
                todaysLeads,
                newLeads,
                inProgressLeads,
                talkToExecutiveLeads,
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
        };
    }
}

export default new DashboardService();
