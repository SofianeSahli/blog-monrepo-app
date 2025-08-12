import express from "express";
import session from "express-session";
import mongoose from "mongoose";
import dotenv from "dotenv";
import passport from "./conf/passport";
import authRoutes from "./routes/auth";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import { router as profileRouter } from "./routes/profile";
import fileUpload from "express-fileupload";
import path from "path";

dotenv.config();
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.connect().catch(console.error);

const app = express();
const PORT = process.env.USER_PORT || 4000;
app.use(
  fileUpload({
    useTempFiles: true,
    createParentPath: true,
    limits: { fileSize: 2 * 1024 * 1024 },
    tempFileDir: "/tmp/",
  })
);
app.use(express.urlencoded({ extended: true }));
//app.use(express.json());

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: process.env.JWT_EXPIRATION
        ? parseInt(process.env.JWT_EXPIRATION)
        : 3600000,
    },
    rolling: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(
  "/",
  express.static(path.join(__dirname, "../uploads/profile-pictures"))
);
app.use("/", [authRoutes, profileRouter]);

console.log(process.env.AUTH_ROUTE, process.env.REGISTER_ROUTE);

mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Users Service running on port ${PORT}`)
    );
  })
  .catch((err) => console.error(err));
