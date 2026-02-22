import axios from "axios";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Create a new FluxRoom.
 * @returns {{ roomCode, createdAt, expiresAt }}
 */
export const createRoom = async () => {
  const { data } = await api.post("/rooms");
  return data;
};

/**
 * Validate a room code — resolves if valid, throws if expired/not found.
 * @param {string} code
 * @returns {{ roomCode, createdAt, expiresAt }}
 */
export const validateRoom = async (code) => {
  const { data } = await api.get(`/rooms/${code.toUpperCase()}`);
  return data;
};

/**
 * Fetch message history for a room.
 * @param {string} code
 * @returns {{ messages: Message[] }}
 */
export const fetchMessages = async (code) => {
    const { data } = await api.get(`/rooms/${code.toUpperCase()}/messages`);
    return data;
};

/**
 * Upload a file to the backend (which uploads to Cloudinary).
 * @param {File} file 
 * @returns {{ fileName, fileUrl }}
 */
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/rooms/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // 60 seconds for uploads
    });
    return data;
};

export default api;
