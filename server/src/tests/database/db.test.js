import Admin from "../../models/Admin.js";
import Customer from "../../models/Customer.js";
import mongoose from "mongoose";

describe("Database Models & Schema Validation Tests", () => {
    it("should successfully save a valid Admin user", async () => {
        const admin = new Admin({
            name: "dbtester",
            email: "dbtester@example.com",
            password: "dbpassword123",
            role: "ADMIN"
        });

        const saved = await admin.save();
        expect(saved._id).toBeDefined();
        expect(saved.role).toBe("ADMIN");
        expect(saved.isActive).toBe(true); // default value
    });

    it("should enforce validation rule requiring name in Admin schema", async () => {
        const admin = new Admin({
            email: "dbmissinguser@example.com",
            password: "dbpassword123"
        });

        let err = null;
        try {
            await admin.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
        expect(err.errors.name).toBeDefined();
    });

    it("should enforce unique constraint check on Customer customerId", async () => {
        const customer1 = new Customer({
            customerId: "9999955555@c.us",
            name: "Customer A"
        });
        await customer1.save();

        const customer2 = new Customer({
            customerId: "9999955555@c.us", // Duplicate ID
            name: "Customer B"
        });

        let err = null;
        try {
            await customer2.save();
        } catch (error) {
            err = error;
        }

        expect(err).toBeDefined();
        expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });
});
