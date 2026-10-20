import { query } from '../db.js';

export async function getAllSettings() {
  const [rows] = await query('SELECT setting_key, setting_value FROM site_settings');
  const settings = {};
  for (const row of rows) {
    settings[row.setting_key] = row.setting_value;
  }
  return settings;
}

export async function getSetting(key, defaultValue = null) {
  const [rows] = await query('SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1', [key]);
  return rows.length > 0 ? rows[0].setting_value : defaultValue;
}

export async function setSetting(key, value) {
  const [result] = await query(
    `INSERT INTO site_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value]
  );
  return result;
}

export async function updateMultipleSettings(settingsObj) {
  for (const [key, value] of Object.entries(settingsObj)) {
    await setSetting(key, String(value ?? ''));
  }
}

export default {
  getAllSettings,
  getSetting,
  setSetting,
  updateMultipleSettings,
};
