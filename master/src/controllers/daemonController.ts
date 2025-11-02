import { Router, type Request, type Response } from "express";
import { Room } from "../model/Room.ts";
import { User } from "../model/User.ts";
import { DiffBlobModel } from "../model/DiffBlobs.ts";
import type { CommitPayload } from "../types/commit.ts";

export const roomRouter = Router();

export async function joinRoom(req: Request, res: Response) {
  try {
    const { roomId, gmail } = req.body;

    if (!roomId || !gmail) {
      return res.status(400).json({success:true, error: "roomId and gmail are required" });
    }

    const member = await User.findOne({ email: gmail });
    if (!member) {
      return res.status(404).json({success:true, error: "Member not found for this Gmail" });
    }

    const googleId = member.googleId;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({success:true, error: "Room not found" });
    }

    if (!room.members.includes(googleId)) {
      room.members.push(googleId);
      await room.save();
      console.log(`✅ Added ${googleId} to room ${roomId}`);
    } else {
      console.log(`⚠️ Member already in room ${roomId}`);
    }

    return res.json({
      success:true,
      message: "Member added successfully",
      room,
    });
  } catch (error) {
    console.error("❌ Error adding member to room:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserRooms(req: Request, res: Response) {
  try {
    const { googleId } = req.body;
    if (!googleId) {
      return res.status(400).json({ error: "googleId is required" });
    }

    const rooms = await Room.find({ members: googleId });

    if (rooms.length === 0) {
      return res
        .status(404)
        .json({ message: "No rooms found for this member" });
    }

    console.log(`✅ Found ${rooms.length} rooms for Google ID: ${googleId}`);

    return res.json({success: true, rooms});
  } catch (error) {
    console.error("❌ Error fetching user rooms:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export const addDiffBlobs = async (req: Request, res: Response) => {
  try {
    const {
      roomId,
      memberId,
      projectName,
      oldHash,
      newHash,
      summary,
      changes,
    } = req.body;

    // 🧩 Validation
    if (!roomId || !memberId || !projectName) {
      return res.status(400).json({
        error: "roomId, memberId, and projectName are required fields.",
      });
    }

    // 🧠 Create and Save DiffBlob
    const diffBlob = new DiffBlobModel({
      roomId,
      memberId,
      projectName,
      oldHash,
      newHash,
      summary,
      changes,
      timestamp: new Date(),
    });

    await diffBlob.save();

    console.log(`✅ DiffBlob added for member ${memberId} in room ${roomId}`);

    return res.status(201).json({
      message: "DiffBlob added successfully",
      diffBlob,
    });
  } catch (error) {
    console.error("❌ Error adding DiffBlob:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const fetchDiffBlobMember = async (req: Request, res: Response) => {
  try {
    const { roomId, googleId } = req.body;

    if (!roomId || !googleId) {
      return res.status(400).json({ error: "Missing roomId or googleId" });
    }

    // Fetch all documents for the member, sorted by latest timestamp
    const data = await DiffBlobModel.find({
      roomId,
      memberId: String(googleId),
    }).sort({ timestamp: -1 });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: "No data found" });
    }

    // Extract all timestamps separately (for timeline or history view)
    const allTimestamps = data.map((entry) => ({
      projectName: entry.projectName,
      timestamp: entry.timestamp,
      newHash: entry.newHash,
      oldHash: entry.oldHash,
    }));

    // Respond with both the data and timestamps
    res.status(200).json({
      message: "Fetched member activity successfully",
      allTimestamps,
      diffData: data,
    });
  } catch (error) {
    console.error("❌ Error fetching diff blobs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const handleCommit = async (req: Request, res: Response) => {
  try {
    const payload: CommitPayload = req.body;

    console.log("📦 Received Commit:");
    console.log("EmailID:", payload.emailId);
    console.log("RoomID:", payload.roomId);
    console.log("Timestamp:", payload.timestamp);
    // console.log("FileDiff:", fileDiff);
    // console.log("CmdDiff:", cmdDiff);


    //


    return res.status(200).json({
      success: true,
      message: "Commit received successfully",
    });
  } catch (error) {
    console.error("❌ Error handling commit:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
