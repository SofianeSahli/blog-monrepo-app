import { Post } from "../models/posts";
import express from "express";
import { indexPost, updatePostInIndex, deletePostFromIndex, searchPosts, } from "../config/elastic-search-setup";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
dotenv.config();
const router = express.Router();
const uploadDir = path.join(__dirname, "../../uploads/posts-files");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
router.post(process.env.POSTS_ROUTE, async (req, res) => {
    try {
        const userId = req.header("X-User-Id");
        if (!userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Missing user ID" });
        }
        const { title, text } = req.body;
        if (!title || !text) {
            return res.status(400).json({ message: "Title and text are required" });
        }
        let picture = null;
        if (req.files && req.files.file) {
            const file = req.files.file;
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return res.status(400).json({ message: "errors.wrong_file_format" });
            }
            const fileName = `${Date.now()}-${file.name}`;
            picture = path.join(uploadDir, fileName);
            await file.mv(picture);
        }
        const post = new Post({
            title,
            text,
            picture,
            likes: [],
            comments: [],
            userId,
        });
        await post.save();
        await indexPost(post);
        res.status(201).json(post);
    }
    catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// GET post by id
router.get(process.env.POSTS_ROUTE + "/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("comments")
            .populate("likes");
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        res.json(post);
    }
    catch (error) {
        console.error("Get post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// UPDATE post
router.put(process.env.POSTS_ROUTE + "/:id", async (req, res) => {
    try {
        const userId = req.header("X-User-Id");
        if (!userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Missing user ID" });
        }
        const post = await Post.findById(req.params.id);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        if (post.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ message: "Forbidden: You do not own this post" });
        }
        const { title, text } = req.body;
        let picture;
        if (req.files && req.files.file) {
            const file = req.files.file;
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return res.status(400).json({ message: "errors.wrong_file_format" });
            }
            const fileName = `${Date.now()}-${file.name}`;
            picture = path.join(uploadDir, fileName);
            await file.mv(picture);
            if (post.picture && fs.existsSync(post.picture)) {
                fs.unlinkSync(post.picture);
            }
        }
        post.title = title ?? post.title;
        post.text = text ?? post.text;
        if (picture)
            post.picture = picture;
        await post.save();
        await updatePostInIndex(post);
        res.json(post);
    }
    catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// DELETE post
router.delete(process.env.POSTS_ROUTE + "/:id", async (req, res) => {
    try {
        const userId = req.header("X-User-Id");
        if (!userId) {
            return res
                .status(401)
                .json({ message: "Unauthorized: Missing user ID" });
        }
        const post = await Post.findById(req.params.id);
        if (!post)
            return res.status(404).json({ message: "Post not found" });
        if (post.userId.toString() !== userId) {
            return res
                .status(403)
                .json({ message: "Forbidden: You do not own this post" });
        }
        // Delete picture file if exists
        if (post.picture && fs.existsSync(post.picture)) {
            fs.unlinkSync(post.picture);
        }
        await Post.findByIdAndDelete(req.params.id);
        await deletePostFromIndex(req.params.id);
        res.json({ message: "Post deleted" });
    }
    catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
// SEARCH posts
router.get(process.env.POSTS_ROUTE + "/search", async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ message: "Query param 'q' is required" });
        }
        const results = await searchPosts(query);
        res.json(results);
    }
    catch (error) {
        console.error("Search posts error:", error);
        res.status(500).json({ message: "Server error" });
    }
});
export { router };
