const cloudinary = require("../config/cloudinary");

/**
 * POST /api/rooms/upload-signature
 * Generates a presigned signature for direct client-to-Cloudinary uploads.
 * Offloads file streaming from the application server, avoiding RAM bottlenecks.
 */
const getUploadSignature = async (req, res) => {
    try {
        const { fileName } = req.body || {};

        if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
            console.error("❌ Cloudinary credentials are missing in server environment.");
            return res.status(500).json({ error: "Cloudinary is not configured." });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = "fluxroom_uploads";

        const paramsToSign = {
            folder,
            timestamp,
        };

        let publicId = null;
        if (fileName && typeof fileName === "string") {
            const sanitizedName = fileName.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
            publicId = `${Date.now()}-${sanitizedName}`;
            paramsToSign.public_id = publicId;
        }

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
        );

        return res.status(200).json({
            signature,
            timestamp,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            folder,
            publicId,
        });
    } catch (err) {
        console.error("❌ Error generating upload signature:", err);
        return res.status(500).json({ error: "Failed to generate upload signature." });
    }
};

module.exports = {
    getUploadSignature,
};
