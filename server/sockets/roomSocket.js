const Message = require("../models/Message");
const Room = require("../models/Room");

// In-memory map of roomCode -> Set of socket IDs (for user count tracking)
const roomUsers = new Map();

const SOCKET_RATE_LIMIT_MS = 500; // minimum ms between messages per user
const userLastMessage = new Map(); // socketId -> timestamp

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    /**
     * join_room
     * Client emits: { roomCode: string }
     * Server validates room, adds user, broadcasts user_count.
     */
    socket.on("join_room", async ({ roomCode } = {}) => {
      if (!roomCode || typeof roomCode !== "string") {
        return socket.emit("error", { message: "Invalid room code." });
      }

      const code = roomCode.toUpperCase().trim();

      try {
        const room = await Room.findOne({ roomCode: code });
        if (!room) {
          return socket.emit("error", {
            message: "Room not found or has expired.",
          });
        }

        // Leave any previous rooms (re-join guard)
        const previousRooms = Array.from(socket.rooms).filter(
          (r) => r !== socket.id
        );
        previousRooms.forEach((r) => {
          socket.leave(r);
          _removeUser(r, socket.id);
          _broadcastUserCount(io, r);
        });

        socket.join(code);
        _addUser(code, socket.id);
        _broadcastUserCount(io, code);

        // Store current room on socket for cleanup on disconnect
        socket.currentRoom = code;
        socket.emit("joined", {
          roomCode: code,
          expiresAt: new Date(
            room.createdAt.getTime() + 86400 * 1000
          ).toISOString(),
        });
      } catch (err) {
        console.error("join_room error:", err);
        socket.emit("error", { message: "Server error while joining room." });
      }
    });

    /**
     * send_message
     * Client emits: { roomCode, type, content, fileUrl?, fileName?, sender? }
     * Server validates, rate-limits, persists, and broadcasts receive_message.
     */
    socket.on("send_message", async (payload = {}) => {
      const { roomCode, type, content, fileUrl, fileName, sender } = payload;

      // Basic validation
      if (!roomCode || !type || !content) {
        return socket.emit("error", {
          message: "roomCode, type, and content are required.",
        });
      }

      if (!["text", "file"].includes(type)) {
        return socket.emit("error", {
          message: "Message type must be 'text' or 'file'.",
        });
      }

      if (typeof content !== "string" || content.trim().length === 0) {
        return socket.emit("error", { message: "Content must not be empty." });
      }

      if (content.length > 20000) {
        return socket.emit("error", {
          message: "Content exceeds maximum length (20,000 chars).",
        });
      }

      // Socket-level rate limiting
      const now = Date.now();
      const lastMsg = userLastMessage.get(socket.id) || 0;
      if (now - lastMsg < SOCKET_RATE_LIMIT_MS) {
        return socket.emit("error", {
          message: "You are sending messages too fast. Please slow down.",
        });
      }
      userLastMessage.set(socket.id, now);

      const code = roomCode.toUpperCase().trim();

      try {
        const room = await Room.findOne({ roomCode: code });
        if (!room) {
          return socket.emit("error", {
            message: "Room not found or has expired.",
          });
        }

        const message = await Message.create({
          roomCode: code,
          type,
          content: content.trim(),
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          sender: (sender || "Anonymous").trim().slice(0, 32),
        });

        const msgPayload = {
          _id: message._id,
          roomCode: message.roomCode,
          type: message.type,
          content: message.content,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          sender: message.sender,
          createdAt: message.createdAt,
        };

        // Broadcast to everyone in the room (including sender)
        io.to(code).emit("receive_message", msgPayload);
      } catch (err) {
        console.error("send_message error:", err);
        socket.emit("error", { message: "Failed to send message." });
      }
    });

    /**
     * disconnect
     * Remove user from room tracking and broadcast updated user_count.
     */
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
      if (socket.currentRoom) {
        _removeUser(socket.currentRoom, socket.id);
        _broadcastUserCount(io, socket.currentRoom);
      }
      userLastMessage.delete(socket.id);
    });
  });
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const _addUser = (roomCode, socketId) => {
  if (!roomUsers.has(roomCode)) roomUsers.set(roomCode, new Set());
  roomUsers.get(roomCode).add(socketId);
};

const _removeUser = (roomCode, socketId) => {
  if (roomUsers.has(roomCode)) {
    roomUsers.get(roomCode).delete(socketId);
    if (roomUsers.get(roomCode).size === 0) roomUsers.delete(roomCode);
  }
};

const _broadcastUserCount = (io, roomCode) => {
  const count = roomUsers.has(roomCode) ? roomUsers.get(roomCode).size : 0;
  io.to(roomCode).emit("user_count", { count });
};

module.exports = { registerSocketHandlers };
