import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import MongoStore = require("connect-mongo");
import type { MongoClient } from "mongodb";
import agentRoutes from "./routes/agent.routes";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4200";
const SESSION_SECRET = process.env.SESSION_SECRET || "abra-ka-dabra";

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

  // session config
  app.use(
    session({
      name: "agent.sid",
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
      store: MongoStore.create({
        client: mongoose.connection.getClient() as unknown as MongoClient, // reuse mongoose connection
        collectionName: "agentsessions",
        dbName: mongoose.connection.db?.databaseName,
        ttl: 60 * 60 * 24 * 7, // 7 days
      }),
    })
  );

  // routes
  app.use("/api/agent", agentRoutes);

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
