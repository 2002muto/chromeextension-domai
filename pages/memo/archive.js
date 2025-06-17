// File: pages/memo/archive.js

"use strict";

const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
let archiveType = "memo"; // "memo" or "clip"

// archive モードに切り替え
window.addEventListener("DOMContentLoaded", () => {
  // アーカイブボタンを memo.js 側で .archive-mode クラス付与後に呼び出す前提
  document.querySelectorAll(".archive-toggle").forEach((btn) => {
    btn.addEventListener("click", () => startArchiveMode(btn.dataset.type));
  });
});

async function startArchiveMode(type) {
  archiveType = type;
  // カード背景切り替え
  const card = document.querySelector(".card-container");
  card.classList.add("archive");

  // サブナビを挿入
  let nav = document.querySelector(".sub-archive-nav");
  if (!nav) {
    nav = document.createElement("div");
    nav.className = "sub-archive-nav";
    nav.innerHTML = `
      <div class="nav-btn" id="arch-memo">アーカイブ/MEMO</div>
      <div class="nav-btn" id="arch-clip">アーカイブ/クリップボード</div>
    `;
    card.parentNode.insertBefore(nav, card);
    nav.querySelectorAll(".nav-btn").forEach((el) => {
      el.addEventListener("click", () => {
        archiveType = el.id === "arch-clip" ? "clip" : "memo";
        renderArchiveList();
      });
    });
  }
  // active 切り替え
  nav.querySelectorAll(".nav-btn").forEach((el) => {
    el.classList.toggle(
      "active",
      (archiveType === "memo" && el.id === "arch-memo") ||
        (archiveType === "clip" && el.id === "arch-clip")
    );
  });

  // フッター切り替え
  const footer = document.querySelector(".bottom-footer");
  footer.classList.add("archive");
  footer.innerHTML = `
    <button class="footer-btn back-btn">← 戻る</button>
    <button class="footer-btn delete-all-btn">一括削除</button>
  `;
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // 通常モードに戻す
    location.reload();
  });
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
      await chrome.storage.local.set({ [key]: [] });
      renderArchiveList();
    });

  // リスト初回描画
  renderArchiveList();
}

async function renderArchiveList() {
  const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
  const { [key]: items = [] } = await new Promise((res) =>
    chrome.storage.local.get([key], res)
  );

  const ul =
    document.querySelector(".archive-list") ||
    (() => {
      const u = document.createElement("ul");
      u.className = "archive-list";
      document.querySelector(".card-container .card").append(u);
      return u;
    })();
  ul.innerHTML = "";

  items.forEach((it, i) => {
    const li = document.createElement("li");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.index = i;
    li.append(cb);

    const span = document.createElement("span");
    span.textContent = (archiveType === "memo" ? it.title : it) || "無題";
    li.append(span);

    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.textContent = "↩︎";
    btn.addEventListener("click", async () => {
      items.splice(i, 1);
      await chrome.storage.local.set({ [key]: items });
      renderArchiveList();
    });
    li.append(btn);

    ul.append(li);
  });
}
