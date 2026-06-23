/**
 * ReysApp — Backend (Google Apps Script)
 * Tracking Pemasukan & Pengeluaran Pribadi
 * by ReYSAKI Digital Creatio
 *
 * Cara pakai singkat:
 * 1. Buka https://script.google.com  -> New project
 * 2. Hapus isi default, paste seluruh file ini.
 * 3. Ganti SHEET_ID di bawah dengan ID Google Sheet lo.
 *    (ID = bagian di URL Sheet antara /d/ dan /edit)
 * 4. Deploy > New deployment > Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 5. Copy URL Web App-nya, paste di Settings ReysApp (di iPhone).
 */

// ====== KONFIGURASI ======
const SHEET_ID = 'GANTI_DENGAN_ID_SHEET_LO';
const SHEET_NAME = 'Transaksi';
const HEADERS = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan', 'Dibuat'];
// =========================

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Ambil semua transaksi (GET)
function doGet(e) {
  try {
    return json_({ ok: true, data: listTransaksi_() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// Tambah / hapus transaksi (POST)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || 'add';

    if (action === 'add') {
      return json_({ ok: true, data: addTransaksi_(body) });
    }
    if (action === 'delete') {
      return json_({ ok: true, data: deleteTransaksi_(body.id) });
    }
    if (action === 'list') {
      return json_({ ok: true, data: listTransaksi_() });
    }
    return json_({ ok: false, error: 'Action tidak dikenal: ' + action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function addTransaksi_(body) {
  const sheet = getSheet_();
  const id = Utilities.getUuid();
  const now = new Date();
  const tanggal = body.tanggal || Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const tipe = body.tipe === 'pemasukan' ? 'pemasukan' : 'pengeluaran';
  const kategori = body.kategori || 'Lainnya';
  const nominal = Number(body.nominal) || 0;
  const catatan = body.catatan || '';
  sheet.appendRow([id, tanggal, tipe, kategori, nominal, catatan, now]);
  return { id: id, tanggal: tanggal, tipe: tipe, kategori: kategori, nominal: nominal, catatan: catatan };
}

function deleteTransaksi_(id) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: id };
    }
  }
  return { deleted: null };
}

function listTransaksi_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    if (!r[0]) continue;
    rows.push({
      id: String(r[0]),
      tanggal: r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[1]),
      tipe: String(r[2]),
      kategori: String(r[3]),
      nominal: Number(r[4]) || 0,
      catatan: String(r[5] || '')
    });
  }
  // urutkan terbaru di atas
  rows.reverse();
  return rows;
}
