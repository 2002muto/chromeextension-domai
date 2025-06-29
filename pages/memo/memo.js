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

// 現在編集中のメモID
let currentEditingMemoId = null;

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
let dragSrcStarred = null; // ドラッグ元の星状態を記録
function handleDragStart(e) {
  dragSrcIndex = +this.dataset.index;
  const filteredMemos = memos.filter((m) => !m.archived);
  dragSrcStarred = filteredMemos[dragSrcIndex]?.starred || false;
  console.log("MEMO drag start:", dragSrcIndex, "starred:", dragSrcStarred);
  e.dataTransfer.effectAllowed = "move";
}
function handleDragOver(e) {
  e.preventDefault();

  // ドロップ先の星状態をチェック
  const dropIndex = +this.dataset.index;
  const filteredMemos = memos.filter((m) => !m.archived);
  const dropTargetStarred = filteredMemos[dropIndex]?.starred || false;

  // 異なるカテゴリ間のドロップを禁止
  if (dragSrcStarred !== dropTargetStarred) {
    this.classList.add("drag-invalid");
    this.classList.remove("drag-over");
    console.log("MEMO drag invalid: different categories");
    return;
  }

  this.classList.add("drag-over");
  this.classList.remove("drag-invalid");
}
function handleDragLeave() {
  this.classList.remove("drag-over", "drag-invalid");
}
async function handleDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;

  // カテゴリ間のドロップを再度チェック
  const filteredMemos = memos.filter((m) => !m.archived);
  const dropTargetStarred = filteredMemos[dropIndex]?.starred || false;

  if (dragSrcStarred !== dropTargetStarred) {
    console.log("MEMO drop rejected: different categories");
    return;
  }

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
    .forEach((el) => el.classList.remove("drag-over", "drag-invalid"));
  dragSrcIndex = null;
  dragSrcStarred = null;
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
      <button id="btn-archive-toggle" class="nav-btn archive-toggle">
        <i class="bi bi-archive"></i>
        <span class="nav-text">アーカイブ</span>
      </button>
      <button class="nav-btn encrypt-btn">
        <i class="bi bi-download"></i>
        <span class="nav-text">バックアップ</span>
      </button>
    `;
  } else if (mode === "edit") {
    /* ← 追加：MEMO入力／編集画面用フッター */
    foot.innerHTML = `
      <button class="nav-btn back-btn">
        <i class="bi bi-arrow-left-circle"></i>
        <span class="nav-text">戻る</span>
      </button>
      <button class="nav-btn save-btn">
        <i class="bi bi-save"></i>
        <span class="nav-text">保存</span>
      </button>
      <button class="nav-btn delete-btn">
        <i class="bi bi-trash"></i>
        <span class="nav-text">削除</span>
      </button>
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

  // グローバルに最新のmemosを設定
  window.memos = memos;
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

  const activeMemos = memos.filter((m) => !m.archived); // ← 追加：一覧は未アーカイブのみ

  // Empty State: メモが何もない場合
  if (activeMemos.length === 0) {
    ul.innerHTML = `
      <div class="memo-empty-state">
        <div class="memo-empty-state-content">
          <div class="memo-empty-state-icon">
            <i class="bi bi-journal-x"></i>
          </div>
          <h3 class="memo-empty-state-title">メモがありません</h3>
          <p class="memo-empty-state-message">
            最初のメモを作成してみましょう。
          </p>
          <div class="memo-empty-state-action">
            <button class="btn-add-first-memo">
              <i class="bi bi-plus-lg"></i> 最初のメモを作成
            </button>
          </div>
        </div>
      </div>
    `;

    // 最初のメモ作成ボタンのイベント
    ul.querySelector(".btn-add-first-memo").addEventListener("click", () =>
      renderInputForm()
    );

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".memo-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  } else {
    // 通常のメモ一覧表示
    activeMemos.forEach((m, i) => {
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
        // ★修正：IDで検索して正確なインデックスを取得
        const realIdx = memos.findIndex((memo) => memo.id === m.id);
        if (realIdx !== -1) {
          memos.splice(realIdx, 1);
          if (m.starred) memos.unshift(m);
          else memos.push(m);
        }
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

        // アニメーション付きでアーカイブ
        await animateArchiveItem(li, async () => {
          m.archived = true;
          await saveStorage(MEMO_KEY, memos);
          // グローバルに最新のmemosを設定
          window.memos = memos;
        });
      });
      li.appendChild(arch);

      // click row → edit
      li.addEventListener("click", () => renderInputForm(m.id));

      ul.appendChild(li);
    });
  }

  // 編集中のメモIDをリセット
  currentEditingMemoId = null;

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

  // Empty State: クリップが何もない場合
  if (clips.length === 0) {
    ul.innerHTML = `
      <div class="clipboard-empty-state">
        <div class="clipboard-empty-state-content">
          <div class="clipboard-empty-state-icon">
            <i class="bi bi-clipboard-x"></i>
          </div>
          <h3 class="clipboard-empty-state-title">クリップがありません</h3>
          <p class="clipboard-empty-state-message">
            最初のクリップを追加してみましょう。
          </p>
        </div>
      </div>
    `;

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".clipboard-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  } else {
    // 通常のクリップ一覧表示
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
        // アニメーション付きでアーカイブ
        await animateArchiveItem(li, async () => {
          const removed = clips.splice(i, 1)[0]; // ① アクティブ配列から削除
          await saveStorage(CLIP_KEY, clips); // ② 保存（現役クリップを更新）

          const arch = await loadStorage(CLIP_ARCH_KEY); // ③ アーカイブ配列を取得
          arch.push(removed); // ④ 末尾に追加
          await saveStorage(CLIP_ARCH_KEY, arch); // ⑤ 保存（アーカイブを更新）

          console.log("[CLIP] archived →", removed);
        });
      });
      li.appendChild(del);
      /*─────────────────────────────────────────*/

      ul.appendChild(li);
      // ensure correct initial height
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }

  console.log("renderClipboardView: end");
}

// ───────────────────────────────────────
// 3) MEMO input / edit form
// ───────────────────────────────────────
async function renderInputForm(id) {
  console.log("renderInputForm: start, id=", id);
  memos = await loadStorage(MEMO_KEY);

  // グローバルに最新のmemosを設定
  window.memos = memos;

  // 現在編集中のメモIDを設定
  currentEditingMemoId = id;

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
      <div class="textarea-container">
        <textarea class="text-input" placeholder="テキストを入力..."></textarea>
        <div class="textarea-buttons">
          <div class="char-counter">0</div>
          <div class="font-size-controls">
            <button class="font-size-btn font-decrease" title="文字を小さく">
              a
            </button>
            <div class="font-size-dropdown">
              <span class="font-size-indicator" title="クリックでサイズ選択">16px</span>
              <div class="font-size-options">
                <div class="font-option" data-size="24">24px</div>
                <div class="font-option" data-size="22">22px</div>
                <div class="font-option" data-size="20">20px</div>
                <div class="font-option" data-size="18">18px</div>
                <div class="font-option" data-size="16">16px</div>
                <div class="font-option" data-size="14">14px</div>
                <div class="font-option" data-size="12">12px</div>
              </div>
            </div>
            <button class="font-size-btn font-increase" title="文字を大きく">
              A
            </button>
          </div>
          <button class="copy-text-btn" title="テキストをコピー">
            <i class="bi bi-copy"></i>
          </button>
          <button class="scroll-to-top-btn" title="一番上に戻る">
            <i class="bi bi-arrow-up-square"></i>
          </button>
        </div>
      </div>
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

    console.log(
      `Clicked line: ${clickedLine}, total lines: ${lines.length}, text length: ${text.length}`
    );

    // 完全に空のtextareaで任意の行をクリックした場合
    if (text.length === 0 && clickedLine > 0) {
      const newText = "\n".repeat(clickedLine);
      ta.value = newText;
      ta.setSelectionRange(newText.length, newText.length);
      ta.focus();
      console.log(`Empty textarea: added ${clickedLine} newlines`);
      document.body.removeChild(mirror);
      return;
    }

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
      // 最後の行より下をクリックした場合、必要な改行を追加
      const currentText = ta.value;
      const neededNewlines = clickedLine - lines.length + 1;
      const newText = currentText + "\n".repeat(neededNewlines);

      ta.value = newText;

      // 新しい行の開始位置にカーソルを設定
      const newPosition = newText.length;
      ta.setSelectionRange(newPosition, newPosition);
      ta.focus();

      console.log(
        `Added ${neededNewlines} newlines, cursor at position ${newPosition}`
      );
    }

    // 一時的なelementを削除
    document.body.removeChild(mirror);
  });

  // フォントサイズ調整機能を追加
  let currentFontSize = parseInt(localStorage.getItem("memoFontSize")) || 16;
  const fontSizeIndicator = content.querySelector(".font-size-indicator");
  const fontDecreaseBtn = content.querySelector(".font-decrease");
  const fontIncreaseBtn = content.querySelector(".font-increase");
  const fontSizeDropdown = content.querySelector(".font-size-dropdown");
  const fontSizeOptions = content.querySelector(".font-size-options");

  // 初期フォントサイズを設定
  ta.style.fontSize = `${currentFontSize}px`;
  fontSizeIndicator.textContent = `${currentFontSize}px`;

  // フォントサイズ減少ボタン
  fontDecreaseBtn.addEventListener("click", () => {
    if (currentFontSize > 12) {
      currentFontSize -= 2;
      updateFontSize();
      console.log(`Font size decreased to ${currentFontSize}px`);
    }
  });

  // フォントサイズ増加ボタン
  fontIncreaseBtn.addEventListener("click", () => {
    if (currentFontSize < 24) {
      currentFontSize += 2;
      updateFontSize();
      console.log(`Font size increased to ${currentFontSize}px`);
    }
  });

  function updateFontSize() {
    ta.style.fontSize = `${currentFontSize}px`;
    fontSizeIndicator.textContent = `${currentFontSize}px`;
    localStorage.setItem("memoFontSize", currentFontSize);

    // ボタンの有効/無効状態を更新
    fontDecreaseBtn.disabled = currentFontSize <= 12;
    fontIncreaseBtn.disabled = currentFontSize >= 24;

    // ドロップダウンの選択状態を更新
    content.querySelectorAll(".font-option").forEach((option) => {
      option.classList.toggle(
        "active",
        parseInt(option.dataset.size) === currentFontSize
      );
    });
  }

  // ドロップダウン機能
  fontSizeIndicator.addEventListener("click", (e) => {
    e.stopPropagation();
    fontSizeOptions.classList.toggle("show");
    console.log("Font size dropdown toggled");
  });

  // ドロップダウンオプション選択
  content.querySelectorAll(".font-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      e.stopPropagation();
      const newSize = parseInt(option.dataset.size);
      currentFontSize = newSize;
      updateFontSize();
      fontSizeOptions.classList.remove("show");
      console.log(`Font size selected: ${newSize}px`);
    });
  });

  // ドロップダウン外クリックで閉じる
  document.addEventListener("click", () => {
    fontSizeOptions.classList.remove("show");
  });

  // 初期ボタン状態を設定
  updateFontSize();

  // 一番上に戻るボタンの機能を追加
  const scrollToTopBtn = content.querySelector(".scroll-to-top-btn");
  scrollToTopBtn.addEventListener("click", () => {
    ta.setSelectionRange(0, 0);
    ta.focus();
    ta.scrollTop = 0;
    console.log("Scrolled to top of textarea");
  });

  // コピーボタンの機能を追加
  const copyBtn = content.querySelector(".copy-text-btn");
  copyBtn.addEventListener("click", async () => {
    const textToCopy = ta.value;

    if (textToCopy.trim() === "") {
      console.log("No text to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      console.log("Text copied to clipboard");

      // コピー成功時の視覚的フィードバック
      const icon = copyBtn.querySelector("i");
      const originalClass = icon.className;

      // アイコンをチェックマークに変更してグレーにする
      icon.className = "bi bi-check";
      copyBtn.classList.add("copied");

      // 1秒後に元に戻す
      setTimeout(() => {
        icon.className = originalClass;
        copyBtn.classList.remove("copied");
      }, 1000);
    } catch (err) {
      console.error("Failed to copy text: ", err);

      // 失敗時のフィードバック（古いブラウザ対応）
      try {
        ta.select();
        document.execCommand("copy");
        console.log("Text copied using fallback method");

        // 成功時の視覚的フィードバック
        const icon = copyBtn.querySelector("i");
        const originalClass = icon.className;

        icon.className = "bi bi-check";
        copyBtn.classList.add("copied");

        setTimeout(() => {
          icon.className = originalClass;
          copyBtn.classList.remove("copied");
        }, 1000);
      } catch (fallbackErr) {
        console.error("Fallback copy also failed: ", fallbackErr);
      }
    }
  });

  // テキストの量に応じてボタンの表示/非表示を制御
  function updateButtonVisibility() {
    const hasText = ta.value.trim().length > 0;
    const lines = ta.value.split("\n").length;
    const isLongText = lines > 10; // 10行以上の場合に表示

    // 文字数カウント：改行文字を除外した実際の文字数を表示
    const charCountWithoutNewlines = ta.value.replace(/\n/g, "").length;

    // 文字数カウンターを更新
    const charCounter = content.querySelector(".char-counter");
    charCounter.textContent = `${charCountWithoutNewlines}文字`;

    // コピーボタン：テキストがある場合に表示
    copyBtn.style.display = hasText ? "flex" : "none";

    // スクロールボタン：10行以上の場合に表示
    scrollToTopBtn.style.display = isLongText ? "flex" : "none";
  }

  // 初期状態でボタンの表示を設定
  updateButtonVisibility();

  // 文字数カウンターの確実な更新のための包括的イベント監視
  let lastValue = ta.value;

  // 基本的なイベント監視
  ta.addEventListener("input", updateButtonVisibility);
  ta.addEventListener("paste", () => setTimeout(updateButtonVisibility, 10));
  ta.addEventListener("cut", updateButtonVisibility);
  ta.addEventListener("compositionend", updateButtonVisibility);
  ta.addEventListener("focus", updateButtonVisibility);
  ta.addEventListener("blur", updateButtonVisibility);
  ta.addEventListener("keyup", updateButtonVisibility);
  ta.addEventListener("keydown", updateButtonVisibility);
  ta.addEventListener("change", updateButtonVisibility);
  ta.addEventListener("propertychange", updateButtonVisibility);

  // ドラッグ&ドロップ対応
  ta.addEventListener("drop", () => setTimeout(updateButtonVisibility, 10));
  ta.addEventListener("dragend", updateButtonVisibility);

  // 定期的な監視（最強の保険として）
  const charCountInterval = setInterval(() => {
    if (ta.value !== lastValue) {
      lastValue = ta.value;
      updateButtonVisibility();
      console.log("文字数カウンター：定期監視で差分検出", ta.value.length);
    }
  }, 100); // 100msごとにチェック

  // メモリリーク防止：ページ離脱時にインターバルをクリア
  window.addEventListener("beforeunload", () => {
    clearInterval(charCountInterval);
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

      // 既存メモ編集時は文字数カウンターを更新
      updateButtonVisibility();
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

  // back handler (保存確認付き)
  document.querySelector(".back-btn").addEventListener("click", () => {
    // 変更があるかチェック
    const originalMemo =
      id !== undefined ? memos.find((m) => m.id === id) : null;
    const hasChanges = checkForUnsavedMemoChanges(
      originalMemo,
      id === undefined
    );

    if (hasChanges) {
      // 変更がある場合は保存確認ダイアログを表示
      showMemoSaveConfirmDialog(
        async () => {
          // 保存して戻る
          const title =
            content.querySelector(".title-input").value.trim() || "無題";
          const body = content.querySelector(".text-input").value.trim();
          const starred = starIcon.dataset.starred === "true";

          if (id !== undefined) {
            // update existing
            const idx = memos.findIndex((m) => m.id === id);
            memos[idx] = { id, title, content: body, starred };
            console.log("[BACK] 変更を保存して戻りました:", memos[idx]);
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
            console.log("[BACK] 新規メモを保存して戻りました:", newM);
          }
          await saveStorage(MEMO_KEY, memos);
          // グローバルに最新のmemosを設定
          window.memos = memos;
          renderListView();
        },
        () => {
          // 破棄して戻る
          console.log("[BACK] 変更を破棄して戻りました");
          renderListView();
        }
      );
    } else {
      // 変更がない場合は直接戻る
      console.log("[BACK] 変更なしで戻りました");
      renderListView();
    }
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
    // グローバルに最新のmemosを設定
    window.memos = memos;
    renderListView();
  });

  // delete/cancel handler
  document.querySelector(".delete-btn").addEventListener("click", async () => {
    if (id !== undefined) {
      memos = memos.filter((m) => m.id !== id);
      console.log("delete memo id=", id);
      await saveStorage(MEMO_KEY, memos);
      // グローバルに最新のmemosを設定
      window.memos = memos;
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
    <button class="nav-btn back-btn">
      <i class="bi bi-arrow-left-circle"></i>
      <span class="nav-text">戻る</span>
    </button>
    <button class="nav-btn delete-all-btn">
      <i class="bi bi-trash"></i>
      <span class="nav-text">一括削除</span>
    </button>
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

  // 強制的に一覧画面に戻す処理を追加
  setTimeout(() => {
    const content = document.querySelector(".memo-content");
    if (content && content.classList.contains("edit-mode")) {
      console.log("Force return to list view from edit mode");
      renderListView();
    }
  }, 100);

  // start in MEMO list
  await renderListView();

  // グローバルに最新のmemosを設定
  window.memos = memos;
});

/*━━━━━━━━━━ 変更検知機能 ━━━━━━━━━━*/
function checkForUnsavedMemoChanges(originalMemo, isNew) {
  const currentTitle =
    document.querySelector(".title-input")?.value.trim() || "";
  const currentContent =
    document.querySelector(".text-input")?.value.trim() || "";
  const currentStarred =
    document.querySelector(".star-input")?.dataset.starred === "true";

  // 新規作成の場合
  if (isNew) {
    // タイトルまたは内容があれば変更あり
    return currentTitle !== "" || currentContent !== "";
  }

  // 既存編集の場合
  if (!originalMemo) return false;

  // 各項目の変更をチェック
  return (
    currentTitle !== (originalMemo.title || "") ||
    currentContent !== (originalMemo.content || "") ||
    currentStarred !== (originalMemo.starred || false)
  );
}

/*━━━━━━━━━━ おしゃれな保存確認ダイアログ（MEMO用） ━━━━━━━━━━*/
function showMemoSaveConfirmDialog(onSave, onDiscard) {
  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".memo-save-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "memo-save-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-exclamation-circle dialog-icon"></i>
          <h3 class="dialog-title">変更を保存しますか？</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">
            メモ内容に変更があります。<br>
            保存せずに戻ると変更が失われます。
          </p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn discard-btn">破棄</button>
          <button class="dialog-btn cancel-btn">キャンセル</button>
          <button class="dialog-btn save-btn">保存</button>
        </div>
      </div>
    </div>
  `;

  // スタイルを動的に追加
  if (!document.querySelector("#memo-save-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "memo-save-confirm-styles";
    styles.textContent = `
      .memo-save-confirm-dialog {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .memo-save-confirm-dialog .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .memo-save-confirm-dialog .dialog-content {
        position: relative;
        background: #2d2d2d;
        border-radius: 12px;
        min-width: 360px;
        max-width: 450px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .memo-save-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .memo-save-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #3b82f6;
      }

      .memo-save-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .memo-save-confirm-dialog .dialog-body {
        padding: 16px 20px;
      }

      .memo-save-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
      }

      .memo-save-confirm-dialog .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
      }

      .memo-save-confirm-dialog .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }

      .memo-save-confirm-dialog .discard-btn {
        background: #dc3545;
        color: #ffffff;
      }

      .memo-save-confirm-dialog .discard-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
      }

      .memo-save-confirm-dialog .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .memo-save-confirm-dialog .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .memo-save-confirm-dialog .save-btn {
        background: #00a31e;
        color: #ffffff;
      }

      .memo-save-confirm-dialog .save-btn:hover {
        background: #008a1a;
        transform: translateY(-1px);
      }

      .memo-save-confirm-dialog .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .memo-save-confirm-dialog .dialog-overlay.closing {
        animation: fadeOut 0.2s ease-in forwards;
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // イベントリスナー設定
  const overlay = dialog.querySelector(".dialog-overlay");
  const content = dialog.querySelector(".dialog-content");
  const discardBtn = dialog.querySelector(".discard-btn");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const saveBtn = dialog.querySelector(".save-btn");

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 200);
  }

  // 破棄ボタン
  discardBtn.addEventListener("click", () => {
    closeDialog();
    onDiscard();
  });

  // キャンセルボタン
  cancelBtn.addEventListener("click", closeDialog);

  // 保存ボタン
  saveBtn.addEventListener("click", () => {
    closeDialog();
    onSave();
  });

  // オーバーレイクリックで閉じる
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  // ESCキーで閉じる
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      closeDialog();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);

  // フォーカス管理
  setTimeout(() => {
    saveBtn.focus();
  }, 100);
}

/*━━━━━━━━━━ アーカイブアニメーション機能 ━━━━━━━━━━*/
async function animateArchiveItem(element, onComplete) {
  return new Promise((resolve) => {
    // ランダムに3つの方向から選択（33%ずつの確率）
    const random = Math.random();
    let animationType, animationClass;

    if (random < 0.33) {
      animationType = "left";
      animationClass = "archiving-left";
    } else if (random < 0.66) {
      animationType = "right";
      animationClass = "archiving-right";
    } else {
      animationType = "down";
      animationClass = "archiving-down";
    }

    console.log(
      `[ARCHIVE] ${
        animationType === "left"
          ? "左"
          : animationType === "right"
          ? "右"
          : "下"
      }にアニメーション`
    );

    // アニメーション開始前にアーカイブアイコンを光らせる
    const archiveIcon = element.querySelector(".actions");
    if (archiveIcon) {
      archiveIcon.style.color = "#f59e0b";
      archiveIcon.style.transform = "scale(1.2)";
      archiveIcon.style.transition = "all 0.2s ease";
    }

    // 既存のアニメーションクラスを削除（もしあれば）
    element.classList.remove(
      "archiving-left",
      "archiving-right",
      "archiving-down"
    );

    // 強制的にリフローを発生させてクラス削除を確定
    void element.offsetWidth;

    // 選択されたアニメーションクラスを追加
    element.classList.add(animationClass);

    // アニメーション用スタイルを動的に追加（初回のみ）
    if (!document.querySelector("#archive-animation-styles")) {
      const styles = document.createElement("style");
      styles.id = "archive-animation-styles";
      styles.textContent = `
        .archiving-left {
          animation: archiveSlideOutLeft 0.6s ease-in-out forwards;
          pointer-events: none; /* クリック無効化 */
        }

        .archiving-right {
          animation: archiveSlideOutRight 0.6s ease-in-out forwards;
          pointer-events: none; /* クリック無効化 */
        }

        .archiving-down {
          animation: archiveFallDown 0.8s ease-in forwards;
          pointer-events: none; /* クリック無効化 */
        }

        @keyframes archiveSlideOutLeft {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          30% {
            opacity: 0.8;
            transform: translateX(-10px) scale(0.98);
          }
          60% {
            opacity: 0.4;
            transform: translateX(-30px) scale(0.95) rotateZ(-2deg);
          }
          100% {
            opacity: 0;
            transform: translateX(-100px) scale(0.8) rotateZ(-5deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        @keyframes archiveSlideOutRight {
          0% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          30% {
            opacity: 0.8;
            transform: translateX(10px) scale(0.98);
          }
          60% {
            opacity: 0.4;
            transform: translateX(30px) scale(0.95) rotateZ(2deg);
          }
          100% {
            opacity: 0;
            transform: translateX(100px) scale(0.8) rotateZ(5deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        @keyframes archiveFallDown {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1) rotateZ(0deg);
          }
          20% {
            opacity: 0.9;
            transform: translateY(10px) scale(0.98) rotateZ(2deg);
          }
          40% {
            opacity: 0.7;
            transform: translateY(30px) scale(0.95) rotateZ(-3deg);
          }
          60% {
            opacity: 0.5;
            transform: translateY(60px) scale(0.9) rotateZ(5deg);
          }
          80% {
            opacity: 0.2;
            transform: translateY(100px) scale(0.8) rotateZ(-8deg);
          }
          100% {
            opacity: 0;
            transform: translateY(150px) scale(0.6) rotateZ(15deg);
            height: 0;
            margin: 0;
            padding: 0;
          }
        }

        /* アーカイブ成功トースト */
        .archive-toast {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          animation: toastSlideIn 0.3s ease-out;
        }

        .archive-toast.fade-out {
          animation: toastFadeOut 0.3s ease-in forwards;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toastFadeOut {
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `;
      document.head.appendChild(styles);
    }

    // animationend イベントリスナーを使用してより確実にアニメーション完了を検知
    const handleAnimationEnd = async (event) => {
      // 3つのアニメーション完了を対象にする
      if (
        event.animationName === "archiveSlideOutLeft" ||
        event.animationName === "archiveSlideOutRight" ||
        event.animationName === "archiveFallDown"
      ) {
        element.removeEventListener("animationend", handleAnimationEnd);

        // データ更新処理を実行
        await onComplete();

        // トースト通知を表示
        showArchiveToast();

        // 要素を完全に削除
        element.remove();

        // 他のアイテムの位置を調整するためのアニメーション
        const remainingItems = document.querySelectorAll(
          ".memo-item, .clipboard-item"
        );
        remainingItems.forEach((item, index) => {
          // 既存のアニメーションとトランジションを完全にクリア
          item.style.animation = "";
          item.style.transition = "";
          item.style.transform = "";
          item.style.opacity = "";

          // 強制的にリフローを発生させて状態をリセット
          void item.offsetHeight;

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.style.animation = `slideUp 0.3s ease-out both`;

            // アニメーション完了後にスタイルをクリーンアップ
            setTimeout(() => {
              item.style.animation = "";
              item.style.transform = "";
              item.style.opacity = "";
            }, 300); // slideUpアニメーションの時間(0.3s)と同期
          }, index * 50);
        });

        // slideUpアニメーションを動的に追加
        if (!document.querySelector("#slide-up-animation")) {
          const slideUpStyles = document.createElement("style");
          slideUpStyles.id = "slide-up-animation";
          slideUpStyles.textContent = `
            @keyframes slideUp {
              from {
                transform: translateY(10px);
                opacity: 0.8;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `;
          document.head.appendChild(slideUpStyles);
        }

        resolve();
      }
    };

    // アニメーション完了イベントを監視
    element.addEventListener("animationend", handleAnimationEnd);

    // フォールバック: 1000ms後に強制的に完了処理を実行（下落ちアニメーションが長いため）
    setTimeout(async () => {
      if (element.parentNode) {
        // まだ要素が存在する場合
        element.removeEventListener("animationend", handleAnimationEnd);
        console.warn("[ARCHIVE] Animation timeout - forcing completion");

        await onComplete();
        showArchiveToast();
        element.remove();

        const remainingItems = document.querySelectorAll(
          ".memo-item, .clipboard-item"
        );
        remainingItems.forEach((item, index) => {
          // 既存のアニメーションとトランジションを完全にクリア
          item.style.animation = "";
          item.style.transition = "";
          item.style.transform = "";
          item.style.opacity = "";

          // 強制的にリフローを発生させて状態をリセット
          void item.offsetHeight;

          // 少し遅延してから新しいアニメーションを適用
          setTimeout(() => {
            item.style.animation = `slideUp 0.3s ease-out both`;

            // アニメーション完了後にスタイルをクリーンアップ
            setTimeout(() => {
              item.style.animation = "";
              item.style.transform = "";
              item.style.opacity = "";
            }, 300); // slideUpアニメーションの時間(0.3s)と同期
          }, index * 50);
        });

        resolve();
      }
    }, 1000); // 800ms → 1000ms に延長
  });
}

/*━━━━━━━━━━ トースト通知機能 ━━━━━━━━━━*/
function showArchiveToast() {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".archive-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // 新しいトーストを作成
  const toast = document.createElement("div");
  toast.className = "archive-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    アーカイブに移動しました
  `;

  // bodyに追加
  document.body.appendChild(toast);

  // 2秒後にフェードアウト
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2000);
}

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderListView = renderListView;
window.checkForUnsavedMemoChanges = checkForUnsavedMemoChanges;
window.showMemoSaveConfirmDialog = showMemoSaveConfirmDialog;
window.memos = memos;
window.saveStorage = saveStorage;
window.getCurrentEditingMemoId = () => currentEditingMemoId;
