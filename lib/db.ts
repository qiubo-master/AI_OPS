import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { Course, initialCourse } from "./course";
import type { BusinessKind, BusinessRun } from "./business";

const globalForDb = globalThis as unknown as { aiOpsPool?: Pool; aiOpsSchemaReady?: Promise<void> };

function pool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  globalForDb.aiOpsPool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return globalForDb.aiOpsPool;
}

async function ensureSchema() {
  globalForDb.aiOpsSchemaReady ??= (async () => {
    const db = pool();
    await db.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        content JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS business_runs (
        id UUID PRIMARY KEY,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        input JSONB NOT NULL,
        result JSONB NOT NULL,
        mode TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        model_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query("CREATE INDEX IF NOT EXISTS business_runs_kind_created_idx ON business_runs(kind, created_at DESC)");
    const count = await db.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM courses");
    if (count.rows[0]?.count === "0") await insertCourse(initialCourse);
  })();
  return globalForDb.aiOpsSchemaReady;
}

function fromRow(row: { id: string; content: Course; status: Course["status"]; version: number; updated_at: Date }): Course {
  return { ...row.content, id: row.id, status: row.status, version: row.version, updatedAt: row.updated_at.toISOString() };
}

async function insertCourse(course: Course) {
  const id = course.id ?? randomUUID();
  const content = { ...course };
  delete content.id;
  delete content.status;
  delete content.version;
  delete content.updatedAt;
  const result = await pool().query(
    `INSERT INTO courses (id, title, content, status) VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, content, status, version, updated_at`,
    [id, course.title, JSON.stringify(content), course.status ?? "draft"],
  );
  return fromRow(result.rows[0]);
}

export async function latestCourse() {
  await ensureSchema();
  const result = await pool().query(
    "SELECT id, content, status, version, updated_at FROM courses ORDER BY updated_at DESC LIMIT 1",
  );
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

export async function listCourses() {
  await ensureSchema();
  const result = await pool().query(
    "SELECT id, content, status, version, updated_at FROM courses ORDER BY updated_at DESC LIMIT 20",
  );
  return result.rows.map(fromRow);
}

export async function saveCourse(course: Course) {
  await ensureSchema();
  if (!course.id) return insertCourse(course);
  const content = { ...course };
  delete content.id;
  delete content.status;
  delete content.version;
  delete content.updatedAt;
  const result = await pool().query(
    `UPDATE courses SET title=$2, content=$3::jsonb, status=$4, version=version+1, updated_at=NOW()
     WHERE id=$1 RETURNING id, content, status, version, updated_at`,
    [course.id, course.title, JSON.stringify(content), course.status ?? "draft"],
  );
  return result.rows[0] ? fromRow(result.rows[0]) : insertCourse(course);
}

export async function databaseReady() {
  await ensureSchema();
  await pool().query("SELECT 1");
  return true;
}

export async function saveBusinessRun<T>(run: Omit<BusinessRun<T>, "id" | "createdAt" | "status">) {
  await ensureSchema();
  const id = randomUUID();
  const result = await pool().query(
    `INSERT INTO business_runs (id, kind, status, input, result, mode, trace_id, model_versions)
     VALUES ($1,$2,'completed',$3::jsonb,$4::jsonb,$5,$6,$7::jsonb)
     RETURNING created_at`,
    [id, run.kind, JSON.stringify(run.input), JSON.stringify(run.result), run.mode, run.traceId, JSON.stringify(run.modelVersions)],
  );
  return { ...run, id, status: "completed" as const, createdAt: result.rows[0].created_at.toISOString() };
}

export async function listBusinessRuns(kind?: BusinessKind) {
  await ensureSchema();
  const result = kind
    ? await pool().query("SELECT * FROM business_runs WHERE kind=$1 ORDER BY created_at DESC LIMIT 20", [kind])
    : await pool().query("SELECT * FROM business_runs ORDER BY created_at DESC LIMIT 50");
  return result.rows.map((row) => ({ id: row.id, kind: row.kind, status: row.status, input: row.input, result: row.result, mode: row.mode, traceId: row.trace_id, modelVersions: row.model_versions, createdAt: row.created_at.toISOString() }));
}
