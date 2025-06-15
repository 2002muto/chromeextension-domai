// File: pages/memo/memo.js
// ダミーデータ（後で localStorage 連携に置き換え）
const memos = [
  { id: 1, title: "タイトルタイトルタイトル...", starred: true },
  { id: 2, title: "タイトルタイトルタイトル...", starred: false },
  { id: 3, title: "タイトルタイトルタイトル...", starred: false },
  { id: 4, title: "タイトルタイトルタイトル...", starred: false },
];

function renderMemos() {
  const ul = document.querySelector(".memo-list");
  ul.innerHTML = "";
  memos.forEach((m) => {
    const li = document.createElement("li");
    // スター
    const star = document.createElement("i");
    star.className = `bi bi-star-${m.starred ? "fill star on" : "off star"}`;
    star.addEventListener("click", () => {
      m.starred = !m.starred;
      renderMemos();
    });
    li.appendChild(star);
    // タイトル
    const title = document.createElement("span");
    title.className = "title";
    title.textContent = m.title;
    li.appendChild(title);
    // アクション（例：詳細ボタン）
    const act = document.createElement("i");
    act.className = "bi bi-three-dots actions";
    li.appendChild(act);

    ul.appendChild(li);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  renderMemos();
  document.querySelector(".btn-new-memo").addEventListener("click", () => {
    // 新規作成ダイアログ呼び出し（実装予定）
    alert("新規MEMO追加");
  });
  document.querySelectorAll(".card-nav .nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".card-nav .nav-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      // クリックに応じた表示切り替えもここで実装できます
    });
  });
});
