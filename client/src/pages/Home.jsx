import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { createRoom, validateRoom } from "../api/roomApi";

export default function Home() {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const { roomCode } = await createRoom();
            toast.success(`Room ${roomCode} created!`);
            navigate(`/room/${roomCode}`);
        } catch (err) {
            const msg = err?.response?.data?.error || "Failed to create room.";
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        const code = joinCode.trim().toUpperCase();

        if (code.length !== 6) {
            toast.error("Room code must be exactly 6 characters.");
            return;
        }

        setJoining(true);
        try {
            await validateRoom(code);
            navigate(`/room/${code}`);
        } catch (err) {
            const msg = err?.response?.data?.error || "Room not found or expired.";
            toast.error(msg);
        } finally {
            setJoining(false);
        }
    };

    return (
        <main className="home-page">
            <div className="home-bg-glow" aria-hidden />

            <div className="home-container fade-in">
                {/* Logo */}
                <div className="home-logo">
                    <span className="logo-icon">⚡</span>
                    <h1>FluxRoom</h1>
                    <p>Ephemeral rooms for collaboration. Vanish in 24&nbsp;hours.</p>
                </div>

                <div className="home-cards">
                    {/* Create Room */}
                    <div className="home-card">
                        <div className="home-card-header">
                            <span className="home-card-icon">✨</span>
                            <div>
                                <div className="home-card-title">Create a Room</div>
                                <div className="home-card-sub">Get a unique 6-digit code instantly</div>
                            </div>
                        </div>
                        <button
                            id="create-room-btn"
                            className="btn btn-primary btn-lg btn-full"
                            onClick={handleCreate}
                            disabled={creating}
                        >
                            {creating ? <><span className="spinner" /> Creating…</> : "Create Room"}
                        </button>
                    </div>

                    <div className="divider">or</div>

                    {/* Join Room */}
                    <div className="home-card">
                        <div className="home-card-header">
                            <span className="home-card-icon">🔗</span>
                            <div>
                                <div className="home-card-title">Join a Room</div>
                                <div className="home-card-sub">Enter a 6-character room code</div>
                            </div>
                        </div>
                        <form onSubmit={handleJoin} className="form-group">
                            <input
                                id="join-code-input"
                                type="text"
                                className="form-input code-input"
                                placeholder="AB3X9K"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                                maxLength={6}
                                autoComplete="off"
                                spellCheck={false}
                                aria-label="Room code"
                            />
                            <button
                                id="join-room-btn"
                                type="submit"
                                className="btn btn-outline btn-lg btn-full"
                                disabled={joining || joinCode.length !== 6}
                            >
                                {joining ? <><span className="spinner" /> Joining…</> : "Join Room"}
                            </button>
                        </form>
                    </div>
                </div>

                <p className="home-footer">
                    Rooms &amp; messages auto-expire after 24 hours. No account needed.
                </p>
            </div>
        </main>
    );
}
