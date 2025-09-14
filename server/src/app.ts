import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URI || "http://localhost:4200";

if (!MONGO_URI) {
  console.error("No MONGO_URI environment variable has been defined in .env");
  process.exit(1);
}

export const createExpressApp = async () => {
  await mongoose.connect(MONGO_URI, {
    dbName: "supportchat",
  });

  const app = express();
  app.use(morgan("dev")); // logging
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json());

  // error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);

    const status = err.status || 500;
    res
      .status(status)
      .json({ message: err.message || "Internal Server Error" });
  });

  return app;
};
