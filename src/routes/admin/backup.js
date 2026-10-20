import { Router } from 'express';
import { query } from '../../db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `portfolio_backup_${timestamp}.sql`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    let dump = `-- Portfolio Database Backup\n-- Generated at: ${new Date().toISOString()}\n\n`;
    dump += 'SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n';

    const [tables] = await query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];

    for (const t of tables) {
      const tableName = t[tableKey];
      // Skip session storage table if present
      if (tableName === 'sessions') continue;

      const [createResult] = await query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSql = createResult[0]['Create Table'];

      dump += `-- Table structure for \`${tableName}\`\n`;
      dump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      dump += `${createSql};\n\n`;

      const [rows] = await query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        dump += `-- Data for table \`${tableName}\`\n`;
        const columns = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');

        for (const row of rows) {
          const values = Object.values(row).map((val) => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          }).join(', ');

          dump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        dump += '\n';
      }
    }

    dump += 'SET FOREIGN_KEY_CHECKS = 1;\n';
    res.send(dump);
  } catch (err) {
    next(err);
  }
});

export default router;
