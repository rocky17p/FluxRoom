import { useRef, useEffect, useState } from "react";

const USERNAME_KEY = "fluxroom_username";

const getInitial = (name) => (name || "?")[0].toUpperCase();

export default function Chat({ messages, onSend }) {
    const [text, setText] = useState("");
    const [sender, setSender] = useState(
        () => localStorage.getItem(USERNAME_KEY) || "Anonymous"
    );
    const [editingName, setEditingName] = useState(false);
    const [nameDraft, setNameDraft] = useState(sender);
    const bottomRef = useRef(null);
    const textRef = useRef(null);

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

    return (
        <div className="chat-section">
            {/* Name bar */}
            <div style={{
                padding: "8px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem",
                background: "var(--bg-surface)"
            }}>
                <span style={{ color: "var(--text-muted)" }}>Chatting as:</span>
                {editingName ? (
                    <>
                        <input
                            autoFocus
                            value={nameDraft}
                            onChange={(e) => setNameDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveName()}
                            maxLength={32}
                            style={{
                                background: "var(--bg-input)", border: "1px solid var(--border-focus)",
                                borderRadius: "var(--radius-sm)", color: "var(--text-primary)",
                                padding: "2px 8px", fontSize: "0.82rem", outline: "none", width: 120
                            }}
                            id="username-input"
                        />
                        <button className="btn btn-primary btn-sm" onClick={saveName} id="save-username-btn">Save</button>
                    </>
                ) : (
                    <>
                        <span style={{ fontWeight: 600, color: "var(--accent)" }}>{sender}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setNameDraft(sender); setEditingName(true); }} id="edit-username-btn">✏️</button>
                    </>
                )}
            </div>

            {/* Messages */}
            <div className="messages-container" id="chat-messages">
                {messages.length === 0 ? (
                    <div className="messages-empty">
                        <span className="messages-empty-icon">💬</span>
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
                        className="btn btn-primary btn-icon"
                        onClick={handleSend}
                        disabled={!text.trim()}
                        title="Send message"
                        style={{ padding: "10px 14px", fontSize: "1rem" }}
                    >
                        ➤
                    </button>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 5 }}>
                    Press Enter to send · Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}

function MessageBubble({ msg, currentUser }) {
    const isOwn = msg.sender === currentUser;
    const isFile = msg.type === "file";
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const initial = getInitial(msg.sender);

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
                {isFile ? (
                    <div className="msg-content file">
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>📎 File shared</span>
                        <a href={msg.fileUrl} download={msg.content} target="_blank" rel="noopener noreferrer" className="file-link">
                            <span className="file-link-icon">📄</span>
                            {msg.content}
                        </a>
                    </div>
                ) : (
                    <div className="msg-content text" style={{ whiteSpace: "pre-wrap" }}>
                        {msg.content}
                    </div>
                )}
            </div>
            {isOwn && (
                <div className="msg-avatar" title="You" style={{ background: "var(--accent)", color: "#fff" }}>{initial}</div>
            )}
        </div>
    );
}
