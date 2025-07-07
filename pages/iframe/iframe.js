// File: pages/iframe/iframe.js
// 簡易的なGoogle検索iframeページ

// 要素取得
const view = document.getElementById('view');
const input = document.getElementById('q');
const go = document.getElementById('go');

// 検索実行関数
function search(q) {
  console.log('[iframe] search:', q); // デバッグ出力
  view.src = 'https://www.google.com/search?q=' + encodeURIComponent(q);
}

// ボタン押下で検索
go.addEventListener('click', () => search(input.value));

// Enterキーでも検索
input.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    search(input.value);
  }
});

// URLパラメータqがあれば自動検索
window.addEventListener('DOMContentLoaded', () => {
  const qParam = new URLSearchParams(location.search).get('q');
  if (qParam) {
    input.value = qParam;
    search(qParam);
  }
});
