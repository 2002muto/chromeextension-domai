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

  // header + list + add + hint
  content.innerHTML = `
    <h2 class="clipboard-header">
      <i class="bi bi-clipboard-fill"></i> フォーム用clipboard
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

      // アーカイブボタン
      const del = document.createElement("button");
      del.className = "clipboard-archive";
      del.innerHTML = '<i class="bi bi-archive-fill"></i>';
      del.addEventListener("click", async () => {
        // アニメーション付きでアーカイブ
        await window.AppUtils.animateArchiveItem(li, async () => {
          const removed = clips.splice(i, 1)[0]; // ① アクティブ配列から削除
          await saveStorage(CLIP_KEY, clips); // ② 保存（現役クリップを更新）

          const arch = await loadStorage(CLIP_ARCH_KEY); // ③ アーカイブ配列を取得
          arch.push(removed); // ④ 末尾に追加
          await saveStorage(CLIP_ARCH_KEY, arch); // ⑤ 保存（アーカイブを更新）

          console.log("[CLIP] archived →", removed);
        });
      });
      li.appendChild(del);

      ul.appendChild(li);
      // ensure correct initial height
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    });
  }

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
