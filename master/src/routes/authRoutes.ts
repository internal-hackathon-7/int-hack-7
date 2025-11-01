import { Router } from "express";
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getUserInfo,
  logout,
} from "../controllers/auth.js";

const router = Router();

router.get("/google", getGoogleAuthUrl);
router.get("/google/callback", handleGoogleCallback);
router.get("/me", getUserInfo);
router.post("/logout", logout);

export default router;
