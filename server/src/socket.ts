import { Server as IOServer, Socket } from "socket.io";
import type { Server } from "node:http";
import dotenv from "dotenv";

interface ClientToServerEvents {}

interface ServerToClientEvents {}

interface InterServerEvents {}
interface SocketData {}

dotenv.config();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:4200";

export function createSocketServer(httpServer: Server) {
  const io = new IOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: CLIENT_URL,
      credentials: true,
    },
  });

  io.on(
    "connection",
    (
      socket: Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
      >
    ) => {
      console.log("Socket connected: ", socket.id);

      socket.on("disconnect", () => {
        console.log(`Socket disconnected ${socket.id}`);
      });
    }
  );
}
