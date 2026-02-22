import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function RoomHeader({ roomCode, userCount, expiresAt, onLeave }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!expiresAt) return;
        const expiry = new Date(expiresAt).getTime();

        const tick = () => {
            const diff = expiry - Date.now();
            if (diff <= 0) {
                setTimeLeft("Expired");
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const label = h > 0
                ? `${h}h ${String(m).padStart(2, "0")}m`
                : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
            setTimeLeft(label);
            setIsUrgent(diff < 3600000); // urgent if < 1 hour left
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(roomCode);
            setCopied(true);
            toast.success("Code copied!");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Failed to copy.");
        }
    };

    return (
        <header className="room-header">
            <div className="room-header-left">
                {/* Logo */}
                <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em" }}>
                    ⚡ FluxRoom
                </span>

                {/* Room code */}
                <div className="room-code-display">
                    <span className="room-code-label">Room</span>
                    <span className="room-code-value">{roomCode}</span>
                    <button
                        id="copy-code-btn"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={copyCode}
                        title="Copy room code"
                        aria-label="Copy room code"
                    >
                        {copied ? "✅" : "📋"}
                    </button>
                </div>

                {/* User count */}
                <div className="user-count">
                    <div className="pulse-dot" />
                    <span className="user-count-num">{userCount}</span>
                    <span>online</span>
                </div>
            </div>

            <div className="room-header-right">
                {/* Expiry countdown */}
                {timeLeft && (
                    <div className={`room-timer${isUrgent ? " urgent" : ""}`} title="Room expires at">
                        {isUrgent ? "⚠️" : "⏱"} {timeLeft}
                    </div>
                )}

                <button
                    id="leave-room-btn"
                    className="btn btn-danger btn-sm"
                    onClick={onLeave}
                >
                    Leave
                </button>
            </div>
        </header>
    );
}
