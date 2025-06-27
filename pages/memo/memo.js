// File: pages/memo/memo.js

"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
const CLIP_ARCH_KEY = "clips_arch";
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
  } else if (mode === "edit") {
    /* ← 追加：MEMO入力／編集画面用フッター */
    foot.innerHTML = `
      <button class="footer-btn save-btn"><i class="bi bi-save"></i> 保存して戻る</button>
      <button class="footer-btn delete-btn"><i class="bi bi-trash"></i> 削除して戻る</button>
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
  /* --- nav が無い場合は生成しておく ---------------------- */
  /* --- nav が無い場合は生成しておく ---------------------- */
  let nav = document.querySelector(".card-nav");
  if (!nav) {
    const nav = document.createElement("div");
    nav.className = "card-nav";
    nav.innerHTML = `
        <button class="nav-btn" id="btn-memolist">MEMO一覧</button>
        <button class="nav-btn" id="btn-clipboard">クリップボード</button>
      `;
    document.querySelector(".top-nav").after(nav);
    // .top-nav が無い場合でも必ず挿入
    const ref = document.querySelector(".top-nav") || document.body.firstChild;
    ref.parentNode.insertBefore(nav, ref.nextSibling);
  }
  /* ------------------------------------------------------- */
  /* ------------------------------------------------------- */
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

  // animate content
  const content = document.querySelector(".memo-content");
  content.classList.remove("edit-mode", "clipboard-mode");
  content.classList.remove("animate");
  void content.offsetWidth;
  content.classList.add("animate");

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
  memos
    .filter((m) => !m.archived) // ← 追加：一覧は未アーカイブのみ
    .forEach((m, i) => {
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
      arch.title = "アーカイブへ移動";
      arch.addEventListener("click", async (e) => {
        e.stopPropagation();
        m.archived = true;
        await saveStorage(MEMO_KEY, memos);
        renderListView(); // 再描画で一覧から消える
      });
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
  const content = document.querySelector(".memo-content");
  content.classList.remove("edit-mode");
  content.classList.add("clipboard-mode");
  content.classList.remove("animate");
  void content.offsetWidth;
  content.classList.add("animate");

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
    // 挿入ボタン（Arrow-left-square-fill）
    const copy = document.createElement("button");
    copy.className = "clipboard-copy";
    copy.innerHTML = '<i class="bi bi-arrow-left-square-fill"></i>';
    copy.addEventListener("click", () => {
      // ★修正★ 最新の textarea の値を取得して送信
      const currentText = ta.value;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length) return;
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "INSERT_CLIP", text: currentText },
          (resp) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "sendMessage failed:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("copy:", currentText);
            }
          }
        );
      });
    });

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

    /*─────────────────────────────────────────*/
    /* ② renderClipboardView 内の「アーカイブ」 */
    /*   アイコン・クリック処理を差し替え       */
    /*─────────────────────────────────────────*/
    // delete-archive button  ←★差し替え★
    const del = document.createElement("button");
    del.className = "clipboard-archive";
    del.innerHTML = '<i class="bi bi-archive-fill"></i>';
    del.addEventListener("click", async () => {
      /*--- アーカイブへ移動 ---*/
      const removed = clips.splice(i, 1)[0]; // ① アクティブ配列から削除
      await saveStorage(CLIP_KEY, clips); // ② 保存（現役クリップを更新）

      const arch = await loadStorage(CLIP_ARCH_KEY); // ③ アーカイブ配列を取得
      arch.push(removed); // ④ 末尾に追加
      await saveStorage(CLIP_ARCH_KEY, arch); // ⑤ 保存（アーカイブを更新）

      console.log("[CLIP] archived →", removed);
      renderClipboardView(); // ⑥ 再描画
    });
    li.appendChild(del);
    /*─────────────────────────────────────────*/

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
  const contentElement = document.querySelector(".memo-content");
  let h2 = document.querySelector(".form-title");
  if (!h2) {
    h2 = document.createElement("h2");
    h2.className = "form-title";
    contentElement.parentNode.insertBefore(h2, contentElement);
  }
  h2.textContent = id ? "MEMO編集画面" : "MEMO入力画面";

  // form HTML
  const content = document.querySelector(".memo-content");
  content.innerHTML = `
    <div class="memo-input-form">
      <div class="input-header">
        <i class="bi bi-star star-input off"></i>
        <input type="text" class="title-input" placeholder="タイトル" />
      </div>
      <textarea class="text-input" placeholder="テキストを入力..."></textarea>
    </div>
  `;

  // Locate the textarea element for further manipulation
  const ta = content.querySelector(".text-input");
  console.log("Initialized MEMO textarea", ta);
  // Ensure minimum height via JS as well
  ta.style.minHeight = "200px";
  // Explicitly allow vertical resizing
  ta.style.resize = "vertical";
  console.log("Enable vertical resize for MEMO textarea");

  // クリックした位置にカーソルを移動する機能を追加
  ta.addEventListener("click", function (e) {
    // クリック座標からカーソル位置を計算
    const rect = ta.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 一時的に空のdivを作成してテキストの描画を模擬
    const mirror = document.createElement("div");
    const computedStyle = window.getComputedStyle(ta);

    // textareaのスタイルをコピー
    mirror.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${
        ta.offsetWidth -
        parseInt(computedStyle.paddingLeft) -
        parseInt(computedStyle.paddingRight)
      }px;
      height: auto;
      font-family: ${computedStyle.fontFamily};
      font-size: ${computedStyle.fontSize};
      font-weight: ${computedStyle.fontWeight};
      line-height: ${computedStyle.lineHeight};
      letter-spacing: ${computedStyle.letterSpacing};
      white-space: pre-wrap;
      word-wrap: break-word;
      padding: 0;
      margin: 0;
      border: 0;
      overflow: hidden;
    `;

    document.body.appendChild(mirror);

    const text = ta.value;
    const lines = text.split("\n");
    const lineHeight =
      parseInt(computedStyle.lineHeight) ||
      parseInt(computedStyle.fontSize) * 1.2;
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;

    // クリックされた行を計算
    const clickedLine = Math.floor((y - paddingTop) / lineHeight);

    if (clickedLine >= 0 && clickedLine < lines.length) {
      // その行の開始位置を計算
      let position = 0;
      for (let i = 0; i < clickedLine; i++) {
        position += lines[i].length + 1; // +1 for newline character
      }

      // その行内での位置を計算
      const lineText = lines[clickedLine];
      mirror.textContent = lineText;

      let charPosition = 0;
      for (let i = 0; i <= lineText.length; i++) {
        mirror.textContent = lineText.substring(0, i);
        if (mirror.offsetWidth > x) {
          charPosition = Math.max(0, i - 1);
          break;
        }
        charPosition = i;
      }

      const finalPosition = position + charPosition;

      // カーソル位置を設定
      ta.setSelectionRange(finalPosition, finalPosition);
      ta.focus();
    } else if (clickedLine >= lines.length) {
      // 最後の行より下をクリックした場合、最後の行の末尾に移動
      const lastPosition = text.length;
      ta.setSelectionRange(lastPosition, lastPosition);
      ta.focus();
    }

    // 一時的なelementを削除
    document.body.removeChild(mirror);
  });

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

      // 既存メモ編集時のアイコン設定
      if (existing.starred) {
        starIcon.classList.remove("bi-star");
        starIcon.classList.add("bi-star-fill");
      } else {
        starIcon.classList.remove("bi-star-fill");
        starIcon.classList.add("bi-star");
      }
    }
  }

  // animate form
  content.classList.remove("clipboard-mode");
  content.classList.add("edit-mode");

  /* ▼▼ 追加：カード本体にも"下からふわっ"アニメ ▼▼ */
  content.classList.remove("animate");
  void content.offsetWidth; // 1フレーム reflow
  content.classList.add("animate");

  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  // star toggle in form - デフォルトは未選択状態
  if (id === undefined) {
    // 新規作成時は必ず未選択状態
    starIcon.dataset.starred = "false";
    starIcon.classList.add("off");
    starIcon.classList.remove("on");
  } else {
    starIcon.dataset.starred = (starIcon.dataset.starred === "true").toString();
  }
  starIcon.addEventListener("click", () => {
    const cur = starIcon.dataset.starred === "true";
    starIcon.dataset.starred = (!cur).toString();
    starIcon.classList.toggle("on", !cur);
    starIcon.classList.toggle("off", cur);

    // アイコンの種類も切り替え
    if (!cur) {
      // 選択状態：塗りつぶし + 黄色
      starIcon.classList.remove("bi-star");
      starIcon.classList.add("bi-star-fill");
    } else {
      // 未選択状態：枠のみ + グレー
      starIcon.classList.remove("bi-star-fill");
      starIcon.classList.add("bi-star");
    }

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
      const newM = {
        id: Date.now(),
        title,
        content: body,
        starred,
        archived: false,
      };
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
  console.log("renderArchiveList: start", archiveType);

  document.querySelector(".memo-content").classList.add("archive");
  const content = document.querySelector(".memo-content");
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  /* 1) ストレージ読み込み */
  const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY; // ★ 修正
  const rawItems = await loadStorage(key);
  const listData =
    archiveType === "memo" ? rawItems.filter((m) => m.archived) : rawItems;

  /* 2) HTML 骨格 */
  content.innerHTML = `
    <label class="select-all-label">
      <input type="checkbox" id="chk-select-all" /> 全て選択する
    </label>
    <ul class="archive-list"></ul>`;
  const ul = content.querySelector(".archive-list");

  /* 3) 行生成 */
  listData.forEach((it, idx) => {
    const li = document.createElement("li");
    li.className = "archive-item";

    /* 左：チェック */
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "arch-check";
    cb.dataset.index = idx;
    li.appendChild(cb);

    /* 中央：タイトル */
    const span = document.createElement("span");
    span.className = "arch-title";
    span.textContent = archiveType === "memo" ? it.title || "無題" : it;
    li.appendChild(span);

    /* 右：復元ボタン */
    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.innerHTML = '<i class="bi bi-upload"></i>';
    btn.title = "復元";
    btn.addEventListener("click", async () => {
      console.log("[ARCH] restore idx:", idx);

      if (archiveType === "memo") {
        /* MEMO: archived → false */
        const memos = await loadStorage(MEMO_KEY);
        const target = memos.find((m) => m.id === it.id);
        if (target) target.archived = false;
        await saveStorage(MEMO_KEY, memos);
      } else {
        /* CLIP: アーカイブ → アクティブへ移動 */
        const act = await loadStorage(CLIP_KEY);
        const arch = await loadStorage(CLIP_ARCH_KEY);
        act.push(arch.splice(idx, 1)[0]);
        await saveStorage(CLIP_KEY, act);
        await saveStorage(CLIP_ARCH_KEY, arch);
      }
      renderArchiveList(); // 再描画
    });
    li.appendChild(btn);

    ul.appendChild(li);
  });

  /* 4) 全選択チェック */
  content.querySelector("#chk-select-all").onchange = (e) =>
    ul
      .querySelectorAll(".arch-check")
      .forEach((c) => (c.checked = e.target.checked));

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
  footer.style.display = "flex";

  // Back → go back to last mode (we'll default to MEMO list)
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // 1) Archive 表示を解除
    document.querySelector(".memo-content").classList.remove("archive");
    document.querySelector(".sub-archive-nav")?.remove();
    footer.classList.remove("archive");

    // 2) MEMO/CLIP ナビを復元してイベント再登録
    const nav = document.querySelector(".card-nav");
    nav.innerHTML = `
     <button class="nav-btn" id="btn-memolist">MEMO一覧</button>
     <button class="nav-btn" id="btn-clipboard">クリップボード</button>
   `;
    document
      .getElementById("btn-memolist")
      .addEventListener("click", renderListView);
    document
      .getElementById("btn-clipboard")
      .addEventListener("click", renderClipboardView);

    // 3) 画面遷移
    if (archiveType === "memo") renderListView();
    else renderClipboardView();
  });
  // Delete All → clear storage & re-render archive list
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY;
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
