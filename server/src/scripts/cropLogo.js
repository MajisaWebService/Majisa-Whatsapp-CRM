import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const crop = async () => {
    console.log("Launching headless browser to auto-crop logo...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Path to the copied logo
    const logoUrl = "file:///d:/Projects/Majisa-Whatsapp-CRM/client/public/logo.png";
    
    await page.setContent(`
        <html>
        <body>
            <canvas id="canvas"></canvas>
            <script>
                const img = new Image();
                img.src = "${logoUrl}";
                img.onload = () => {
                    const canvas = document.getElementById("canvas");
                    const ctx = canvas.getContext("2d");
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;
                    
                    let minX = canvas.width;
                    let maxX = 0;
                    let minY = canvas.height;
                    let maxY = 0;
                    
                    // Scan pixels for non-white values (threshold of 250)
                    for (let y = 0; y < canvas.height; y++) {
                        for (let x = 0; x < canvas.width; x++) {
                            const idx = (y * canvas.width + x) * 4;
                            const r = data[idx];
                            const g = data[idx+1];
                            const b = data[idx+2];
                            
                            // If pixel is darker than white background
                            if (r < 250 || g < 250 || b < 250) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                    
                    // Add padding around cropped area
                    const padding = 15;
                    minX = Math.max(0, minX - padding);
                    minY = Math.max(0, minY - padding);
                    maxX = Math.min(canvas.width, maxX + padding);
                    maxY = Math.min(canvas.height, maxY + padding);
                    
                    const cropW = maxX - minX;
                    const cropH = maxY - minY;
                    
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = cropW;
                    tempCanvas.height = cropH;
                    const tempCtx = tempCanvas.getContext("2d");
                    tempCtx.drawImage(img, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
                    
                    window.croppedData = tempCanvas.toDataURL("image/png");
                };
            </script>
        </body>
        </html>
    `);
    
    await page.waitForFunction(() => window.croppedData);
    const dataUrl = await page.evaluate(() => window.croppedData);
    
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    
    fs.writeFileSync("d:/Projects/Majisa-Whatsapp-CRM/client/public/logo.png", base64Data, "base64");
    console.log("✅ Brand logo successfully auto-cropped and updated.");
    
    await browser.close();
};

crop().catch(console.error);
