import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
// Derive a 32-byte key from JWT_SECRET or a default passphrase
const KEY = crypto.scryptSync(process.env.JWT_SECRET || "majisa_crm_key_salt_encryption_default", "salt_crm", 32);
const IV_LENGTH = 16;

export const encrypt = (text) => {
    if (!text) return "";
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (encryptedText) => {
    if (!encryptedText) return "";
    try {
        const textParts = encryptedText.split(":");
        const iv = Buffer.from(textParts.shift(), "hex");
        const encrypted = Buffer.from(textParts.join(":"), "hex");
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error.message);
        return encryptedText; // Return original text if not encrypted or decryption fails
    }
};
