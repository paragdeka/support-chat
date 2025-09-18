import { Server as IOServer, Socket } from "socket.io";
import type { Server } from "node:http";
import dotenv from "dotenv";
import {
  agentJoinHandler,
  agentJoinTicketRoomHandler,
  agentMessageHandler,
  customerJoinHandler,
  customerMessageHandler,
  ticketAssignHandler,
  ticketCloseHandler,
  typingHandler,
} from "./controllers/socket.controller";

type UserType = "customer" | "agent";

interface ChatMessagePayload {
  ticketId: string;
  from: "customer" | "agent";
  fromId: string;
  fromName: string;
  text: string;
  id: string;
  createdAt: Date;
}

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
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
  typing: (p: TypingPayload) => void;
  agent_join_ticket_room: (
    p: TicketAssignPayload,
    cb?: (ack: { ok: boolean; error?: string }) => void
  ) => void;
}

interface ServerToClientEvents {
  typing: (p: TypingPayload) => void;
  system_message: (p: SystemMessagePayload) => void;
  unassigned_ticket: (p: UnassignedTicketPayload) => void;
  chat_message: (p: ChatMessagePayload) => void;
}

interface InterServerEvents {}
interface SocketData {
  userType?: UserType;
  agentId?: string;
  sessionId?: string;
  customerName?: string;
  agentName?: string;
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

export const customerSocketsMap = new Map<string, SocketType>();
export const agentSocketsMap = new Map<string, SocketType>();
export const socketToTicketMap = new Map<string, string>();

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
    ticketAssignHandler(io, socket);
    agentMessageHandler(io, socket);
    agentJoinTicketRoomHandler(io, socket);
    ticketCloseHandler(io, socket);
    typingHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected ${socket.id}`);
      if (socket.data.userType === "customer" && socket.data.sessionId) {
        customerSocketsMap.delete(socket.data.sessionId);
      }

      if (socket.data.userType === "agent" && socket.data.agentId) {
        agentSocketsMap.delete(socket.data.agentId);
      }
    });
  });
}
