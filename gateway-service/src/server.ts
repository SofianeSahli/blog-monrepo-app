import express from "express";
import session from "express-session";
import cors from "cors";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import dotenv from "dotenv";
import path from "path";

dotenv.config();
const app = express();
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    credentials: true,
  })
);
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      secure: false, // set true in prod + https
    },
    rolling: true,
  })
);

const isAuthenticated = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "errors.unauthorized" });
  }
};

const proxyOptions: Options = {
  selfHandleResponse: false,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq: any, req: any, res) => {
      if (req.session?.userId) {
        proxyReq.setHeader("X-User-Id", req.session.userId);
      }
    },

    error: (err) => {
      console.log(err);
    },
  },
};

app.use(
  process.env.AUTH_ROUTE!,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.USER_SERVICE_URL!,
  })
);

app.use(
  process.env.PROFILE_ROUTES!,
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.USER_SERVICE_URL!,
  })
);

app.use(
  "/api/articles",
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: "/api/articles",
  })
);
app.use(
  "/api/notifications",
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: "/api/notifications",
  })
);

app.use(
  "/uploads/profile-pictures",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL!,
    changeOrigin: true,
    pathRewrite: {
      "^/uploads/profile-pictures": "/uploads/profile-pictures",
    },
  })
);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
