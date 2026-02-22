import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { validateRoom, fetchMessages } from "../api/roomApi";
import { connectSocket, disconnectSocket } from "../services/socket";
import RoomHeader from "../components/RoomHeader";
import Chat from "../components/Chat";
import CodeEditor from "../components/CodeEditor";
import FileUpload from "../components/FileUpload";

const TABS = [
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "code", label: "Code", icon: "💻" },
    { id: "files", label: "Files", icon: "📎" },
];

export default function Room() {
    const { code } = useParams();
    const navigate = useNavigate();
    const roomCode = code?.toUpperCase();

    const [loading, setLoading] = useState(true);
    const [roomError, setRoomError] = useState(null);
    const [roomMeta, setRoomMeta] = useState(null); // { roomCode, createdAt, expiresAt }

    const [messages, setMessages] = useState([]);
    const [userCount, setUserCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [activeTab, setActiveTab] = useState("chat");

    // ── Validate room & load history ──────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                const meta = await validateRoom(roomCode);
                if (cancelled) return;
                setRoomMeta(meta);

                const { messages: history } = await fetchMessages(roomCode);
                if (cancelled) return;
                setMessages(history);
            } catch (err) {
                if (cancelled) return;
                const msg = err?.response?.data?.error || "Room not found or has expired.";
                setRoomError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        init();
        return () => { cancelled = true; };
    }, [roomCode]);

    // ── Connect socket once room is valid ─────────────────────────────────────
    useEffect(() => {
        if (roomError || loading || !roomMeta) return;

        const s = connectSocket();
        setSocket(s);

        // Join the room
        s.emit("join_room", { roomCode });

        // Listen for confirmation
        const onJoined = ({ expiresAt }) => {
            console.log("✅ Joined room:", roomCode);
            // Update expiresAt if it differs (don't set state if same to avoid re-renders)
            setRoomMeta((prev) => {
                if (prev?.expiresAt === expiresAt) return prev;
                return { ...prev, expiresAt };
            });
        };

        const onMsg = (msg) => {
            console.log("📩 New message received:", msg);
            setMessages((prev) => {
                // Prevent duplicates (e.g. if re-connected and history re-fetched)
                if (prev.find((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        const onUserCount = ({ count }) => {
            setUserCount(count);
        };

        const onSocketError = ({ message }) => {
            toast.error(message);
        };

        const onDisconnect = (reason) => {
            console.log("🔌 Socket disconnected:", reason);
            toast("Reconnecting…", { icon: "🔄" });
        };

        const onConnect = () => {
            console.log("🔌 Socket connected/reconnected");
            s.emit("join_room", { roomCode });
        };

        s.on("joined", onJoined);
        s.on("receive_message", onMsg);
        s.on("user_count", onUserCount);
        s.on("error", onSocketError);
        s.on("disconnect", onDisconnect);
        s.on("connect", onConnect);

        return () => {
            console.log("🧹 Cleaning up socket listeners for room:", roomCode);
            s.off("joined", onJoined);
            s.off("receive_message", onMsg);
            s.off("user_count", onUserCount);
            s.off("error", onSocketError);
            s.off("disconnect", onDisconnect);
            s.off("connect", onConnect);
            // We don't necessarily want to disconnect the physical socket 
            // every re-render, only when leaving the page.
        };
    }, [roomCode, roomError, loading]); // Removed roomMeta from dependencies

    // Separate effect for full cleanup on unmount
    useEffect(() => {
        return () => {
            console.log("🚪 Leaving Room: disconnecting socket");
            disconnectSocket();
        };
    }, []);

    // ── Send message helper (used by Chat & CodeEditor) ───────────────────────
    const sendMessage = useCallback(
        (type, content, extras = {}) => {
            if (!socket) return;
            socket.emit("send_message", {
                roomCode,
                type,
                content,
                sender: localStorage.getItem("fluxroom_username") || "Anonymous",
                ...extras,
            });
        },
        [socket, roomCode]
    );

    // ── Error / loading states ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="room-error-page">
                <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <p style={{ color: "var(--text-muted)", marginTop: 12 }}>Connecting to room…</p>
            </div>
        );
    }

    if (roomError) {
        return (
            <div className="room-error-page fade-in">
                <div className="room-error-icon">⏳</div>
                <h2 className="room-error-title">Room Unavailable</h2>
                <p className="room-error-msg">{roomError}</p>
                <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate("/")}
                    id="go-home-btn"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="room-page">
            <RoomHeader
                roomCode={roomCode}
                userCount={userCount}
                expiresAt={roomMeta?.expiresAt}
                onLeave={() => { disconnectSocket(); navigate("/"); }}
            />

            <div className="room-body">
                {/* Main area — tabs */}
                <div className="room-main">
                    <div className="tab-bar" role="tablist">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                id={`tab-${tab.id}`}
                                role="tab"
                                aria-selected={activeTab === tab.id}
                                className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "chat" && (
                        <Chat messages={messages} onSend={(text) => sendMessage("text", text)} />
                    )}
                    {activeTab === "code" && (
                        <CodeEditor onShare={(code, lang) => sendMessage("text", `\`\`\`${lang}\n${code}\n\`\`\``)} />
                    )}
                    {activeTab === "files" && (
                        <FileUpload
                            roomCode={roomCode}
                            onShare={(fileName, fileUrl) =>
                                sendMessage("file", fileName, { fileUrl, fileName })
                            }
                        />
                    )}
                </div>

                {/* Sidebar — always shows full chat history */}
                <div className="room-sidebar">
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        All Messages
                    </div>
                    <div className="messages-container" id="sidebar-messages">
                        {messages.length === 0 ? (
                            <div className="messages-empty">
                                <span className="messages-empty-icon">💬</span>
                                <span>No messages yet</span>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <SidebarMessage key={msg._id} msg={msg} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarMessage({ msg }) {
    const isFile = msg.type === "file";
    return (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{msg.sender || "Anonymous"}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
            {isFile ? (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
                    <span className="file-link-icon">📎</span>{msg.content}
                </a>
            ) : (
                <p style={{ color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content.slice(0, 120)}{msg.content.length > 120 && "…"}
                </p>
            )}
        </div>
    );
}
