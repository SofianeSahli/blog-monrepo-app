import { Request, Response } from "express";
import { IUser, User } from "../models/User";
import path from "path";
import express from "express";
import { UploadedFile } from "express-fileupload";
import fs from "fs";
const router = express.Router();

router.get(
  (process.env.PROFILE_ROUTE || "/profile") + "/:id",
  async (req: Request, res: Response) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  process.env.PROFILE_ROUTE || "/profile",
  async (req: Request, res: Response) => {
    try {
      const userId = (req.user as IUser)?.id;
      const { firstName, email, lastName } = req.body;
      const updateData: Partial<IUser> = {};

      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      console.log(req.body);

      if (req.files && req.files.file) {
        const file = req.files.file as UploadedFile;

        const allowed = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(file.mimetype)) {
          return res.status(400).send({ message: "errors.wrong_file_format" });
        }

        const uploadDir = path.join(
          __dirname,
          "../../uploads/profile-pictures"
        );
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${Date.now()}-${file.name}`;
        const savePath = path.join(uploadDir, fileName);

        await file.mv(savePath);

        updateData.profilePicture = `/uploads/profile-pictures/${fileName}`;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
        new: true,
      }).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get(process.env.PROFILE_ROUTE || "/profile", (req, res) => {
  const user = req.user as IUser;

  if (!user) {
    return res.status(404).json({ message: "errors.profile_not_found" });
  }
  const userSafe = { ...(user.toObject?.() || user) };
  delete userSafe.password;

  res.json(userSafe);
});

export { router };
