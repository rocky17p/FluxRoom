const express = require("express");
const router = express.Router();
const {
    createRoom,
    validateRoom,
    fetchMessages,
} = require("../controllers/roomController");
const {
    uploadFile,
    uploadSingle,
} = require("../controllers/uploadController");
const {
    apiLimiter,
    createRoomLimiter,
} = require("../middleware/rateLimiter");

// POST /api/rooms — create a new room
router.post("/", createRoomLimiter, createRoom);

// POST /api/rooms/upload — upload a file to Cloudinary
router.post("/upload", apiLimiter, uploadSingle, uploadFile);

// GET /api/rooms/:code — validate a room
router.get("/:code", apiLimiter, validateRoom);

// GET /api/rooms/:code/messages — fetch message history
router.get("/:code/messages", apiLimiter, fetchMessages);

module.exports = router;
