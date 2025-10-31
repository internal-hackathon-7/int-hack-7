import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: "development" | "production" | "test";
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  apiBaseUrl: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173",
  apiBaseUrl: process.env.API_BASE_URL || "http://localhost:3000",
};

if (!config.googleClientId || !config.googleRedirectUri) {
  console.warn("⚠️  Missing Google OAuth environment variables in .env file!");
}
