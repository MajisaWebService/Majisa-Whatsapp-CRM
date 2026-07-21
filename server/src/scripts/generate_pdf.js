// server/src/scripts/generate_pdf.js
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../../../docs/Majisa_WhatsApp_CRM_Documentation.pdf");

// Ensure docs folder exists
const docsDir = path.dirname(outputPath);
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Majisa WhatsApp CRM & AI Lead Capture System Documentation</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #2D3748;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            background-color: #ffffff;
        }

        h1, h2, h3, h4 {
            color: #1A365D;
            font-weight: 700;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            page-break-after: avoid;
        }

        h1 {
            font-size: 24pt;
            border-bottom: 2px solid #2B6CB0;
            padding-bottom: 8px;
            color: #1A365D;
        }

        h2 {
            font-size: 16pt;
            color: #2B6CB0;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 6px;
            margin-top: 2em;
        }

        h3 {
            font-size: 13pt;
            color: #2D3748;
        }

        p {
            margin-top: 0;
            margin-bottom: 1em;
            text-align: justify;
        }

        /* Lists */
        ul, ol {
            margin-top: 0;
            margin-bottom: 1em;
            padding-left: 20px;
        }

        li {
            margin-bottom: 0.4em;
        }

        /* Code Blocks */
        pre {
            background-color: #F7FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 12px;
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            font-size: 9.5pt;
            overflow: auto;
            margin-bottom: 1.5em;
            white-space: pre-wrap;
            word-break: break-all;
            color: #2D3748;
        }

        code {
            font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
            background-color: #F7FAFC;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 9.5pt;
            border: 1px solid #E2E8F0;
            color: #C53030;
        }

        pre code {
            border: none;
            padding: 0;
            background-color: transparent;
            color: inherit;
            font-size: inherit;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5em;
            font-size: 10pt;
        }

        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid #E2E8F0;
        }

        th {
            background-color: #EBF8FF;
            color: #2B6CB0;
            font-weight: 600;
            border-bottom: 2px solid #BEE3F8;
        }

        tr:nth-child(even) td {
            background-color: #F7FAFC;
        }

        /* Cover Page Styling */
        .cover-page {
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
            box-sizing: border-box;
            padding: 60px 40px;
            position: relative;
        }

        .cover-header {
            border-left: 6px solid #3182CE;
            padding-left: 20px;
            margin-top: 15%;
        }

        .cover-title {
            font-size: 32pt;
            font-weight: 800;
            color: #1A365D;
            line-height: 1.2;
            margin: 0 0 10px 0;
        }

        .cover-subtitle {
            font-size: 18pt;
            font-weight: 400;
            color: #4A5568;
            margin: 0;
        }

        .cover-footer {
            margin-bottom: 10%;
            font-size: 10.5pt;
            color: #718096;
            border-top: 1px solid #E2E8F0;
            padding-top: 20px;
        }

        .metadata-table {
            width: 100%;
            margin-top: 20px;
        }
        
        .metadata-table td {
            border: none;
            padding: 4px 0;
            background-color: transparent !important;
        }

        .metadata-label {
            font-weight: 600;
            color: #4A5568;
            width: 140px;
        }

        .page-break {
            page-break-after: always;
        }

        .badge {
            background-color: #E2E8F0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-new { background-color: #C6F6D5; color: #22543D; }
        .badge-modify { background-color: #FEFCBF; color: #744210; }
    </style>
</head>
<body>

    <!-- ========================================== -->
    <!-- COVER PAGE                                 -->
    <!-- ========================================== -->
    <div class="cover-page">
        <div class="cover-header">
            <h1 class="cover-title">Majisa WhatsApp CRM &<br>AI Lead Capture System</h1>
            <p class="cover-subtitle">Enterprise Technical Documentation & Operations Guide</p>
        </div>
        
        <div class="cover-footer">
            <table class="metadata-table">
                <tr>
                    <td class="metadata-label">Client Name:</td>
                    <td>Majisa Web Solutions</td>
                </tr>
                <tr>
                    <td class="metadata-label">Author:</td>
                    <td>Technical Engineering Team</td>
                </tr>
                <tr>
                    <td class="metadata-label">Date:</td>
                    <td>July 2026</td>
                </tr>
                <tr>
                    <td class="metadata-label">Document Version:</td>
                    <td>v1.0.0 (Release)</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- ========================================== -->
    <!-- SECTION 1: ARCHITECTURE                   -->
    <!-- ========================================== -->
    <h1>1. Executive Summary & Architecture</h1>
    <p>
        The <strong>Majisa WhatsApp CRM & AI Lead Capture System</strong> is a full-stack, enterprise-grade system designed to automate lead generation, dynamic package pricing, document proposal creation, and live agent chat management. By integrating directly with the WhatsApp Web interface, the application removes friction from customer acquisition and optimizes the entire sales workflow.
    </p>
    
    <h2>1.1 System Components</h2>
    <ul>
        <li><strong>Frontend Dashboard (React / Vite)</strong>: A highly responsive portal for administrative agents featuring real-time KPIs, visual analytics charts, chat threads, customer cards, and custom pricing rule settings.</li>
        <li><strong>Backend REST API & Worker (Express / Node.js)</strong>: Manages auth, logs, CRUD rules, quotation compiler engines, and hosts static attachments.</li>
        <li><strong>Database (MongoDB / Mongoose)</strong>: Relational document store housing persistent customer states, conversation histories, pricing models, audit logs, and notification schemas.</li>
        <li><strong>WhatsApp Service (Puppeteer / Headless Browser)</strong>: Runs a headless Chrome instance to control the WhatsApp Web application protocol, emitting session events and handling incoming messages.</li>
    </ul>

    <h2>1.2 Communication Protocol</h2>
    <p>
        Real-time events (incoming messages, customer typing statuses, read receipts, and system alerts) are synchronized between the server and the admin panel using <strong>Socket.io</strong>. This allows support agents to view active conversations and take over chatbot flows instantly.
    </p>
    
    <div class="page-break"></div>

    <!-- ========================================== -->
    <!-- SECTION 2: CORE FEATURES                   -->
    <!-- ========================================== -->
    <h1>2. Core Capabilities & Workflows</h1>

    <h2>2.1 Conversational State Machine</h2>
    <p>
        The automated chatbot guides users through a structured requirement gathering questionnaire. The flow is maintained persistently in the database per customer ID via the <code>ChatState</code> schema.
    </p>
    
    <h3>Chatbot Questionnaire States</h3>
    <table>
        <thead>
            <tr>
                <th>State ID</th>
                <th>Target Field Captured</th>
                <th>Validation / Action Triggered</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>WELCOME</code></td>
                <td>N/A (Greeting Menu)</td>
                <td>Presents the 6 services, portfolio, and executive-talk options.</td>
            </tr>
            <tr>
                <td><code>ASK_NAME</code></td>
                <td><code>customer.name</code></td>
                <td>Stores full name; supports navigation back (0).</td>
            </tr>
            <tr>
                <td><code>ASK_COMPANY</code></td>
                <td><code>customer.company</code></td>
                <td>Stores company name.</td>
            </tr>
            <tr>
                <td><code>ASK_EMAIL</code></td>
                <td><code>customer.email</code></td>
                <td>Validates email format strictly.</td>
            </tr>
            <tr>
                <td><code>ASK_PHONE</code></td>
                <td><code>customer.phone</code></td>
                <td>Validates phone format (10 digits).</td>
            </tr>
            <tr>
                <td><code>ASK_CITY</code></td>
                <td><code>customer.city</code></td>
                <td>Stores customer location.</td>
            </tr>
            <tr>
                <td><code>SELECT_SUB_TYPE</code></td>
                <td><code>chatState.data.subType</code></td>
                <td>Queries <code>PricingRule</code> for base packages (e.g. Static vs E-commerce).</td>
            </tr>
            <tr>
                <td><code>SELECT_PAGES</code></td>
                <td><code>chatState.data.pageRange</code></td>
                <td>Gathers required page depth.</td>
            </tr>
            <tr>
                <td><code>SELECT_FEATURES</code></td>
                <td><code>chatState.data.selectedFeatures</code></td>
                <td>Multi-select features (comma separated list, e.g. 1,3,4) or "skip".</td>
            </tr>
            <tr>
                <td><code>SHOW_QUOTATION</code></td>
                <td>N/A (Calculates Invoice)</td>
                <td>Generates dynamic PDF and sends it directly to the customer's WhatsApp.</td>
            </tr>
        </tbody>
    </table>

    <h3>Anti-Loop Loop Guard</h3>
    <p>
        To prevent conversational loops and frustration, the chatbot tracks invalid entries. If a user provides an invalid option <strong>3 consecutive times</strong>:
    </p>
    <ol>
        <li>The chatbot is programmatically paused (<code>customer.isBotPaused = true</code>).</li>
        <li>The customer's pipeline status is updated to <strong>Talk to Executive</strong>.</li>
        <li>A high-priority notification (<code>EXECUTIVE_REQUESTED</code>) is dispatched via Socket.io to the admin panel dashboard.</li>
        <li>An polite message is returned to the user stating they are being connected to a human representative.</li>
    </ol>

    <h2>2.2 NLP-Based Lead Auto-Extraction</h2>
    <p>
        When a user sends an unstructured introduction (e.g., in their initial greeting), the system bypasses step-by-step questioning. Using natural language keyword matching and pattern parsing (regex), it extracts key parameters:
    </p>
    <ul>
        <li><strong>Email</strong>: Match regular RFC email standards.</li>
        <li><strong>Phone</strong>: Captures Indian (+91/0) or standard international formats.</li>
        <li><strong>Company</strong>: Identified using constructs like <em>"from [Company]"</em> or inferred from corporate email domains (e.g. <code>rahul@apex.com</code> &rarr; <code>Apex</code>).</li>
        <li><strong>Service Interest</strong>: Scans text for terms like "wordpress", "app", "marketing", "seo", or "server" and maps them to appropriate service categories.</li>
    </ul>

    <div class="page-break"></div>

    <!-- ========================================== -->
    <!-- SECTION 3: DATABASE SCHEMA                 -->
    <!-- ========================================== -->
    <h1>3. Database Reference Guide</h1>
    <p>
        The database consists of collections modeled using Mongoose schemas. Below are details on the core data models.
    </p>

    <h2>3.1 Customer Schema (<code>Customer.js</code>)</h2>
    <pre>// Structure overview of the Customer model
{
    customerId:     { type: String, required: true, unique: true }, // e.g. "91940xxxxxxx@c.us"
    name:           { type: String, default: "" },
    company:        { type: String, default: "" },
    email:          { type: String, default: "" },
    phone:          { type: String, default: "" },
    city:           { type: String, default: "" },
    service:        { type: String, default: "" },
    budget:         { type: String, default: "" },
    timeline:       { type: String, default: "" },
    status:         { type: String, default: "New Lead" }, // New Lead | Talk to Executive | In Progress | Completed
    source:         { type: String, default: "WhatsApp" },
    quotationSent:  { type: Boolean, default: false },
    assignedTo:     { type: String, default: "" },          // Admin Owner ID
    notes:          { type: String, default: "" },
    isBotPaused:    { type: Boolean, default: false },
    isDeleted:      { type: Boolean, default: false }
}</pre>

    <h2>3.2 Message Schema (<code>Message.js</code>)</h2>
    <pre>{
    chat:           { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    customer:       { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    sender:         { type: String, enum: ['CUSTOMER', 'ADMIN', 'BOT'], required: true },
    message:        { type: String, required: true },       // Text content or static file path
    type:           { type: String, enum: ['TEXT', 'IMAGE', 'PDF', 'VIDEO', 'AUDIO', 'DOCUMENT'] },
    status:         { type: String, enum: ['SENT', 'DELIVERED', 'READ'] }
}</pre>

    <h2>3.3 Pricing Rule Schema (<code>PricingRule.js</code>)</h2>
    <p>
        This schema stores dynamic pricing configuration. Categories determine how options render to the chatbot:
    </p>
    <ul>
        <li><code>SERVICE</code>: Major service types (e.g., Website Development, Mobile Apps).</li>
        <li><code>PACKAGE</code>: Base package subtypes mapped to specific services (e.g. E-Commerce package).</li>
        <li><code>PAGE_RANGE</code>: Base cost margins and pricing-per-extra-page.</li>
        <li><code>FEATURE</code>: Optional plug-and-play features (e.g., Payment Gateway Integration, Chatbot).</li>
    </ul>

    <div class="page-break"></div>

    <!-- ========================================== -->
    <!-- SECTION 4: REST API REFERENCE              -->
    <!-- ========================================== -->
    <h1>4. API Reference Manual</h1>
    <p>
        All routes are versioned and prefixes are mapped to <code>/api/v1</code>. Access to administrative routes (chats, settings, reports) requires authorization via JWT authentication cookies.
    </p>

    <h2>4.1 Endpoints List</h2>
    
    <h3>Authentication & Profile</h3>
    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>POST</code></td>
                <td><code>/api/v1/auth/register</code></td>
                <td>Creates a new admin login credential.</td>
            </tr>
            <tr>
                <td><code>POST</code></td>
                <td><code>/api/v1/auth/login</code></td>
                <td>Validates password and issues secure JWT HttpOnly cookie.</td>
            </tr>
            <tr>
                <td><code>POST</code></td>
                <td><code>/api/v1/auth/logout</code></td>
                <td>Clears the session cookie.</td>
            </tr>
            <tr>
                <td><code>GET</code></td>
                <td><code>/api/v1/auth/me</code></td>
                <td>Returns details of currently authenticated admin.</td>
            </tr>
        </tbody>
    </table>

    <h3>Live Chat Console</h3>
    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>GET</code></td>
                <td><code>/api/v1/chats</code></td>
                <td>Lists active chat rooms sorted by last activity.</td>
            </tr>
            <tr>
                <td><code>GET</code></td>
                <td><code>/api/v1/chats/:customerId/messages</code></td>
                <td>Returns a paginated list of logs/messages for that thread.</td>
            </tr>
            <tr>
                <td><code>POST</code></td>
                <td><code>/api/v1/chats/send</code></td>
                <td>Dispatches an outgoing WhatsApp message on behalf of admin.</td>
            </tr>
            <tr>
                <td><code>POST</code></td>
                <td><code>/api/v1/chats/send-media</code></td>
                <td>Uploads base64 files and sends them as media attachments.</td>
            </tr>
            <tr>
                <td><code>PUT</code></td>
                <td><code>/api/v1/chats/:chatId/read</code></td>
                <td>Resets unread count in dashboard.</td>
            </tr>
            <tr>
                <td><code>DELETE</code></td>
                <td><code>/api/v1/chats/:chatId</code></td>
                <td>Permanently clears message histories and chat session records.</td>
            </tr>
        </tbody>
    </table>

    <h3>Leads & Customers Directory</h3>
    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>Path</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>GET</code></td>
                <td><code>/api/v1/customers</code></td>
                <td>Returns customer listing (with filtering and text search).</td>
            </tr>
            <tr>
                <td><code>GET</code></td>
                <td><code>/api/v1/customers/:id</code></td>
                <td>Fetches specific customer profile records.</td>
            </tr>
            <tr>
                <td><code>PUT</code></td>
                <td><code>/api/v1/customers/:id</code></td>
                <td>Modifies details, updates assignedOwner, adds notes, or toggles bot.</td>
            </tr>
            <tr>
                <td><code>DELETE</code></td>
                <td><code>/api/v1/customers/:id</code></td>
                <td>Performs a soft-delete (sets <code>isDeleted = true</code>).</td>
            </tr>
        </tbody>
    </table>

    <div class="page-break"></div>

    <!-- ========================================== -->
    <!-- SECTION 5: DEPLOYMENT & OPERATION          -->
    <!-- ========================================== -->
    <h1>5. Deployment & Operations Guide</h1>

    <h2>5.1 Environment Configuration</h2>
    <p>
        The server relies on the following configurations. Ensure a <code>.env</code> file is configured in the <code>/server</code> directory:
    </p>
    <pre>PORT=5000
MONGO_URI=mongodb://localhost:27017/majisa_whatsapp_crm
JWT_SECRET=your_jwt_signing_key_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173</pre>

    <h2>5.2 Local Execution</h2>
    <p>To run the application locally without Docker:</p>
    
    <h3>1. Start MongoDB</h3>
    <p>Ensure that a local MongoDB instance is running on port 27017.</p>
    
    <h3>2. Run Backend Server</h3>
    <pre>cd server
npm install
npm run dev</pre>
    
    <h3>3. Run Frontend Portal</h3>
    <pre>cd client
npm install
npm run dev</pre>

    <h2>5.3 Docker Compose Deployment</h2>
    <p>
        In a production scenario, use the root level <code>docker-compose.yml</code>. This binds together the MongoDB, the Express backend, and the React frontend static server (which runs behind an Nginx gateway routing traffic on port 80).
    </p>
    <pre># Compile and boot all services in detached mode
docker-compose up --build -d</pre>

    <h2>5.4 Backup & Verification Script</h2>
    <p>
        A utility script (<code>server/src/scripts/backup_verify.js</code>) is included to test database disaster recovery. Running this script copies database states to "./backups", spins up a temporary restore DB, and checks schema count parity. Run it via:
    </p>
    <pre>cd server
node src/scripts/backup_verify.js</pre>

    <h2>5.5 Automated Tests</h2>
    <p>Automated regression tests can be run inside each component folder:</p>
    <ul>
        <li><strong>Backend Tests (Jest)</strong>: <code>cd server && npm test</code></li>
        <li><strong>Frontend Tests (Vitest)</strong>: <code>cd client && npm test</code></li>
    </ul>

    <hr style="margin-top:40px; border:none; border-top: 1px solid #E2E8F0;">
    <p style="text-align: center; font-size: 9pt; color: #718096; margin-top: 20px;">
        Majisa Web Solutions CRM © 2026. Confidential Documentation. All Rights Reserved.
    </p>

</body>
</html>
`;

async function run() {
    try {
        console.log("🚀 Launching Puppeteer...");
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage"
            ]
        });

        console.log("📄 Creating new page...");
        const page = await browser.newPage();

        console.log("✍️ Setting HTML content...");
        await page.setContent(htmlContent, { waitUntil: "networkidle0" });

        console.log("🖨️ Printing PDF...");
        await page.pdf({
            path: outputPath,
            format: "A4",
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: "<span></span>",
            footerTemplate: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 8px; color: #718096; width: 100%; padding: 0 20mm; box-sizing: border-box; display: flex; justify-content: space-between;">
                    <span>Majisa WhatsApp CRM - Technical Reference Guide</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>
            `,
            margin: {
                top: "20mm",
                right: "20mm",
                bottom: "20mm",
                left: "20mm"
            }
        });

        console.log("🔒 Closing browser...");
        await browser.close();

        console.log(`✅ Documentation PDF generated successfully at:\n   ${outputPath}`);
    } catch (error) {
        console.error("❌ Error generating PDF:", error);
        process.exit(1);
    }
}

run();
