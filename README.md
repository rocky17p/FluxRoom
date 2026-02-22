# FluxRoom ⚡

> Real-time, ephemeral collaboration rooms. Share messages, code snippets, and files. Everything vanishes after 24 hours.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/) [![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/atlas) [![Socket.io](https://img.shields.io/badge/Socket.io-4-white)](https://socket.io/)

---

## Features

- 🔑 **6-digit room codes** — collision-safe, uppercase alphanumeric
- 💬 **Real-time chat** — text / code snippets share instantly via Socket.io
- 💻 **Monaco code editor** — syntax highlighting for 17 languages
- 📎 **File sharing** — drag-and-drop upload (Cloudinary integration ready)
- ⏱ **24-hour auto-expiry** — MongoDB TTL indexes delete rooms & messages automatically
- 🔄 **Auto-reconnect** — Socket.io reconnects seamlessly on refresh/network drop
- 📜 **Message history** — previous messages loaded on room join
- 👥 **Live user count** — real-time active user count per room

---

## Project Structure

```
FluxRoom/
├── server/          # Node.js + Express + Socket.io backend
│   ├── config/      # MongoDB connection
│   ├── controllers/ # Room logic (create, validate, fetch messages)
│   ├── middleware/  # Rate limiting
│   ├── models/      # Room + Message (TTL indexed)
│   ├── routes/      # REST API routes
│   ├── sockets/     # Socket.io event handlers
│   └── utils/       # Room code generator
└── client/          # React + Vite frontend
    └── src/
        ├── api/         # Axios service layer
        ├── components/  # Chat, CodeEditor, FileUpload, RoomHeader
        ├── pages/       # Home, Room
        └── services/    # Socket.io singleton
```

---

## Quick Start

### 1. Set up environment variables

```bash
# Server
cp server/.env.example server/.env
# → Fill in MONGO_URI with your MongoDB Atlas connection string

# Client
cp client/.env.example client/.env
# → Update VITE_API_BASE_URL and VITE_SOCKET_URL if deploying remotely
```

### 2. Start the backend

```bash
cd server
npm install
npm run dev        # runs on http://localhost:5000
```

### 3. Start the frontend

```bash
cd client
npm install
npm run dev        # runs on http://localhost:5173
```

---

## Environment Variables

### `server/.env`
| Variable | Description |
|---|---|
| `PORT` | Port for Express server (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLIENT_ORIGIN` | Comma-separated allowed client origins |
| `CLOUDINARY_*` | Cloudinary credentials for file uploads |

### `client/.env`
| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend REST API base URL |
| `VITE_SOCKET_URL` | Backend Socket.io server URL |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rooms` | Create a new room |
| `GET` | `/api/rooms/:code` | Validate a room (404 if expired) |
| `GET` | `/api/rooms/:code/messages` | Fetch room message history (last 200) |

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a room |
| `joined` | Server → Client | Confirmation + expiry timestamp |
| `send_message` | Client → Server | Send a message to the room |
| `receive_message` | Server → Client | Broadcast new message to room |
| `user_count` | Server → Client | Current active users in room |
| `error` | Server → Client | Validation/server errors |

---

## Production Notes

- **MongoDB TTL indexes** are configured on `createdAt` (86400s) on both `Room` and `Message` collections. MongoDB's TTL monitor runs approximately every 60 seconds.
- **Rate limiting**: Room creation is limited to 5 req/min, general API to 30 req/min. Socket messages are rate-limited at 500ms intervals per socket.
- **File storage**: Replace the placeholder in `client/src/components/FileUpload.jsx` with a real Cloudinary `upload_preset` call for production.
- **CORS**: Set `CLIENT_ORIGIN` to your production frontend URL (e.g., `https://fluxroom.vercel.app`).
