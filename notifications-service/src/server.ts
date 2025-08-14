import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createClient } from "redis";
import { insertNotificaitons } from "./actions/notifications.actions";
import { router } from "./routes/notifications.routes";

dotenv.config();

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Redis clients
export const redisPub = createClient({ url: process.env.REDIS_URL });
const redisSub = createClient({ url: process.env.REDIS_URL });

redisPub.on("error", (err) => console.error("Redis Pub Error", err));
redisSub.on("error", (err) => console.error("Redis Sub Error", err));

(async () => {
  await redisPub.connect();
  await redisSub.connect();
  console.log("✅ Redis connected");

  await redisSub.subscribe(
    process.env.COMMENT_CREATED_EVENT || "comments_created",
    async (message) => {
      try {
        const commentEvent = JSON.parse(message);
        insertNotificaitons(commentEvent);
      } catch (err) {
        console.error("Error handling comment event:", err);
      }
    }
  );
})();

const PORT = process.env.NOTIFICATIONS_PORT || 4002;
app.use(router);
app.listen(PORT, () => {
  console.log(`🚀 Notification Service running on port ${PORT}`);
});
