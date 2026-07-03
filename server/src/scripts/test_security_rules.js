import http from "http";

const checkEndpoint = (path, method = "GET", body = null) => {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : "";
        const options = {
            hostname: "localhost",
            port: 5000,
            path,
            method,
            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body) {
            options.headers["Content-Length"] = Buffer.byteLength(payload);
        }

        const req = http.request(options, (res) => {
            let responseData = "";
            res.on("data", (chunk) => { responseData += chunk; });
            res.on("end", () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: responseData ? JSON.parse(responseData) : null
                });
            });
        });

        req.on("error", (e) => {
            resolve({ statusCode: 500, error: e.message });
        });

        if (body) {
            req.write(payload);
        }
        req.end();
    });
};

async function runTests() {
    console.log("🔒 Running CRM Security and Architecture Verification Tests...");

    // Test 1: Unauthenticated request should block with 401
    console.log("\nTest 1: Unauthenticated request block verification...");
    const t1 = await checkEndpoint("/api/v1/customers");
    if (t1.statusCode === 401) {
        console.log("✅ PASS: Correctly blocked unauthenticated request with 401.");
    } else {
        console.log(`❌ FAIL: Expected 401, got ${t1.statusCode}`);
    }

    // Test 2: Input Validation schema check (registering admin with invalid inputs)
    console.log("\nTest 2: Input validation check (missing name/email)...");
    const t2 = await checkEndpoint("/api/v1/auth/register", "POST", {
        name: "",
        email: "invalid-email",
        password: "123"
    });
    if (t2.statusCode === 400 && t2.data && !t2.data.success) {
        console.log("✅ PASS: Correctly rejected invalid request payload with 400 and validation errors.");
        console.log("Errors returned:", JSON.stringify(t2.data.errors));
    } else {
        console.log(`❌ FAIL: Expected 400 rejection, got ${t2.statusCode}`, t2.data);
    }

    // Test 3: Rate Limiter check (repeated requests on auth endpoint)
    console.log("\nTest 3: Rate Limiter trigger check (spamming register endpoint)...");
    let rateLimitTriggered = false;
    for (let i = 0; i < 7; i++) {
        const res = await checkEndpoint("/api/v1/auth/register", "POST", {
            name: "Test",
            email: "test@domain.com",
            password: "password123"
        });
        if (res.statusCode === 429) {
            rateLimitTriggered = true;
            console.log(`✅ PASS: Rate limiter successfully triggered 429 on request #${i+1}.`);
            console.log("Limiter response:", res.data);
            break;
        }
    }
    if (!rateLimitTriggered) {
        console.log("❌ FAIL: Rate limiter did not trigger 429 after 7 requests.");
    }

    console.log("\n🏁 Security Verification complete.");
    process.exit(0);
}

runTests().catch(console.error);
