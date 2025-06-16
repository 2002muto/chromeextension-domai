// File: pages/memo/memo.js
"use strict";

/*
 * Memo & Clipboard SPA — 完全新版
 * - MEMO一覧: 星 on/off、矢印アイコン、グラデカード
 * - MEMO入力: 見出し緑、星トグル、入力欄、緑/赤ボタン
 * - クリップボード: 見出し、カードリスト、+クリップを追加、ヒント
 * - console.log 付きステップバイステップ
 */

/*
 * MEMO & Clipboard SPA — ドラッグ＆ドロップ修正版
 */

const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
let memos = [];
let clips = [];

// ───────────────────────────────────────
// Storage ラッパー
// ───────────────────────────────────────
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

// ───────────────────────────────────────
// ドラッグ＆ドロップハンドラ
// ───────────────────────────────────────
let dragSrcIndex = null;

function handleDragStart(e) {
  dragSrcIndex = Number(this.dataset.index);
  console.log("drag start:", dragSrcIndex);
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault(); // drop を許可
  this.classList.add("drag-over");
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

async function handleDrop(e) {
  e.stopPropagation();
  const dropIndex = Number(this.dataset.index);
  console.log("drop from", dragSrcIndex, "to", dropIndex);
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  // 配列を移動
  const [moved] = memos.splice(dragSrcIndex, 1);
  memos.splice(dropIndex, 0, moved);
  console.log(
    "after drop order:",
    memos.map((x) => x.title)
  );
  await saveStorage(MEMO_KEY, memos);
  renderListView();
}

function handleDragEnd() {
  document
    .querySelectorAll(".memo-item")
    .forEach((el) => el.classList.remove("drag-over"));
  dragSrcIndex = null;
}

// ───────────────────────────────────────
// MEMO一覧描画
// ───────────────────────────────────────
async function renderListView() {
  memos = await loadStorage(MEMO_KEY);

  // 既存のタイトルフォーム削除
  document.querySelector(".form-title")?.remove();

  // サブナビ切替
  document
    .querySelectorAll(".card-nav .nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-memolist").classList.add("active");

  // フッターセット
  const footer = document.querySelector(".memo-footer");
  footer.style.display = "flex";
  footer.innerHTML = `
    <button class="footer-btn"><i class="bi bi-lock-fill"></i> 暗号化フォルダ</button>
    <button class="footer-btn"><i class="bi bi-archive-fill"></i> アーカイブ</button>
  `;

  // フェードイン
  const card = document.querySelector(".card-container");
  const content = document.querySelector(".memo-content");
  [card, content].forEach((el) => {
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  });

  // 新規追加＋リスト領域
  content.innerHTML = `
    <button class="btn-new-memo"><i class="bi bi-plus-lg"></i> 新しいMEMOを追加</button>
    <ul class="memo-list"></ul>
  `;
  content
    .querySelector(".btn-new-memo")
    .addEventListener("click", () => renderInputForm());

  // リスト描画
  const ul = content.querySelector(".memo-list");
  ul.innerHTML = "";
  memos.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "memo-item";
    li.setAttribute("draggable", "true");
    li.dataset.index = i;

    // ドラッグイベント
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("dragleave", handleDragLeave);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    // 星アイコン
    const star = document.createElement("i");
    star.className = m.starred
      ? "bi bi-star-fill star on"
      : "bi bi-star-fill star off";
    star.addEventListener("click", (e) => {
      e.stopPropagation();
      m.starred = !m.starred;
      console.log(`toggle star id=${m.id} → ${m.starred}`);
      memos.splice(i, 1);
      if (m.starred) memos.unshift(m);
      else memos.push(m);
      console.log(
        "after star order:",
        memos.map((x) => x.title)
      );
      saveStorage(MEMO_KEY, memos).then(renderListView);
    });
    li.appendChild(star);

    // タイトル
    const span = document.createElement("span");
    span.className = "title";
    span.textContent = m.title;
    li.appendChild(span);

    // アーカイブアイコン
    const archive = document.createElement("i");
    archive.className = "bi bi-archive-fill actions";
    archive.addEventListener("click", (e) => e.stopPropagation());
    li.appendChild(archive);

    // クリックで編集
    li.addEventListener("click", () => renderInputForm(m.id));

    ul.appendChild(li);
  });
}

// --- クリップボード 描画 ---
async function renderClipboardView() {
  console.log("renderClipboardView: start");
  clips = await loadStorage(CLIP_KEY);
  document.querySelector(".form-title")?.remove();

  // サブナビ切替
  document
    .querySelectorAll(".card-nav .nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-clipboard").classList.add("active");

  // フッターセット
  const footer = document.querySelector(".memo-footer");
  footer.style.display = "flex";
  footer.innerHTML = `
    <button class="footer-btn"><i class="bi bi-lock-fill"></i> 暗号化フォルダ</button>
    <button class="footer-btn"><i class="bi bi-archive-fill"></i> アーカイブ</button>
  `;

  // フェードイン
  const card = document.querySelector(".card-container");
  const content = document.querySelector(".memo-content");
  [card, content].forEach((el) => {
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  });

  // 見出し + リスト + 追加 + ヒント
  content.innerHTML = `
    <h2 class="clipboard-header">
      <i class="bi bi-clipboard-fill"></i> フォーム用クリップボード
    </h2>
    <ul class="clipboard-list"></ul>
    <button class="btn-add-clip">+ クリップを追加</button>
    <p class="clipboard-hint">※ 選択中のテキストエリアに入力されます</p>
  `;
  content.querySelector(".btn-add-clip").addEventListener("click", () => {
    clips.push("");
    saveStorage(CLIP_KEY, clips);
    renderClipboardView();
  });

  // クリップアイテム
  const ul = content.querySelector(".clipboard-list");
  ul.innerHTML = "";
  clips.forEach((txt, i) => {
    const li = document.createElement("li");
    li.className = "clipboard-item";

    // コピーアイコン
    const copy = document.createElement("button");
    copy.className = "clipboard-copy";
    copy.innerHTML = '<i class="bi bi-arrow-left-square-fill"></i>';
    copy.addEventListener("click", () => console.log("copy:", txt));
    li.appendChild(copy);

    // テキスト欄
    const input = document.createElement("input");
    input.className = "clipboard-input";
    input.value = txt;
    input.placeholder = "テキストを入力";
    input.addEventListener("change", () => {
      clips[i] = input.value;
      saveStorage(CLIP_KEY, clips);
    });
    li.appendChild(input);

    // アーカイブアイコン
    const arch = document.createElement("button");
    arch.className = "clipboard-archive";
    arch.innerHTML = '<i class="bi bi-archive-fill"></i>';
    arch.addEventListener("click", () => {
      clips.splice(i, 1);
      saveStorage(CLIP_KEY, clips);
      renderClipboardView();
    });
    li.appendChild(arch);

    ul.appendChild(li);
  });

  console.log("renderClipboardView: end");
}

async function renderInputForm(id) {
  console.log("renderInputForm: start, id=", id);

  // ① 最新データをロード
  memos = await loadStorage(MEMO_KEY);
  console.log("renderInputForm: loaded memos", memos);

  // ② サブナビ表示（そのまま）
  document.querySelector(".card-nav").style.display = "flex";

  // ③ フッターを「保存／削除」に切り替え
  const footer = document.querySelector(".memo-footer");
  footer.style.display = "flex";
  footer.innerHTML = `
    <button class="footer-btn save-btn">
      <i class="bi bi-save"></i> 保存して戻る
    </button>
    <button class="footer-btn delete-btn">
      <i class="bi bi-trash"></i> 削除して戻る
    </button>
  `;

  // ④ フォーム見出し
  const card = document.querySelector(".card-container");
  let titleEl = document.querySelector(".form-title");
  if (!titleEl) {
    titleEl = document.createElement("h2");
    titleEl.className = "form-title";
    card.parentNode.insertBefore(titleEl, card);
  }
  titleEl.textContent = id ? "MEMO編集画面" : "MEMO入力画面";

  // ⑤ フォーム本体をカードに描画
  const content = document.querySelector(".memo-content");
  content.innerHTML = `
    <div class="memo-input-form">
      <div class="input-header">
        <i class="bi bi-star-fill star-input off"></i>
        <input type="text" class="title-input" placeholder="タイトル" />
      </div>
      <textarea class="text-input" placeholder="テキストを入力…"></textarea>
    </div>
  `;

  // ⑥ 既存データがある場合はフォームへセット
  if (id !== undefined) {
    const memo = memos.find((m) => m.id === id);
    console.log("renderInputForm: editing memo", memo);
    if (memo) {
      // タイトル／本文
      content.querySelector(".title-input").value = memo.title;
      content.querySelector(".text-input").value = memo.content;
      // 星の状態
      let starred = memo.starred;
      const starIcon = content.querySelector(".star-input");
      starIcon.classList.toggle("on", starred);
      starIcon.classList.toggle("off", !starred);
      // toggle イベントで使えるように保持
      starIcon.dataset.starred = starred;
    }
  }

  // ⑦ フェードイン（カード＋内容）
  [card, content].forEach((el) => {
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  });

  // ⑧ 星トグル処理
  const starIcon = content.querySelector(".star-input");
  starIcon.addEventListener("click", () => {
    const current = starIcon.dataset.starred === "true";
    starIcon.dataset.starred = (!current).toString();
    starIcon.classList.toggle("on", !current);
    starIcon.classList.toggle("off", current);
    console.log("renderInputForm: starred toggled", !current);
  });

  // ⑨ 保存ボタン
  footer.querySelector(".save-btn").addEventListener("click", () => {
    const title = content.querySelector(".title-input").value.trim() || "無題";
    const body = content.querySelector(".text-input").value.trim();
    const starred = starIcon.dataset.starred === "true";

    if (id !== undefined) {
      // 更新
      const idx = memos.findIndex((m) => m.id === id);
      memos[idx] = { id, title, content: body, starred };
      console.log("renderInputForm: update memo", memos[idx]);
    } else {
      // 新規
      const newMemo = { id: Date.now(), title, content: body, starred };
      memos.push(newMemo);
      console.log("renderInputForm: add memo", newMemo);
    }

    saveStorage(MEMO_KEY, memos);
    renderListView();
  });

  // ⑩ 削除／キャンセルボタン
  footer.querySelector(".delete-btn").addEventListener("click", () => {
    if (id !== undefined) {
      memos = memos.filter((m) => m.id !== id);
      saveStorage(MEMO_KEY, memos);
      console.log("renderInputForm: delete memo id=", id);
    }
    renderListView();
  });

  console.log("renderInputForm: end");
}

// --- 初期化 ---
window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  document
    .getElementById("btn-memolist")
    .addEventListener("click", renderListView);
  document
    .getElementById("btn-clipboard")
    .addEventListener("click", renderClipboardView);
  await renderListView();
});
