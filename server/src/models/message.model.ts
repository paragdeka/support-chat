import mongoose from "mongoose";

export interface MessageType {
  sessionId: string;
  sender: "customer" | "agent" | "system";
  text: string;
  ticketId?: mongoose.Types.ObjectId | null;
  customerName?: string;
  agentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    sender: {
      type: String,
      enum: ["customer", "agent", "system"],
      required: true,
    },
    text: { type: String, required: true },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null, // if message is of normal conversation
    },
    customerName: {
      type: String,
      required: [
        function (this: MessageType) {
          return this.sender === "customer";
        },
        'Customer name is required when sender is "customer"',
      ],
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: [
        function (this: MessageType) {
          return this.sender === "agent";
        },
        'agentId is required when sender is "agent"',
      ],
    },
  },
  { timestamps: true }
);

MessageSchema.index({ sessionId: 1 });

export type MessageModel = mongoose.Model<MessageType>;

const Message = mongoose.model<MessageType, MessageModel>(
  "Message",
  MessageSchema
);
export default Message;
