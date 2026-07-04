import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import PricingRule from "../../models/PricingRule.js";
import generateToken from "../../utils/generateToken.js";

describe("Pricing Rules API Endpoint Tests", () => {
    let superAdminToken;
    let regularAdminToken;
    let testRule;

    beforeEach(async () => {
        // Create mock Admin accounts
        const superAdmin = await Admin.create({
            name: "prsuper",
            email: "prsuper@example.com",
            password: "superpassword123",
            role: "SUPER_ADMIN"
        });

        const superSession = await AdminSession.create({
            admin: superAdmin._id,
            refreshTokenHash: "test_refresh_hash_prsuper_" + Math.random(),
            userAgent: "jest"
        });
        superAdminToken = generateToken(superAdmin._id, superSession._id);

        const regularAdmin = await Admin.create({
            name: "pradmin",
            email: "pradmin@example.com",
            password: "adminpassword123",
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_pradmin_" + Math.random(),
            userAgent: "jest"
        });
        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);

        // Setup a test pricing rule
        testRule = await PricingRule.create({
            serviceKey: "web_dev",
            category: "PACKAGE",
            key: "corporate",
            name: "Corporate Website",
            price: 25000,
            isActive: true
        });
    });

    describe("GET /api/v1/pricing", () => {
        it("should retrieve all pricing rules", async () => {
            const response = await request(app)
                .get("/api/v1/pricing")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe("POST /api/v1/pricing", () => {
        it("should successfully create a new pricing rule", async () => {
            const response = await request(app)
                .post("/api/v1/pricing")
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    serviceKey: "app_dev",
                    category: "PACKAGE",
                    key: "custom_mobile",
                    name: "Custom Mobile App",
                    price: 50000,
                    isActive: true
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("key", "custom_mobile");
        });

        it("should reject creation if price is negative", async () => {
            const response = await request(app)
                .post("/api/v1/pricing")
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    serviceKey: "app_dev",
                    category: "PACKAGE",
                    key: "custom_mobile",
                    name: "Custom Mobile App",
                    price: -100,
                    isActive: true
                });

            expect(response.status).toBe(400);
        });
    });

    describe("PUT /api/v1/pricing/:id", () => {
        it("should successfully update a pricing rule", async () => {
            const response = await request(app)
                .put(`/api/v1/pricing/${testRule._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    serviceKey: "web_dev",
                    category: "PACKAGE",
                    key: "corporate",
                    name: "Corporate Website Premium",
                    price: 30000,
                    isActive: true
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("price", 30000);
            expect(response.body.data).toHaveProperty("name", "Corporate Website Premium");
        });
    });

    describe("PATCH /api/v1/pricing/:id/toggle", () => {
        it("should toggle the active state of a pricing rule", async () => {
            const response = await request(app)
                .patch(`/api/v1/pricing/${testRule._id}/toggle`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("isActive", false);
        });
    });

    describe("DELETE /api/v1/pricing/:id", () => {
        it("should allow SUPER_ADMIN to delete a pricing rule", async () => {
            const response = await request(app)
                .delete(`/api/v1/pricing/${testRule._id}`)
                .set("Authorization", `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);

            const check = await PricingRule.findById(testRule._id);
            expect(check).toBeNull();
        });

        it("should deny deletion from regular ADMIN", async () => {
            const response = await request(app)
                .delete(`/api/v1/pricing/${testRule._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(403);
        });
    });
});
