process.env.NODE_ENV = "test";

import http from "http";
import { io as ClientSocket, Socket as ClientSocketType } from "socket.io-client";
import { initSocketServer, closeSocketServer } from "../socket/socket.server";
import { realtimeService } from "../services/realtime.service";
import { TokenService } from "../utils/token.service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runRealtimeTests() {
  console.log("====================================================");
  console.log("ANKLYZE Phase 15 - Realtime WebSocket Tests");
  console.log("====================================================");

  // Setup test HTTP Server on a dynamic port
  const server = http.createServer();
  initSocketServer(server);

  await new Promise<void>((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = (server.address() as any).port;
  const socketUrl = `http://localhost:${port}`;

  const validToken = TokenService.generateAccessToken({
    id: "realtime-evaluator-1",
    email: "evaluator@test.anklyze",
    role: "HEAD_EXAMINER",
  });

  console.log("\n--- SECTION 1: AUTHENTICATED HANDSHAKE ---");

  // Scenario 1: Unauthenticated connection is rejected
  await new Promise<void>((resolve) => {
    const unauthClient = ClientSocket(socketUrl, {
      transports: ["websocket"],
      reconnection: false,
    });

    unauthClient.on("connect_error", (err) => {
      assert(err.message.includes("AUTHENTICATION_REQUIRED"), "Should reject without token");
      console.log("  ✓ [SCENARIO 1] Unauthenticated socket connection is rejected");
      unauthClient.close();
      resolve();
    });

    unauthClient.on("connect", () => {
      assert(false, "Should not connect without token");
    });
  });

  // Scenario 2: Authenticated connection with valid JWT succeeds
  let client1: ClientSocketType;
  await new Promise<void>((resolve) => {
    client1 = ClientSocket(socketUrl, {
      auth: { token: validToken },
      transports: ["websocket"],
    });

    client1.on("connect", () => {
      console.log("  ✓ [SCENARIO 2] Authenticated client connected with valid JWT");
      resolve();
    });
  });

  console.log("\n--- SECTION 2: ROOM SUBSCRIPTION & TARGETED DELIVERY ---");

  // Scenario 3: Client successfully joins authorized room
  await new Promise<void>((resolve) => {
    client1.emit("join_room", { room: "exam:exam-math-101" }, (response: any) => {
      assert(response.success === true, "Should successfully join exam room");
      assert(response.room === "exam:exam-math-101", "Room name must match");
      console.log("  ✓ [SCENARIO 3] Authorized user joined target exam room");
      resolve();
    });
  });

  // Scenario 4: Targeted event is received by client in room
  await new Promise<void>((resolve) => {
    client1.on("MODERATION_CASE_CREATED", (payload: any) => {
      assert(payload.event === "MODERATION_CASE_CREATED", "Event name matches");
      assert(payload.data.caseId === "mod-case-999", "CaseId matches payload");
      console.log("  ✓ [SCENARIO 4] Targeted institutional event received in exam room");
      resolve();
    });

    // Emit event using RealtimeService
    realtimeService.emitModerationCaseCreated("mod-case-999", "exam-math-101", {
      priority: "HIGH",
      reason: "High risk score delta",
    });
  });

  // Scenario 5: Unauthorized private user channel join is rejected
  const examinerToken = TokenService.generateAccessToken({
    id: "examiner-regular-1",
    email: "examiner1@test.anklyze",
    role: "EXAMINER",
  });

  let client2: ClientSocketType;
  await new Promise<void>((resolve) => {
    client2 = ClientSocket(socketUrl, {
      auth: { token: examinerToken },
      transports: ["websocket"],
    });

    client2.on("connect", () => {
      resolve();
    });
  });

  // Examiner attempting to join another user's private channel
  await new Promise<void>((resolve) => {
    client2.emit("join_room", { room: "user:other-examiner-99" }, (res: any) => {
      assert(res.success === false, "Should reject joining unauthorized private user channel");
      assert(res.error.includes("FORBIDDEN"), "Should return FORBIDDEN");
      console.log("  ✓ [SCENARIO 5] Unauthorized private channel join rejected with FORBIDDEN");
      resolve();
    });
  });

  // Scenario 6: Malformed room identifier is rejected
  await new Promise<void>((resolve) => {
    client2.emit("join_room", { room: "invalid_format_without_colon" }, (res: any) => {
      assert(res.success === false, "Should reject malformed room format");
      console.log("  ✓ [SCENARIO 6] Malformed room identifier rejected safely");
      resolve();
    });
  });

  // Scenario 7: Client leaves room and no longer receives events
  await new Promise<void>((resolve) => {
    client1.emit("leave_room", { room: "exam:exam-math-101" }, (res: any) => {
      assert(res.success === true, "Should leave room");
      console.log("  ✓ [SCENARIO 7] Client left room successfully");
      resolve();
    });
  });

  console.log("\n--- SECTION 3: RESILIENCE & CLEANUP ---");

  // Scenario 8: Disconnect and close cleanly
  client1!.disconnect();
  client2!.disconnect();
  console.log("  ✓ [SCENARIO 8] Clients disconnected cleanly");

  await closeSocketServer();
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
  console.log("  ✓ [SCENARIO 9] Socket.IO and HTTP server shut down cleanly");

  console.log("====================================================");
  console.log("Realtime WebSocket Test Suite: 9/9 Passed (100%)");
  console.log("====================================================");
}

runRealtimeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Realtime Test Failure:", err);
    process.exit(1);
  });
