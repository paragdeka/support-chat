import { Router } from "express";
import { listTickets } from "../controllers/ticket.controller";

const router = Router();

router.get("/", listTickets);

export default router;
