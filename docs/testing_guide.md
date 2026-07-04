# Enterprise Testing & Quality Assurance Guide

This guide details the testing strategy, test suites configuration, automated testing pipelines, and manual verification scripts for the Majisa Web Solutions CRM.

---

## 🚀 1. Automated Testing Execution

We have configured separate test suites for the backend server and frontend client.

### Backend APIs, Chatbot, Sockets, and Database (Jest)
We use Jest for backend integration tests. Tests run against a dedicated local test database `majisa_whatsapp_crm_test` which is automatically cleared after each test run.

1. Ensure MongoDB is running locally.
2. Navigate to the server folder:
   ```bash
   cd server
   ```
3. Run the automated test suite:
   ```bash
   npm test
   ```
   *Note: This runs Jest with `--experimental-vm-modules` to natively support ES Modules without transpilation, and `--runInBand` to prevent database collection race conditions.*

### Frontend React Component Testing (Vitest)
We use Vitest combined with React Testing Library for frontend component verification.

1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Run the test suite:
   ```bash
   npm test
   ```
   *Note: This runs component verification with JS-Dom support for element layout checks, events simulation, and context mocks.*

---

## 📝 2. Database Backup & Restoration Verification

To verify backup generation, restoration consistency, and disaster recovery procedures:
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Execute the verification script:
   ```bash
   node src/scripts/backup_verify.js
   ```
This script programmatically performs a backup of your primary database to `./backups`, recovers the data into a temporary test database, and performs 1:1 count consistency validation across all MongoDB collections.

---

## 📋 3. User Acceptance Testing (UAT) Manual Checklist

Perform this end-to-end workflow to verify operations as a CRM administrator:

1. **Authentication Check**:
   - Navigate to the login screen.
   - Try logging in with invalid details (verify error message matches: `⚠️ Invalid credentials`).
   - Log in with valid admin credentials.
2. **WhatsApp Connection**:
   - Confirm the connection status badge in the dashboard header.
   - If offline, scan the generated terminal QR code with your business phone.
3. **Chatbot Flow & Lead Capture**:
   - Message the business WhatsApp number from a personal phone.
   - Verify the chatbot sends the greeting menu.
   - Reply with invalid inputs (confirm that on the 3rd consecutive invalid attempt, the bot pauses and sends the executive notification warning).
   - Enter details (Name, Company, Email, Phone, City, Service).
   - Verify the chatbot automatically calculates the quote, stores the Customer profile in MongoDB, and triggers a real-time dashboard notification.
4. **CRM Dashboard Live Chat Management**:
   - Check that the new customer appears instantly in the "Recent Conversations" and "Overview" lists.
   - Navigate to the "Live Chats" console.
   - Click on the customer conversation to load message logs.
   - Toggle chatbot pause status (verify label switches between `🤖 Bot Active` and `⏸️ Bot Paused`).
   - Enter administrative notes and owner assignments (click Save and confirm it updates).
   - Click **🗑️ Delete Chat**, click Confirm, and verify the conversation thread and database messages are cleanly deleted.
5. **Logout**:
   - Click logout in the sidebar and ensure you are redirected back to the login page.

---

## 🛡️ 4. Performance & Security Validation Benchmarks

### Performance Targets
- **API Response Latency**: `< 300 ms` for typical REST calls.
- **Initial React Dashboard Load**: `< 2.0 s`.
- **Socket Event Exchange Latency**: `< 100 ms` on a local network.

### Security Configurations
- **JWT Verification**: Validates expiration and signatures for all protected endpoints.
- **Helmet Headers**: Enabled on the backend to enforce secure CORS origins and CSP parameters.
- **Rate Limiting**: Enforced via Express Rate Limit to block API brute-forcing.
- **Input Sanitization**: Handled by Express Validator schemas.
