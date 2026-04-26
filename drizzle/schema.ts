import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float } from "drizzle-orm/mysql-core";

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

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const verifications = mysqlTable("verifications", {
  id: int("id").autoincrement().primaryKey(),
  claim: text("claim").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  verdict: mysqlEnum("verdict", ["Verified", "Suspicious", "False"]),
  reliabilityScore: float("reliabilityScore"),
  summary: text("summary"),
  txHash: varchar("txHash", { length: 128 }),
  cosmosAddress: varchar("cosmosAddress", { length: 128 }),
  anchoredAt: timestamp("anchoredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Verification = typeof verifications.$inferSelect;
export type InsertVerification = typeof verifications.$inferInsert;

export const agentResults = mysqlTable("agent_results", {
  id: int("id").autoincrement().primaryKey(),
  verificationId: int("verificationId").notNull(),
  agentType: mysqlEnum("agentType", ["source", "logic", "crosscheck"]).notNull(),
  agentName: varchar("agentName", { length: 128 }).notNull(),
  score: float("score").notNull(),
  findings: text("findings").notNull(),
  sources: text("sources"),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentResult = typeof agentResults.$inferSelect;
export type InsertAgentResult = typeof agentResults.$inferInsert;
