import { Router } from "express";
import {
  joinRoom,
  getUserRooms, handleCommit,
  addDiffBlobs,
  fetchDiffBlobMember,
} from "../controllers/daemonController.ts";

const router = Router();

router.post("/joinRoom", joinRoom);
router.post("/roomsJoined", getUserRooms);
router.post("/addDiffBlobs", addDiffBlobs);
router.post("/fetchDiffBlobMember", fetchDiffBlobMember);
router.post("/commit", handleCommit );

export default router;
