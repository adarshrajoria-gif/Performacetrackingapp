// ─── Sheets API helpers ───────────────────────────────────────────────────────
// Each function calls the deployed Apps Script web app.

function sheetsPost(url, payload) {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify(payload),
  }).then((res) => {
    if (!res.ok) throw new Error(`Sheets request failed: ${res.status}`);
    return res.json();
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadFromSheets(url) {
  const res = await fetch(`${url}?action=getData`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.initiatives) || !Array.isArray(data.activities)) {
    throw new Error('Invalid response from Sheets');
  }
  return data;
}

// ─── Initiative CRUD ──────────────────────────────────────────────────────────

export function sheetsAddInitiative(url, initiative) {
  return sheetsPost(url, { action: 'addInitiative', initiative });
}

export function sheetsUpdateInitiative(url, id, updates) {
  return sheetsPost(url, { action: 'updateInitiative', id, updates });
}

export function sheetsDeleteInitiative(url, id) {
  return sheetsPost(url, { action: 'deleteInitiative', id });
}

// ─── Activity CRUD ────────────────────────────────────────────────────────────

export function sheetsAddActivity(url, activity) {
  return sheetsPost(url, { action: 'addActivity', activity });
}

export function sheetsAddActivities(url, activities) {
  return sheetsPost(url, { action: 'addActivities', activities });
}

export function sheetsUpdateActivity(url, id, updates) {
  return sheetsPost(url, { action: 'updateActivity', id, updates });
}

export function sheetsDeleteActivity(url, id) {
  return sheetsPost(url, { action: 'deleteActivity', id });
}

// ─── Bulk ─────────────────────────────────────────────────────────────────────

export function sheetsClearAll(url) {
  return sheetsPost(url, { action: 'clearAll' });
}

export function saveToSheets(url, initiatives, activities) {
  return sheetsPost(url, { action: 'saveData', initiatives, activities });
}

// ─── Apps Script code users paste into their Google Sheet ─────────────────────

export const APPS_SCRIPT_CODE = `const SS = SpreadsheetApp.getActiveSpreadsheet();

const INIT_HEADERS = ['id','name','description','status','createdAt','platforms','activityTypes','funnelStages'];
const ACT_HEADERS = ['id','initiativeId','date', 'platform', 'activityType', 'title', 'notes', 'stageCounts'];

// Return static headers - we no longer use dynamic columns for performance
function getDynamicHeaders() {
  return ACT_HEADERS;
}

// ── GET ──────────────────────────────────────────────────────────────────────

function doGet(e) {
  const action = (e.parameter || {}).action;
  if (action === 'getData') {
    ensureHeaders('Initiatives', INIT_HEADERS);
    ensureHeaders('Activities', ACT_HEADERS);
    
    return respond({
      initiatives: readSheet('Initiatives'),
      activities: readSheet('Activities'),
    });
  }
  return respond({ error: 'Unknown action' });
}

// ── POST ─────────────────────────────────────────────────────────────────────

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  
  switch (data.action) {

    // ── Initiatives ────────────────────────────────────────────────────────
    case 'addInitiative':
      appendRow('Initiatives', data.initiative, INIT_HEADERS);
      return respond({ success: true });

    case 'updateInitiative':
      updateRowById('Initiatives', data.id, data.updates, INIT_HEADERS);
      return respond({ success: true });

    case 'deleteInitiative':
      deleteRowById('Initiatives', data.id);
      deleteRowsById('Activities', 'initiativeId', data.id);
      return respond({ success: true });

    // ── Activities ─────────────────────────────────────────────────────────
    case 'addActivity':
      appendRow('Activities', data.activity, ACT_HEADERS);
      return respond({ success: true });

    case 'addActivities':
      (data.activities || []).forEach(a => appendRow('Activities', a, ACT_HEADERS));
      return respond({ success: true });

    case 'updateActivity':
      updateRowById('Activities', data.id, data.updates, ACT_HEADERS);
      return respond({ success: true });

    case 'deleteActivity':
      deleteRowById('Activities', data.id);
      return respond({ success: true });

    // ── Bulk ───────────────────────────────────────────────────────────────
    case 'clearAll':
      clearSheet('Initiatives');
      clearSheet('Activities');
      return respond({ success: true });

    case 'saveData':
      writeSheet('Initiatives', data.initiatives, INIT_HEADERS);
      writeSheet('Activities', data.activities || [], ACT_HEADERS);
      return respond({ success: true });

    default:
      return respond({ error: 'Unknown action' });
  }
}

// No longer needed: we store everything in stageCounts JSON column
function flattenActivity(a) { return a; }

// ── Helpers ──────────────────────────────────────────────────────────────────

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheet(name) {
  let s = SS.getSheetByName(name);
  if (!s) s = SS.insertSheet(name);
  return s;
}

// Forces headers to match exactly (adds missing, removes extra)
function ensureHeaders(sheetName, expectedHeaders) {
  const sheet = ensureSheet(sheetName);
  const lastCol = sheet.getLastColumn();
  
  if (lastCol === 0) {
    sheet.appendRow(expectedHeaders);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const normalizedExpected = expectedHeaders.map(h => String(h).toLowerCase().trim());
  
  // 1. Remove extra columns (from right to left to maintain indices)
  for (let c = currentHeaders.length - 1; c >= 0; c--) {
    const head = String(currentHeaders[c]).toLowerCase().trim();
    if (normalizedExpected.indexOf(head) === -1) {
      sheet.deleteColumn(c + 1);
    }
  }

  // 2. Re-read and add missing
  const newLast = sheet.getLastColumn();
  const updatedHeaders = sheet.getRange(1, 1, 1, newLast).getValues()[0];
  const updatedNorm = updatedHeaders.map(h => String(h).toLowerCase().trim());
  
  expectedHeaders.forEach(h => {
    if (updatedNorm.indexOf(String(h).toLowerCase().trim()) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h);
    }
  });
}

function serialize(v) {
  return Array.isArray(v) || (v !== null && typeof v === 'object')
    ? JSON.stringify(v) : (v ?? '');
}

function deserialize(v) {
  if (typeof v === 'string' && (v.startsWith('[') || v.startsWith('{'))) {
    try { return JSON.parse(v); } catch(_) {}
  }
  return v;
}

// ── Read all rows ────────────────────────────────────────────────────────────

function readSheet(name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = deserialize(row[i]); });
    return obj;
  });
}

// ── Write all rows (full overwrite) ──────────────────────────────────────────

function writeSheet(name, rows, headers) {
  const sheet = ensureSheet(name);
  sheet.clearContents();
  sheet.appendRow(headers);
  if (!rows || !rows.length) return;
  const data = rows.map(row => headers.map(h => serialize(row[h])));
  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
}

function clearSheet(name) {
  const sheet = SS.getSheetByName(name);
  if (sheet) sheet.clearContents();
}

// ── Single-row operations ────────────────────────────────────────────────────

function appendRow(sheetName, obj, expectedHeaders) {
  const sheet = ensureSheet(sheetName);
  ensureHeaders(sheetName, expectedHeaders);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(h => serialize(obj[h])));
}

function updateRowById(sheetName, id, updates, expectedHeaders) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
  ensureHeaders(sheetName, expectedHeaders);
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const headers = rows[0];
  const idCol = headers.indexOf('id');
  if (idCol === -1) return;
  for (let r = 1; r < rows.length; r++) {
    if (String(rows[r][idCol]) === String(id)) {
      headers.forEach((h, c) => {
        if (updates.hasOwnProperty(h)) {
          sheet.getRange(r + 1, c + 1).setValue(serialize(updates[h]));
        }
      });
      return;
    }
  }
}

function deleteRowById(sheetName, id) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const idCol = rows[0].indexOf('id');
  if (idCol === -1) return;
  for (let r = rows.length - 1; r >= 1; r--) {
    if (String(rows[r][idCol]) === String(id)) {
      sheet.deleteRow(r + 1);
    }
  }
}

function deleteRowsById(sheetName, field, value) {
  const sheet = SS.getSheetByName(sheetName);
  if (!sheet) return;
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return;
  const col = rows[0].indexOf(field);
  if (col === -1) return;
  for (let r = rows.length - 1; r >= 1; r--) {
    if (String(rows[r][col]) === String(value)) {
      sheet.deleteRow(r + 1);
    }
  }
}`;
