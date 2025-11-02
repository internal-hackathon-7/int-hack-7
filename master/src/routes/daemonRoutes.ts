import { Router } from "express";
import {
  joinRoom,
  getUserRooms, 
  handleCommit,
  fetchDiffBlobMember,
} from "../controllers/daemonController.ts";

const router = Router();

router.post("/joinRoom", joinRoom);
router.post("/roomsJoined", getUserRooms);
router.post("/addDiffBlobs", handleCommit);
router.post("/fetchDiffBlobMember", fetchDiffBlobMember);
router.post("/commit", handleCommit );

export default router;
