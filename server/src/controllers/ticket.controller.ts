import { Request, Response, NextFunction } from "express";
import Ticket from "../models/ticket.model";
import mongoose from "mongoose";

export const listTickets = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

export const listTicketsWithFirstMessage = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tickets = await Ticket.find({}, { messages: { $slice: 1 } }).populate(
      "messages"
    );
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

interface TicketQuery {
  status?: "open" | "in-progress" | "closed";
  order?: "asc" | "desc";
  agent?: string;
}

export const getTickets = async (
  req: Request<{}, {}, {}, TicketQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const agentId = req.session.agentId;
    if (!agentId)
      return res.status(401).json({ message: "Not authenticated." });
    if (!mongoose.Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: "Invalid session agent id." });
    }

    const { status, order, agent } = req.query;

    console.log({ status, order, agent });

    const filter: any = {};
    if (status) filter.status = status;
    if (agent) filter.agentId = agentId;
    const sortOrder = order === "desc" ? -1 : 1;
    console.log("filter: ", filter, sortOrder);

    const tickets = await Ticket.find(filter, { messages: { $slice: 1 } })
      .sort({ createdAt: sortOrder })
      .populate("messages");
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

export const getTicket = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id." });
    }

    const ticket = await Ticket.findOne({ _id: id }).populate("messages");
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};

export const getTicketMessageHistory = async (
  req: Request<{ sessionId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const ticket = await Ticket.findOne({ sessionId }).populate({
      path: "messages",
      populate: {
        path: "agentId",
        model: "Agent",
      },
    });
    if (!ticket) return res.status(404).json({ message: "Ticket not found." });
    res.json(ticket);
  } catch (error) {
    next(error);
  }
};
