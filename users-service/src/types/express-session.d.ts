import session from "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string; // or your actual type
  }
}

declare module "express-serve-static-core" {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}
