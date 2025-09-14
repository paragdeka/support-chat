import { Request, Response, NextFunction } from "express";

export const requireAgentAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.session?.agentId;
  const role = req.session?.role;

  if (id && (role === "agent" || role === "admin")) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};
