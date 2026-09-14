import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const learnerProfiles = mysqlTable("learnerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  fullName: varchar("fullName", { length: 160 }).notNull(),
  learnerType: varchar("learnerType", { length: 80 }).notNull(),
  roleTitle: varchar("roleTitle", { length: 160 }).notNull(),
  organization: varchar("organization", { length: 200 }).notNull(),
  experience: varchar("experience", { length: 80 }).notNull(),
  background: text("background").notNull(),
  domain: varchar("domain", { length: 120 }).notNull(),
  currentSkills: text("currentSkills").notNull(),
  interests: text("interests").notNull(),
  goals: text("goals").notNull(),
  workType: text("workType").notNull(),
  onboardingComplete: boolean("onboardingComplete").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const competencyStates = mysqlTable("competencyStates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  competencyId: varchar("competencyId", { length: 80 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  domain: varchar("domain", { length: 120 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description").notNull(),
  currentScore: int("currentScore").default(0).notNull(),
  targetScore: int("targetScore").default(75).notNull(),
  status: varchar("status", { length: 40 }).default("NOT STARTED").notNull(),
  prerequisites: text("prerequisites").notNull(),
  evidenceCount: int("evidenceCount").default(0).notNull(),
  rationale: text("rationale").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const learningEvents = mysqlTable("learningEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topicId: varchar("topicId", { length: 80 }).notNull(),
  competencyId: varchar("competencyId", { length: 80 }).notNull(),
  source: varchar("source", { length: 80 }).notNull(),
  startedAt: timestamp("startedAt").notNull(),
  completedAt: timestamp("completedAt"),
  timeSpent: int("timeSpent").default(0).notNull(),
  contentCovered: text("contentCovered").notNull(),
});

export const assessmentAttempts = mysqlTable("assessmentAttempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentType: varchar("assessmentType", { length: 40 }).notNull(),
  score: int("score").notNull(),
  answersJson: text("answersJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questionHash: varchar("questionHash", { length: 128 }).notNull(),
  competencyId: varchar("competencyId", { length: 80 }).notNull(),
  questionText: text("questionText").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const studyMaterials = mysqlTable("studyMaterials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 240 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  storageKey: varchar("storageKey", { length: 320 }),
  textSnippet: text("textSnippet"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  competencyId: varchar("competencyId", { length: 80 }).notNull(),
  evidenceType: varchar("evidenceType", { length: 80 }).notNull(),
  score: int("score").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type CompetencyState = typeof competencyStates.$inferSelect;
export type LearningEvent = typeof learningEvents.$inferSelect;
export type Evidence = typeof evidence.$inferSelect;
