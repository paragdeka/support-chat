import "express-session";

declare module "express-session" {
  interface SessionData {
    agentId?: string;
    role?: string;
  }
}
