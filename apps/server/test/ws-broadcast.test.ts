import { describe, it, expect, vi, beforeEach } from "vitest";
import { addClient, removeClient, broadcastQuizUpdate, clients } from "../src/lib/ws-broadcast.js";

// Mock WebSocket class
class MockWebSocket {
  static OPEN = 1;
  readyState: number = 1;
  sent: string[] = [];
  send(msg: string) {
    this.sent.push(msg);
  }
}

describe("ws-broadcast", () => {
  beforeEach(() => {
    clients.length = 0;
  });

  it("addClient adds client to list", () => {
    const ws = new MockWebSocket() as any;
    addClient(ws, "quiz1");
    expect(clients.length).toBe(1);
    expect(clients[0].quizId).toBe("quiz1");
  });

  it("removeClient removes client from list", () => {
    const ws = new MockWebSocket() as any;
    addClient(ws, "quiz1");
    expect(clients.length).toBe(1);
    removeClient(ws);
    expect(clients.length).toBe(0);
  });

  it("broadcastQuizUpdate sends message to matching clients", () => {
    const ws1 = new MockWebSocket() as any;
    const ws2 = new MockWebSocket() as any;
    addClient(ws1, "quiz1");
    addClient(ws2, "quiz2");

    broadcastQuizUpdate("quiz1", { type: "test" });

    expect(ws1.sent.length).toBe(1);
    expect(JSON.parse(ws1.sent[0]).type).toBe("update");
    expect(JSON.parse(ws1.sent[0]).quizId).toBe("quiz1");
    expect(ws2.sent.length).toBe(0);
  });

  it("broadcastQuizUpdate skips closed clients", () => {
    const ws = new MockWebSocket() as any;
    ws.readyState = 3; // CLOSED
    addClient(ws, "quiz1");

    broadcastQuizUpdate("quiz1", { type: "test" });

    expect(ws.sent.length).toBe(0);
  });

  it("broadcastQuizUpdate with no clients does nothing", () => {
    expect(() => broadcastQuizUpdate("quiz1", { type: "test" })).not.toThrow();
  });

  it("removeClient with unknown client does nothing", () => {
    const ws = new MockWebSocket() as any;
    expect(() => removeClient(ws)).not.toThrow();
    expect(clients.length).toBe(0);
  });
});
