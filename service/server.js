// Minimal Yjs WebSocket server (compatible with y-websocket protocol)
// Room name = noteId (URL path). No auth/persistence.
// Run locally: node server.js
// Docker: docker run -p 1234:1234 -e WS_PORT=1234 byte-note-collab

import http from "http";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

const port = Number(process.env.WS_PORT || 1234);
const allowedOrigins =
  (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const messageSync = 0;
const messageAwareness = 1;

const rooms = new Map();

const server = http.createServer();
const wss = new WebSocketServer({ server });

const isOriginAllowed = (origin) => {
  if (!allowedOrigins.length) return true;
  if (!origin) return false;
  return allowedOrigins.some((o) => origin === o);
};

function getRoom(docName) {
  let room = rooms.get(docName);
  if (!room) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    const conns = new Set();
    room = { doc, awareness, conns };
    rooms.set(docName, room);
    doc.on("update", (update, origin) => {
      const msg = createUpdateMessage(update);
      broadcast(room, msg, origin);
    });
    awareness.on("update", ({ added, updated, removed }, origin) => {
      const states = added.concat(updated, removed);
      const msg = createAwarenessMessage(awareness, states);
      broadcast(room, msg, origin);
    });
  }
  return room;
}

function createUpdateMessage(update) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeUpdate(encoder, update);
  return encoding.toUint8Array(encoder);
}

function createAwarenessMessage(awareness, clients) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageAwareness);
  encoding.writeVarUint8Array(
    encoder,
    awarenessProtocol.encodeAwarenessUpdate(awareness, clients),
  );
  return encoding.toUint8Array(encoder);
}

function broadcast(room, data, origin) {
  room.conns.forEach((conn) => {
    if (conn !== origin && conn.readyState === 1) {
      try {
        conn.send(data);
      } catch (_) {
        // ignore send errors
      }
    }
  });
}

wss.on("connection", (conn, req) => {
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) {
    conn.close();
    return;
  }
  const docName = (req.url || "/").slice(1).split("?")[0] || "default";
  const room = getRoom(docName);
  room.conns.add(conn);

  // send sync step 1
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, room.doc);
    conn.send(encoding.toUint8Array(encoder));
    // send current awareness
    const awarenessMsg = createAwarenessMessage(
      room.awareness,
      Array.from(room.awareness.getStates().keys()),
    );
    if (awarenessMsg.length > 0) conn.send(awarenessMsg);
  }

  const awareness = room.awareness;
  const awarenessCleanup = () => {
    awarenessProtocol.removeAwarenessStates(
      awareness,
      [room.doc.clientID],
      null,
    );
    room.conns.delete(conn);
  };

  conn.on("message", (data) => {
    const decoder = decoding.createDecoder(new Uint8Array(data));
    const encoder = encoding.createEncoder();
    const messageType = decoding.readVarUint(decoder);
    switch (messageType) {
      case messageSync: {
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
        const out = encoding.toUint8Array(encoder);
        if (out.length > 1) {
          conn.send(out);
        }
        break;
      }
      case messageAwareness: {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(awareness, update, conn);
        break;
      }
      default:
        break;
    }
  });

  conn.on("close", awarenessCleanup);
  conn.on("error", awarenessCleanup);
});

server.listen(port, () => {
  console.log(`[yjs-ws] server listening on port ${port}`);
  if (allowedOrigins.length) {
    console.log(`[yjs-ws] allowed origins: ${allowedOrigins.join(", ")}`);
  } else {
    console.log("[yjs-ws] allowed origins: * (no restriction)");
  }
});
