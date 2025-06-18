// File: pages/memo/archive.js

"use strict";

const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
let archiveType = "memo"; // "memo" or "clip"

/** Promiseラッパー */
function loadStorage(key) {
  return new Promise((res) =>
    chrome.storage.local.get([key], (o) => res(o[key] || []))
  );
}
function saveStorage(key, arr) {
  return new Promise((res) =>
    chrome.storage.local.set({ [key]: arr }, () => res())
  );
}

/** Archive モード開始（btn-archive に data-type="memo"/"clip" を付けておく） */
function startArchiveMode(type) {
  archiveType = type;
  const card = document.querySelector(".card-container");

  // 1) カード背景を切り替え
  card.classList.add("archive");

  // 2) サブナビを差し替え
  let nav = document.querySelector(".sub-archive-nav");
  if (!nav) {
    nav = document.createElement("div");
    nav.className = "sub-archive-nav";
    nav.innerHTML = `
      <div class="nav-btn" id="arch-memo">アーカイブ/MEMO</div>
      <div class="nav-btn" id="arch-clip">アーカイブ/クリップボード</div>
    `;
    card.parentNode.insertBefore(nav, card);
    // 切替リスナ
    nav.querySelector("#arch-memo").addEventListener("click", () => {
      archiveType = "memo";
      renderArchiveList();
      setArchiveNavActive();
    });
    nav.querySelector("#arch-clip").addEventListener("click", () => {
      archiveType = "clip";
      renderArchiveList();
      setArchiveNavActive();
    });
  }
  setArchiveNavActive();

  // 3) リスト描画
  renderArchiveList();

  // 4) フッター描画
  renderArchiveFooter();
}

/** サブナビの active 切り替え */
function setArchiveNavActive() {
  document.querySelectorAll(".sub-archive-nav .nav-btn").forEach((b) => {
    b.classList.toggle(
      "active",
      (archiveType === "memo" && b.id === "arch-memo") ||
        (archiveType === "clip" && b.id === "arch-clip")
    );
  });
}

/** アーカイブリストを描画 */
async function renderArchiveList() {
  const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
  const items = await loadStorage(key);

  let ul = document.querySelector(".archive-list");
  if (!ul) {
    ul = document.createElement("ul");
    ul.className = "archive-list";
    document.querySelector(".card-container .card").appendChild(ul);
  }
  ul.innerHTML = "";

  items.forEach((it, i) => {
    const li = document.createElement("li");
    // チェックボックス
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.index = i;
    li.appendChild(cb);
    // タイトル
    const span = document.createElement("span");
    span.textContent = archiveType === "memo" ? it.title : it;
    li.appendChild(span);
    // 復元ボタン
    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.textContent = "↩︎";
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      items.splice(i, 1);
      await saveStorage(key, items);
      renderArchiveList();
    });
    li.appendChild(btn);

    ul.appendChild(li);
  });
}

/** アーカイブモード用フッターを描画 */
function renderArchiveFooter() {
  const footer = document.querySelector(".memo-footer");
  // const footer = document.querySelector(".bottom-footer");
  footer.classList.add("archive");
  footer.innerHTML = `
    <button class="footer-btn back-btn">
      <i class="bi bi-arrow-left-circle"></i> 戻る
    </button>
    <button class="footer-btn delete-all-btn">
      <i class="bi bi-trash"></i> 一括削除
    </button>
  `;

  // ↓ここを修正（archiveType に応じて正しく呼び出し）
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // 1) Archiveモードを解除
    document.querySelector(".card-container").classList.remove("archive");
    document.querySelector(".sub-archive-nav")?.remove();
    footer.classList.remove("archive");
    // 2) 元の画面に戻す
    if (archiveType === "memo") {
      renderListView();
    } else {
      renderClipboardView();
    }
  });

  // 一括削除ボタンのロジックはそのまま
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
      await saveStorage(key, []);
      renderArchiveList();
    });
}

// DOMContentLoaded で archive-toggle ボタンを拾って startArchiveMode をバインド
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#btn-archive").forEach((btn) => {
    // memo.js の setFooter で生成される <button id="btn-archive">
    btn.addEventListener("click", () => startArchiveMode("memo"));
  });
  // もし クリップボード画面にも archive ボタンを出したいなら同様に data-type="clip" としてバインド
});
