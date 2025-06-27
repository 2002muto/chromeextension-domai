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

  // back handler (何もせずに戻る)
  document.querySelector(".back-btn").addEventListener("click", () => {
    console.log("Back without saving");
    renderListView();
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
});
