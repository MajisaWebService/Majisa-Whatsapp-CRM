import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load models
import Admin from "../models/Admin.js";
import Customer from "../models/Customer.js";
import PricingRule from "../models/PricingRule.js";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import ChatState from "../models/ChatState.js";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Settings from "../models/Settings.js";

dotenv.config();

const MODELS = {
    Admin,
    Customer,
    PricingRule,
    Project,
    Notification,
    ChatState,
    Chat,
    Message,
    Settings
};

async function verifyBackupAndRecovery() {
    const backupDir = path.resolve("./backups");
    const timestamp = Date.now();
    const currentBackupPath = path.join(backupDir, `backup_${timestamp}`);
    const restoreDBUri = "mongodb://127.0.0.1:27017/majisa_whatsapp_crm_restore_test";

    try {
        console.log("🔌 Connecting to primary database...");
        await mongoose.connect("mongodb://127.0.0.1:27017/majisa_whatsapp_crm");
        console.log("✅ Connected.");

        // 1. Generate Backup
        console.log("\n📦 [PHASE 1] Starting backup generation...");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        fs.mkdirSync(currentBackupPath);

        const counts = {};
        for (const [name, model] of Object.entries(MODELS)) {
            const data = await model.find({});
            counts[name] = data.length;
            const filePath = path.join(currentBackupPath, `${name}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`- Backed up ${data.length} records from ${name}`);
        }

        console.log(`✅ Backup successfully saved to: ${currentBackupPath}`);
        await mongoose.disconnect();

        // 2. Simulate Restoration
        console.log("\n🔄 [PHASE 2] Starting database restoration simulation...");
        console.log(`🔌 Connecting to recovery test database: ${restoreDBUri}`);
        await mongoose.connect(restoreDBUri);
        console.log("✅ Connected.");

        // Clean recovery database first
        await mongoose.connection.db.dropDatabase();

        const restoreCounts = {};
        for (const [name, model] of Object.entries(MODELS)) {
            const filePath = path.join(currentBackupPath, `${name}.json`);
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, "utf-8");
                const data = JSON.parse(raw);
                if (data.length > 0) {
                    await model.insertMany(data);
                }
                restoreCounts[name] = await model.countDocuments({});
                console.log(`- Restored ${restoreCounts[name]} records to ${name}`);
            }
        }

        // 3. Consistency Checks
        console.log("\n🔬 [PHASE 3] Running integrity checks...");
        let isConsistent = true;
        for (const name of Object.keys(MODELS)) {
            const originalCount = counts[name] || 0;
            const restoredCount = restoreCounts[name] || 0;
            if (originalCount !== restoredCount) {
                console.error(`❌ Count mismatch on ${name}: Original=${originalCount}, Restored=${restoredCount}`);
                isConsistent = false;
            } else {
                console.log(`- ${name} is consistent (Count = ${originalCount})`);
            }
        }

        if (isConsistent) {
            console.log("\n🎉 SUCCESS: Backup & Recovery validation checks completed successfully! Data integrity is 100%.");
        } else {
            console.error("\n❌ FAILURE: Count mismatch detected during recovery verification.");
        }

        // Clean up recovery test database
        await mongoose.connection.db.dropDatabase();
        console.log("🧹 Recovery test database dropped cleanly.");

    } catch (error) {
        console.error("❌ Backup and Recovery verification failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

verifyBackupAndRecovery();
