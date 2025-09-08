// GAS WebアプリURL（公開用は /exec を使用）
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx0JFmtbz4arj6hFjBp4X6Ov0miZ1Gi9XitMIHRx9U/exec';

// 簡易トースト
const toast = (msg) => {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 2500);
};

// ローカルキュー
const KEY = 'pendingOrders';
const loadQ  = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const saveQ  = (q) => localStorage.setItem(KEY, JSON.stringify(q));
const pushQ  = (o) => { const q = loadQ(); q.push(o); saveQ(q); };
const shiftQ = () => { const q = loadQ(); const o = q.shift(); saveQ(q); return o; };

async function sendOrder(order){
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
    mode: 'cors',
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('HTTP '+res.status);
  const j = await res.json().catch(() => ({}));
  if (!j.ok) throw new Error('GAS error');
  return j;
}

async function flushQueue(){
  while(navigator.onLine){
    const next = loadQ()[0];
    if (!next) break;
    try { await sendOrder(next); shiftQ(); }
    catch { break; }
  }
}
window.addEventListener('online', flushQueue);

document.getElementById('orderForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const order = {
    ts: new Date().toISOString(),
    store: fd.get('store'),
    customer: fd.get('customer'),
    item: fd.get('item'),
    qty: Number(fd.get('qty')),
    note: fd.get('note') || '',
    token: 'YOUR_SIMPLE_TOKEN'
  };

  if (!navigator.onLine) {
    pushQ(order);
    toast('オフラインのため一時保存しました（復帰後に自動送信）');
    e.currentTarget.reset();
    return;
  }
  try {
    await sendOrder(order);
    toast('送信しました');
    e.currentTarget.reset();
    flushQueue();
  } catch (err) {
    pushQ(order);
    toast('送信失敗→一時保存しました（復帰後に自動送信）');
  }
});

flushQueue();
