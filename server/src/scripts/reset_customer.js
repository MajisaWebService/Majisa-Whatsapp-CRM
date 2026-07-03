import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import ChatState from "../models/ChatState.js";

async function run() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        const JID = "160279740575899@lid";

        // Restore original details
        await Customer.findOneAndUpdate(
            { customerId: JID },
            {
                $set: {
                    name: "Modh Harshad",
                    company: "Qbtz pvt ltd",
                    email: "Qbtz@gmail.com",
                    phone: "9428533145",
                    status: "Talk to Executive"
                }
            }
        );
        console.log(`✅ Restored profile details for ${JID}.`);

        // Reset chat state to COMPLETED
        await ChatState.findOneAndUpdate(
            { customerId: JID },
            {
                $set: {
                    state: "COMPLETED"
                }
            }
        );
        console.log(`✅ Restored ChatState for ${JID} to COMPLETED.`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
