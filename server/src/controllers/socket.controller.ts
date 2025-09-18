import {
  AGENTS_ROOM,
  agentSocketsMap,
  customerRoom,
  customerSocketsMap,
  IOServerType,
  SocketType,
  ticketRoom,
} from "../socket";
import mongoose from "mongoose";
import Message, { MessageType } from "../models/message.model";
import { isIssue } from "./message.controller";
import Ticket, { TicketType } from "../models/ticket.model";
import Agent, { AgentType } from "../models/agent.model";

export function customerMessageHandler(io: IOServerType, socket: SocketType) {
  socket.on("customer_message", async (payload, cb) => {
    const { customerName, sessionId, text } = payload;
    console.log("Received message:", payload);
    if (!customerName || !sessionId || !text) {
      return cb?.({ ok: false, error: "Required fields missing." });
    }

    // start mongo session for db transaction
    const dbSession = await mongoose.startSession();

    try {
      dbSession.startTransaction();

      const messageData: Partial<MessageType> = {
        sessionId,
        text,
        sender: "customer",
        customerName,
      };

      const [message] = await Message.create([messageData], {
        session: dbSession,
      });
      const messageId = message._id;

      const existingTicket = await Ticket.findOne({ sessionId }).session(
        dbSession
      );

      // differentiate between chat and issue
      if (!isIssue(text) && !existingTicket) {
        await dbSession.commitTransaction();
        dbSession.endSession();

        io.to(customerRoom(sessionId)).emit("system_message", {
          text: SYSTEM_MESSAGES.init,
        });
        return;
      }

      if (existingTicket) {
        const existingTicketId = existingTicket._id.toString();

        if (existingTicket.status === "in-progress") {
          message.ticketId = existingTicket._id;
          await message.save({ session: dbSession });

          existingTicket.messages.push(messageId);
          await existingTicket.save({ session: dbSession });

          io.to(ticketRoom(existingTicketId)).emit("chat_message", {
            from: "customer",
            fromName: customerName,
            fromId: sessionId,
            text,
            id: messageId.toString(),
            createdAt: message.createdAt,
            ticketId: existingTicketId,
          });

          await dbSession.commitTransaction();
          dbSession.endSession();

          return;
        }
        // add the message to ticket
        // send response: ticket already exists
        existingTicket.messages.push(messageId);
        await existingTicket.save({ session: dbSession });

        message.ticketId = existingTicket._id;
        await message.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        if (existingTicket.status !== "closed") {
          io.to(customerRoom(sessionId)).emit("system_message", {
            text: SYSTEM_MESSAGES.ticketExists(existingTicketId),
          });
        }
        return;
      }

      // else create a new ticket and link the ticket to the message
      const ticketData: Partial<TicketType> = {
        priority: randomPriority(), // TODO: use sentiment analysis
        status: "open",
        sessionId,
        messages: [messageId],
      };

      const [newTicket] = await Ticket.create([ticketData], {
        session: dbSession,
      });

      message.ticketId = newTicket._id;
      await message.save({ session: dbSession });

      await dbSession.commitTransaction();
      dbSession.endSession();

      const newTicketId = newTicket._id.toString();
      io.to(AGENTS_ROOM).emit("unassigned_ticket", {
        id: newTicketId,
        createdAt: newTicket.createdAt,
        priority: newTicket.priority,
        subject: text,
        customerName,
        status: "open",
      });
      io.to(customerRoom(sessionId)).emit("system_message", {
        text: SYSTEM_MESSAGES.ticketCreated(newTicketId),
      });
    } catch (error) {
      // rollback
      await dbSession.abortTransaction();
      dbSession.endSession();

      io.to(customerRoom(sessionId)).emit("system_message", {
        text: SYSTEM_MESSAGES.internalServerError,
      });

      return cb?.({ ok: false, error: "Internal Server Error" });
    }
  });
}

export function customerJoinHandler(_io: IOServerType, socket: SocketType) {
  socket.on("customer_join", async (payload, cb) => {
    const { sessionId, customerName } = payload;
    if (!sessionId || !customerName) {
      return cb?.({ ok: false });
    }

    socket.data.userType = "customer";
    socket.data.customerName = customerName;
    socket.data.sessionId = sessionId;

    customerSocketsMap.set(sessionId, socket);

    // customer joins their private room
    // because sessionId is used as identifier, not socket.id. this survives tab refresh
    socket.join(customerRoom(sessionId));

    const ticket = await Ticket.findOne({ sessionId });
    console.log("Customer join handler: ", ticket);
    if (ticket && ticket.status == "in-progress") {
      console.log("Customer re-joins ticket room");
      socket.join(ticketRoom(ticket._id.toString()));
    }

    console.log(
      `${customerName} (${sessionId}) joined ${customerRoom(sessionId)}`
    );
  });
}

export function agentJoinHandler(_io: IOServerType, socket: SocketType) {
  socket.on("agent_join", async (payload, cb) => {
    const { agentId } = payload;
    if (!agentId) {
      return cb?.({ ok: false });
    }

    const agent = await Agent.findOne({ _id: agentId });
    if (!agent) {
      return cb?.({ ok: false });
    }

    socket.data.userType = "agent";
    socket.data.agentId = agentId;
    socket.data.agentName = agent.name;

    agentSocketsMap.set(agentId, socket);

    socket.join(AGENTS_ROOM);

    console.log(`Agent ${agentId} joined`);
  });
}

export function ticketAssignHandler(io: IOServerType, socket: SocketType) {
  socket.on("ticket_assign", async (payload, cb) => {
    const { agentId, ticketId } = payload;
    if (!agentId || !ticketId) {
      return cb?.({ ok: false, error: "Required fields missing." });
    }
    console.log(`Self assign request by ${agentId} for ${ticketId}`);

    try {
      await Ticket.updateOne(
        { _id: ticketId },
        { agentId, status: "in-progress" }
      );

      // agent joins ticket room
      console.log("Agent joined ticketRoom");
      socket.join(ticketRoom(ticketId));

      const ticket = await Ticket.findById(ticketId).populate<{
        agentId: AgentType;
      }>("agentId");

      if (ticket?.sessionId) {
        const customerSocket = customerSocketsMap.get(ticket.sessionId);
        if (customerSocket) {
          console.log("customer joined ticket room");
          customerSocket.join(ticketRoom(ticketId));
        }

        io.to(customerRoom(ticket.sessionId)).emit("system_message", {
          text: SYSTEM_MESSAGES.ticketAssigned(ticket.agentId?.name || ""),
        });

        cb?.({ ok: true });
      }
    } catch (error) {
      console.error(error);
      return cb?.({ ok: false, error: "Internal Server Error" });
    }
  });
}

export function agentMessageHandler(io: IOServerType, socket: SocketType) {
  socket.on("agent_message", async (payload, cb) => {
    const { agentId, text, ticketId } = payload;
    if (!agentId || !text || !ticketId) {
      return cb?.({ ok: false, error: "Required fields missing." });
    }

    const dbSession = await mongoose.startSession();
    try {
      dbSession.startTransaction();
      const messageData: Partial<MessageType> = {
        agentId: new mongoose.Types.ObjectId(agentId),
        text,
        sender: "agent",
        ticketId: new mongoose.Types.ObjectId(ticketId),
      };
      const [message] = await Message.create([messageData], {
        session: dbSession,
      });
      const messageId = message._id;

      await Ticket.updateOne(
        { _id: ticketId },
        {
          $push: { messages: messageId },
        },
        { session: dbSession }
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      io.to(ticketRoom(ticketId)).emit("chat_message", {
        from: "agent",
        fromId: agentId,
        fromName: socket.data.agentName!,
        text,
        createdAt: message.createdAt,
        id: messageId.toString(),
        ticketId,
      });
    } catch (error) {
      await dbSession.abortTransaction();
      dbSession.endSession();

      return cb?.({ ok: false, error: "Internal Server Error" });
    }
  });
}

export function agentJoinTicketRoomHandler(
  _io: IOServerType,
  socket: SocketType
) {
  socket.on("agent_join_ticket_room", async (payload, cb) => {
    console.log("rejoin request by agent");
    const { agentId, ticketId } = payload;
    if (!agentId || !ticketId) {
      return cb?.({ ok: false, error: "Required fields missing." });
    }

    const ticket = await Ticket.findOne({ _id: ticketId, agentId });
    if (!ticket) {
      console.log("Failed to re-join");
      return cb?.({
        ok: false,
        error: "Ticket not found or not assigned to this agent.",
      });
    }

    console.log("Agent rejoins ticket room");
    socket.join(ticketRoom(ticketId));
  });
}

export function ticketCloseHandler(io: IOServerType, socket: SocketType) {
  socket.on("ticket_close", async (payload, cb) => {
    const { agentId, ticketId } = payload;
    if (!agentId || !ticketId) {
      return cb?.({ ok: false, error: "Required fields missing." });
    }
    console.log(`Ticket close request by ${agentId} for ${ticketId}`);

    try {
      await Ticket.updateOne({ _id: ticketId, agentId }, { status: "closed" });

      io.to(ticketRoom(ticketId)).emit("system_message", {
        text: SYSTEM_MESSAGES.ticketClosed(ticketId),
      });

      cb?.({ ok: true });

      // agent leaves ticket room
      socket.leave(ticketRoom(ticketId));
    } catch (error) {
      return cb?.({ ok: false, error: "Internal Server Error" });
    }
  });
}

const SYSTEM_MESSAGES = {
  init: "Hello! Our team is ready to help you. Please tell us about your issue.",
  waitingTicketAssignment:
    "Hang tight! We're finding the best person to help you.",
  offline:
    "We're closed for the day, but we'd love to help. Please leave a message, and we'll respond when we open again.",
  tryAgain: "Oops! Something went wrong. Let's try that again.",
  ticketExists: (ticketId: string) =>
    `A ticket with id #${ticketId} already exists.`,
  ticketCreated: (ticketId: string) =>
    `Your ticket (#${ticketId}) has been created! An agent will be assigned to your case shortly.`,
  internalServerError:
    "There was an internal server error. Our team has been notified and is working to fix the issue. Please try again in a few minutes. We apologize for the inconvenience.",
  ticketAssigned: (agentName: string) =>
    `Your ticket has been assigned to support agent ${agentName.toUpperCase()}. Agent will review your request and be in touch with you shortly.`,
  ticketClosed: (ticketId: string) =>
    `Your ticket (${ticketId}) has been closed. If you have any further issues, please create a new ticket.`,
};

function randomPriority(): "high" | "medium" | "low" {
  const p: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const randomIndex = Math.floor(Math.random() * p.length);
  return p[randomIndex];
}
