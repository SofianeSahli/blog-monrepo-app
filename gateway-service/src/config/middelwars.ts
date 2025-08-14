import { RedisStore } from "connect-redis";
import express from "express";
import session from "express-session";
import { createClient } from "redis";
export const redisClient = createClient({ url: process.env.REDIS_URL });
(async () => await redisClient.connect())();

export const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.session?.userId) {
    return next();
  }
  res.status(401).json({ message: "errors.unauthorized" });
};

export const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
    secure: false,
  },
  rolling: true,
});
