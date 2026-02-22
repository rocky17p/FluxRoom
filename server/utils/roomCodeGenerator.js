const crypto = require("crypto");

/**
 * Generates a cryptographically random 6-character alphanumeric room code.
 * Uses uppercase letters + digits (excluding ambiguous chars: 0, O, I, 1).
 */
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const generateRoomCode = () => {
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
};

module.exports = { generateRoomCode };
