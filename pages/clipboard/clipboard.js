"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const CLIP_KEY = "clips";
const CLIP_ARCH_KEY = "clips_arch";
let clips = [];

// Keeps track of current Archive sub-mode: "clip"
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
// ───────────────────────────────────────
function setFooter(mode) {
  const foot = document.querySelector(".memo-footer");
  foot.style.display = "flex";
  if (mode === "clipboard") {
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
  }
}

// ───────────────────────────────────────
// Clipboard view + Archive toggle
// ───────────────────────────────────────
async function renderClipboardView() {
  console.log("renderClipboardView: start");
  clips = await loadStorage(CLIP_KEY);

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

  // MEMOページと同じ構造：ボタンを上に、リストを下に
  content.innerHTML = `
    <button class="btn-add-clip">
      <i class="bi bi-plus-lg"></i> 新しいクリップを追加
    </button>
    <ul class="clipboard-list"></ul>
  `;
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  // クリップ追加ボタンのイベントリスナー
  const addClipBtn = content.querySelector(".btn-add-clip");
  if (addClipBtn) {
    addClipBtn.addEventListener("click", async () => {
      console.log("クリップを追加ボタンがクリックされました");
      clips.push("");
      await saveStorage(CLIP_KEY, clips);
      renderClipboardView();
    });
  }

  // populate clips
  const ul = content.querySelector(".clipboard-list");
  ul.innerHTML = "";

  // Empty State: アクティブなクリップボードが何もない場合
  if (clips.length === 0) {
    ul.innerHTML = `
      <div class="clipboard-empty-state">
        <div class="clipboard-empty-state-content">
          <div class="clipboard-empty-state-icon">
            <i class="bi bi-archive"></i>
          </div>
          <h3 class="clipboard-empty-state-title">すべてアーカイブされています。</h3>
          <p class="clipboard-empty-state-message">
            新しいクリップボードを作成するか、<br>アーカイブから復元してください。
          </p>
          <div class="clipboard-empty-state-action">
            <button class="btn-add-first-clip">
              <i class="bi bi-plus-lg"></i> 最初のクリップボードを作成
            </button>
          </div>
        </div>
      </div>
    `;

    // 最初のクリップボード作成ボタンのイベント
    const firstClipBtn = ul.querySelector(".btn-add-first-clip");
    if (firstClipBtn) {
      firstClipBtn.addEventListener("click", async () => {
        console.log("最初のクリップボードを作成ボタンがクリックされました");
        clips.push("");
        await saveStorage(CLIP_KEY, clips);
        renderClipboardView();
      });
    }

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".clipboard-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);

    return; // ここで処理を終了
  }

  // 通常のクリップ一覧表示
  clips.forEach((txt, i) => {
    const li = document.createElement("li");
    li.className = "clipboard-item";
    li.draggable = true;
    li.dataset.index = i;

    // DnD handlers
    li.addEventListener("dragstart", (e) => {
      handleClipDragStart.call(li, e);
      li.classList.add("dragging");
    });
    li.addEventListener("dragover", handleClipDragOver);
    li.addEventListener("dragleave", handleClipDragLeave);
    li.addEventListener("drop", handleClipDrop);
    li.addEventListener("dragend", (e) => {
      handleClipDragEnd.call(li, e);
      // 全ての要素からドラッグ関連クラスを削除
      document.querySelectorAll(".clipboard-item").forEach((item) => {
        item.classList.remove("dragging", "drag-over", "drag-invalid");
      });
    });

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

    // auto-resize textarea（MEMOページと同様の包括的な自動リサイズ）
    const ta = document.createElement("textarea");
    ta.className = "clipboard-textarea";
    ta.rows = 1;
    ta.value = txt;
    ta.placeholder = "テキストを入力";

    // 自動リサイズ関数（clipboard-item全体の調整を含む）
    function autoResize() {
      // 一時的に高さをリセットして正確なscrollHeightを取得
      ta.style.height = "auto";

      // 行の高さを取得
      const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 24;

      // 最小高さ（1行分）と最大高さ（5行分）を設定
      const minHeight = lineHeight;
      const maxHeight = lineHeight * 5;
      const contentHeight = ta.scrollHeight;

      // 最小〜最大の範囲内で高さを設定
      const newHeight = Math.min(Math.max(minHeight, contentHeight), maxHeight);

      ta.style.height = newHeight + "px";

      // 最大高さに達した場合はスクロールを有効にする
      if (contentHeight > maxHeight) {
        ta.style.overflowY = "auto";
      } else {
        ta.style.overflowY = "hidden";
      }

      // 親要素（clipboard-item）の最小高さを動的調整
      const clipboardItem = ta.closest(".clipboard-item");
      if (clipboardItem) {
        const itemPadding = 32; // 上下パディング16px * 2
        const buttonHeight = 36; // copyボタンとarchiveアイコンの高さ
        const itemMinHeight = Math.max(
          64, // 最小高さ
          newHeight + itemPadding,
          buttonHeight + itemPadding
        );
        clipboardItem.style.minHeight = itemMinHeight + "px";

        // レイアウト調整のためのクラス管理
        if (newHeight > minHeight) {
          clipboardItem.classList.add("expanded");
        } else {
          clipboardItem.classList.remove("expanded");
        }
      }

      console.log(
        `Clipboard textarea resized: ${newHeight}px (content: ${contentHeight}px, min: ${minHeight}px, max: ${maxHeight}px)`
      );
    }

    // 値の変更時に保存し、高さを調整
    function handleTextChange() {
      clips[i] = ta.value;
      saveStorage(CLIP_KEY, clips);
      autoResize();
    }

    // 包括的なイベント監視
    ta.addEventListener("input", handleTextChange);
    ta.addEventListener("paste", () => setTimeout(handleTextChange, 10));
    ta.addEventListener("cut", handleTextChange);
    ta.addEventListener("compositionend", handleTextChange);
    ta.addEventListener("focus", autoResize);
    ta.addEventListener("blur", autoResize);
    ta.addEventListener("keyup", autoResize);
    ta.addEventListener("keydown", autoResize);
    ta.addEventListener("change", handleTextChange);
    ta.addEventListener("propertychange", handleTextChange);

    // ドラッグ&ドロップ対応
    ta.addEventListener("drop", () => setTimeout(handleTextChange, 10));
    ta.addEventListener("dragend", handleTextChange);

    li.appendChild(ta);

    // アーカイブアイコン（MEMOページと同様のスタイル）
    const arch = document.createElement("i");
    arch.className = "bi bi-archive-fill actions";
    arch.title = "アーカイブへ移動";
    arch.addEventListener("click", async (e) => {
      e.stopPropagation();

      // アニメーション付きでアーカイブ
      await window.AppUtils.animateArchiveItem(li, async () => {
        const removed = clips.splice(i, 1)[0]; // ① アクティブ配列から削除
        await saveStorage(CLIP_KEY, clips); // ② 保存（現役クリップを更新）

        const archData = await loadStorage(CLIP_ARCH_KEY); // ③ アーカイブ配列を取得
        archData.push(removed); // ④ 末尾に追加
        await saveStorage(CLIP_ARCH_KEY, archData); // ⑤ 保存（アーカイブを更新）

        console.log("[CLIP] archived →", removed);

        // アーカイブ後、クリップが空になった場合は即座に画面を更新
        renderClipboardView();
      });
    });
    li.appendChild(arch);

    ul.appendChild(li);

    // 初期化時の高さ設定（改良版）
    setTimeout(() => {
      autoResize();
    }, 10); // DOM追加後に実行
  });

  console.log("renderClipboardView: end");
}

// ───────────────────────────────────────
// Archive mode: swap sub-nav & footer
// ───────────────────────────────────────
function renderArchiveNav(type) {
  console.log("renderArchiveNav: start, type=", type);
  archiveType = type;

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
  const rawItems = await loadStorage(CLIP_ARCH_KEY);
  const listData = rawItems;

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
    span.textContent = it;
    li.appendChild(span);

    /* 右：復元ボタン */
    const btn = document.createElement("button");
    btn.className = "restore-btn";
    btn.innerHTML = '<i class="bi bi-upload"></i>';
    btn.title = "復元";
    btn.addEventListener("click", async () => {
      console.log("[ARCH] restore idx:", idx);

      /* CLIP: アーカイブ → アクティブへ移動 */
      const act = await loadStorage(CLIP_KEY);
      const arch = await loadStorage(CLIP_ARCH_KEY);
      act.push(arch.splice(idx, 1)[0]);
      await saveStorage(CLIP_KEY, act);
      await saveStorage(CLIP_ARCH_KEY, arch);

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

  // Back → go back to clipboard view
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // 1) Archive 表示を解除
    document.querySelector(".memo-content").classList.remove("archive");
    footer.classList.remove("archive");

    // 2) clipboard画面に戻る
    renderClipboardView();
  });

  // Delete All → clear storage & re-render archive list
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      await saveStorage(CLIP_ARCH_KEY, []);
      renderArchiveList();
    });
  console.log("renderArchiveFooter: end");
}

// ───────────────────────────────────────
// アーカイブアニメーション機能（memo.jsから移植）

// ───────────────────────────────────────
// Initialization on load
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("Clipboard DOMContentLoaded fired");

  // start in Clipboard view
  await renderClipboardView();
});

// グローバルに公開
window.renderClipboardView = renderClipboardView;
