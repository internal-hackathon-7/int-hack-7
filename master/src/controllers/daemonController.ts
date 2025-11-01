import { Router, type Request, type Response } from "express";
import { Room } from "../model/Room.ts";
import { User } from "../model/User.ts";
import { DiffBlobModel } from "../model/DiffBlobs.ts";

export const roomRouter = Router();

export async function joinRoom(req: Request, res: Response) {
  try {
    const { roomId, gmail } = req.body;

    if (!roomId || !gmail) {
      return res.status(400).json({ error: "roomId and gmail are required" });
    }

    const member = await User.findOne({ email: gmail });
    if (!member) {
      return res.status(404).json({ error: "Member not found for this Gmail" });
    }

    const googleId = member.googleId;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (!room.members.includes(googleId)) {
      room.members.push(googleId);
      await room.save();
      console.log(`✅ Added ${googleId} to room ${roomId}`);
    } else {
      console.log(`⚠️ Member already in room ${roomId}`);
    }

    return res.json({
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

    return res.json({ rooms });
  } catch (error) {
    console.error("❌ Error fetching user rooms:", error);
    return res.status(500).json({ error: "Internal server error" });
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
      console.log("❌ Missing roomId or googleId:", req.body);
      return res.status(400).json({ error: "Missing roomId or googleId" });
    }

    console.log("🔍 Searching DiffBlob for:", { roomId, googleId });

    const data = await DiffBlobModel.find({ roomId, memberId : googleId }).sort({
      timestamp: -1,
    });

    console.log("✅ Found", data.length, "records");
    return res.json(data);
  } catch (err) {
    console.error("❌ Error fetching diff blobs:", err);
    return res.status(500).json({ error: "Failed to fetch diff data" });
  }
};
