/*
 * Google Apps Script: simpan email "Kabari Saya" ke Google Sheet.
 *
 * Cara pasang (login sebagai macaron.tuffero@gmail.com):
 * 1. Buat Google Sheet baru, lalu Extensions > Apps Script.
 * 2. Tempel seluruh file ini ke Code.gs, simpan.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me. Who has access: Anyone.
 * 4. Salin URL ".../exec", tempel ke atribut action pada form #notifyMe di index.html.
 * Setiap kali kode ini diubah: Deploy > Manage deployments > Edit > Version: New version.
 */

const SHEET_NAME = 'Subscribers';

function doPost(e) {
  const email = String((e && e.parameter && e.parameter.email) || '').trim().toLowerCase();

  // Tolak format salah dan awalan yang bisa dibaca Sheets sebagai rumus.
  if (email.length > 254 || /^[=+\-@]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ status: 'error', type: 'ValidationError' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(['Waktu', 'Email']);
    }

    const lastRow = sheet.getLastRow();
    const existing = lastRow > 1
      ? sheet.getRange(2, 2, lastRow - 1, 1).getValues().flat()
      : [];

    if (existing.indexOf(email) === -1) {
      sheet.appendRow([new Date(), email]);
    }
  } finally {
    lock.releaseLock();
  }

  return json({ status: 'success' });
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
