require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const roomRoutes = require("./routes/roomRoutes");
const { registerSocketHandlers } = require("./sockets/roomSocket");

// ─── App Setup ───────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);

// ─── Trust Proxy (Render / Heroku / cloud load balancers) ────────────────────
// Required for express-rate-limit to correctly identify client IPs via
// X-Forwarded-For. Without this it throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set("trust proxy", 1);

// ─── Static Files (Monolith) ─────────────────────────────────────────────────

// Use process.cwd() to get the root directory on Vercel
const distPath = path.join(process.cwd(), "client/dist");
app.use(express.static(distPath));

// ─── CORS ────────────────────────────────────────────────────────────────────

const corsOptions = {
  origin: true,
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/rooms", roomRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ─── SPA Fallback ────────────────────────────────────────────────────────────

app.get("*", (req, res) => {
  // Only fallback for non-API routes
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) {
        res.status(404).send("Frontend build not found. Please run 'build' script.");
      }
    });
  } else {
    res.status(404).json({ error: "API route not found." });
  }
});

// ─── Socket.io ───────────────────────────────────────────────────────────────

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["polling", "websocket"],
});

registerSocketHandlers(io);

// ─── Start / Init ───────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

// Connect to DB immediately (Serverless friendly)
connectDB();

// Only start the server if not being required as a module (e.g. by Vercel)
if (require.main === module) {
  httpServer.listen(PORT, () => {
    console.log(`🚀 FluxRoom server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
