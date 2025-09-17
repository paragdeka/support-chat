import mongoose from "mongoose";

export interface TicketType {
  sessionId: string;
  messages: mongoose.Types.ObjectId[];
  status: "open" | "in-progress" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
  agentId?: string;
}

const TicketSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    agentId: {
      type: mongoose.Types.ObjectId,
      ref: "Agent",
      default: null,
    },
  },
  { timestamps: true }
);

TicketSchema.index({ sessionId: 1 });

export type TicketModel = mongoose.Model<TicketType>;

const Ticket = mongoose.model<TicketType, TicketModel>("Ticket", TicketSchema);
export default Ticket;
