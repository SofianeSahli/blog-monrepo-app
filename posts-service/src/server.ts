import express from "express";
import mongoose from "mongoose";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import { router as PostsRouter } from "./routes/posts";
import fileUpload from "express-fileupload";
import path from "path";
import { commentRouter } from "./routes/comments";
import { createClient } from "redis";

dotenv.config();

const app = express();
app.use(
  fileUpload({
    useTempFiles: true,
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 },
    tempFileDir: "/tmp/",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
export const redisPub = createClient({ url: process.env.REDIS_URL });
redisPub.on("error", (err) => console.error("Redis Pub Error", err));
redisPub.connect();
const PORT = process.env.POSTS_PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/postsdb";
const ELASTIC_URI = process.env.ELASTIC_URI || "http://localhost:9200";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

export const esClient = new Client({ node: ELASTIC_URI });
app.use("/", express.static(path.join(__dirname, "../uploads/posts-file")));
esClient
  .ping()
  .then(() => console.log("Elasticsearch connected"))
  .catch((err) => console.error("Elasticsearch connection error:", err));

app.use("/", PostsRouter);
app.use("/", commentRouter);
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
