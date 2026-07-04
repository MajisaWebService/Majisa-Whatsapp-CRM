import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

jest.setTimeout(20000);

process.env.MONGO_URI = "mongodb://127.0.0.1:27017/majisa_whatsapp_crm_test";
process.env.JWT_SECRET = "testjwtsecrettoken987654321";
process.env.NODE_ENV = "test";

// Mock global WhatsApp client and connection functions
jest.mock("../services/whatsapp.service.js", () => {
    return {
        client: {
            sendMessage: jest.fn().mockResolvedValue({ id: { id: "mock_id" } }),
            on: jest.fn(),
            initialize: jest.fn().mockResolvedValue(true),
            destroy: jest.fn().mockResolvedValue(true)
        },
        initializeWhatsApp: jest.fn(),
        closeWhatsApp: jest.fn(),
        getWhatsAppStatus: jest.fn().mockReturnValue("connected")
    };
});

// Mock sockets emitter module
jest.mock("../sockets/emitter.js", () => {
    return {
        emitWhatsAppQR: jest.fn(),
        emitWhatsAppStatus: jest.fn(),
        emitNewCustomer: jest.fn(),
        emitCustomerUpdated: jest.fn(),
        emitNewMessage: jest.fn(),
        emitQuotationGenerated: jest.fn(),
        emitTypingStatus: jest.fn(),
        emitMessageStatus: jest.fn(),
        emitNotification: jest.fn()
    };
});

beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGO_URI);
    }
    // Ensure all indexes are built before starting tests to avoid index race conditions
    await Promise.all(
        mongoose.modelNames().map(modelName => mongoose.model(modelName).ensureIndexes())
    );
});

afterEach(async () => {
    // Clear all collections to ensure test isolation
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        try {
            await mongoose.connection.db.dropDatabase();
        } catch (err) {
            console.warn("Could not drop test database:", err.message);
        }
        await mongoose.disconnect();
    }
});
