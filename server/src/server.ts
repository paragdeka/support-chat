import dotenv from "dotenv";
import { createExpressApp } from "./app";
import { createServer } from "node:http";
import { createSocketServer } from "./socket";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

createExpressApp().then((app) => {
  const httpServer = createServer(app);

  createSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
});
