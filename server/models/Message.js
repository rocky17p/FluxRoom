const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    index: true,
  },
  // "text" covers plain text AND code snippets
  // "file" covers uploaded file links
  type: {
    type: String,
    enum: ["text", "file"],
    required: true,
    default: "text",
  },
  content: {
    type: String,
    required: true,
    maxlength: 20000,
  },
  fileUrl: {
    type: String,
    default: null,
  },
  fileName: {
    type: String,
    default: null,
  },
  sender: {
    type: String,
    default: "Anonymous",
    maxlength: 32,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: auto-delete messages 24 hours after createdAt
MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("Message", MessageSchema);
