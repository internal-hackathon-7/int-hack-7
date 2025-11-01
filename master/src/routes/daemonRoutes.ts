import { Router } from "express";
import { joinRoom, getUserRooms } from "../controllers/daemonController.ts";

const router = Router();

router.post("/joinRoom", joinRoom);
router.post("/roomsJoined", getUserRooms);

export default router;
