import { WebSocket } from "ws";

interface QuizClient {
  ws: WebSocket;
  quizId: string;
}

export const clients: QuizClient[] = [];

export function broadcastQuizUpdate(quizId: string, payload: unknown) {
  const message = JSON.stringify({ type: "update", quizId, payload });
  for (const client of clients) {
    if (client.quizId === quizId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function addClient(ws: WebSocket, quizId: string) {
  clients.push({ ws, quizId });
}

export function removeClient(ws: WebSocket) {
  const idx = clients.findIndex((c) => c.ws === ws);
  if (idx !== -1) clients.splice(idx, 1);
}
