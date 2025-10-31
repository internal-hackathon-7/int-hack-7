import { type Request, type Response } from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";
import { jwtDecode } from "jwt-decode";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretdevkey";

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

export async function handleGoogleCallback(req: Request, res: Response) {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
    const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
    const FRONTEND_REDIRECT_URI =
      process.env.FRONTEND_REDIRECT_URI || "http://localhost:5173/home";
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
    const code = req.query.code as string | undefined;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code." });
    }

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
    const idToken = tokenData.id_token;
    if (!idToken) throw new Error("No ID token returned from Google.");

    const userInfo = jwtDecode<GoogleIDToken>(idToken);

    const sessionToken = jwt.sign(
      {
        sub: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600 * 1000,
    });

    res.redirect(FRONTEND_REDIRECT_URI);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).json({ error: "OAuth callback failed." });
  }
}

export function getUserInfo(req: Request, res: Response) {
  try {
    const token = req.cookies.session_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch {
    res.status(401).json({ error: "Invalid session" });
  }
}