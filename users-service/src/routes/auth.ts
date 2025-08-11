import express, { Router } from "express";
import passport from "../conf/passport";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";
import dotenv from "dotenv";

dotenv.config();

const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRATION: number = process.env.JWT_EXPIRATION
  ? parseInt(process.env.JWT_EXPIRATION)
  : 3600000;
const JWT_EXPIRATION_SECONDS = Math.floor(JWT_EXPIRATION / 1000);

router.post(process.env.REGISTER_ROUTE || "/register", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "errors.params_missing" });
    }
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "errors.params_missing" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "errors.invalid_email_format" });
    }
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({ message: "errors.invalid_credential" });
    }
    const user = new User({ email, password });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post(process.env.LOGIN_ROUTE || "/login", (req, res, next) => {
  console.log(req.body);
  passport.authenticate(
    "local",
    (
      err: Error | null,
      user: IUser | false | undefined,
      info: { message?: string } | string | undefined
    ) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);

      req.logIn(user, { session: true }, (err) => {
        if (err) return next(err);

        const token = jwt.sign(
          { sub: user.id, roles: user.roles },
          JWT_SECRET,
          {
            expiresIn: JWT_EXPIRATION_SECONDS,
          }
        );

        res.json({ message: "Logged in", token });
      });
    }
  )(req, res, next);
});

router.post("/logout", (req, res) => {
  req.logout(() => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });
});

router.get(
  process.env.PROFILE_ROUTE || "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const user = req.user as any;
    res.json({ email: user.email, roles: user.roles });
  }
);

export default router;
