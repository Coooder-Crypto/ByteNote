# Simple Yjs websocket server for collaborative editing
# Build: docker build -t byte-note-collab .
# Run:   docker run -p 1234:1234 -e WS_PORT=1234 byte-note-collab

FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY server.js ./

ENV WS_PORT=1234
EXPOSE 1234

CMD ["node", "server.js"]

