import { Request, Response, NextFunction } from "express";
import Ticket from "../models/ticket.model";

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
