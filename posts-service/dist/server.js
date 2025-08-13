import express from "express";
import mongoose from "mongoose";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import { router as PostsRouter } from "./routes/posts";
import fileUpload from "express-fileupload";
dotenv.config();
const app = express();
app.use(fileUpload({
    useTempFiles: true,
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 },
    tempFileDir: "/tmp/",
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const PORT = process.env.POSTS_PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/postsdb";
const ELASTIC_URI = process.env.ELASTIC_URI || "http://localhost:9200";
mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
export const esClient = new Client({ node: ELASTIC_URI });
esClient
    .ping()
    .then(() => console.log("Elasticsearch connected"))
    .catch((err) => console.error("Elasticsearch connection error:", err));
app.use("/", PostsRouter);
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
