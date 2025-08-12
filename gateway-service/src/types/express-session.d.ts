import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare module "http" {
  interface IncomingMessage {
    session?: import("express-session").Session &
      Partial<import("express-session").SessionData>;
  }
}
