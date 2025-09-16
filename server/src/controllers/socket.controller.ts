import { AGENTS_ROOM, customerRoom, IOServerType, SocketType } from "../socket";
import mongoose from "mongoose";
import Message, { MessageType } from "../models/message.model";
import { isIssue } from "./message.controller";
import Ticket, { TicketType } from "../models/ticket.model";

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

      // differentiate between chat and issue
      if (!isIssue(text)) {
        await dbSession.commitTransaction();
        dbSession.endSession();

        io.to(customerRoom(sessionId)).emit("system_message", {
          text: SYSTEM_MESSAGES.init,
        });
        return;
      }

      const existingTicket = await Ticket.findOne({ sessionId }).session(
        dbSession
      );
      if (existingTicket) {
        // add the message to ticket
        // send response: ticket already exists
        existingTicket.messages.push(messageId);
        await existingTicket.save({ session: dbSession });

        message.ticketId = existingTicket._id;
        await message.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        const existingTicketId = existingTicket._id.toString();
        io.to(customerRoom(sessionId)).emit("system_message", {
          text: SYSTEM_MESSAGES.ticketExists(existingTicketId),
        });
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
  socket.on("customer_join", (payload, cb) => {
    const { sessionId, customerName } = payload;
    if (!sessionId || !customerName) {
      return cb?.({ ok: false });
    }

    socket.data.userType = "customer";
    socket.data.customerName = customerName;
    socket.data.sessionId = sessionId;

    // customer joins their private room
    // because sessionId is used as identifier, not socket.id. this survives tab refresh
    socket.join(customerRoom(sessionId));

    console.log(
      `${customerName} (${sessionId}) joined ${customerRoom(sessionId)}`
    );
  });
}

export function agentJoinHandler(_io: IOServerType, socket: SocketType) {
  socket.on("agent_join", (payload, cb) => {
    const { agentId } = payload;
    if (!agentId) {
      return cb?.({ ok: false });
    }

    socket.data.userType = "agent";
    socket.data.agentId = agentId;

    socket.join(AGENTS_ROOM);

    console.log(`Agent ${agentId} joined`);
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
};

function randomPriority(): "high" | "medium" | "low" {
  const p: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const randomIndex = Math.floor(Math.random() * p.length);
  return p[randomIndex];
}
