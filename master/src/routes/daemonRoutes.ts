import { Router } from "express";
import { joinRoom, getUserRooms, handleCommit } from "../controllers/daemonController.ts";

const router = Router();

router.post("/joinRoom", joinRoom);
router.post("/roomsJoined", getUserRooms);
router.post("/commit", handleCommit );

export default router;
