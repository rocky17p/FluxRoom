import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { validateRoom, fetchMessages } from "../api/roomApi";
import { connectSocket, disconnectSocket } from "../services/socket";
import RoomHeader from "../components/RoomHeader";
import Chat from "../components/Chat";
import CodeEditor from "../components/CodeEditor";

const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
const CodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

const TABS = [
    { id: "chat", label: "Chat", Icon: ChatIcon },
    { id: "code", label: "Code", Icon: CodeIcon },
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

    // ── Send message helper ───────────────────────────────────────────────────
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

    // Handle text OR file messages from Chat component
    const handleChatSend = useCallback(
        (payload) => {
            if (payload.startsWith("__file__:")) {
                const parts = payload.slice("__file__:".length).split(":");
                const fileName = parts[0];
                const fileUrl = parts.slice(1).join(":"); // handle URLs with colons
                sendMessage("file", fileName, { fileUrl, fileName });
            } else {
                sendMessage("text", payload);
            }
        },
        [sendMessage]
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
                                <tab.Icon /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === "chat" && (
                        <Chat
                            messages={messages}
                            onSend={handleChatSend}
                            roomCode={roomCode}
                        />
                    )}
                    {activeTab === "code" && (
                        <CodeEditor onShare={(code, lang) => sendMessage("text", `\`\`\`${lang}\n${code}\n\`\`\``)} />
                    )}
                </div>

                {/* Sidebar — always shows full chat history */}
                <div className="room-sidebar">
                    <div className="sidebar-header">
                        All Messages
                    </div>
                    <div className="messages-container" id="sidebar-messages">
                        {messages.length === 0 ? (
                            <div className="messages-empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}>
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
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

const SidebarFileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

function SidebarMessage({ msg }) {
    const isFile = msg.type === "file";
    return (
        <div className="sidebar-msg-item">
            <div className="sidebar-msg-meta">
                <span className="sidebar-msg-sender">{msg.sender || "Anonymous"}</span>
                <span className="sidebar-msg-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
            </div>
            {isFile ? (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="file-link sidebar-file-link">
                    <SidebarFileIcon />{msg.content}
                </a>
            ) : (
                <p className="sidebar-msg-content">
                    {msg.content.slice(0, 120)}{msg.content.length > 120 && "…"}
                </p>
            )}
        </div>
    );
}
