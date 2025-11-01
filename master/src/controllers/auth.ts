import { type Request, type Response } from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretdevkey";

interface GoogleIDToken {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: "Bearer";
  id_token?: string;
}

// === STEP 1: Generate Google OAuth URL ===
export async function getGoogleAuthUrl(req: Request, res: Response) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
      return res
        .status(500)
        .json({ error: "Missing Google OAuth environment variables." });
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return res.json({ url });
  } catch (err) {
    console.error("Error generating Google OAuth URL:", err);
    res.status(500).json({ error: "Failed to generate Google OAuth URL." });
  }
}

// === STEP 2: Handle Google OAuth callback ===
export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
    const FRONTEND_REDIRECT_URI =
      process.env.FRONTEND_REDIRECT_URI || "http://localhost:5173/home";

    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code." });
    }

    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenData.id_token) {
      throw new Error(
        `No ID token returned from Google. Response: ${JSON.stringify(tokenData)}`
      );
    }

    // Decode Google ID token
    const userInfo = jwtDecode<GoogleIDToken>(tokenData.id_token);

    // Sign your own JWT for session
    const sessionToken = jwt.sign(
      {
        sub: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // 7-day session
    );

    // Set cookie (IMPORTANT)
    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/", // <--- ensure cookie is sent for all routes
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend
    return res.redirect(FRONTEND_REDIRECT_URI);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).json({ error: "OAuth callback failed." });
  }
}

// === STEP 3: Return currently logged-in user ===
export function getUserInfo(req: Request, res: Response) {
  try {
    const token = req.cookies.session_token;
    if (!token) {
      console.log("No session token found in cookies");
      return res.status(401).json({ error: "Not logged in" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    console.error("Invalid session:", err);
    res.status(401).json({ error: "Invalid session" });
  }
}

// === STEP 4: Logout route (optional) ===
export function logout(req: Request, res: Response) {
  res.clearCookie("session_token", { path: "/" });
  res.json({ success: true });
}
