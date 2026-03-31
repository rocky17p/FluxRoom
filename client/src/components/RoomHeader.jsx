import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const ClipboardIcon = ({ copied }) => copied ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
    </svg>
) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
);

const TimerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
);

const BoltIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--warning)" }}>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </svg>
);

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
            setIsUrgent(diff < 3600000);
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
                <span className="room-logo">
                    <BoltIcon /> FluxRoom
                </span>

                {/* Room code */}
                <div className="room-code-display">
                    <span className="room-code-label">Room</span>
                    <span className="room-code-value">{roomCode}</span>
                    <button
                        id="copy-code-btn"
                        className="btn btn-ghost btn-icon btn-sm icon-btn"
                        onClick={copyCode}
                        title="Copy room code"
                        aria-label="Copy room code"
                    >
                        <ClipboardIcon copied={copied} />
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
                        {isUrgent ? <AlertIcon /> : <TimerIcon />} {timeLeft}
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
