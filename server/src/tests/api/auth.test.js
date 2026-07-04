import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import generateToken from "../../utils/generateToken.js";
import bcrypt from "bcryptjs";

describe("Authentication API Endpoint Tests", () => {
    let superAdminToken;
    let regularAdminToken;
    let registeredAdminId;

    beforeEach(async () => {
        // Create a mock SUPER_ADMIN in the database
        const superAdmin = await Admin.create({
            name: "Super Tester",
            email: "supertester@example.com",
            password: await bcrypt.hash("superpassword123", 10),
            role: "SUPER_ADMIN"
        });

        const superSession = await AdminSession.create({
            admin: superAdmin._id,
            refreshTokenHash: "test_refresh_hash_super_" + Math.random(),
            userAgent: "jest",
            ipAddress: "127.0.0.1"
        });

        superAdminToken = generateToken(superAdmin._id, superSession._id);

        // Create a mock regular ADMIN in the database
        const regularAdmin = await Admin.create({
            name: "Regular Admin",
            email: "admin@example.com",
            password: await bcrypt.hash("adminpassword123", 10),
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_admin_" + Math.random(),
            userAgent: "jest",
            ipAddress: "127.0.0.1"
        });

        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);
    });

    describe("POST /api/v1/auth/register", () => {
        it("should successfully register a new admin account", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "newadmin",
                    email: "newadmin@example.com",
                    password: "newadminpassword123"
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("name", "newadmin");
            registeredAdminId = response.body.data._id;
        });

        it("should reject registration with invalid email format", async () => {
            const response = await request(app)
                .post("/api/v1/auth/register")
                .send({
                    name: "invalidemailadmin",
                    email: "not-an-email",
                    password: "password123"
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty("success", false);
        });
    });

    describe("POST /api/v1/auth/login", () => {
        it("should successfully authenticate an admin with valid credentials", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "supertester@example.com",
                    password: "superpassword123"
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body).toHaveProperty("token");
        });

        it("should reject login with incorrect credentials", async () => {
            const response = await request(app)
                .post("/api/v1/auth/login")
                .send({
                    email: "supertester@example.com",
                    password: "wrongpassword"
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty("success", false);
        });
    });

    describe("GET /api/v1/auth/me", () => {
        it("should allow access and return profile details to authenticated admin", async () => {
            const response = await request(app)
                .get("/api/v1/auth/me")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("email", "admin@example.com");
        });

        it("should block request and return unauthorized error if token is missing", async () => {
            const response = await request(app).get("/api/v1/auth/me");
            expect(response.status).toBe(401);
        });
    });

    describe("GET /api/v1/auth/admins (RBAC Verification)", () => {
        it("should allow SUPER_ADMIN to query all registered administrators", async () => {
            const response = await request(app)
                .get("/api/v1/auth/admins")
                .set("Authorization", `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it("should reject query request from regular ADMIN", async () => {
            const response = await request(app)
                .get("/api/v1/auth/admins")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(403); // Forbidden
        });
    });
});
