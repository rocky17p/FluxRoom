import { useRef, useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "../api/roomApi";

const USERNAME_KEY = "fluxroom_username";
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const getInitial = (name) => (name || "?")[0].toUpperCase();

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
    </svg>
);

const PaperclipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
);

const ChatBubbleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

// ── Main Chat ──────────────────────────────────────────────────────────────────
export default function Chat({ messages, onSend, roomCode }) {
    const [text, setText] = useState("");
    const [sender, setSender] = useState(
        () => localStorage.getItem(USERNAME_KEY) || "Anonymous"
    );
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(sender);
    const [uploading, setUploading] = useState(false);
    const bottomRef = useRef(null);
    const textRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        textRef.current?.focus();
    }, []);

    const saveName = () => {
        const trimmed = nameDraft.trim().slice(0, 32) || "Anonymous";
        setSender(trimmed);
        localStorage.setItem(USERNAME_KEY, trimmed);
        setEditingName(false);
    };

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        onSend(trimmed);
        setText("");
        textRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";

        if (file.size > MAX_FILE_SIZE_BYTES) {
            toast.error(`File exceeds ${MAX_FILE_SIZE_MB} MB limit.`);
            return;
        }

        setUploading(true);
        try {
            const { fileName, fileUrl } = await uploadFile(file);
            // Use the onSend mechanism via a special payload — caller handles file type
            onSend(`__file__:${fileName}:${fileUrl}`);
            toast.success(`${fileName} shared!`);
        } catch (err) {
            console.error("Upload error:", err);
            toast.error("Failed to upload file.");
        } finally {
            setUploading(false);
        }
    }, [onSend]);

    return (
        <div className="chat-section">
            {/* Name bar */}
            <div className="chat-namebar">
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Chatting as:</span>
                {editingName ? (
                    <>
                        <input
                            autoFocus
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveName()}
                            maxLength={32}
                            className="name-edit-input"
                            id="username-input"
                        />
                        <button className="btn btn-primary btn-sm" onClick={saveName} id="save-username-btn">Save</button>
                    </>
                ) : (
                    <>
                        <span style={{ fontWeight: 600, color: "var(--accent)", fontSize: "0.82rem" }}>{sender}</span>
                        <button
                            className="btn btn-ghost btn-icon btn-sm icon-btn"
                            onClick={() => { setNameDraft(sender); setEditingName(true); }}
                            id="edit-username-btn"
                            title="Edit name"
                        >
                            <EditIcon />
                        </button>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="messages-container" id="chat-messages">
                {messages.length === 0 ? (
                    <div className="messages-empty">
                        <ChatBubbleIcon />
                        <span>No messages yet. Start the conversation!</span>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble key={msg._id} msg={msg} currentUser={sender} />
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="chat-input-row">
                    {/* File attach button */}
                    <button
                        id="attach-file-btn"
                        className="btn btn-ghost btn-icon icon-btn attach-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Attach file"
                        aria-label="Attach file"
                    >
                        {uploading
                            ? <span className="spinner" style={{ width: 16, height: 16 }} />
                            : <PaperclipIcon />}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        id="chat-file-input"
                        onChange={handleFileChange}
                    />

                    <textarea
                        ref={textRef}
                        id="chat-input"
                        className="chat-textarea"
                        placeholder="Type a message… (Shift+Enter for new line)"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        maxLength={20000}
                    />
                    <button
                        id="send-msg-btn"
                        className="btn btn-primary btn-icon send-btn"
                        onClick={handleSend}
                        disabled={!text.trim()}
                        title="Send message"
                    >
                        <SendIcon />
                    </button>
                </div>
                <div className="chat-hint">
                    Press Enter to send · Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, currentUser }) {
    const isOwn = msg.sender === currentUser;
    const isFile = msg.type === "file";
    const [copied, setCopied] = useState(false);
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const initial = getInitial(msg.sender);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(msg.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy.");
        }
    };

    return (
        <div className={`message-bubble ${isOwn ? "own" : "other"}`}>
            {!isOwn && (
                <div className="msg-avatar" title={msg.sender}>{initial}</div>
            )}
            <div className="msg-body">
                <div className="msg-meta">
                    {!isOwn && <span className="msg-sender">{msg.sender}</span>}
                    <span>{time}</span>
                </div>
                <div className="msg-content-wrapper">
                    {isFile ? (
                        <div className="msg-content file">
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                                <FileIcon /> File shared
                            </span>
                            <a href={msg.fileUrl} download={msg.content} target="_blank" rel="noopener noreferrer" className="file-link">
                                <FileIcon />
                                {msg.content}
                            </a>
                        </div>
                    ) : (
                        <div className="msg-content text" style={{ whiteSpace: "pre-wrap" }}>
                            {msg.content}
                        </div>
                    )}
                    {/* Hover copy button */}
                    {!isFile && (
                        <button
                            className={`msg-copy-btn${isOwn ? " own" : ""}`}
                            onClick={handleCopy}
                            title={copied ? "Copied!" : "Copy message"}
                            aria-label="Copy message"
                        >
                            {copied ? <CheckIcon /> : <CopyIcon />}
                        </button>
                    )}
                </div>
            </div>
            {isOwn && (
                <div className="msg-avatar own-avatar" title="You">{initial}</div>
            )}
        </div>
    );
}
