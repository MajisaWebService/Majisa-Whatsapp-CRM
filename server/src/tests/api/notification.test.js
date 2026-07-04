import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import Notification from "../../models/Notification.js";
import generateToken from "../../utils/generateToken.js";

describe("Notification API Endpoint Tests", () => {
    let regularAdminToken;
    let testNotif;

    beforeEach(async () => {
        const regularAdmin = await Admin.create({
            name: "notifadmin",
            email: "notifadmin@example.com",
            password: "adminpassword123",
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_notifadmin_" + Math.random(),
            userAgent: "jest"
        });
        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);

        testNotif = await Notification.create({
            type: "NEW_LEAD",
            title: "New Lead Created",
            message: "A new lead is waiting for assignments",
            isRead: false
        });
    });

    describe("GET /api/v1/notifications", () => {
        it("should retrieve list of notifications", async () => {
            const response = await request(app)
                .get("/api/v1/notifications")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/v1/notifications/unread-count", () => {
        it("should return the count of unread notifications", async () => {
            const response = await request(app)
                .get("/api/v1/notifications/unread-count")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("count", 1);
        });
    });

    describe("PATCH /api/v1/notifications/:id/read", () => {
        it("should mark the notification as read", async () => {
            const response = await request(app)
                .patch(`/api/v1/notifications/${testNotif._id}/read`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("isRead", true);

            const unreadCountResponse = await request(app)
                .get("/api/v1/notifications/unread-count")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(unreadCountResponse.body.count).toBe(0);
        });
    });

    describe("PATCH /api/v1/notifications/read-all", () => {
        it("should mark all notifications as read", async () => {
            await Notification.create({
                type: "EXECUTIVE_REQUESTED",
                title: "Executive Requested",
                message: "A customer wants to speak with an executive",
                isRead: false
            });

            const response = await request(app)
                .patch("/api/v1/notifications/read-all")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);

            const countResponse = await request(app)
                .get("/api/v1/notifications/unread-count")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(countResponse.body.count).toBe(0);
        });
    });
});
