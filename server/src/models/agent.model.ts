import mongoose from "mongoose";
import bcrypt from "bcrypt";

const AgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "agent"], default: "agent" },
  },
  { timestamps: true }
);

export type AgentType = mongoose.InferSchemaType<typeof AgentSchema>;
export interface AgentDocument extends mongoose.HydratedDocument<AgentType> {
  comparePassword(canditate: string): Promise<boolean>;
}
export type AgentModel = mongoose.Model<AgentDocument>;

AgentSchema.methods.comparePassword = async function (
  canditate: string
): Promise<boolean> {
  return bcrypt.compare(canditate, this.password);
};

// hash password if modified, before saving
AgentSchema.pre<AgentDocument>("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = 10;
  try {
    const hashedPass = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPass;
  } catch (error) {
    next(error as any);
  }
});

const Agent = mongoose.model<AgentDocument, AgentModel>("Agent", AgentSchema);
export default Agent;
