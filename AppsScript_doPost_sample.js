// === Apps Script Webアプリ (受信API) ===
// スプレッドシートIDを設定（ユーザー提供）
const SPREADSHEET_ID = '10i5OJlgkgVfGhUekVXoqWo7--1F_6iH_LyL6ISWnZzA';
const SHEET_NAME = '注文';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== 'YOUR_SIMPLE_TOKEN') {
      return _json({ ok:false, error:'invalid token' });
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sh.appendRow([
      new Date(),
      body.ts || '',
      body.store || '',
      body.customer || '',
      body.item || '',
      body.qty || '',
      body.note || ''
    ]);
    return _json({ ok:true });
  } catch (err) {
    return _json({ ok:false, error:String(err) });
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
