import { Router } from "express";
import {
  getTicket,
  getTicketMessageHistory,
  listTicketsWithFirstMessage,
} from "../controllers/ticket.controller";
import { requireAgentAuth } from "../middlewares/agent-auth.middleware";

const router = Router();

router.get("/", requireAgentAuth, listTicketsWithFirstMessage);
router.get("/:id", requireAgentAuth, getTicket);
router.get("/history/:sessionId", getTicketMessageHistory);

export default router;
