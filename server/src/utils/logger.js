import fs from "fs";
import path from "path";

const LOGS_DIR = path.resolve("./logs");
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const writeToFile = (level, data) => {
    try {
        const logFile = path.join(LOGS_DIR, `${new Date().toISOString().split("T")[0]}_app.log`);
        const logEntry = JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            ...data
        }) + "\n";
        fs.appendFileSync(logFile, logEntry);
    } catch (e) {
        console.error("Failed to write to log file:", e);
    }
};

const logger = {
    info: (data) => {
        const payload = typeof data === "string" ? { message: data } : data;
        const msg = `[INFO] ${new Date().toLocaleTimeString()} - ${payload.message || ""}`;
        console.log("\x1b[32m%s\x1b[0m", msg);
        writeToFile("INFO", payload);
    },
    warn: (data) => {
        const payload = typeof data === "string" ? { message: data } : data;
        const msg = `[WARN] ${new Date().toLocaleTimeString()} - ${payload.message || ""}`;
        console.warn("\x1b[33m%s\x1b[0m", msg);
        writeToFile("WARN", payload);
    },
    error: (data) => {
        const payload = typeof data === "string" ? { message: data } : data;
        const msg = `[ERROR] ${new Date().toLocaleTimeString()} - ${payload.message || ""}`;
        console.error("\x1b[31m%s\x1b[0m", msg);
        if (payload.stack) {
            console.error(payload.stack);
        }
        writeToFile("ERROR", payload);
    }
};

export default logger;
