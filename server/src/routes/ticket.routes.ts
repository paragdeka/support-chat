import { Router } from "express";
import { listTicketsWithFirstMessage } from "../controllers/ticket.controller";
import { requireAgentAuth } from "../middlewares/agent-auth.middleware";

const router = Router();

router.get("/", requireAgentAuth, listTicketsWithFirstMessage);

export default router;
