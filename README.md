# FluxRoom ⚡

> Real-time, ephemeral collaboration rooms. Share messages, code snippets, and files. Everything vanishes after 24 hours.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/) [![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/) [![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/atlas) [![Socket.io](https://img.shields.io/badge/Socket.io-4-white)](https://socket.io/)

---

## Features

- 🔑 **6-digit room codes** — collision-safe, uppercase alphanumeric
- 💬 **Real-time chat** — text / code snippets share instantly via Socket.io
- 💻 **Monaco code editor** — syntax highlighting for 17 languages
- 📎 **Real File Sharing** — Integrated with **Cloudinary** for persistent file storage during the room's life.
- ⏱ **24-hour auto-expiry** — MongoDB TTL indexes delete rooms & messages automatically
- 🔄 **Auto-reconnect** — Socket.io reconnects seamlessly on refresh/network drop
- 📜 **Message history** — previous messages loaded on room join
- 👥 **Live user count** — real-time active user count per room

---

## Architecture (Split Deployment)

To ensure stable real-time communication, FluxRoom uses a split architecture:

1.  **Backend (Render)**: Hosted as a permanent Node.js service on [Render](https://render.com). This provides the stable, 24/7 environment required for Socket.io WebSockets/Polling.
2.  **Frontend (Vercel)**: Hosted as a high-performance static site on [Vercel](https://vercel.com).
3.  **Database**: Managed MongoDB Atlas with TTL indexes.
4.  **Storage**: Cloudinary for user-shared files.

---

## Project Structure

```
FluxRoom/
├── api/             # Vercel function entry (proxy to server)
├── server/          # Node.js + Express + Socket.io backend
│   ├── config/      # MongoDB & Cloudinary connection
│   ├── controllers/ # Room & Upload logic
│   ├── middleware/  # Rate limiting
│   ├── models/      # Room + Message (TTL indexed)
│   ├── routes/      # REST API routes
│   └── sockets/     # Socket.io event handlers
└── client/          # React + Vite frontend
    └── src/
        ├── api/         # Axios service layer
        ├── components/  # Chat, CodeEditor, FileUpload, RoomHeader
        ├── pages/       # Home, Room
        └── services/    # Socket.io singleton
```

---

## Setup & Development

### 1. Backend Setup (Render or Local)

- **Environment Variables** (`server/.env`):
  - `MONGO_URI`: MongoDB Atlas connection string.
  - `CLIENT_ORIGIN`: Your frontend URL (e.g., `https://flux-room.vercel.app`).
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: From your Cloudinary dashboard.

- **Run Locally**:
  ```bash
  cd server
  npm install
  npm run dev  # Starts on http://localhost:5000
  ```

### 2. Frontend Setup (Vercel or Local)

- **Environment Variables** (Vercel or `client/.env`):
  - `VITE_API_BASE_URL`: `http://localhost:5000/api` (Local) or `https://your-render-app.onrender.com/api` (Production).
  - `VITE_SOCKET_URL`: `http://localhost:5000` (Local) or `https://your-render-app.onrender.com` (Production).

- **Run Locally**:
  ```bash
  cd client
  npm install
  npm run dev  # Starts on http://localhost:5173
  ```

---

## Deployment Summary

### Backend (Render)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Frontend (Vercel)
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## Production Security & Scaling

- **CORS**: Strictly limited via the `CLIENT_ORIGIN` variable on the backend.
- **Rate Limiting**: Express-rate-limit prevents abuse of room creation and message endpoints.
- **Transports**: Socket.io is configured to prefer `polling` then `websocket` for maximum compatibility across different hosting environments.
