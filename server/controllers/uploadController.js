const { upload } = require("../config/cloudinary");

/**
 * POST /api/rooms/upload
 * Handles file upload to Cloudinary and returns the URL.
 */
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            console.error("❌ No file received in request.");
            return res.status(400).json({ error: "No file uploaded." });
        }

        console.log(`📡 Uploading to Cloudinary: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`🔗 Cloudinary URL: ${req.file.path}`);

        return res.status(200).json({
            fileName: req.file.originalname,
            fileUrl: req.file.path, // This is the Cloudinary secure URL
        });
    } catch (err) {
        console.error("❌ Upload controller error:", err);
        return res.status(500).json({ error: "Internal server error during upload." });
    }
};

module.exports = {
    uploadSingle: upload.single("file"),
    uploadFile,
};
