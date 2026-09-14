import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const now = new Date();
  const user: AuthenticatedUser = {
    id: 42,
    openId: "competency-test-user",
    email: "learner@example.com",
    name: "Test Learner",
    loginMethod: "manus",
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("workspace.catalog", () => {
  it("returns a dependency-aware competency framework for the learner journey", async () => {
    const caller = appRouter.createCaller(createContext());
    const catalog = await caller.workspace.catalog();

    expect(catalog.length).toBeGreaterThanOrEqual(8);
    expect(catalog[0]).toMatchObject({ id: "python-fundamentals", category: "REQUIRED FOR ROLE" });
    expect(catalog.find(item => item.id === "data-processing")?.prerequisites).toBe("Python Fundamentals");
    expect(catalog.some(item => item.category === "FUTURE / ADVANCED")).toBe(true);
  });
});

describe("workspace.get", () => {
  it("returns a safe empty state when a database is unavailable", async () => {
    const caller = appRouter.createCaller(createContext());
    const workspace = await caller.workspace.get();

    expect(workspace).toEqual({ profile: undefined, competencies: [], events: [], evidence: [], materials: [] });
  });
});

describe("profile.get", () => {
  it("returns null rather than undefined for a new learner", async () => {
    const caller = appRouter.createCaller(createContext());
    const profile = await caller.profile.get();

    expect(profile).toBeNull();
  });
});
