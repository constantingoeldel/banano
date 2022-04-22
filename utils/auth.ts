import { User } from "../types";

export const ironOptions = {
  cookieName: "banano-auth",
  password: process.env.COOKIE_SECRET!,
  // secure: true should be used in production (HTTPS) but can't be used in development (HTTP)
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

declare module "iron-session" {
  interface IronSessionData {
    user?: User;
  }
}
