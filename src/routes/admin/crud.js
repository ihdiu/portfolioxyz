import { Router } from 'express';
import { query, pool } from '../../db.js';
import { upload, saveProcessedImage } from '../../middleware/upload.js';
import { generateCsrfToken, doubleCsrfProtection } from '../../middleware/csrf.js';

export function createCrudRouter(config) {
  const router = Router();

  // Helper to fetch options for a dropdown or multiselect
  async function fetchFieldOptions(fields) {
    const options = {};
    for (const f of fields) {
      if (f.type === 'select' && f.optionsFrom) {
        const [rows] = await query(`SELECT * FROM ${f.optionsFrom} ORDER BY id ASC`);
        options[f.name] = rows.map((r) => ({
          value: r[f.optionValueKey || 'id'],
          label: r[f.optionLabelKey || 'name' || 'title'],
        }));
      } else if (f.type === 'multiselect' && f.relation?.optionsFrom) {
        const [rows] = await query(`SELECT * FROM ${f.relation.optionsFrom} ORDER BY name ASC`);
        options[f.name] = rows.map((r) => ({
          value: r.id,
          label: r.name,
        }));
      }
    }
    return options;
  }

  // 1. LIST
  router.get('/', async (req, res, next) => {
    try {
      let sql = `SELECT * FROM ${config.table}`;
      if (config.table === 'skills') {
        sql = `SELECT s.*, sc.name AS category_name, d.name AS domain_name 
               FROM skills s 
               JOIN skill_categories sc ON s.category_id = sc.id 
               JOIN domains d ON sc.domain_id = d.id 
               ORDER BY d.id ASC, sc.sort_order ASC, s.sort_order ASC`;
      } else if (config.table === 'skill_categories') {
        sql = `SELECT sc.*, d.name AS domain_name 
               FROM skill_categories sc 
               JOIN domains d ON sc.domain_id = d.id 
               ORDER BY d.id ASC, sc.sort_order ASC`;
      } else if (config.table === 'experiences') {
        sql = `SELECT e.*, o.name AS organization_name 
               FROM experiences e 
               JOIN organizations o ON e.organization_id = o.id 
               ORDER BY e.sort_order ASC, e.start_date DESC`;
      } else if (config.table === 'educations') {
        sql = `SELECT ed.*, o.name AS organization_name 
               FROM educations ed 
               JOIN organizations o ON ed.organization_id = o.id 
               ORDER BY ed.sort_order ASC, ed.start_date DESC`;
      } else if (config.table === 'research_profiles') {
        sql = `SELECT rp.*, p.name AS platform_name 
               FROM research_profiles rp 
               JOIN research_platforms p ON rp.platform_id = p.id 
               ORDER BY rp.sort_order ASC`;
      } else if (config.table === 'projects') {
        sql = `SELECT p.*, d.name AS domain_name 
               FROM projects p 
               JOIN domains d ON p.domain_id = d.id 
               ORDER BY p.sort_order ASC, p.id DESC`;
      } else {
        sql += ' ORDER BY id ASC';
      }

      const [items] = await query(sql);

      res.render('admin/crud/list', {
        title: config.label,
        config,
        items,
        csrfToken: generateCsrfToken(req, res),
        flash: req.session.flash || null,
      });
      delete req.session.flash;
    } catch (err) {
      next(err);
    }
  });

  // 2. NEW FORM
  router.get('/new', async (req, res, next) => {
    try {
      const options = await fetchFieldOptions(config.fields);
      res.render('admin/crud/form', {
        title: `Create ${config.singular || 'Item'}`,
        config,
        item: {},
        options,
        errors: {},
        csrfToken: generateCsrfToken(req, res),
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. CREATE
  router.post('/', upload.any(), doubleCsrfProtection, async (req, res, next) => {
    try {
      let bodyData = { ...req.body };

      // Process uploaded images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const webPath = await saveProcessedImage(file.buffer);
          bodyData[file.fieldname] = webPath;
        }
      }

      // Checkbox handling
      config.fields.forEach((f) => {
        if (f.type === 'checkbox') {
          bodyData[f.name] = Boolean(bodyData[f.name] === '1' || bodyData[f.name] === 'true' || bodyData[f.name] === 'on');
        }
      });

      // Validate with schema
      if (config.schema) {
        const validation = config.schema.safeParse(bodyData);
        if (!validation.success) {
          const errors = {};
          validation.error.issues.forEach((issue) => {
            errors[issue.path[0]] = issue.message;
          });
          const options = await fetchFieldOptions(config.fields);
          return res.status(400).render('admin/crud/form', {
            title: `Create ${config.singular || 'Item'}`,
            config,
            item: bodyData,
            options,
            errors,
            csrfToken: generateCsrfToken(req, res),
          });
        }
        bodyData = validation.data;
      }

      // Hook
      if (typeof config.beforeSave === 'function') {
        bodyData = config.beforeSave(bodyData);
      }

      // Extract relation fields (like multiselect)
      const relationsToSync = [];
      const dbColumns = [];
      const dbValues = [];

      for (const field of config.fields) {
        if (field.type === 'multiselect' && field.relation) {
          const rawIds = req.body[field.name];
          const ids = Array.isArray(rawIds) ? rawIds.map(Number) : (rawIds ? [Number(rawIds)] : []);
          relationsToSync.push({ relation: field.relation, ids });
        } else if (bodyData[field.name] !== undefined) {
          dbColumns.push(field.name);
          dbValues.push(bodyData[field.name] === '' ? null : bodyData[field.name]);
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const placeholders = dbColumns.map(() => '?').join(', ');
        const [insertRes] = await conn.execute(
          `INSERT INTO ${config.table} (${dbColumns.join(', ')}) VALUES (${placeholders})`,
          dbValues
        );
        const newId = insertRes.insertId;

        // Sync junction relations
        for (const rel of relationsToSync) {
          for (const relId of rel.ids) {
            await conn.execute(
              `INSERT INTO ${rel.relation.junction} (${rel.relation.key}, ${rel.relation.other}) VALUES (?, ?)`,
              [newId, relId]
            );
          }
        }

        await conn.commit();
        req.session.flash = { type: 'success', message: `${config.singular || 'Item'} created successfully.` };
        res.redirect(`/admin/${config.name}`);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      next(err);
    }
  });

  // 4. EDIT FORM
  router.get('/:id/edit', async (req, res, next) => {
    try {
      const [rows] = await query(`SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`, [req.params.id]);
      if (!rows[0]) {
        return res.status(404).render('errors/404', { title: 'Not Found', url: req.originalUrl });
      }

      const item = rows[0];
      const options = await fetchFieldOptions(config.fields);

      // Fetch multiselect current relations
      for (const field of config.fields) {
        if (field.type === 'multiselect' && field.relation) {
          const [junctionRows] = await query(
            `SELECT ${field.relation.other} AS val FROM ${field.relation.junction} WHERE ${field.relation.key} = ?`,
            [req.params.id]
          );
          item[field.name] = junctionRows.map((j) => j.val);
        }
      }

      res.render('admin/crud/form', {
        title: `Edit ${config.singular || 'Item'} #${item.id}`,
        config,
        item,
        options,
        errors: {},
        csrfToken: generateCsrfToken(req, res),
      });
    } catch (err) {
      next(err);
    }
  });

  // 5. UPDATE
  router.post('/:id', upload.any(), doubleCsrfProtection, async (req, res, next) => {
    try {
      const [existing] = await query(`SELECT * FROM ${config.table} WHERE id = ? LIMIT 1`, [req.params.id]);
      if (!existing[0]) {
        return res.status(404).render('errors/404', { title: 'Not Found', url: req.originalUrl });
      }

      let bodyData = { ...req.body };

      // Process uploaded images
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const webPath = await saveProcessedImage(file.buffer);
          bodyData[file.fieldname] = webPath;
        }
      }

      // Checkbox handling
      config.fields.forEach((f) => {
        if (f.type === 'checkbox') {
          bodyData[f.name] = Boolean(bodyData[f.name] === '1' || bodyData[f.name] === 'true' || bodyData[f.name] === 'on');
        }
      });

      // Validation
      if (config.schema) {
        const validation = config.schema.safeParse(bodyData);
        if (!validation.success) {
          const errors = {};
          validation.error.issues.forEach((issue) => {
            errors[issue.path[0]] = issue.message;
          });
          const options = await fetchFieldOptions(config.fields);
          return res.status(400).render('admin/crud/form', {
            title: `Edit ${config.singular || 'Item'} #${req.params.id}`,
            config,
            item: { ...existing[0], ...bodyData, id: req.params.id },
            options,
            errors,
            csrfToken: generateCsrfToken(req, res),
          });
        }
        bodyData = { ...bodyData, ...validation.data };
      }

      // Hook
      if (typeof config.beforeSave === 'function') {
        bodyData = config.beforeSave(bodyData);
      }

      const relationsToSync = [];
      const setClauses = [];
      const dbValues = [];

      for (const field of config.fields) {
        if (field.type === 'multiselect' && field.relation) {
          const rawIds = req.body[field.name];
          const ids = Array.isArray(rawIds) ? rawIds.map(Number) : (rawIds ? [Number(rawIds)] : []);
          relationsToSync.push({ relation: field.relation, ids });
        } else if (bodyData[field.name] !== undefined) {
          setClauses.push(`${field.name} = ?`);
          dbValues.push(bodyData[field.name] === '' ? null : bodyData[field.name]);
        }
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        if (setClauses.length > 0) {
          dbValues.push(req.params.id);
          await conn.execute(
            `UPDATE ${config.table} SET ${setClauses.join(', ')} WHERE id = ?`,
            dbValues
          );
        }

        // Sync junction relations
        for (const rel of relationsToSync) {
          await conn.execute(
            `DELETE FROM ${rel.relation.junction} WHERE ${rel.relation.key} = ?`,
            [req.params.id]
          );
          for (const relId of rel.ids) {
            await conn.execute(
              `INSERT INTO ${rel.relation.junction} (${rel.relation.key}, ${rel.relation.other}) VALUES (?, ?)`,
              [req.params.id, relId]
            );
          }
        }

        await conn.commit();
        req.session.flash = { type: 'success', message: `${config.singular || 'Item'} updated successfully.` };
        res.redirect(`/admin/${config.name}`);
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } catch (err) {
      next(err);
    }
  });

  // 6. DELETE
  router.post('/:id/delete', doubleCsrfProtection, async (req, res, next) => {
    try {
      await query(`DELETE FROM ${config.table} WHERE id = ?`, [req.params.id]);
      req.session.flash = { type: 'success', message: `${config.singular || 'Item'} deleted.` };
      res.redirect(`/admin/${config.name}`);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export default { createCrudRouter };
