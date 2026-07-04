import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import Customer from "../../models/Customer.js";
import generateToken from "../../utils/generateToken.js";

describe("Customer API Endpoint Tests", () => {
    let superAdminToken;
    let regularAdminToken;
    let testCustomer;

    beforeEach(async () => {
        // Create mock Admin accounts
        const superAdmin = await Admin.create({
            name: "custsuper",
            email: "custsuper@example.com",
            password: "superpassword123",
            role: "SUPER_ADMIN"
        });

        const superSession = await AdminSession.create({
            admin: superAdmin._id,
            refreshTokenHash: "test_refresh_hash_custsuper_" + Math.random(),
            userAgent: "jest"
        });
        superAdminToken = generateToken(superAdmin._id, superSession._id);

        const regularAdmin = await Admin.create({
            name: "custadmin",
            email: "custadmin@example.com",
            password: "adminpassword123",
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_custadmin_" + Math.random(),
            userAgent: "jest"
        });
        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);

        // Create a fresh test customer
        testCustomer = await Customer.create({
            customerId: "9999900000@c.us",
            name: "John Doe",
            company: "JD Enterprises",
            email: "john@example.com",
            phone: "9999900000",
            status: "New Lead"
        });
    });

    describe("GET /api/v1/customers", () => {
        it("should return a list of customers", async () => {
            const response = await request(app)
                .get("/api/v1/customers")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/v1/customers/:id", () => {
        it("should return the customer matching the ID", async () => {
            const response = await request(app)
                .get(`/api/v1/customers/${testCustomer._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("name", "John Doe");
        });

        it("should return validation error for invalid MongoDB ID format", async () => {
            const response = await request(app)
                .get("/api/v1/customers/not-a-valid-id")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
        });
    });

    describe("PUT /api/v1/customers/:id", () => {
        it("should successfully update the customer details", async () => {
            const response = await request(app)
                .put(`/api/v1/customers/${testCustomer._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    name: "John Updated",
                    company: "JD Inc.",
                    email: "john_new@example.com",
                    phone: "9999900000",
                    city: "Ahmedabad"
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("name", "John Updated");
            expect(response.body.data).toHaveProperty("city", "Ahmedabad");
        });
    });

    describe("PATCH /api/v1/customers/:id/status", () => {
        it("should successfully transition lead status", async () => {
            const response = await request(app)
                .patch(`/api/v1/customers/${testCustomer._id}/status`)
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({ status: "In Progress" });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("status", "In Progress");
        });
    });

    describe("PATCH /api/v1/customers/:id/toggle-bot", () => {
        it("should successfully toggle the chatbot pause state", async () => {
            const response = await request(app)
                .patch(`/api/v1/customers/${testCustomer._id}/toggle-bot`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("isBotPaused", true);

            // Toggle back
            const response2 = await request(app)
                .patch(`/api/v1/customers/${testCustomer._id}/toggle-bot`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response2.body.data).toHaveProperty("isBotPaused", false);
        });
    });

    describe("DELETE /api/v1/customers/:id", () => {
        it("should allow SUPER_ADMIN to soft delete a customer", async () => {
            const response = await request(app)
                .delete(`/api/v1/customers/${testCustomer._id}`)
                .set("Authorization", `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);

            const deletedCheck = await Customer.findById(testCustomer._id);
            expect(deletedCheck.isDeleted).toBe(true);
        });

        it("should block delete request from regular ADMIN", async () => {
            const response = await request(app)
                .delete(`/api/v1/customers/${testCustomer._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(403); // Forbidden
        });
    });
});
