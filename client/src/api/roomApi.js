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
 * Upload a file directly to Cloudinary using a backend-generated signature (presigned pattern).
 * Completely offloads binary streaming from the Node server directly to Cloudinary's CDN edge.
 * @param {File} file 
 * @returns {Promise<{ fileName: string, fileUrl: string }>}
 */
export const uploadFile = async (file) => {
    // 1. Request upload signature & credentials from backend
    const { data: signData } = await api.post("/rooms/upload-signature", {
        fileName: file.name,
    });

    const { signature, timestamp, apiKey, cloudName, folder, publicId } = signData;

    // 2. Determine Cloudinary resource type: image or raw (for docs, pdfs, zips, etc.)
    const isImage = file.type.startsWith("image/");
    const resourceType = isImage ? "image" : "raw";

    // 3. Assemble multipart FormData with signed parameters
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", folder);
    if (publicId) {
        formData.append("public_id", publicId);
    }

    // 4. Direct upload to Cloudinary CDN edge
    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const response = await axios.post(cloudinaryUploadUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000, // 60 seconds for uploads
    });

    return {
        fileName: file.name,
        fileUrl: response.data.secure_url,
    };
};

export default api;
