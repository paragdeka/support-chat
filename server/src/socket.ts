import { Server as IOServer, Socket } from "socket.io";
import type { Server } from "node:http";
import dotenv from "dotenv";
import {
  agentJoinHandler,
  customerJoinHandler,
  customerMessageHandler,
} from "./controllers/socket.controller";

type UserType = "customer" | "agent";

interface CustomerJoinPayload {
  sessionId: string;
  customerName: string;
}

interface CustomerMessagePayload extends CustomerJoinPayload {
  text: string;
}

interface AgentJoinPayload {
  agentId: string;
}

interface AgentMessagePayload {
  agentId: string;
  ticketId: string;
  text: string;
}

interface TicketAssignPayload {
  agentId: string;
  ticketId: string;
}

interface TypingPayload {
  ticketId: string;
  sessionId?: string;
  agentId?: string;
  isTyping: boolean;
}

interface SystemMessagePayload {
  text: string;
}

interface UnassignedTicketPayload {
  id: string;
  subject: string;
  customerName: string;
  priority: "high" | "low" | "medium";
  createdAt: Date;
  status: "open";
}

interface ClientToServerEvents {
  customer_join: (
    p: CustomerJoinPayload,
    cb?: (ack: { ok: boolean }) => void
  ) => void;
  customer_message: (
    p: CustomerMessagePayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
  agent_join: (
    p: AgentJoinPayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
  agent_message: (
    p: AgentMessagePayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
  ticket_assign: (
    p: TicketAssignPayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void; // agent self assigns
  ticket_close: (
    p: TicketAssignPayload,
    cb?: (ack: { ok: boolean }) => void
  ) => void;
  typing: (p: TypingPayload) => void;
}

interface ServerToClientEvents {
  typing: (p: TypingPayload) => void;
  system_message: (p: SystemMessagePayload) => void;
  unassigned_ticket: (p: UnassignedTicketPayload) => void;
}

interface InterServerEvents {}
interface SocketData {
  userType?: UserType;
  agentId?: string;
  sessionId?: string;
  customerName?: string;
}

export type IOServerType = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
export type SocketType = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// rooms
export const AGENTS_ROOM = "room:agents";
export const customerRoom = (sessionId: string) => `customer:${sessionId}`;
export const ticketRoom = (ticketId: string) => `ticket:${ticketId}`;

dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4200";

export function createSocketServer(httpServer: Server) {
  const io = new IOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket: SocketType) => {
    console.log("Socket connected: ", socket.id);

    customerJoinHandler(io, socket);
    customerMessageHandler(io, socket);
    agentJoinHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected ${socket.id}`);
    });
  });
}
