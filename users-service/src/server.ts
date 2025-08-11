import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import passport from "./conf/passport";
import authRoutes from "./routes/auth";
import connectRedis from "connect-redis";
import { createClient } from "redis";

dotenv.config();
const RedisStore = connectRedis(session);
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.connect().catch(console.error);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  })
);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // prevent JS access to cookies
      secure: false, // true in production with HTTPS
      sameSite: "lax", // avoid CSRF issues
      maxAge: process.env.JWT_EXPIRATION
        ? parseInt(process.env.JWT_EXPIRATION)
        : 3600000, // 1 hour
    },
    rolling: true, // Reset cookie Max-Age on every response
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(process.env.AUTH_ROUTE || "/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Users Service running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));
