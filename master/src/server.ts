import dotenv from "dotenv";
dotenv.config();

import express, { type Request, type Response } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.ts";
import daemonRoutes from "./routes/daemonRoutes.ts";
import { setupWebSocket } from "./websocket/index.ts";
import { connectDB } from "./database/db.ts";
import mongoose from "mongoose";

await connectDB();
console.log("📦 Connected DB name:", mongoose.connection.name);

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

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

app.use("/daemon", daemonRoutes);

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
