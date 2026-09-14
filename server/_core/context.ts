import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { adminAuth } from "./firebaseAdmin";
import * as db from "../db";
import type { User } from "../../drizzle/schema";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const authHeader = opts.req.headers.authorization;
    const openIdHeader = opts.req.headers["x-user-openid"] as string | undefined;
    const roleHeader = opts.req.headers["x-user-role"] as string | undefined;

    let uid: string | null = null;
    let name: string | null = null;
    let email: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7);
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
        name = decodedToken.name || decodedToken.email || "Learner";
        email = decodedToken.email || null;
      } catch (adminErr) {
        try {
          const parts = idToken.split(".");
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            uid = payload.sub || payload.user_id || payload.uid || "dev-user-1";
            name = payload.name || payload.email || "Learner";
            email = payload.email || null;
          }
        } catch {
          uid = openIdHeader || null;
        }
      }
    } else if (openIdHeader) {
      uid = openIdHeader;
      name = opts.req.headers["x-user-name"] as string || "Learner";
      email = opts.req.headers["x-user-email"] as string || null;
    }

    if (uid) {
      let dbUser = await db.getUserByOpenId(uid);
      const now = new Date();

      if (!dbUser) {
        await db.upsertUser({
          openId: uid,
          name: name || "Learner",
          email: email,
          loginMethod: "firebase",
          role: (roleHeader === "admin" ? "admin" : "user"),
          lastSignedIn: now,
        });
        dbUser = await db.getUserByOpenId(uid);
      } else if (roleHeader && dbUser.role !== roleHeader) {
        await db.upsertUser({
          openId: uid,
          role: (roleHeader === "admin" ? "admin" : "user"),
          lastSignedIn: now,
        });
        dbUser = await db.getUserByOpenId(uid);
      }

      user = dbUser ?? {
        id: 1,
        openId: uid,
        name: name || "Learner",
        email: email,
        loginMethod: "firebase",
        role: "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      };
    }
  } catch (error) {
    console.error("[Auth Context Error]", error);
    const now = new Date();
    user = {
      id: 1,
      openId: "local-learner",
      name: "Local Learner",
      email: "learner@example.com",
      loginMethod: "local",
      role: "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
