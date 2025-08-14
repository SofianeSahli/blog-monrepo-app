import express from "express";
import { redisPub } from "../server";
import { Notification } from "../models/notifications";
export const router = express();

router.post("/", async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    await redisPub.publish("notifications:created", JSON.stringify(notif));
    res.status(201).json({ notif });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});
router.get("/", async (req, res) => {
  try {
    const userId = req.header("X-User-Id");
    if (!userId) {
      return res.status(400).json({ error: "Missing X-User-Id header" });
    }

    const notifs = await Notification.find({ userId })
      .sort({ timestamp: -1 })
      .lean(); // <-- crucial: plain JS objects, no Mongoose metadata

    const transformedNotifs = notifs.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    }));

    res.json(transformedNotifs);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.post("/mark-read", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids must be a non-empty array" });
    }
    const result = await Notification.updateMany(
      { _id: { $in: ids }, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({
      message: "Selected notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});
