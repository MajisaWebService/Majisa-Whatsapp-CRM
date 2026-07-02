// src/chatbot/services/pdf.service.js

import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { FEATURES } from "../config/pricing.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.resolve(__dirname, "../../assets/logo.png");

// Ensure quotations directory exists
const QUOTATIONS_DIR = path.resolve("./quotations");

if (!fs.existsSync(QUOTATIONS_DIR)) {
    fs.mkdirSync(QUOTATIONS_DIR, { recursive: true });
}

// ==========================================
// Generate PDF Quotation
// ==========================================

export const generateQuotationPDF = async (customer, chatState, quotationData, quotationId) => {

    const fileName = `quotation_${quotationId}.pdf`;
    const filePath = path.join(QUOTATIONS_DIR, fileName);

    return new Promise((resolve, reject) => {

        const doc = new PDFDocument({
            size: "A4",
            margin: 50
        });

        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // ------------------------------------------
        // Header — Logo or fallback text
        // ------------------------------------------

        const logoExists = fs.existsSync(LOGO_PATH);

        if (logoExists) {

            // Center the logo horizontally
            const logoWidth = 180;
            const pageWidth = doc.page.width;
            const logoX = (pageWidth - logoWidth) / 2;

            doc.image(LOGO_PATH, logoX, doc.y, {
                width: logoWidth,
                align: "center"
            });

            doc.moveDown(0.5);

        } else {

            // Fallback: text header if logo not found
            doc.fontSize(24)
                .font("Helvetica-Bold")
                .fillColor("#E64A19")
                .text("Majisa Web Solutions", { align: "center" });

            doc.fontSize(10)
                .font("Helvetica")
                .fillColor("#666666")
                .text("Professional IT Services & Solutions", { align: "center" });

            doc.moveDown(0.5);
        }

        // Horizontal line
        doc.strokeColor("#2196F3")
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1);

        // ------------------------------------------
        // Quotation Info
        // ------------------------------------------

        doc.fillColor("#000000")
            .fontSize(16)
            .font("Helvetica-Bold")
            .text("QUOTATION", { align: "center" });

        doc.moveDown(0.5);

        doc.fontSize(10)
            .font("Helvetica")
            .fillColor("#444444");

        const today = new Date();
        const dateStr = today.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });

        doc.text(`Date: ${dateStr}`);
        doc.text(`Quotation ID: ${quotationId}`);

        doc.moveDown(1);

        // ------------------------------------------
        // Customer Details
        // ------------------------------------------

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#2196F3")
            .text("Customer Details");

        doc.moveDown(0.3);

        doc.fontSize(10)
            .font("Helvetica")
            .fillColor("#000000");

        if (customer.name) doc.text(`Name: ${customer.name}`);
        if (customer.company) doc.text(`Company: ${customer.company}`);
        if (customer.email) doc.text(`Email: ${customer.email}`);
        if (customer.phone) doc.text(`Phone: ${customer.phone}`);
        if (customer.city) doc.text(`City: ${customer.city}`);

        doc.moveDown(1);

        // ------------------------------------------
        // Service Details
        // ------------------------------------------

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#2196F3")
            .text("Service Details");

        doc.moveDown(0.3);

        doc.fontSize(10)
            .font("Helvetica")
            .fillColor("#000000");

        doc.text(`Service: ${chatState.service || "N/A"}`);

        if (chatState.data?.subType) {
            doc.text(`Type: ${chatState.data.subType}`);
        }

        if (chatState.data?.pageRange) {
            doc.text(`Pages: ${chatState.data.pageRange}`);
        }

        // Selected Features
        const featureKeys = chatState.data?.selectedFeatureKeys || [];
        const featureNames = featureKeys
            .map(k => FEATURES[k]?.name)
            .filter(Boolean);

        if (featureNames.length > 0) {
            doc.moveDown(0.5);
            doc.font("Helvetica-Bold").text("Selected Features:");
            doc.font("Helvetica");
            for (const name of featureNames) {
                doc.text(`  ✓ ${name}`);
            }
        }

        doc.moveDown(1);

        // ------------------------------------------
        // Cost Breakdown Table
        // ------------------------------------------

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#2196F3")
            .text("Cost Breakdown");

        doc.moveDown(0.5);

        const tableTop = doc.y;
        const tableLeft = 50;
        const tableRight = 545;
        const colItemX = tableLeft + 10;
        const colPriceX = 420;

        // Table Header
        doc.rect(tableLeft, tableTop, tableRight - tableLeft, 25)
            .fill("#2196F3");

        doc.fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#FFFFFF")
            .text("Item", colItemX, tableTop + 7)
            .text("Price (₹)", colPriceX, tableTop + 7);

        // Table Rows
        let rowY = tableTop + 25;
        const { items } = quotationData.breakdown;

        for (let i = 0; i < items.length; i++) {

            const bgColor = i % 2 === 0 ? "#F5F5F5" : "#FFFFFF";

            doc.rect(tableLeft, rowY, tableRight - tableLeft, 22)
                .fill(bgColor);

            doc.fontSize(10)
                .font("Helvetica")
                .fillColor("#333333")
                .text(items[i].name, colItemX, rowY + 6, { width: 350 })
                .text(
                    `₹${items[i].price.toLocaleString("en-IN")}`,
                    colPriceX,
                    rowY + 6
                );

            rowY += 22;
        }

        // Total Row
        doc.rect(tableLeft, rowY, tableRight - tableLeft, 28)
            .fill("#1976D2");

        doc.fontSize(12)
            .font("Helvetica-Bold")
            .fillColor("#FFFFFF")
            .text("ESTIMATED TOTAL", colItemX, rowY + 8)
            .text(
                `₹${quotationData.totalAmount.toLocaleString("en-IN")}`,
                colPriceX,
                rowY + 8
            );

        rowY += 40;

        // ------------------------------------------
        // Terms & Conditions
        // ------------------------------------------

        doc.y = rowY;

        doc.fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#2196F3")
            .text("Terms & Conditions");

        doc.moveDown(0.3);

        doc.fontSize(8)
            .font("Helvetica")
            .fillColor("#666666");

        doc.text("• This is an estimated quotation. Final price may vary based on detailed requirements.");
        doc.text("• 50% advance payment is required to start the project.");
        doc.text("• Delivery timeline will be confirmed after requirement discussion.");
        doc.text("• Prices are exclusive of GST (18%).");
        doc.text("• This quotation is valid for 30 days from the date of issue.");

        doc.moveDown(2);

        // ------------------------------------------
        // Footer
        // ------------------------------------------

        doc.fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#2196F3")
            .text("Majisa Web Solutions", { align: "center" });

        doc.fontSize(8)
            .font("Helvetica")
            .fillColor("#666666")
            .text("📞 Contact: Your Phone Number | 📧 Email: info@majisaweb.com", { align: "center" })
            .text("🌐 www.majisaweb.com", { align: "center" });

        // Finalize
        doc.end();

        writeStream.on("finish", () => {

            console.log("✅ PDF Generated:", filePath);
            resolve(filePath);

        });

        writeStream.on("error", (err) => {

            console.error("❌ PDF Generation Error:", err);
            reject(err);

        });

    });
};
