import { Router } from "express";
import {
  createCustomerMessage,
  getMessageHistory,
} from "../controllers/message.controller";

const router = Router();

router.post("/", createCustomerMessage);
router.get("/history", getMessageHistory);

export default router;
