import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { setupWebSocket } from "./websocket/index.js"; // use .js after TS build

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// normal routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from TypeScript server" });
});

app.post("/echo", (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.use("/auth", authRoutes);

const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
