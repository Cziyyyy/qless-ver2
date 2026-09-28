import { createClient, Client } from '@libsql/client';

declare global {
  // Preserve singleton client instance across Next.js dev reloads
  var _libsqlClient: Client | undefined;
}

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export const client: Client =
  globalThis._libsqlClient ||
  createClient({
    url,
    authToken: url.startsWith('file:') ? undefined : authToken,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._libsqlClient = client;
}

export function transformSql(sql: string): string {
  let s = sql;

  // 1. Replace CURDATE() with DATE('now', 'localtime')
  s = s.replace(/\bCURDATE\(\)/gi, "DATE('now', 'localtime')");

  // 2. Replace NOW() with DATETIME('now', 'localtime')
  s = s.replace(/\bNOW\(\)/gi, "DATETIME('now', 'localtime')");

  // 3. Remove FOR UPDATE (SQLite handles concurrency via transaction locking)
  s = s.replace(/\bFOR UPDATE\b/gi, '');

  // 4. Transform DATE_FORMAT(expr, format)
  s = s.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d %H:%i'\s*\)/gi, "strftime('%Y-%m-%d %H:%M', $1)");
  s = s.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*'%Y-%m-%d'\s*\)/gi, "strftime('%Y-%m-%d', $1)");

  // 5. Transform LPAD(expr, len, '0') -> printf('%03d', expr)
  s = s.replace(/LPAD\s*\(\s*([^,]+)\s*,\s*(\d+)\s*,\s*'0'\s*\)/gi, (match, expr, len) => {
    return `printf('%0${len}d', ${expr})`;
  });

  // 6. Transform DESCRIBE table -> PRAGMA table_info(table)
  s = s.replace(/^DESCRIBE\s+([a-zA-Z0-9_]+)/gi, 'PRAGMA table_info($1)');

  return s;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const transformedSql = transformSql(sql);
  const rs = await client.execute({ sql: transformedSql, args: params });

  const rows = rs.rows.map((row: any) => {
    const obj: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      obj[key] = row[key];
    }
    return obj;
  });

  const insertId = rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : 0;
  const affectedRows = rs.rowsAffected || 0;

  const result: any = rows;
  result.insertId = insertId;
  result.affectedRows = affectedRows;

  return result as T;
}

export async function getConnection() {
  let tx: any = null;
  return {
    async beginTransaction() {
      tx = await client.transaction('write');
    },
    async execute(sql: string, params: any[] = []) {
      const execClient = tx || client;
      const transformedSql = transformSql(sql);
      const rs = await execClient.execute({ sql: transformedSql, args: params });

      const rows = rs.rows.map((row: any) => {
        const obj: Record<string, any> = {};
        for (const key of Object.keys(row)) {
          obj[key] = row[key];
        }
        return obj;
      });

      const insertId = rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : 0;
      const affectedRows = rs.rowsAffected || 0;

      const result: any = rows;
      result.insertId = insertId;
      result.affectedRows = affectedRows;

      return [result, null];
    },
    async query(sql: string, params: any[] = []) {
      return this.execute(sql, params);
    },
    async commit() {
      if (tx) {
        await tx.commit();
        tx = null;
      }
    },
    async rollback() {
      if (tx) {
        try {
          await tx.rollback();
        } catch (e) {
          // ignore if transaction already completed/closed
        }
        tx = null;
      }
    },
    release() {
      tx = null;
    },
  };
}

export const pool = {
  query: async <T = any>(sql: string, params: any[] = []) => {
    const res = await query<T>(sql, params);
    return [res, null] as any;
  },
  getConnection,
};

export default pool;