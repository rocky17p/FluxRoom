import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "../api/roomApi";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUpload({ roomCode, onShare }) {
    const [files, setFiles] = useState([]); // [{ file, id }]
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef(null);

    const addFiles = (incoming) => {
        const valid = Array.from(incoming).filter((f) => {
            if (f.size > MAX_FILE_SIZE_BYTES) {
                toast.error(`${f.name} exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
                return false;
            }
            return true;
        });
        setFiles((prev) => [
            ...prev,
            ...valid.map((f) => ({ file: f, id: `${f.name}-${Date.now()}` })),
        ]);
    };

    const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        addFiles(e.dataTransfer.files);
    };

    const handleUpload = async () => {
        if (!files.length) return;
        setUploading(true);

        const uploadPromises = files.map(async ({ file, id }) => {
            try {
                const { fileName, fileUrl } = await uploadFile(file);
                onShare(fileName, fileUrl);
                toast.success(`${fileName} shared!`);
                removeFile(id);
            } catch (err) {
                console.error("Upload error:", err);
                toast.error(`Failed to upload ${file.name}.`);
            }
        });

        await Promise.all(uploadPromises);
        setUploading(false);
    };

    return (
        <div className="file-section">
            {/* Dropzone */}
            <div
                id="file-dropzone"
                className={`dropzone${dragOver ? " drag-over" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label="File drop zone"
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            >
                <span className="dropzone-icon">📁</span>
                <p className="dropzone-title">Drop files here or click to browse</p>
                <p className="dropzone-hint">Max {MAX_FILE_SIZE_MB} MB per file</p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    id="file-input"
                    onChange={(e) => addFiles(e.target.files)}
                />
            </div>

            {/* File queue */}
            {files.length > 0 && (
                <div className="file-queue">
                    {files.map(({ file, id }) => (
                        <div key={id} className="file-item">
                            <span className="file-item-name" title={file.name}>📄 {file.name}</span>
                            <span className="file-item-size">{formatBytes(file.size)}</span>
                            <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => removeFile(id)}
                                title="Remove file"
                                id={`remove-file-${id}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <div className="file-upload-actions">
                        <button
                            id="upload-files-btn"
                            className="btn btn-primary btn-sm"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading
                                ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Uploading…</>
                                : `⬆ Share ${files.length} file${files.length !== 1 ? "s" : ""}`}
                        </button>
                        <button
                            id="clear-files-btn"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setFiles([])}
                            disabled={uploading}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <p>ℹ️ Files are uploaded to cloud storage. Links are shared in the room and expire with it.</p>
                <p style={{ marginTop: 4 }}>To use real uploads, configure Cloudinary credentials in <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent)" }}>server/.env</code>.</p>
            </div>
        </div>
    );
}
