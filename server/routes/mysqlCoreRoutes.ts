import express, { NextFunction, Request, Response, Router } from 'express';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import {
  checkMySqlHealth,
  executeStatement,
  getMySqlPool,
  queryRows,
  withMySqlTransaction,
} from '../db/mysqlPool';

export interface MySqlCoreRouterContext {
  getDb: () => any;
  persist: () => void;
  requireAuth: (req: any, res: Response, next: NextFunction) => void;
  isCentralSuperAdmin: (role: string) => boolean;
  isSchoolAuthorized: (schoolId: string | null | undefined, session: any) => boolean;
  hashPassword: (password: string) => { salt: string; hash: string };
}

function parsePagination(query: Request['query']) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize || query.limit) || 25));
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset, search, sortOrder };
}

function toNumericId(val: unknown): number | null {
  if (typeof val === 'number' && Number.isInteger(val) && val > 0) return val;
  if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
    const parsed = Number(val.trim());
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

async function writeMySqlAuditLog(
  connOrPool: PoolConnection | null,
  session: any,
  entry: {
    organizationId?: number | null;
    schoolId?: number | null;
    campusId?: number | null;
    moduleKey: string;
    action: 'CREATE' | 'UPDATE' | 'DEACTIVATE' | 'REACTIVATE' | 'SOFT_DELETE';
    entityType: string;
    entityId: string;
    remarks: string;
    ipAddress?: string;
  }
) {
  const sql = `
    INSERT INTO audit_logs
      (organization_id, school_id, campus_id, actor_user_id, actor_username, actor_role, module_key, action, entity_type, entity_id, remarks, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    entry.organizationId ?? null,
    entry.schoolId ?? null,
    entry.campusId ?? null,
    toNumericId(session?.sub),
    String(session?.username || 'system'),
    String(session?.role || 'Unknown'),
    entry.moduleKey,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.remarks,
    entry.ipAddress || null,
  ];
  try {
    if (connOrPool) {
      await connOrPool.execute(sql, params);
    } else {
      await executeStatement(sql, params);
    }
  } catch {
    // Audit write must not crash non-critical reads if audit_logs schema differs
  }
}

async function canUseMySql(): Promise<boolean> {
  const pool = getMySqlPool();
  if (!pool) return false;
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Phase 3 & Phase 4 REST API Router for MySQL 8 (`leaders_multischool_erp`):
 *  - GET  /api/v1/db/health
 *  - CRUD /api/v1/organizations   -> `organizations`
 *  - CRUD /api/v1/schools         -> `schools` (+ nested `campuses`)
 *  - CRUD /api/v1/campuses        -> `campuses`
 *  - CRUD /api/v1/academic-years  -> `academic_years`
 *  - CRUD /api/v1/users           -> `users` + `roles` + `user_school_access`
 *
 * Uses parameterized SQL queries with mysql2/promise when MySQL is reachable, and
 * preserves full compatibility with the existing local store when running without a local MySQL daemon.
 */
export function createMySqlCoreRouter(ctx: MySqlCoreRouterContext): Router {
  const router = express.Router();

  // -------------------------------------------------------------------------
  // 1. Database Health Check (non-destructive, zero secrets leaked)
  // -------------------------------------------------------------------------
  router.get('/db/health', async (_req: Request, res: Response) => {
    const status = await checkMySqlHealth();
    res.status(status.configured && !status.connected ? 503 : 200).json({
      ok: status.connected || !status.configured,
      engine: status.connected ? 'mysql8' : 'local-file-fallback',
      ...status,
    });
  });

  // -------------------------------------------------------------------------
  // 2. Organizations CRUD (`organizations` table)
  // -------------------------------------------------------------------------
  router.get('/organizations', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    const { page, pageSize, offset, search, sortOrder } = parsePagination(req.query);

    if (await canUseMySql()) {
      try {
        const whereClauses = ['is_deleted = 0'];
        const params: unknown[] = [];

        if (!ctx.isCentralSuperAdmin(session.role) && session.organizationId) {
          const orgNum = toNumericId(session.organizationId);
          if (orgNum) {
            whereClauses.push('id = ?');
            params.push(orgNum);
          }
        }
        if (search) {
          whereClauses.push('(name LIKE ? OR short_name LIKE ? OR code LIKE ? OR city LIKE ?)');
          const like = `%${search}%`;
          params.push(like, like, like, like);
        }

        const whereSql = whereClauses.join(' AND ');
        const countRows = await queryRows<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM organizations WHERE ${whereSql}`,
          params
        );
        const total = Number(countRows[0]?.total || 0);

        const rows = await queryRows<RowDataPacket[]>(
          `SELECT id, code, name, short_name, registration_no, email, phone, city, address, established_year, is_active, created_at, updated_at
           FROM organizations
           WHERE ${whereSql}
           ORDER BY id ${sortOrder}
           LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );

        res.json({
          storageSource: 'mysql',
          items: rows.map((r) => ({
            id: String(r.id),
            code: r.code,
            name: r.name,
            shortName: r.short_name,
            regNumber: r.registration_no || '',
            email: r.email || '',
            phone: r.phone || '',
            city: r.city || '',
            headquarters: r.city || '',
            address: r.address || '',
            establishedYear: Number(r.established_year || new Date().getFullYear()),
            isActive: Boolean(r.is_active),
            createdAt: r.created_at,
          })),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
        return;
      } catch (err) {
        res.status(500).json({
          error: err instanceof Error ? err.message : 'Failed to query organizations from MySQL.',
        });
        return;
      }
    }

    // Local store fallback
    const db = ctx.getDb();
    let list = [...(db.organizations || [])];
    if (!ctx.isCentralSuperAdmin(session.role) && session.organizationId) {
      list = list.filter((o) => o.id === session.organizationId);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.name || '').toLowerCase().includes(q) ||
          (o.code || '').toLowerCase().includes(q) ||
          (o.city || '').toLowerCase().includes(q)
      );
    }
    const total = list.length;
    res.json({
      storageSource: 'local-store',
      items: list.slice(offset, offset + pageSize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  router.post('/organizations', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    if (!ctx.isCentralSuperAdmin(session.role)) {
      res.status(403).json({ error: 'Only Central Super Admin can create organizations.' });
      return;
    }
    const { name, shortName, code, city, establishedYear, regNumber, email, phone, address } =
      req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Organization name is required.' });
      return;
    }
    const cleanName = name.trim();
    const cleanShort = (typeof shortName === 'string' && shortName.trim()) || cleanName;
    const cleanCode =
      (typeof code === 'string' && code.trim().toUpperCase()) ||
      `ORG-${Date.now().toString().slice(-4)}`;

    if (await canUseMySql()) {
      try {
        const result = await withMySqlTransaction(async (conn) => {
          const [ins] = await conn.execute<ResultSetHeader>(
            `INSERT INTO organizations
              (code, name, short_name, registration_no, email, phone, city, address, established_year, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              cleanCode,
              cleanName,
              cleanShort,
              typeof regNumber === 'string' ? regNumber.trim() : null,
              typeof email === 'string' ? email.trim() : null,
              typeof phone === 'string' ? phone.trim() : null,
              typeof city === 'string' ? city.trim() : null,
              typeof address === 'string' ? address.trim() : null,
              Number(establishedYear) || new Date().getFullYear(),
              toNumericId(session.sub),
            ]
          );
          await writeMySqlAuditLog(conn, session, {
            organizationId: ins.insertId,
            moduleKey: 'ORGANIZATION',
            action: 'CREATE',
            entityType: 'Organization',
            entityId: String(ins.insertId),
            remarks: `Created organization ${cleanName} (${cleanCode})`,
            ipAddress: req.ip,
          });
          return ins.insertId;
        });

        res.status(201).json({
          storageSource: 'mysql',
          organization: {
            id: String(result),
            code: cleanCode,
            name: cleanName,
            shortName: cleanShort,
            city: city || '',
            establishedYear: Number(establishedYear) || new Date().getFullYear(),
            regNumber: regNumber || '',
            isActive: true,
          },
        });
        return;
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          res.status(409).json({ error: `Organization code "${cleanCode}" already exists.` });
          return;
        }
        res.status(500).json({ error: err?.message || 'Failed to create organization.' });
        return;
      }
    }

    const db = ctx.getDb();
    const created = {
      id: `org-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      shortName: cleanShort,
      city: city || '',
      headquarters: city || '',
      establishedYear: Number(establishedYear) || new Date().getFullYear(),
      regNumber: regNumber || '',
      email: email || '',
      phone: phone || '',
      isActive: true,
    };
    db.organizations.push(created);
    ctx.persist();
    res.status(201).json({ storageSource: 'local-store', organization: created });
  });

  router.put('/organizations/:id', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    if (!ctx.isCentralSuperAdmin(session.role)) {
      res.status(403).json({ error: 'Only Central Super Admin can update organizations.' });
      return;
    }
    const { name, shortName, city, establishedYear, regNumber, email, phone, isActive } =
      req.body || {};

    if (await canUseMySql()) {
      const orgId = toNumericId(req.params.id);
      if (!orgId) {
        res.status(400).json({ error: 'Invalid numeric organization ID.' });
        return;
      }
      try {
        const result = await executeStatement(
          `UPDATE organizations
           SET name = COALESCE(?, name),
               short_name = COALESCE(?, short_name),
               city = COALESCE(?, city),
               established_year = COALESCE(?, established_year),
               registration_no = COALESCE(?, registration_no),
               email = COALESCE(?, email),
               phone = COALESCE(?, phone),
               is_active = COALESCE(?, is_active),
               updated_by = ?
           WHERE id = ? AND is_deleted = 0`,
          [
            typeof name === 'string' && name.trim() ? name.trim() : null,
            typeof shortName === 'string' && shortName.trim() ? shortName.trim() : null,
            typeof city === 'string' ? city.trim() : null,
            establishedYear ? Number(establishedYear) : null,
            typeof regNumber === 'string' ? regNumber.trim() : null,
            typeof email === 'string' ? email.trim() : null,
            typeof phone === 'string' ? phone.trim() : null,
            typeof isActive === 'boolean' ? (isActive ? 1 : 0) : null,
            toNumericId(session.sub),
            orgId,
          ]
        );
        if (result.affectedRows === 0) {
          res.status(404).json({ error: 'Organization not found.' });
          return;
        }
        await writeMySqlAuditLog(null, session, {
          organizationId: orgId,
          moduleKey: 'ORGANIZATION',
          action: 'UPDATE',
          entityType: 'Organization',
          entityId: String(orgId),
          remarks: `Updated organization #${orgId}`,
          ipAddress: req.ip,
        });
        res.json({ storageSource: 'mysql', success: true, id: String(orgId) });
        return;
      } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Failed to update organization.' });
        return;
      }
    }

    const db = ctx.getDb();
    const idx = (db.organizations || []).findIndex((o: any) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }
    db.organizations[idx] = { ...db.organizations[idx], ...req.body, id: req.params.id };
    ctx.persist();
    res.json({ storageSource: 'local-store', organization: db.organizations[idx] });
  });

  router.delete('/organizations/:id', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    if (!ctx.isCentralSuperAdmin(session.role)) {
      res.status(403).json({ error: 'Only Central Super Admin can deactivate organizations.' });
      return;
    }

    if (await canUseMySql()) {
      const orgId = toNumericId(req.params.id);
      if (!orgId) {
        res.status(400).json({ error: 'Invalid numeric organization ID.' });
        return;
      }
      // Soft-delete / deactivate only (strict data safety)
      const result = await executeStatement(
        `UPDATE organizations SET is_active = 0, is_deleted = 1, deleted_at = NOW(), deleted_by = ? WHERE id = ? AND is_deleted = 0`,
        [toNumericId(session.sub), orgId]
      );
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'Organization not found.' });
        return;
      }
      await writeMySqlAuditLog(null, session, {
        organizationId: orgId,
        moduleKey: 'ORGANIZATION',
        action: 'DEACTIVATE',
        entityType: 'Organization',
        entityId: String(orgId),
        remarks: `Soft-deactivated organization #${orgId}`,
        ipAddress: req.ip,
      });
      res.json({ storageSource: 'mysql', success: true });
      return;
    }

    const db = ctx.getDb();
    const idx = (db.organizations || []).findIndex((o: any) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Organization not found.' });
      return;
    }
    db.organizations[idx].isActive = false;
    ctx.persist();
    res.json({ storageSource: 'local-store', success: true });
  });

  // -------------------------------------------------------------------------
  // 3. Schools CRUD (`schools` + nested `campuses` tables)
  // -------------------------------------------------------------------------
  router.get('/schools', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    const { page, pageSize, offset, search, sortOrder } = parsePagination(req.query);
    const organizationIdFilter =
      typeof req.query.organizationId === 'string' && req.query.organizationId !== 'all'
        ? req.query.organizationId
        : null;

    if (await canUseMySql()) {
      try {
        const whereClauses = ['s.is_deleted = 0'];
        const params: unknown[] = [];

        if (organizationIdFilter) {
          const orgNum = toNumericId(organizationIdFilter);
          if (orgNum) {
            whereClauses.push('s.organization_id = ?');
            params.push(orgNum);
          }
        }
        if (search) {
          whereClauses.push('(s.name LIKE ? OR s.short_name LIKE ? OR s.code LIKE ? OR s.affiliation_no LIKE ?)');
          const like = `%${search}%`;
          params.push(like, like, like, like);
        }

        // Multi-school tenant enforcement on SQL query
        if (!ctx.isCentralSuperAdmin(session.role)) {
          const allowedNumericIds: number[] = [];
          if (Array.isArray(session.schoolIds) && session.schoolIds.length > 0) {
            for (const sid of session.schoolIds) {
              const n = toNumericId(sid);
              if (n) allowedNumericIds.push(n);
            }
          } else if (session.schoolId && session.schoolId !== 'all') {
            const n = toNumericId(session.schoolId);
            if (n) allowedNumericIds.push(n);
          }

          if (allowedNumericIds.length > 0) {
            whereClauses.push(`s.id IN (${allowedNumericIds.map(() => '?').join(',')})`);
            params.push(...allowedNumericIds);
          } else if (session.organizationId) {
            const orgNum = toNumericId(session.organizationId);
            if (orgNum) {
              whereClauses.push('s.organization_id = ?');
              params.push(orgNum);
            }
          }
        }

        const whereSql = whereClauses.join(' AND ');
        const countRows = await queryRows<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM schools s WHERE ${whereSql}`,
          params
        );
        const total = Number(countRows[0]?.total || 0);

        const schoolRows = await queryRows<RowDataPacket[]>(
          `SELECT s.id, s.organization_id, o.name AS organization_name, s.code, s.name, s.short_name,
                  s.board, s.affiliation_no, s.email, s.phone, s.website, s.is_active, s.created_at
           FROM schools s
           INNER JOIN organizations o ON o.id = s.organization_id
           WHERE ${whereSql}
           ORDER BY s.id ${sortOrder}
           LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );

        const schoolIds = schoolRows.map((r) => Number(r.id));
        let campusRows: RowDataPacket[] = [];
        if (schoolIds.length > 0) {
          campusRows = await queryRows<RowDataPacket[]>(
            `SELECT id, organization_id, school_id, code, name, city, address, phone, principal_name, is_active
             FROM campuses
             WHERE is_deleted = 0 AND school_id IN (${schoolIds.map(() => '?').join(',')})
             ORDER BY id ASC`,
            schoolIds
          );
        }

        const items = schoolRows.map((s) => ({
          id: String(s.id),
          organizationId: String(s.organization_id),
          organizationName: s.organization_name,
          code: s.code,
          name: s.name,
          shortName: s.short_name,
          board: s.board,
          affiliationNo: s.affiliation_no || '',
          email: s.email || '',
          phone: s.phone || '',
          website: s.website || '',
          isActive: Boolean(s.is_active),
          campuses: campusRows
            .filter((c) => Number(c.school_id) === Number(s.id))
            .map((c) => ({
              id: String(c.id),
              name: c.name,
              code: c.code,
              city: c.city,
              address: c.address || '',
              principalName: c.principal_name || '',
              studentCount: 0,
              staffCount: 0,
              attendanceRate: 0,
              staffAttendanceRate: 0,
              feeCollectedLakhs: 0,
              feeTargetLakhs: 0,
              pendingAdmissions: 0,
              appUsers: 0,
            })),
        }));

        res.json({
          storageSource: 'mysql',
          items,
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
        return;
      } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Failed to query schools from MySQL.' });
        return;
      }
    }

    const db = ctx.getDb();
    let list = [...(db.schools || [])];
    if (!ctx.isCentralSuperAdmin(session.role)) {
      list = list.filter((s) => ctx.isSchoolAuthorized(s.id, session));
    }
    if (organizationIdFilter) {
      list = list.filter((s) => s.organizationId === organizationIdFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          (s.name || '').toLowerCase().includes(q) ||
          (s.shortName || '').toLowerCase().includes(q) ||
          (s.board || '').toLowerCase().includes(q)
      );
    }
    const total = list.length;
    res.json({
      storageSource: 'local-store',
      items: list.slice(offset, offset + pageSize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  router.post('/schools', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    if (
      !ctx.isCentralSuperAdmin(session.role) &&
      session.role !== 'Organization Administrator'
    ) {
      res.status(403).json({ error: 'Only Central Super Admin or Organization Admin can create schools.' });
      return;
    }

    const { organizationId, name, shortName, code, board, affiliationNo, email, phone, website } =
      req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'School name is required.' });
      return;
    }

    const cleanName = name.trim();
    const cleanShort = (typeof shortName === 'string' && shortName.trim()) || cleanName;
    const cleanCode =
      (typeof code === 'string' && code.trim().toUpperCase()) ||
      `SCH-${Date.now().toString().slice(-4)}`;
    const validBoards = new Set(['CBSE', 'ICSE', 'IB', 'Cambridge IGCSE', 'State Board']);
    const resolvedBoard = validBoards.has(board) ? board : 'CBSE';

    if (await canUseMySql()) {
      const orgNum = toNumericId(organizationId);
      if (!orgNum) {
        res.status(400).json({ error: 'A valid numeric organizationId is required.' });
        return;
      }
      try {
        const insertId = await withMySqlTransaction(async (conn) => {
          const [ins] = await conn.execute<ResultSetHeader>(
            `INSERT INTO schools
              (organization_id, code, name, short_name, board, affiliation_no, email, phone, website, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              orgNum,
              cleanCode,
              cleanName,
              cleanShort,
              resolvedBoard,
              typeof affiliationNo === 'string' ? affiliationNo.trim() : null,
              typeof email === 'string' ? email.trim() : null,
              typeof phone === 'string' ? phone.trim() : null,
              typeof website === 'string' ? website.trim() : null,
              toNumericId(session.sub),
            ]
          );
          await writeMySqlAuditLog(conn, session, {
            organizationId: orgNum,
            schoolId: ins.insertId,
            moduleKey: 'ORGANIZATION',
            action: 'CREATE',
            entityType: 'School',
            entityId: String(ins.insertId),
            remarks: `Created school ${cleanName} (${cleanCode})`,
            ipAddress: req.ip,
          });
          return ins.insertId;
        });

        res.status(201).json({
          storageSource: 'mysql',
          school: {
            id: String(insertId),
            organizationId: String(orgNum),
            code: cleanCode,
            name: cleanName,
            shortName: cleanShort,
            board: resolvedBoard,
            affiliationNo: affiliationNo || '',
            campuses: [],
          },
        });
        return;
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          res.status(409).json({ error: `School code "${cleanCode}" already exists in this organization.` });
          return;
        }
        res.status(500).json({ error: err?.message || 'Failed to create school.' });
        return;
      }
    }

    const db = ctx.getDb();
    const org = (db.organizations || []).find((o: any) => o.id === organizationId);
    const created = {
      id: `sch-${Date.now()}`,
      organizationId: organizationId || '',
      organizationName: org?.name || '',
      code: cleanCode,
      name: cleanName,
      shortName: cleanShort,
      board: resolvedBoard,
      affiliationNo: affiliationNo || '',
      campuses: [],
    };
    db.schools.push(created);
    ctx.persist();
    res.status(201).json({ storageSource: 'local-store', school: created });
  });

  // -------------------------------------------------------------------------
  // 4. Campuses CRUD (`campuses` table)
  // -------------------------------------------------------------------------
  router.post('/campuses', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    const { organizationId, schoolId, name, code, city, address, phone, principalName } =
      req.body || {};

    if (!ctx.isCentralSuperAdmin(session.role) && !ctx.isSchoolAuthorized(schoolId, session)) {
      res.status(403).json({ error: 'Unauthorized to add campus to this school.' });
      return;
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Campus name is required.' });
      return;
    }
    const cleanCode =
      (typeof code === 'string' && code.trim().toUpperCase()) ||
      `CMP-${Date.now().toString().slice(-4)}`;

    if (await canUseMySql()) {
      const orgNum = toNumericId(organizationId);
      const schNum = toNumericId(schoolId);
      if (!orgNum || !schNum) {
        res.status(400).json({ error: 'Valid numeric organizationId and schoolId are required.' });
        return;
      }
      try {
        const insertId = await withMySqlTransaction(async (conn) => {
          const [ins] = await conn.execute<ResultSetHeader>(
            `INSERT INTO campuses
              (organization_id, school_id, code, name, city, address, phone, principal_name, is_active, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
            [
              orgNum,
              schNum,
              cleanCode,
              name.trim(),
              (typeof city === 'string' && city.trim()) || 'Main City',
              typeof address === 'string' ? address.trim() : null,
              typeof phone === 'string' ? phone.trim() : null,
              typeof principalName === 'string' ? principalName.trim() : null,
              toNumericId(session.sub),
            ]
          );
          await writeMySqlAuditLog(conn, session, {
            organizationId: orgNum,
            schoolId: schNum,
            campusId: ins.insertId,
            moduleKey: 'ORGANIZATION',
            action: 'CREATE',
            entityType: 'Campus',
            entityId: String(ins.insertId),
            remarks: `Created campus ${name.trim()} (${cleanCode})`,
            ipAddress: req.ip,
          });
          return ins.insertId;
        });

        res.status(201).json({
          storageSource: 'mysql',
          campus: {
            id: String(insertId),
            organizationId: String(orgNum),
            schoolId: String(schNum),
            code: cleanCode,
            name: name.trim(),
            city: city || 'Main City',
          },
        });
        return;
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          res.status(409).json({ error: `Campus code "${cleanCode}" already exists for this school.` });
          return;
        }
        res.status(500).json({ error: err?.message || 'Failed to create campus.' });
        return;
      }
    }

    const db = ctx.getDb();
    const school = (db.schools || []).find((s: any) => s.id === schoolId);
    if (!school) {
      res.status(404).json({ error: 'Parent school not found.' });
      return;
    }
    const created = {
      id: `cmp-${Date.now()}`,
      name: name.trim(),
      code: cleanCode,
      city: city || 'Main City',
      studentCount: 0,
      staffCount: 0,
      attendanceRate: 0,
      staffAttendanceRate: 0,
      feeCollectedLakhs: 0,
      feeTargetLakhs: 0,
      pendingAdmissions: 0,
      appUsers: 0,
    };
    school.campuses = [...(school.campuses || []), created];
    ctx.persist();
    res.status(201).json({ storageSource: 'local-store', campus: created });
  });

  // -------------------------------------------------------------------------
  // 5. Academic Years CRUD (`academic_years` table)
  // -------------------------------------------------------------------------
  router.get('/academic-years', ctx.requireAuth, async (req: any, res: Response) => {
    const { page, pageSize, offset, sortOrder } = parsePagination(req.query);

    if (await canUseMySql()) {
      try {
        const countRows = await queryRows<RowDataPacket[]>(
          'SELECT COUNT(*) AS total FROM academic_years WHERE is_deleted = 0'
        );
        const total = Number(countRows[0]?.total || 0);
        const rows = await queryRows<RowDataPacket[]>(
          `SELECT id, organization_id, school_id, label, start_date, end_date, status, is_current, is_active
           FROM academic_years
           WHERE is_deleted = 0
           ORDER BY start_date ${sortOrder}
           LIMIT ? OFFSET ?`,
          [pageSize, offset]
        );
        res.json({
          storageSource: 'mysql',
          items: rows.map((r) => ({
            id: String(r.id),
            organizationId: String(r.organization_id),
            schoolId: r.school_id ? String(r.school_id) : null,
            label: r.label,
            startDate: r.start_date,
            endDate: r.end_date,
            status: r.status,
            isCurrent: Boolean(r.is_current),
            isActive: Boolean(r.is_active),
            multiplier: 1,
          })),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
        return;
      } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Failed to query academic years.' });
        return;
      }
    }

    const db = ctx.getDb();
    const list = db.academicYears || [];
    res.json({
      storageSource: 'local-store',
      items: list.slice(offset, offset + pageSize),
      pagination: { page, pageSize, total: list.length, totalPages: Math.ceil(list.length / pageSize) },
    });
  });

  // -------------------------------------------------------------------------
  // 6. Users CRUD (`users` + `roles` + `user_school_access` tables)
  // -------------------------------------------------------------------------
  router.get('/users', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    const { page, pageSize, offset, search, sortOrder } = parsePagination(req.query);
    const schoolFilter =
      typeof req.query.schoolId === 'string' && req.query.schoolId !== 'all'
        ? req.query.schoolId
        : null;

    if (await canUseMySql()) {
      try {
        const whereClauses = ['u.is_deleted = 0'];
        const params: unknown[] = [];

        if (!ctx.isCentralSuperAdmin(session.role)) {
          const allowedSchoolId = toNumericId(session.schoolId);
          if (allowedSchoolId) {
            whereClauses.push(
              '(u.school_id = ? OR EXISTS (SELECT 1 FROM user_school_access usa WHERE usa.user_id = u.id AND usa.school_id = ? AND usa.is_active = 1))'
            );
            params.push(allowedSchoolId, allowedSchoolId);
          }
        } else if (schoolFilter) {
          const filterNum = toNumericId(schoolFilter);
          if (filterNum) {
            whereClauses.push(
              '(u.school_id = ? OR EXISTS (SELECT 1 FROM user_school_access usa WHERE usa.user_id = u.id AND usa.school_id = ? AND usa.is_active = 1))'
            );
            params.push(filterNum, filterNum);
          }
        }

        if (search) {
          whereClauses.push('(u.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
          const like = `%${search}%`;
          params.push(like, like, like);
        }

        const whereSql = whereClauses.join(' AND ');
        const countRows = await queryRows<RowDataPacket[]>(
          `SELECT COUNT(*) AS total FROM users u WHERE ${whereSql}`,
          params
        );
        const total = Number(countRows[0]?.total || 0);

        const rows = await queryRows<RowDataPacket[]>(
          `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role_id, r.name AS role_name,
                  u.organization_id, u.school_id, u.campus_id, u.is_active, u.last_login, u.created_at
           FROM users u
           LEFT JOIN roles r ON r.id = u.role_id
           WHERE ${whereSql}
           ORDER BY u.id ${sortOrder}
           LIMIT ? OFFSET ?`,
          [...params, pageSize, offset]
        );

        res.json({
          storageSource: 'mysql',
          items: rows.map((u) => ({
            id: String(u.id),
            username: u.username,
            email: u.email,
            fullName: u.full_name,
            phone: u.phone || '',
            roleId: u.role_id ? String(u.role_id) : undefined,
            role: u.role_name || 'Student',
            organizationId: u.organization_id ? String(u.organization_id) : 'all',
            schoolId: u.school_id ? String(u.school_id) : 'all',
            campusId: u.campus_id ? String(u.campus_id) : 'all',
            status: u.is_active ? 'Active' : 'Suspended',
            lastLogin: u.last_login || 'Never',
          })),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
        return;
      } catch (err: any) {
        res.status(500).json({ error: err?.message || 'Failed to query users from MySQL.' });
        return;
      }
    }

    const db = ctx.getDb();
    let list = [...(db.users || [])];
    if (!ctx.isCentralSuperAdmin(session.role)) {
      list = list.filter((u: any) => ctx.isSchoolAuthorized(u.schoolId, session));
    }
    if (schoolFilter) {
      list = list.filter(
        (u: any) =>
          u.schoolId === schoolFilter ||
          (Array.isArray(u.schoolIds) && u.schoolIds.includes(schoolFilter))
      );
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u: any) =>
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }
    const total = list.length;
    res.json({
      storageSource: 'local-store',
      items: list.slice(offset, offset + pageSize),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  });

  router.delete('/users/:id', ctx.requireAuth, async (req: any, res: Response) => {
    const session = req.erpSession;
    if (!ctx.isCentralSuperAdmin(session.role) && session.role !== 'School Administrator') {
      res.status(403).json({ error: 'Insufficient permissions to deactivate user accounts.' });
      return;
    }

    if (await canUseMySql()) {
      const userId = toNumericId(req.params.id);
      if (!userId) {
        res.status(400).json({ error: 'Invalid numeric user ID.' });
        return;
      }
      const result = await executeStatement(
        `UPDATE users SET is_active = 0, is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0`,
        [userId]
      );
      if (result.affectedRows === 0) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      await writeMySqlAuditLog(null, session, {
        moduleKey: 'ADMIN',
        action: 'DEACTIVATE',
        entityType: 'User',
        entityId: String(userId),
        remarks: `Deactivated user account #${userId}`,
        ipAddress: req.ip,
      });
      res.json({ storageSource: 'mysql', success: true });
      return;
    }

    const db = ctx.getDb();
    const authUser = (db.authUsers || []).find((u: any) => u.id === req.params.id);
    if (authUser) {
      authUser.isActive = false;
      authUser.isDeleted = true;
    }
    const uiUser = (db.users || []).find((u: any) => u.id === req.params.id);
    if (uiUser) {
      uiUser.status = 'Suspended';
    }
    ctx.persist();
    res.json({ storageSource: 'local-store', success: true });
  });

  return router;
}
