// === GAS Web API (JSON) ===
// スプレッドシートID（ユーザー提供）
const SPREADSHEET_ID = '10i5OJlgkgVfGhUekVXoqWo7--1F_6iH_LyL6ISWnZzA';
// シート名（必要に応じて変更）
const PRODUCTS_SHEET = '商品マスタ';
const ORDERS_SHEET   = '注文';

// フロントのトークンと一致させる（最低限の保護）
const SIMPLE_TOKEN = 'CHANGE_ME_TOKEN';

// --- ルーター ---
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== SIMPLE_TOKEN) return json({ ok:false, error:'invalid token' });

    const action = String(body.action || '');
    if (action === 'getProductByBarcode') return json(getProductByBarcode_(String(body.barcode||'')));
    if (action === 'recordSale') return json(recordSale_(body.order || {}));

    return json({ ok:false, error:'unknown action' });
  } catch (err) {
    return json({ ok:false, error: String(err) });
  }
}

// 健康確認
function doGet() { return ContentService.createTextOutput('OK'); }

// --- 実装 ---
function getProductByBarcode_(barcode) {
  if (!barcode) return { ok:false, error:'barcode required' };
  const sh = openSheet_(PRODUCTS_SHEET);
  const values = sh.getDataRange().getValues();
  const header = values.shift();
  const idxB = indexOfHeader_(header, ['JAN','バーコード','barcode','Barcode']);
  const idxName = indexOfHeader_(header, ['商品名','name','Name']);
  const idxPrice = indexOfHeader_(header, ['売価','価格','price','Price']);
  if (idxB < 0 || idxName < 0) return { ok:false, error:'商品マスタの見出し(JAN/商品名/売価)を確認してください' };
  for (const row of values) {
    if (String(row[idxB]).trim() === String(barcode).trim()) {
      return { ok:true, product: { barcode, name: String(row[idxName]||''), price: Number(row[idxPrice]||0) } };
    }
  }
  return { ok:false, error:'not found' };
}

function recordSale_(order) {
  // order: { ts, items:[{barcode,name,price,qty,subtotal}], total, device }
  const sh = openSheet_(ORDERS_SHEET);
  const saleId = 'S' + new Date().getTime().toString(36) + Math.floor(Math.random()*1e6).toString(36);
  const now = new Date();
  const rows = [];
  (order.items||[]).forEach(it => {
    rows.push([
      now,                  // 受信時刻
      order.ts || '',       // 端末時刻
      saleId,               // 伝票ID
      String(it.barcode||''),
      String(it.name||''),
      Number(it.price||0),
      Number(it.qty||0),
      Number(it.subtotal||0),
      Number(order.total||0),
      String(order.device||'')
    ]);
  });
  if (rows.length) sh.getRange(sh.getLastRow()+1, 1, rows.length, rows[0].length).setValues(rows);
  return { ok:true, saleId };
}

// --- ヘルパ ---
function openSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function indexOfHeader_(header, keys) {
  const lower = header.map(h => String(h).toLowerCase());
  for (const k of keys) { const i = lower.indexOf(String(k).toLowerCase()); if (i >= 0) return i; }
  return -1;
}
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
