import request from "supertest";
import app from "../../app.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import Customer from "../../models/Customer.js";
import Project from "../../models/Project.js";
import generateToken from "../../utils/generateToken.js";

describe("Project API Endpoint Tests", () => {
    let superAdminToken;
    let regularAdminToken;
    let testCustomer;
    let testProject;

    beforeEach(async () => {
        // Create mock Admin accounts
        const superAdmin = await Admin.create({
            name: "projsuper",
            email: "projsuper@example.com",
            password: "superpassword123",
            role: "SUPER_ADMIN"
        });

        const superSession = await AdminSession.create({
            admin: superAdmin._id,
            refreshTokenHash: "test_refresh_hash_projsuper_" + Math.random(),
            userAgent: "jest"
        });
        superAdminToken = generateToken(superAdmin._id, superSession._id);

        const regularAdmin = await Admin.create({
            name: "projadmin",
            email: "projadmin@example.com",
            password: "adminpassword123",
            role: "ADMIN"
        });

        const adminSession = await AdminSession.create({
            admin: regularAdmin._id,
            refreshTokenHash: "test_refresh_hash_projadmin_" + Math.random(),
            userAgent: "jest"
        });
        regularAdminToken = generateToken(regularAdmin._id, adminSession._id);

        // Create test customer
        testCustomer = await Customer.create({
            customerId: "9999911111@c.us",
            name: "Jane Smith",
            email: "jane@example.com",
            phone: "9999911111"
        });

        // Create test project
        testProject = await Project.create({
            name: "Jane Web Portal",
            customer: testCustomer._id,
            description: "Custom web development",
            totalAmount: 35000,
            status: "IN_PROGRESS"
        });
    });

    describe("GET /api/v1/projects", () => {
        it("should return all active projects", async () => {
            const response = await request(app)
                .get("/api/v1/projects")
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe("GET /api/v1/projects/:id", () => {
        it("should return the project matching the ID", async () => {
            const response = await request(app)
                .get(`/api/v1/projects/${testProject._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("name", "Jane Web Portal");
        });
    });

    describe("POST /api/v1/projects", () => {
        it("should successfully create a new project", async () => {
            const response = await request(app)
                .post("/api/v1/projects")
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    title: "Jane App Development",
                    name: "Jane App Development",
                    customer: testCustomer._id.toString(),
                    description: "iOS Mobile Application",
                    totalAmount: 45000,
                    status: "COMPLETED"
                });

            if (response.status !== 201) {
                console.warn("POST /api/v1/projects FAILED:", response.body);
            }

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty("success", true);
            expect(response.body.data).toHaveProperty("name", "Jane App Development");
        });
    });

    describe("PUT /api/v1/projects/:id", () => {
        it("should successfully update a project", async () => {
            const response = await request(app)
                .put(`/api/v1/projects/${testProject._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`)
                .send({
                    title: "Jane Web Portal Pro",
                    name: "Jane Web Portal Pro",
                    customer: testCustomer._id.toString(),
                    description: "Updated description",
                    totalAmount: 40000,
                    status: "COMPLETED"
                });

            if (response.status !== 200) {
                console.warn("PUT /api/v1/projects/:id FAILED:", response.body);
            }

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("name", "Jane Web Portal Pro");
            expect(response.body.data).toHaveProperty("totalAmount", 40000);
        });
    });

    describe("DELETE /api/v1/projects/:id", () => {
        it("should allow SUPER_ADMIN to delete a project", async () => {
            const response = await request(app)
                .delete(`/api/v1/projects/${testProject._id}`)
                .set("Authorization", `Bearer ${superAdminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("success", true);

            const check = await Project.findById(testProject._id);
            expect(check).toBeNull();
        });

        it("should block delete request from regular ADMIN", async () => {
            const response = await request(app)
                .delete(`/api/v1/projects/${testProject._id}`)
                .set("Authorization", `Bearer ${regularAdminToken}`);

            expect(response.status).toBe(403);
        });
    });
});
