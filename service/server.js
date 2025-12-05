// Simple Yjs WebSocket server for collaborative editing.
// Room name = noteId (taken from URL path), no built-in auth.
// Run locally: node server.js
// Docker: docker run -p 1234:1234 -e WS_PORT=1234 byte-note-collab

import http from "http";
import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils.js";

const port = Number(process.env.WS_PORT || 1234);
const allowedOrigins =
  (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

const server = http.createServer();
const wss = new WebSocketServer({ server });

const isOriginAllowed = (origin) => {
  if (!allowedOrigins.length) return true;
  if (!origin) return false;
  return allowedOrigins.some((o) => origin === o);
};

wss.on("connection", (conn, req) => {
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) {
    conn.close();
    return;
  }

  const url = req.url || "/";
  // room name from path, e.g. ws://host:1234/<noteId>
  const docName = url.slice(1).split("?")[0] || "default";
  setupWSConnection(conn, req, { docName });
});

server.listen(port, () => {
  console.log(`[yjs-ws] server listening on port ${port}`);
  if (allowedOrigins.length) {
    console.log(`[yjs-ws] allowed origins: ${allowedOrigins.join(", ")}`);
  } else {
    console.log("[yjs-ws] allowed origins: * (no restriction)");
  }
});
