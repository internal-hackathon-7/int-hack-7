import dotenv from "dotenv";
dotenv.config();
import express, { type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser())
app.use(express.json());

console.log("Loaded ENV:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
});


app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello from TypeScript server" });
});

app.post("/echo", (req: Request, res: Response) => {
  res.json({ youSent: req.body });
});

app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
