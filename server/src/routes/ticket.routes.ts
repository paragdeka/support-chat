import { Router } from "express";
import { listTickets } from "../controllers/ticket.controller";
import { requireAgentAuth } from "../middlewares/agent-auth.middleware";

const router = Router();

router.get("/", requireAgentAuth, listTickets);

export default router;
