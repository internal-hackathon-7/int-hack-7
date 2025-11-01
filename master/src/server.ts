import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { setupWebSocket } from "./websocket/index.js";
import { connectDB } from "./database/db.ts";

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Connect MongoDB
connectDB();

// ✅ Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

// ✅ Basic health check routes
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from TypeScript server" });
});

app.get("/ping", (req: Request, res: Response) => {
  res.json({
    message: "Hey from the server",
    check: true,
  });
});

app.post("/echo", (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

// ✅ Auth routes (Google OAuth)
app.use("/auth", authRoutes);

// ✅ Setup Socket.IO
const server = http.createServer(app);
setupWebSocket(server);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(
    `🌍 Frontend allowed: ${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}`
  );
});
