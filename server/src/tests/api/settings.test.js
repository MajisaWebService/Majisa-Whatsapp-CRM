import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import Settings from "../../models/Settings.js";
import generateToken from "../../utils/generateToken.js";

describe("Settings API Endpoint Tests", () => {
    let superAdminToken;
    let regularAdminToken;

    beforeEach(async () => {
        // Create mock Admin accounts
        const superAdmin = await Admin.create({
            name: "setsuper",
            email: "setsuper@example.com",
            password: "superpassword123",
            role: "SUPER_ADMIN"
        });

        const superSession = await AdminSession.create({
            admin: superAdmin._id,
            refreshTokenHash: "test_refresh_hash_setsuper_" + Math.random(),
            userAgent: "jest"
        });
        superAdminToken = generateToken(superAdmin._id, superSession._id);

        const regularAdmin = await Admin.create({
            name: "setadmin",
            email: "setadmin@example.com",
            password: "adminpassword123",
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_setadmin_" + Math.random(),
            userAgent: "jest"
        });
        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);

        // Make sure a settings doc exists in DB
        await Settings.create({
            companyName: "Majisa Web Solutions Test",
            email: "info@majisa.test",
            phone: "+919400000000"
        });
    });

    describe("GET /api/v1/settings", () => {
        it("should retrieve system settings", async () => {
            const response = await request(app)
                .get("/api/v1/settings")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("companyName", "Majisa Web Solutions Test");
        });
    });

    describe("PUT /api/v1/settings", () => {
        it("should successfully update settings", async () => {
            const response = await request(app)
                .put("/api/v1/settings")
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    companyName: "Majisa Web Solutions Premium",
                    email: "premium@majisa.test",
                    phone: "+919400000001",
                    termsAndConditions: "1. Update policy details."
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("companyName", "Majisa Web Solutions Premium");
        });
    });
});
