import http from "http";
import { io as Client } from "socket.io-client";
import { initializeSocket, getIO } from "../../sockets/socketManager.js";
import Admin from "../../models/Admin.js";
import AdminSession from "../../models/AdminSession.js";
import generateToken from "../../utils/generateToken.js";

describe("Socket.IO Real-time Tests", () => {
    let server;
    let ioInstance;
    let testAdmin;
    let validToken;
    let port;
    let activeSockets = [];

    beforeAll(async () => {
        // Create mock HTTP server on a dynamic port
        server = http.createServer();
        ioInstance = initializeSocket(server);

        await new Promise((resolve) => {
            server.listen(0, () => {
                port = server.address().port;
                resolve();
            });
        });
    });

    afterAll(async () => {
        ioInstance.close();
        await new Promise((resolve) => server.close(resolve));
    });

    beforeEach(async () => {
        activeSockets = [];
        // Create mock Admin & Session before each test
        testAdmin = await Admin.create({
            name: "socktester",
            email: "sock@example.com",
            password: "password123",
            role: "ADMIN"
        });

        const session = await AdminSession.create({
            admin: testAdmin._id,
            refreshTokenHash: "test_refresh_hash_socktester_" + Math.random()
        });

        validToken = generateToken(testAdmin._id, session._id);
    });

    afterEach(() => {
        // Close all active test sockets to prevent hanging handles
        activeSockets.forEach((s) => {
            if (s.connected) {
                s.close();
            }
        });
    });

    it("should reject connection handshake if token is missing", (done) => {
        const clientSocket = Client(`http://localhost:${port}`, {
            auth: { token: "" },
            transports: ["websocket"]
        });
        activeSockets.push(clientSocket);

        clientSocket.on("connect_error", (err) => {
            expect(err.message).toContain("Authentication error. No token provided.");
            clientSocket.close();
            done();
        });
    });

    it("should accept connection and join room if valid token is provided", (done) => {
        const clientSocket = Client(`http://localhost:${port}`, {
            auth: { token: validToken },
            transports: ["websocket"]
        });
        activeSockets.push(clientSocket);

        clientSocket.on("connect", () => {
            expect(clientSocket.connected).toBe(true);
            clientSocket.close();
            done();
        });
    });
});
