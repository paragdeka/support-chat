import dotenv from "dotenv";
import { createExpressApp } from "./app";
import { createServer } from "node:http";

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

createExpressApp().then((app) => {
  const httpServer = createServer(app);

  httpServer.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
});
