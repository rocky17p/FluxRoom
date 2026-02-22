const Room = require("../models/Room");
const Message = require("../models/Message");
const { generateRoomCode } = require("../utils/roomCodeGenerator");

const MAX_COLLISION_RETRIES = 5;

/**
 * POST /api/rooms
 * Creates a new room with a collision-safe 6-digit code.
 */
const createRoom = async (req, res) => {
  let code;
  let attempts = 0;

  while (attempts < MAX_COLLISION_RETRIES) {
    code = generateRoomCode();
    const existing = await Room.findOne({ roomCode: code });
    if (!existing) break;
    attempts++;
  }

  if (attempts === MAX_COLLISION_RETRIES) {
    return res.status(503).json({
      error: "Could not generate a unique room code. Please try again.",
    });
  }

  try {
    const room = await Room.create({ roomCode: code });
    return res.status(201).json({
      roomCode: room.roomCode,
      createdAt: room.createdAt,
      expiresAt: new Date(room.createdAt.getTime() + 86400 * 1000),
    });
  } catch (err) {
    // Handle rare race condition where another request created the same code
    if (err.code === 11000) {
      return res.status(503).json({
        error: "Room code collision. Please try again.",
      });
    }
    console.error("createRoom error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/rooms/:code
 * Validates that a room exists (and has not expired via TTL).
 */
const validateRoom = async (req, res) => {
  const { code } = req.params;

  if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
    return res.status(400).json({ error: "Invalid room code format." });
  }

  try {
    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: "Room not found or has expired." });
    }
    return res.status(200).json({
      roomCode: room.roomCode,
      createdAt: room.createdAt,
      expiresAt: new Date(room.createdAt.getTime() + 86400 * 1000),
    });
  } catch (err) {
    console.error("validateRoom error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/rooms/:code/messages
 * Fetches the message history for a room (most recent 200 messages).
 */
const fetchMessages = async (req, res) => {
  const { code } = req.params;

  if (!code || !/^[A-Z0-9]{6}$/.test(code.toUpperCase())) {
    return res.status(400).json({ error: "Invalid room code format." });
  }

  try {
    const room = await Room.findOne({ roomCode: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ error: "Room not found or has expired." });
    }

    const messages = await Message.find({ roomCode: code.toUpperCase() })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();

    return res.status(200).json({ messages });
  } catch (err) {
    console.error("fetchMessages error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = { createRoom, validateRoom, fetchMessages };
