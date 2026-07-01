import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

const { Client, LocalAuth } = pkg;

// Create WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "./sessions"
    }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    }
});

// ==============================
// QR Code
// ==============================
client.on("qr", (qr) => {
    console.clear();

    console.log("========================================");
    console.log("📱 Scan this QR using WhatsApp Business");
    console.log("========================================\n");

    qrcode.generate(qr, {
        small: true
    });
});

// ==============================
// Authentication
// ==============================
client.on("authenticated", () => {
    console.log("🔐 WhatsApp Authenticated");
});

// ==============================
// Ready
// ==============================
client.on("ready", () => {
    console.log("========================================");
    console.log("✅ WhatsApp Connected Successfully");
    console.log("========================================");
});

// ==============================
// Authentication Failed
// ==============================
client.on("auth_failure", (msg) => {
    console.error("❌ Authentication Failed");
    console.error(msg);
});

// ==============================
// Disconnected
// ==============================
client.on("disconnected", (reason) => {
    console.log("⚠️ WhatsApp Disconnected");
    console.log("Reason:", reason);
});

// ==============================
// Incoming Messages
// ==============================
client.on("message", async (message) => {
    try {

        console.log("\n==============================");
        console.log("📩 New WhatsApp Message");
        console.log("==============================");
        console.log("From :", message.from);
        console.log("Body :", message.body);
        console.log("Type :", message.type);
        console.log("==============================\n");

        // Convert message to lowercase
        const text = message.body.trim().toLowerCase();

        // Welcome Menu
        if (text === "hi", "hii", "hy" || text === "hello") {

            await message.reply(
                `👋 Welcome to Majisa Web Solutions!

Please choose an option:

1️⃣ Website Development
2️⃣ Mobile App Development
3️⃣ Digital Marketing
4️⃣ Cloud & DevOps
5️⃣ Talk to an Executive`
            );

            return;
        }

        // Website Menu
        if (text === "1") {

            await message.reply(
                `🌐 Website Development

What type of website do you need?

1️⃣ Business Website
2️⃣ E-commerce Website
3️⃣ Portfolio Website
4️⃣ Custom Web Application`
            );

            return;
        }

        // Mobile App
        if (text === "2") {

            await message.reply(
                `📱 Mobile App Development

Android
iOS
Flutter

Our executive will contact you shortly.`
            );

            return;
        }

        // Digital Marketing
        if (text === "3") {

            await message.reply(
                `📈 Digital Marketing

✔ SEO
✔ Google Ads
✔ Facebook Ads
✔ Instagram Marketing

Our executive will contact you soon.`
            );

            return;
        }

        // Cloud & DevOps
        if (text === "4") {

            await message.reply(
                `☁ Cloud & DevOps

AWS
Azure
Google Cloud
Docker
Kubernetes
CI/CD

Our expert will contact you soon.`
            );

            return;
        }

        // Talk to Executive
        if (text === "5") {

            await message.reply(
                `👨‍💼 Thank you.

Our executive will contact you shortly.

📞 Majisa Web Solutions`
            );

            return;
        }

    } catch (error) {
        console.error("❌ Message Error:", error);
    }
});

// ==============================
// Initialize WhatsApp
// ==============================
const initializeWhatsApp = async () => {
    try {
        console.log("📱 Initializing WhatsApp...");
        await client.initialize();
    } catch (error) {
        console.error("❌ WhatsApp Initialization Error:", error);
    }
};

// ==============================
// Close WhatsApp
// ==============================
const closeWhatsApp = async () => {
    try {
        console.log("Shutting down WhatsApp client...");
        await client.destroy();
        console.log("✅ WhatsApp client destroyed successfully");
    } catch (error) {
        console.error("❌ Error destroying WhatsApp client:", error);
    }
};

export {
    client,
    initializeWhatsApp,
    closeWhatsApp
};