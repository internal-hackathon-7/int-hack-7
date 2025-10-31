import { Router } from "express";
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getUserInfo,
} from "../controllers/auth.js";

const router = Router();

router.get("/google", getGoogleAuthUrl);
router.get("/google/callback", handleGoogleCallback);
router.get("/me", getUserInfo);
// router.post("/logout" , )

export default router;
