const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype.startsWith("image/");
        // Sanitize filename to remove spaces/weird chars but keep extension
        const sanitizedName = file.originalname.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
        
        return {
            folder: "fluxroom_uploads",
            resource_type: isImage ? "image" : "raw",
            // Include extension in public_id for 'raw' files so URL ends in .ext
            public_id: `${Date.now()}-${sanitizedName}`,
        };
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

module.exports = { cloudinary, upload };
