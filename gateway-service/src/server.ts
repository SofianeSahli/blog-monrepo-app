import express from "express";
import session from "express-session";
import cors from "cors";
import { createClient } from "redis";
import dotenv from "dotenv";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { router } from "./routes/miscs.routes";
import { sessionMiddleware } from "./config/middelwars";
import { Server as SocketIOServer } from "socket.io";

dotenv.config();

const app = express();
export const httpServer = createServer(app);

const redisSub = createClient({ url: process.env.REDIS_URL });

(async () => {
  await redisSub.connect();
})();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(sessionMiddleware);

redisSub.subscribe(
  process.env.NOTIFICATIONS_READY_TO_DISPATCH ||
    "notifications_created_to_dispatch",
  (message) => {
    try {
      const notification = JSON.parse(message);
      console.log("📨 Sending notification:", notification);
      const targetSocket = userSockets.get(notification.userId);
      if (targetSocket) {
        targetSocket.emit("notification", notification);
      }

      io.to(`user:${notification.userId}`).emit("notification", notification);
    } catch (err) {
      console.error("Error handling notification event:", err);
    }
  }
);

const PORT = process.env.PORT || 3000;
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  },
});

// Share session with socket.io
io.use((socket, next) => {
  const req = socket.request as any;
  const res = {} as any;
  sessionMiddleware(req, res, () => {
    if (req.session?.userId) {
      socket.data.userId = req.session.userId;
      return next();
    }
    next(new Error("Unauthorized"));
  });
});
export const userSockets = new Map();

// When a user connects
io.on("connection", (socket) => {
  const session = socket.request.session;
  if (session?.userId) {
    const userId = session.userId;
    console.log(`🔌 User ${userId} connected`);
    userSockets.set(userId, socket);
  }

  socket.on("disconnect", () => {
    const session = socket.request.session;
    if (session?.userId) {
      userSockets.delete(session.userId);
    }
  });
});

app.use(router);
httpServer.listen(PORT, () =>
  console.log(`Gateway + WebSocket running on port ${PORT}`)
);
