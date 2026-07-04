import { handleIncomingMessage } from "../../chatbot/index.js";
import ChatState from "../../models/ChatState.js";
import Customer from "../../models/Customer.js";
import PricingRule from "../../models/PricingRule.js";
import { invalidatePricingCache } from "../../chatbot/config/pricing.config.js";

describe("Chatbot State Machine & Loop Prevention Tests", () => {
    const testCustomerId = "9999922222@c.us";

    beforeEach(async () => {
        // Invalidate cached pricing rules
        invalidatePricingCache();

        // Seed mock pricing rules
        await PricingRule.create({
            category: "SERVICE",
            key: "1",
            name: "Website Development",
            isActive: true
        });

        // Setup initial Customer
        await Customer.create({
            customerId: testCustomerId,
            name: "John Tester",
            phone: "9999922222",
            status: "New Lead",
            isBotPaused: false
        });

        // Setup initial ChatState
        await ChatState.create({
            customerId: testCustomerId,
            state: "WELCOME",
            service: "",
            data: {}
        });
    });

    it("should ignore messages that do not come from direct message formats (e.g. groups)", async () => {
        const groupMsg = {
            from: "120363024888888@g.us",
            body: "hi",
            fromMe: false,
            reply: jest.fn()
        };

        await handleIncomingMessage(groupMsg);
        expect(groupMsg.reply).not.toHaveBeenCalled();
    });

    it("should process direct message greetings and transition state to WELCOME", async () => {
        const msg = {
            from: testCustomerId,
            body: "hi",
            fromMe: false,
            reply: jest.fn().mockResolvedValue({ id: "123" })
        };

        await handleIncomingMessage(msg);
        expect(msg.reply).toHaveBeenCalled();

        const stateCheck = await ChatState.findOne({ customerId: testCustomerId });
        expect(stateCheck.state).toBe("MAIN_MENU");
    });

    it("should transition state to ASK_NAME when a valid service menu option is sent", async () => {
        // First set state to MAIN_MENU
        await ChatState.findOneAndUpdate(
            { customerId: testCustomerId },
            { $set: { state: "MAIN_MENU" } }
        );

        const msg = {
            from: testCustomerId,
            body: "1", // Choice 1 - Website Development
            fromMe: false,
            reply: jest.fn().mockResolvedValue({ id: "123" })
        };

        await handleIncomingMessage(msg);
        expect(msg.reply).toHaveBeenCalled();

        const stateCheck = await ChatState.findOne({ customerId: testCustomerId });
        expect(stateCheck.state).toBe("ASK_NAME");
        expect(stateCheck.invalidAttempts).toBe(0); // Should be reset on success
    });

    it("should increment invalidAttempts and auto-pause chatbot on the 3rd consecutive failure", async () => {
        await ChatState.findOneAndUpdate(
            { customerId: testCustomerId },
            { $set: { state: "MAIN_MENU" } }
        );

        const msg = {
            from: testCustomerId,
            body: "invalid_choice",
            fromMe: false,
            reply: jest.fn().mockResolvedValue({ id: "123" })
        };

        // 1st attempt
        await handleIncomingMessage(msg);
        let stateCheck = await ChatState.findOne({ customerId: testCustomerId });
        expect(stateCheck.invalidAttempts).toBe(1);
        expect(stateCheck.state).toBe("MAIN_MENU");

        // 2nd attempt
        await handleIncomingMessage(msg);
        stateCheck = await ChatState.findOne({ customerId: testCustomerId });
        expect(stateCheck.invalidAttempts).toBe(2);

        // 3rd attempt - should trigger auto-pause loop prevention
        await handleIncomingMessage(msg);
        stateCheck = await ChatState.findOne({ customerId: testCustomerId });
        expect(stateCheck.state).toBe("COMPLETED");
        expect(stateCheck.invalidAttempts).toBe(0); // Reset after action

        const customerCheck = await Customer.findOne({ customerId: testCustomerId });
        expect(customerCheck.isBotPaused).toBe(true);
        expect(customerCheck.status).toBe("Talk to Executive");
    });

    it("should completely bypass chatbot processing if message contains media attachments", async () => {
        const mediaMsg = {
            from: testCustomerId,
            body: "",
            fromMe: false,
            hasMedia: true,
            reply: jest.fn()
        };

        await handleIncomingMessage(mediaMsg);
        expect(mediaMsg.reply).not.toHaveBeenCalled();
    });
});
