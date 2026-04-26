import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, verifications, agentResults, InsertVerification, InsertAgentResult } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// --- Verification helpers ---

export async function createVerification(claim: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(verifications).values({ claim, status: "pending" });
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateVerificationStatus(
  id: number,
  data: Partial<Pick<InsertVerification, "status" | "verdict" | "reliabilityScore" | "summary">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(verifications).set(data).where(eq(verifications.id, id));
}

export async function getVerificationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(verifications).where(eq(verifications.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getVerificationHistory(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(verifications).orderBy(desc(verifications.createdAt)).limit(limit);
}

// --- Agent result helpers ---

export async function createAgentResult(data: InsertAgentResult) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agentResults).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  return insertId as number;
}

export async function updateAgentResult(
  id: number,
  data: Partial<Pick<InsertAgentResult, "score" | "findings" | "sources" | "status">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(agentResults).set(data).where(eq(agentResults.id, id));
}

export async function getAgentResultsByVerificationId(verificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(agentResults).where(eq(agentResults.verificationId, verificationId));
}

// --- Cosmos blockchain anchor helpers ---

export async function anchorVerificationOnChain(
  id: number,
  txHash: string,
  cosmosAddress: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(verifications)
    .set({ txHash, cosmosAddress, anchoredAt: new Date() })
    .where(eq(verifications.id, id));
}
