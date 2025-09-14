import { NextFunction, Request, Response } from "express";
import Agent, { type AgentType } from "../models/agent.model";
import { Types } from "mongoose";

type SignupBody = Omit<AgentType, "role" | "createdAt" | "updatedAt">;

export const signup = async (
  req: Request<{}, {}, SignupBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ messsage: "Missing required fields" });
    }

    const existing = await Agent.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Email already exists. Login instead" });
    }

    const agent = await Agent.create({ email, name, password });

    req.session.agentId = agent._id.toString();
    req.session.role = agent.role;

    res
      .status(201)
      .json({ id: agent._id, email: agent.email, name: agent.name });
  } catch (error) {
    next(error);
  }
};

interface LoginBody {
  email: string;
  password: string;
}

export const login = async (
  req: Request<{}, {}, LoginBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Provide email and password." });
    }

    const agent = await Agent.findOne({ email }).select("+password");
    if (!agent)
      return res.status(401).json({ message: "Invalid credentials." });

    const passMatched = await agent.comparePassword(password);
    if (!passMatched)
      return res.status(401).json({ message: "Invalid credentials" });

    req.session.agentId = agent._id.toString();
    req.session.role = agent.role;

    res
      .status(200)
      .json({ id: agent._id, email: agent.email, name: agent.name });
  } catch (error) {
    next(error);
  }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy((err) => {
    if (err) return next(err);

    res.clearCookie("agent.sid");
    res.status(200).json({ message: "Logged out." });
  });
};

// get current agent
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agentId = req.session.agentId;
    if (!agentId)
      return res.status(401).json({ message: "Not authenticated." });
    // check if id is a valid mongo id
    if (!Types.ObjectId.isValid(agentId)) {
      return res.status(400).json({ message: "Invalid session agent id." });
    }

    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: "Agent not found." });

    res.json(agent);
  } catch (error) {
    next(error);
  }
};
