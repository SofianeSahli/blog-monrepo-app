import express, { Router } from "express";
import passport from "../conf/passport";
import jwt from "jsonwebtoken";
import { IUser, User } from "../models/User";
import dotenv from "dotenv";
import {
  isRefreshTokenValidMongo,
  revokeRefreshTokenMongo,
  saveRefreshTokenMongo,
} from "../conf/jwt.utils";

dotenv.config();

const router: Router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRATION_MS: number = process.env.JWT_EXPIRATION
  ? parseInt(process.env.JWT_EXPIRATION)
  : 3600000;
const JWT_EXPIRATION_SEC = Math.floor(JWT_EXPIRATION_MS / 1000);
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "refresh_secret";
const REFRESH_TOKEN_EXPIRATION_SEC = process.env.REFRESH_TOKEN_EXPIRATION
  ? parseInt(process.env.REFRESH_TOKEN_EXPIRATION)
  : 7 * 24 * 60 * 60; // 7 days

router.post(process.env.REGISTER_ROUTE || "/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "errors.params_missing" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "errors.invalid_email_format" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "errors.email_already_exists" });
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
  passport.authenticate("local", async (err: any, user: IUser, info: any) => {
    if (err) return next(err);
    if (!user) return res.status(401).json(info);

    req.logIn(user, { session: true }, async (err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      const refreshToken = jwt.sign(
        { sub: user.id, roles: user.roles },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRATION_SEC }
      );
      await saveRefreshTokenMongo(
        refreshToken,
        user.id,
        REFRESH_TOKEN_EXPIRATION_SEC
      );

      req.session.save(() => {
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: REFRESH_TOKEN_EXPIRATION_SEC * 1000,
        });

        res.json({ message: "Logged in" });
      });
    });
  })(req, res, next);
});

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  if (!(await isRefreshTokenValidMongo(refreshToken))) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  jwt.verify(
    refreshToken,
    REFRESH_TOKEN_SECRET,
    async (err: any, decoded: any) => {
      if (err)
        return res
          .status(403)
          .json({ message: "Invalid or expired refresh token" });

      const userPayload = decoded as { sub: string; roles: string[] };

      const newRefreshToken = jwt.sign(
        { sub: userPayload.sub, roles: userPayload.roles },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRATION_SEC }
      );

      await revokeRefreshTokenMongo(refreshToken);
      await saveRefreshTokenMongo(
        newRefreshToken,
        userPayload.sub,
        REFRESH_TOKEN_EXPIRATION_SEC
      );

      if (req.session) {
        req.session.userId = userPayload.sub;
        req.session.save(() => {
          res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: REFRESH_TOKEN_EXPIRATION_SEC * 1000,
          });

          res.json({ message: "Token refreshed" });
        });
      } else {
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: REFRESH_TOKEN_EXPIRATION_SEC * 1000,
        });
        res.json({ message: "Token refreshed" });
      }
    }
  );
});

// Logout route
router.post(process.env.LOGOUT_ROUTE || "/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session?.destroy(() => {
      res.clearCookie("refreshToken");
      res.json({ message: "Logged out" });
    });
  });
});

export default router;
