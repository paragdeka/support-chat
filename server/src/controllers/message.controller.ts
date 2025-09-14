import { NextFunction, Response, Request } from "express";
import Ticket, { TicketType } from "../models/ticket.model";
import Message, { MessageType } from "../models/message.model";
import mongoose from "mongoose";

type MessageBody = {
  text: string;
};

// TODO: convert it into ws handler
export const createCustomerMessage = async (
  req: Request<{}, {}, MessageBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Missing required field" });
    }

    const sessionId = req.headers["x-chatsessionid"] as string | undefined;
    const customerName = req.headers["x-customername"] as string | undefined;
    if (!sessionId || !customerName) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    // mongo session for db transaction
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

      // differentiate bw chat and issue
      if (!isIssue(text)) {
        await dbSession.commitTransaction();
        dbSession.endSession();

        return res
          .status(201)
          .json({ message: "How can we help?", data: { message } });
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

        return res.status(201).json({
          message: `A ticket with id #${existingTicket._id} already exists.`,
          data: { message, existingTicket },
        });
      }

      // else create a new ticket and link the ticket to the message
      const ticketData: Partial<TicketType> = {
        priority: "low", // TODO
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

      return res.status(201).json({
        message: `Ticket with id #${newTicket._id} created`,
        data: { message, ticket: newTicket },
      });
    } catch (error) {
      // rollback
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const getMessageHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.headers["x-chatsessionid"] as string | undefined;
    if (!sessionId) {
      return res.status(401).send({ message: "Unauthorized." });
    }

    const messages = await Message.find({ sessionId });

    return res.status(200).json({ data: messages });
  } catch (error) {
    next(error);
  }
};

// if message is more than 4 words, qualify it as an issue. issue = ticket creation
const isIssue = (text: string): boolean => {
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  return words.length > 4;
};
