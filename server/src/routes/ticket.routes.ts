import { Router } from "express";
import {
  getTicket,
  getTicketMessageHistory,
  getTickets,
} from "../controllers/ticket.controller";
import { requireAgentAuth } from "../middlewares/agent-auth.middleware";

const router = Router();

router.get("/", requireAgentAuth, getTickets);
router.get("/:id", requireAgentAuth, getTicket);
router.get("/history/:sessionId", getTicketMessageHistory);

export default router;
