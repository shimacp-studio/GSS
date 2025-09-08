<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>商品発注フォームへ移動中…</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">

  <!-- ホーム画面用アイコン（リポジトリ直下に icons/ を作って置く） -->
  <link rel="apple-touch-icon" href="android-launchericon-192-192.png">
  <link rel="icon" type="image/png" sizes="192x192" href="android-launchericon-512-512.png">
  <link rel="icon" type="image/png" sizes="32x32"  href="android-launchericon-512-512.png">

  <!-- JS無効時のフォールバック（※あなたの /exec に差し替え済み） -->
  <meta http-equiv="refresh" content="0;url=https://script.google.com/macros/s/AKfycby9ZZVrFe1HUiLL6W2wi9p-RPluxP02IIM6_9LGHlxNHoB8QrYxCpEKl-eiqWo6mOC1/exec">

  <style>
    body{font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif;margin:0;min-height:100dvh;display:grid;place-items:center}
    .wrap{text-align:center;line-height:1.8}
    a{color:#0ea5e9;text-decoration:none}
  </style>
</head>
<body>
  <div class="wrap">
    <p>読み込み中です…<br>
       自動で移動しない場合は
       <a id="link" href="https://script.google.com/macros/s/AKfycby9ZZVrFe1HUiLL6W2wi9p-RPluxP02IIM6_9LGHlxNHoB8QrYxCpEKl-eiqWo6mOC1/exec">こちら</a>
       をタップしてください。</p>
  </div>

  <script>
    // ★ あなたの /exec（デプロイ済み本番URL）
    const TARGET = 'https://script.google.com/macros/s/AKfycby9ZZVrFe1HUiLL6W2wi9p-RPluxP02IIM6_9LGHlxNHoB8QrYxCpEKl-eiqWo6mOC1/exec';

    // 以前このリポジトリでPWAを出していた場合の“古いSWキャッシュ”掃除（任意）
    (async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister().catch(()=>{})));
        }
      } catch (e) {}
      // クエリ文字列と#ハッシュを引き継いでリダイレクト
      const url = TARGET + location.search + location.hash;
      document.getElementById('link').href = url;
      location.replace(url);
    })();
  </script>
</body>
</html>
