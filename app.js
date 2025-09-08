// === 設定 ===
const GAS_URL = 'https://script.google.com/macros/s/REPLACE_WITH_YOUR_/exec'; // /exec に差し替え
const TOKEN   = 'CHANGE_ME_TOKEN';

// === ユーティリティ ===
const $ = (sel) => document.querySelector(sel);
const toast = (msg) => { const el = $('#toast'); el.textContent = msg; el.style.display='block'; setTimeout(() => el.style.display='none', 2200); };

const fmtYen = (n) => (Math.round(n).toLocaleString());

// === ローカル保存（カート & 未送信伝票） ===
const KEY_CART = 'order_cart_v1';
const KEY_QUEUE = 'order_queue_v1';

const load = (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const cart = { items: load(KEY_CART, []) };

function saveCart() { save(KEY_CART, cart.items); }
function clearCart() { cart.items = []; saveCart(); render(); }

// === GAS JSON API ===
async function callApi(action, payload) {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: TOKEN, action, ...payload }),
    mode: 'cors',
    cache: 'no-store'
  });
  const data = await res.json().catch(() => ({ ok:false, error:'invalid json' }));
  return data;
}

async function lookupBarcode(barcode) {
  try {
    const j = await callApi('getProductByBarcode', { barcode });
    return j.ok ? j.product : null;
  } catch (e) { return null; }
}

async function sendOrder(order) {
  const j = await callApi('recordSale', { order });
  if (!j.ok) throw new Error(j.error || 'GAS error');
  return j.saleId;
}

// === カート操作 ===
function upsertItem({ barcode, name, price }) {
  const idx = cart.items.findIndex(x => x.barcode === barcode);
  if (idx >= 0) { cart.items[idx].qty += 1; }
  else { cart.items.push({ barcode, name, price, qty:1 }); }
  saveCart(); render();
}

function changeQty(barcode, delta) {
  const it = cart.items.find(x => x.barcode === barcode);
  if (!it) return;
  it.qty = Math.max(1, (it.qty || 1) + delta);
  saveCart(); render();
}

function removeItem(barcode) {
  cart.items = cart.items.filter(x => x.barcode !== barcode);
  saveCart(); render();
}

function subtotal(it) { return (it.price || 0) * (it.qty || 0); }
function total() { return cart.items.reduce((s, it) => s + subtotal(it), 0); }

function render() {
  const body = $('#cartBody'); body.innerHTML = '';
  cart.items.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>{it.barcode}</td>
      <td>{it.name || ''}</td>
      <td class="hide price">¥${fmtYen(it.price || 0)}</td>
      <td>
        <div class="qty">
          <button data-bc="{it.barcode}" data-op="-">-</button>
          <input class="quantity-input" type="number" min="1" value="{it.qty||1}" data-bc="{it.barcode}">
          <button data-bc="{it.barcode}" data-op="+">+</button>
        </div>
      </td>
      <td class="subtotal">¥${fmtYen(subtotal(it))}</td>
      <td class="actions"><button data-bc="{it.barcode}" data-op="remove">削除</button></td>`;
    body.appendChild(tr);
  });
  $('#total').textContent = fmtYen(total());

  body.querySelectorAll('button').forEach(btn => btn.addEventListener('click', (e) => {
    const bc = e.currentTarget.dataset.bc; const op = e.currentTarget.dataset.op;
    if (op === '+') changeQty(bc, +1);
    if (op === '-') changeQty(bc, -1);
    if (op === 'remove') removeItem(bc);
  }));

  body.querySelectorAll('input[type="number"]').forEach(inp => inp.addEventListener('change', (e) => {
    const bc = e.currentTarget.dataset.bc;
    const it = cart.items.find(x => x.barcode === bc);
    if (!it) return;
    const v = parseInt(e.currentTarget.value||'1', 10);
    it.qty = Math.max(1, v);
    saveCart(); render();
  }));
}

// === オフラインキュー ===
function loadQueue() { return load(KEY_QUEUE, []); }
function saveQueue(q) { save(KEY_QUEUE, q); }
function enqueue(order) { const q = loadQueue(); q.push(order); saveQueue(q); }
function dequeue() { const q = loadQueue(); const first = q.shift(); saveQueue(q); return first; }

async function flushQueue() {
  while(navigator.onLine) {
    const next = loadQueue()[0];
    if (!next) break;
    try { await sendOrder(next); dequeue(); }
    catch { break; }
  }
}
window.addEventListener('online', flushQueue);

// === イベント ===
$('#addBtn').addEventListener('click', async () => {
  const bc = $('#barcode').value.trim();
  if (!bc) return;
  if (!navigator.onLine) { 
    upsertItem({ barcode: bc, name: '(オフライン)', price: 0 });
    $('#barcode').value=''; toast('オフラインのため商品検索スキップ'); return;
  }
  const p = await lookupBarcode(bc);
  if (!p) { upsertItem({ barcode: bc, name: '(未登録)', price: 0 }); toast('未登録のバーコードです'); }
  else    { upsertItem({ barcode: bc, name: p.name, price: p.price }); }
  $('#barcode').value='';
});

$('#barcode').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#addBtn').click(); } });

$('#submitBtn').addEventListener('click', async () => {
  if (!cart.items.length) { toast('カートが空です'); return; }
  const order = {
    ts: new Date().toISOString(),
    items: cart.items.map(it => ({ barcode: it.barcode, name: it.name, price: it.price, qty: it.qty, subtotal: subtotal(it) })),
    total: total(),
    device: navigator.userAgent
  };

  if (!navigator.onLine) {
    enqueue(order); clearCart(); toast('オフライン保存しました（復帰後に自動送信）'); return;
  }

  try {
    await sendOrder(order);
    clearCart();
    toast('送信しました');
    flushQueue();
  } catch (e) {
    enqueue(order); clearCart();
    toast('送信失敗→一時保存しました');
  }
});

// 初期表示
render(); flushQueue();
