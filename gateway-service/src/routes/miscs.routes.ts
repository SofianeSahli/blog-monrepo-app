import express from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { isAuthenticated } from "../config/middelwars";
export const router = express();

const proxyOptions: Options = {
  selfHandleResponse: false,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq: any, req: any) => {
      if (req.session?.userId) {
        proxyReq.setHeader("X-User-Id", req.session.userId);
      }
    },
  },
};

router.use(
  process.env.AUTH_ROUTE!,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.USER_SERVICE_URL!,
  })
);

router.use(
  process.env.PROFILE_ROUTES!,
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.USER_SERVICE_URL!,
  })
);

router.use(
  process.env.POSTS_SERVICE_ROUTE!,
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.POSTS_SERVICE_URL!,
  })
);

router.use(
  process.env.NOTIFICATIONS_ROUTE!,
  isAuthenticated,
  createProxyMiddleware({
    ...proxyOptions,
    target: process.env.NOTIFICATIONS_SERVICE_URL!,
  })
);

router.use(
  "/uploads/profile-pictures",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL!,
    changeOrigin: true,
    pathRewrite: {
      "^/uploads/profile-pictures": "/uploads/profile-pictures",
    },
  })
);

router.use(
  "/uploads/posts-file",
  createProxyMiddleware({
    target: process.env.POSTS_SERVICE_URL!,
    changeOrigin: true,
    pathRewrite: {
      "^/uploads/profile-pictures": "/uploads/profile-pictures",
    },
  })
);
