// File: pages/memo/memo.js

"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
let memos = [];
let clips = [];

// Keeps track of current Archive sub-mode: "memo" or "clip"
let archiveType = null;

// ───────────────────────────────────────
// Promise-wrapped Chrome Storage API
// ───────────────────────────────────────
function loadStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => resolve(res[key] || []));
  });
}
function saveStorage(key, arr) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: arr }, () => resolve());
  });
}

// ───────────────────────────────────────
// Drag & Drop handlers for MEMOs
// ───────────────────────────────────────
let dragSrcIndex = null;
function handleDragStart(e) {
  dragSrcIndex = +this.dataset.index;
  console.log("MEMO drag start:", dragSrcIndex);
  e.dataTransfer.effectAllowed = "move";
}
function handleDragOver(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}
function handleDragLeave() {
  this.classList.remove("drag-over");
}
async function handleDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;
  console.log(`MEMO drop from ${dragSrcIndex} to ${dropIndex}`);
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  // reorder in array
  const [moved] = memos.splice(dragSrcIndex, 1);
  memos.splice(dropIndex, 0, moved);
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
// Drag & Drop handlers for Clips
// ───────────────────────────────────────
let dragClipIndex = null;
function handleClipDragStart(e) {
  dragClipIndex = +this.dataset.index;
  console.log("clip drag start:", dragClipIndex);
  e.dataTransfer.effectAllowed = "move";
}
function handleClipDragOver(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}
function handleClipDragLeave() {
  this.classList.remove("drag-over");
}
async function handleClipDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;
  console.log(`clip drop from ${dragClipIndex} to ${dropIndex}`);
  if (dragClipIndex === null || dragClipIndex === dropIndex) return;
  const [moved] = clips.splice(dragClipIndex, 1);
  clips.splice(dropIndex, 0, moved);
  await saveStorage(CLIP_KEY, clips);
  renderClipboardView();
}
function handleClipDragEnd() {
  document
    .querySelectorAll(".clipboard-item")
    .forEach((el) => el.classList.remove("drag-over"));
  dragClipIndex = null;
}

// ───────────────────────────────────────
// Renders the bottom footer depending on mode
// Modes:
//  - 'list'      → MEMO一覧 + Archive toggle
//  - 'clipboard' → Clipboard + Archive toggle
//  - 'edit'      → Save / Delete buttons
//  - 'archive'   → Back / Delete All buttons (set by renderArchiveNav)
// ───────────────────────────────────────
function setFooter(mode) {
  const foot = document.querySelector(".memo-footer");
  foot.style.display = "flex";
  if (mode === "list" || mode === "clipboard") {
    foot.innerHTML = `
      <button class="footer-btn encrypt-btn">暗号化フォルダ</button>
      <button id="btn-archive-toggle" class="footer-btn archive-toggle">アーカイブ</button>
    `;
  }
}

// ───────────────────────────────────────
// 1) MEMO一覧 + Archive toggle wiring
// ───────────────────────────────────────
async function renderListView() {
  console.log("renderListView: start");

  document.querySelector(".form-title")?.remove();

  // load memos
  memos = await loadStorage(MEMO_KEY);

  // reset sub-nav
  document
    .querySelectorAll(".card-nav .nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-memolist").classList.add("active");

  // set footer for list & wire Archive button
  setFooter("list");
  document
    .getElementById("btn-archive-toggle")
    .addEventListener("click", () => renderArchiveNav("memo"));

  // animate card + content
  const card = document.querySelector(".card-container");
  const content = document.querySelector(".memo-content");
  content.classList.remove("edit-mode", "clipboard-mode");
  card.classList.remove("animate");
  void card.offsetWidth;
  card.classList.add("animate");

  // render new-memo button + empty list
  content.innerHTML = `
    <button class="btn-new-memo">
      <i class="bi bi-plus-lg"></i> 新しいMEMOを追加
    </button>
    <ul class="memo-list"></ul>
  `;
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  content
    .querySelector(".btn-new-memo")
    .addEventListener("click", () => renderInputForm());

  // populate list items
  const ul = content.querySelector(".memo-list");
  ul.innerHTML = "";
  memos.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "memo-item";
    li.draggable = true;
    li.dataset.index = i;

    // DnD handlers
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("dragleave", handleDragLeave);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);

    // ★ star
    const star = document.createElement("i");
    star.className = m.starred
      ? "bi bi-star-fill star on"
      : "bi bi-star-fill star off";
    star.addEventListener("click", async (e) => {
      e.stopPropagation();
      m.starred = !m.starred;
      console.log(`star toggle id=${m.id} → ${m.starred}`);
      // move starred to top / unstar to bottom
      const idx = +li.dataset.index;
      memos.splice(idx, 1);
      if (m.starred) memos.unshift(m);
      else memos.push(m);
      await saveStorage(MEMO_KEY, memos);
      renderListView();
    });
    li.appendChild(star);

    // title
    const span = document.createElement("span");
    span.className = "title";
    span.textContent = m.title;
    li.appendChild(span);

    // archive-icon (just UI, no action)
    const arch = document.createElement("i");
    arch.className = "bi bi-archive-fill actions";
    li.appendChild(arch);

    // click row → edit
    li.addEventListener("click", () => renderInputForm(m.id));

    ul.appendChild(li);
  });

  console.log("renderListView: end");
}

// ───────────────────────────────────────
// 2) Clipboard view + Archive toggle
// ───────────────────────────────────────
async function renderClipboardView() {
  console.log("renderClipboardView: start");
  document.querySelector(".form-title")?.remove();
  clips = await loadStorage(CLIP_KEY);

  // reset sub-nav
  document
    .querySelectorAll(".card-nav .nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("btn-clipboard").classList.add("active");

  // footer + archive wiring
  setFooter("clipboard");
  document
    .getElementById("btn-archive-toggle")
    .addEventListener("click", () => renderArchiveNav("clip"));

  // animate
  const card = document.querySelector(".card-container");
  const content = document.querySelector(".memo-content");
  content.classList.remove("edit-mode");
  content.classList.add("clipboard-mode");
  card.classList.remove("animate");
  void card.offsetWidth;
  card.classList.add("animate");

  // header + list + add + hint
  content.innerHTML = `
    <h2 class="clipboard-header">
      <i class="bi bi-clipboard-fill"></i> フォーム用クリップボード
    </h2>
    <ul class="clipboard-list"></ul>
    <button class="btn-add-clip">+ クリップを追加</button>
    <p class="clipboard-hint">
      ※ 選択中のテキストエリアに入力されます
    </p>
  `;
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  content.querySelector(".btn-add-clip").addEventListener("click", async () => {
    clips.push("");
    await saveStorage(CLIP_KEY, clips);
    renderClipboardView();
  });

  // populate clips
  const ul = content.querySelector(".clipboard-list");
  ul.innerHTML = "";
  clips.forEach((txt, i) => {
    const li = document.createElement("li");
    li.className = "clipboard-item";
    li.draggable = true;
    li.dataset.index = i;

    // DnD handlers
    li.addEventListener("dragstart", handleClipDragStart);
    li.addEventListener("dragover", handleClipDragOver);
    li.addEventListener("dragleave", handleClipDragLeave);
    li.addEventListener("drop", handleClipDrop);
    li.addEventListener("dragend", handleClipDragEnd);

    // copy button
    const copy = document.createElement("button");
    copy.className = "clipboard-copy";
    copy.innerHTML = '<i class="bi bi-arrow-left-square-fill"></i>';
    copy.addEventListener("click", () => console.log("copy:", txt));
    li.appendChild(copy);

    // auto-resize textarea
    const ta = document.createElement("textarea");
    ta.className = "clipboard-textarea";
    ta.rows = 1;
    ta.value = txt;
    ta.placeholder = "テキストを入力";
    ta.addEventListener("input", () => {
      clips[i] = ta.value;
      saveStorage(CLIP_KEY, clips);
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
    li.appendChild(ta);

    // delete-archive button
    const del = document.createElement("button");
    del.className = "clipboard-archive";
    del.innerHTML = '<i class="bi bi-archive-fill"></i>';
    del.addEventListener("click", async () => {
      clips.splice(i, 1);
      await saveStorage(CLIP_KEY, clips);
      renderClipboardView();
    });
    li.appendChild(del);

    ul.appendChild(li);
    // ensure correct initial height
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
  });

  console.log("renderClipboardView: end");
}

// ───────────────────────────────────────
// 3) MEMO input / edit form
// ───────────────────────────────────────
async function renderInputForm(id) {
  console.log("renderInputForm: start, id=", id);
  memos = await loadStorage(MEMO_KEY);

  // always show sub-nav
  document.querySelector(".card-nav").style.display = "flex";

  // footer → save / delete
  setFooter("edit");

  // form title
  const card = document.querySelector(".card-container");
  let h2 = document.querySelector(".form-title");
  if (!h2) {
    h2 = document.createElement("h2");
    h2.className = "form-title";
    card.parentNode.insertBefore(h2, card);
  }
  h2.textContent = id ? "MEMO編集画面" : "MEMO入力画面";

  // form HTML
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

  // preload data when editing
  const starIcon = content.querySelector(".star-input");
  if (id !== undefined) {
    const existing = memos.find((m) => m.id === id);
    if (existing) {
      content.querySelector(".title-input").value = existing.title;
      content.querySelector(".text-input").value = existing.content;
      starIcon.classList.toggle("on", existing.starred);
      starIcon.classList.toggle("off", !existing.starred);
      starIcon.dataset.starred = existing.starred;
    }
  }

  // animate form
  content.classList.remove("clipboard-mode");
  content.classList.add("edit-mode");
  [card, content].forEach((el) => {
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  });

  // star toggle in form
  starIcon.dataset.starred = (starIcon.dataset.starred === "true").toString();
  starIcon.addEventListener("click", () => {
    const cur = starIcon.dataset.starred === "true";
    starIcon.dataset.starred = (!cur).toString();
    starIcon.classList.toggle("on", !cur);
    starIcon.classList.toggle("off", cur);
    console.log("form star toggled:", !cur);
  });

  // save handler
  document.querySelector(".save-btn").addEventListener("click", async () => {
    const title = content.querySelector(".title-input").value.trim() || "無題";
    const body = content.querySelector(".text-input").value.trim();
    const starred = starIcon.dataset.starred === "true";

    if (id !== undefined) {
      // update existing
      const idx = memos.findIndex((m) => m.id === id);
      memos[idx] = { id, title, content: body, starred };
      console.log("update memo:", memos[idx]);
    } else {
      // add new
      const newM = { id: Date.now(), title, content: body, starred };
      memos.push(newM);
      console.log("add memo:", newM);
    }
    await saveStorage(MEMO_KEY, memos);
    renderListView();
  });

  // delete/cancel handler
  document.querySelector(".delete-btn").addEventListener("click", async () => {
    if (id !== undefined) {
      memos = memos.filter((m) => m.id !== id);
      console.log("delete memo id=", id);
      await saveStorage(MEMO_KEY, memos);
    }
    renderListView();
  });

  console.log("renderInputForm: end");
}

// ───────────────────────────────────────
// 4) Archive mode: swap sub-nav & footer
// ───────────────────────────────────────
function renderArchiveNav(type) {
  console.log("renderArchiveNav: start, type=", type);
  archiveType = type;

  // swap card-nav buttons to Archive/MEMO ⇔ Archive/Clipboard
  const nav = document.querySelector(".card-nav");
  nav.innerHTML = `
    <button class="nav-btn" id="btn-archive-memo">
      <i class="bi bi-archive-fill"></i> アーカイブ/MEMO
    </button>
    <button class="nav-btn" id="btn-archive-clip">
      <i class="bi bi-archive-fill"></i> アーカイブ/クリップボード
    </button>
  `;
  // activate correct
  document
    .getElementById("btn-archive-memo")
    .classList.toggle("active", archiveType === "memo");
  document
    .getElementById("btn-archive-clip")
    .classList.toggle("active", archiveType === "clip");

  // set click handlers to re-render archive lists
  document
    .getElementById("btn-archive-memo")
    .addEventListener("click", () => renderArchiveNav("memo"));
  document
    .getElementById("btn-archive-clip")
    .addEventListener("click", () => renderArchiveNav("clip"));

  // now render the archive list + footer
  renderArchiveList();
  renderArchiveFooter();

  console.log("renderArchiveNav: end");
}

// Renders the actual archive list inside .memo-content
async function renderArchiveList() {
  console.log("renderArchiveList: start");
  // apply 'archive' class to card for white background (CSS picks this up)
  document.querySelector(".card-container").classList.add("archive");

  // clear & fade-in
  const content = document.querySelector(".memo-content");
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  // load either memos or clips
  const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
  const items = await loadStorage(key);

  // build list
  content.innerHTML = `<ul class="archive-list"></ul>`;
  const ul = content.querySelector(".archive-list");
  items.forEach((it, idx) => {
    const li = document.createElement("li");
    // checkbox
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.dataset.index = idx;
    li.appendChild(cb);
    // label
    const span = document.createElement("span");
    span.textContent = archiveType === "memo" ? it.title : it;
    li.appendChild(span);
    ul.appendChild(li);
  });
  console.log("renderArchiveList: end");
}

// Replace footer with Back & Delete-All for archive mode
function renderArchiveFooter() {
  console.log("renderArchiveFooter: start");
  const footer = document.querySelector(".memo-footer");
  footer.classList.add("archive");
  footer.innerHTML = `
    <button class="footer-btn back-btn">戻る</button>
    <button class="footer-btn delete-all-btn"> 一括削除</button>
  `;
  foot.style.display = "flex";

  // Back → go back to last mode (we’ll default to MEMO list)
  foot.querySelector(".back-btn").addEventListener("click", () => {
    document.querySelector(".card-container").classList.remove("archive");
    renderListView();
  });
  // Delete All → clear storage & re-render archive list
  foot.querySelector(".delete-all-btn").addEventListener("click", async () => {
    const key = archiveType === "memo" ? MEMO_KEY : CLIP_KEY;
    await saveStorage(key, []);
    renderArchiveList();
  });
  console.log("renderArchiveFooter: end");
}

// ───────────────────────────────────────
// Initialization on load
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  document
    .getElementById("btn-memolist")
    .addEventListener("click", renderListView);
  document
    .getElementById("btn-clipboard")
    .addEventListener("click", renderClipboardView);

  // start in MEMO list
  await renderListView();
});
