"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
const CLIP_ARCH_KEY = "clips_arch";
let memos = [];

// Keeps track of current Archive sub-mode: "memo" or "clip"
let archiveType = null;

// 現在編集中のメモID
let currentEditingMemoId = null;

// 文字数カウンター用インターバル（画面切替時に解除するためグローバルで保持）
let charCountInterval = null;

// インターバル解除のユーティリティ
function clearCharCountIntervalFn() {
  if (charCountInterval) {
    clearInterval(charCountInterval);
    charCountInterval = null;
    console.log("[MEMO] charCountInterval cleared");
  }
}

// デバッグ用にグローバルへ公開
window.clearCharCountIntervalFn = clearCharCountIntervalFn;
console.log("[MEMO] clearCharCountIntervalFn registered");

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
// Header click handlers
// ───────────────────────────────────────
function handleOtherHeaderClick(e) {
  e.preventDefault(); // デフォルトのリンク動作を防ぐ
  e.stopPropagation(); // イベントの伝播を停止
  console.log(
    "他のHeaderアイコンがクリックされました - ホバー時UI改善版:",
    e.target.closest("a").id
  );

  // デバッグ情報を追加
  const memoContent = document.querySelector(".memo-content");
  const isEditMode = memoContent && memoContent.classList.contains("edit-mode");
  console.log("デバッグ情報:", {
    memoContent: !!memoContent,
    isEditMode: isEditMode,
    currentEditingMemoId: currentEditingMemoId,
    memos: memos ? memos.length : 0,
  });

  // 入力画面で未保存の変更がある場合は保存確認ダイアログを表示
  if (isEditMode) {
    const isNew = !currentEditingMemoId;
    const originalMemo = memos.find((m) => m.id === currentEditingMemoId);
    const hasUnsavedChanges = checkForUnsavedMemoChanges(originalMemo, isNew);

    console.log("保存確認チェック:", {
      isNew: isNew,
      originalMemo: originalMemo,
      hasUnsavedChanges: hasUnsavedChanges,
      AppUtils: !!window.AppUtils,
      showSaveConfirmDialog: !!(
        window.AppUtils && window.AppUtils.showSaveConfirmDialog
      ),
    });

    if (hasUnsavedChanges) {
      console.log("未保存の変更があります。保存確認ダイアログを表示します。");
      // AppUtilsの保存確認ダイアログを使用
      if (window.AppUtils && window.AppUtils.showSaveConfirmDialog) {
        window.AppUtils.showSaveConfirmDialog({
          title: "変更を保存しますか？",
          message:
            "メモ内容に変更があります。<br>保存せずに移動すると変更が失われます。",
          onSave: async () => {
            // 保存してからページ遷移
            console.log("[MEMO] 変更を保存してからページ遷移");
            await saveAndGoBack();
            // 保存後に元のリンク先に遷移
            const href = e.target.closest("a").getAttribute("href");
            if (href) {
              window.location.href = href;
            }
          },
          onDiscard: () => {
            // 破棄してからページ遷移
            console.log("[MEMO] 変更を破棄してからページ遷移");
            discardAndGoBack();
            // 破棄後に元のリンク先に遷移
            const href = e.target.closest("a").getAttribute("href");
            if (href) {
              window.location.href = href;
            }
          },
        });
      } else {
        // AppUtilsが利用できない場合は何もせず中断
        return;
      }
      return;
    }
  }

  // 未保存の変更がない場合は直接ページ遷移
  const href = e.target.closest("a").getAttribute("href");
  if (href) {
    window.location.href = href;
  }
}

function handleMemoHeaderClick(e) {
  e.preventDefault(); // デフォルトのリンク動作を防ぐ
  e.stopPropagation(); // イベントの伝播を停止
  console.log("MEMOヘッダーアイコンがクリックされました - ホバー時UI改善版");

  // デバッグ情報を追加
  const memoContent = document.querySelector(".memo-content");
  const isEditMode = memoContent && memoContent.classList.contains("edit-mode");
  console.log("MEMOデバッグ情報:", {
    memoContent: !!memoContent,
    isEditMode: isEditMode,
    currentEditingMemoId: currentEditingMemoId,
    memos: memos ? memos.length : 0,
  });

  // 入力画面で未保存の変更がある場合は保存確認ダイアログを表示
  if (isEditMode) {
    const isNew = !currentEditingMemoId;
    const originalMemo = memos.find((m) => m.id === currentEditingMemoId);
    const hasUnsavedChanges = checkForUnsavedMemoChanges(originalMemo, isNew);

    console.log("MEMO保存確認チェック:", {
      isNew: isNew,
      originalMemo: originalMemo,
      hasUnsavedChanges: hasUnsavedChanges,
      AppUtils: !!window.AppUtils,
      showSaveConfirmDialog: !!(
        window.AppUtils && window.AppUtils.showSaveConfirmDialog
      ),
    });

    if (hasUnsavedChanges) {
      console.log("未保存の変更があります。保存確認ダイアログを表示します。");
      // AppUtilsの保存確認ダイアログを使用
      if (window.AppUtils && window.AppUtils.showSaveConfirmDialog) {
        window.AppUtils.showSaveConfirmDialog({
          title: "変更を保存しますか？",
          message:
            "メモ内容に変更があります。<br>保存せずに戻ると変更が失われます。",
          onSave: async () => {
            // 保存して戻る
            console.log("[MEMO] 変更を保存して一覧画面に遷移");
            await saveAndGoBack();
          },
          onDiscard: () => {
            // 破棄して戻る
            console.log("[MEMO] 変更を破棄して一覧画面に遷移");
            discardAndGoBack();
          },
        });
      } else {
        // AppUtilsが利用できない場合は何もせず中断
        return;
      }
      return;
    }
  }

  console.log("現在のページ状態:", {
    archiveType: archiveType,
    currentMode: document
      .querySelector(".memo-content")
      .classList.contains("archive")
      ? "archive"
      : "main",
  });
  renderListView(); // メインページに遷移
}

// ───────────────────────────────────────
// Drag & Drop handlers for MEMOs
// ───────────────────────────────────────
let dragSrcIndex = null; // memos配列上のインデックス
let dragSrcId = null; // ドラッグ元メモのID
let dragSrcStarred = null; // ドラッグ元の星状態を記録
function handleDragStart(e) {
  // li要素からIDを取得し、memos配列上のインデックスを算出
  dragSrcId = this.dataset.id;
  dragSrcIndex = memos.findIndex((m) => String(m.id) === dragSrcId);
  dragSrcStarred = memos[dragSrcIndex]?.starred || false;
  console.log("MEMO drag start:", {
    id: dragSrcId,
    index: dragSrcIndex,
    starred: dragSrcStarred,
  });
  e.dataTransfer.effectAllowed = "move";
}
function handleDragOver(e) {
  e.preventDefault();

  // ドロップ先の星状態をチェック
  const dropId = this.dataset.id;
  const dropIndex = memos.findIndex((m) => String(m.id) === dropId);
  const dropTargetStarred = memos[dropIndex]?.starred || false;

  // 異なるカテゴリ間のドロップを禁止
  if (dragSrcStarred !== dropTargetStarred) {
    this.classList.add("drag-invalid");
    this.classList.remove(
      "drop-indicator",
      "drop-above",
      "drop-below",
      "active"
    );
    console.log("MEMO drag invalid: different categories");
    return;
  }

  // 他の要素のドロップインジケーターをクリア
  document.querySelectorAll(".memo-item.drop-indicator").forEach((el) => {
    el.classList.remove("drop-indicator", "drop-above", "drop-below", "active");
  });

  // マウスの位置に基づいてドロップ位置を判定
  const rect = this.getBoundingClientRect();
  const mouseY = e.clientY;
  const itemCenter = rect.top + rect.height / 2;

  // ドロップ位置のインジケーターを表示
  this.classList.add("drop-indicator", "active");
  this.classList.remove("drag-invalid");

  if (mouseY < itemCenter) {
    // マウスが要素の上半分にある場合、要素の上に挿入
    this.classList.add("drop-above");
    console.log("[MEMO DND] ドロップ位置: 上に挿入");
  } else {
    // マウスが要素の下半分にある場合、要素の下に挿入
    this.classList.add("drop-below");
    console.log("[MEMO DND] ドロップ位置: 下に挿入");
  }
}
function handleDragLeave() {
  this.classList.remove(
    "drop-indicator",
    "drop-above",
    "drop-below",
    "active",
    "drag-invalid"
  );
}
async function handleDrop(e) {
  e.stopPropagation();
  const dropId = this.dataset.id;
  const dropIndex = memos.findIndex((m) => String(m.id) === dropId);

  // カテゴリ間のドロップを再度チェック
  const dropTargetStarred = memos[dropIndex]?.starred || false;

  if (dragSrcStarred !== dropTargetStarred) {
    console.log("MEMO drop rejected: different categories");
    return;
  }

  console.log(`MEMO drop from ${dragSrcIndex} to ${dropIndex}`);
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;

  // ドロップ位置を判定
  const rect = this.getBoundingClientRect();
  const mouseY = e.clientY;
  const itemCenter = rect.top + rect.height / 2;
  const dropAbove = mouseY < itemCenter;

  let actualToIndex = dropIndex;

  // 配列からドラッグ元要素を取り出す
  const [moved] = memos.splice(dragSrcIndex, 1);

  if (dropAbove) {
    // 要素の上に挿入
    if (dropIndex > dragSrcIndex) actualToIndex = dropIndex - 1;
    else actualToIndex = dropIndex;
    memos.splice(actualToIndex, 0, moved);
    console.log("[MEMO DND] 要素の上に挿入:", dragSrcIndex, "→", actualToIndex);
  } else {
    // 要素の下に挿入
    if (dropIndex > dragSrcIndex) actualToIndex = dropIndex;
    else actualToIndex = dropIndex + 1;
    memos.splice(actualToIndex, 0, moved);
    console.log("[MEMO DND] 要素の下に挿入:", dragSrcIndex, "→", actualToIndex);
  }

  console.log("[MEMO D&D] 保存前のmemos配列:", memos);
  await saveStorage(MEMO_KEY, memos);
  console.log("[MEMO D&D] 保存完了");

  // グローバルに最新のmemosを設定
  window.memos = memos;
  console.log("[MEMO D&D] window.memosを更新:", window.memos);

  // ドラッグ＆ドロップ成功メッセージを表示
  console.log("[MEMO D&D] showDragDropSuccessMessage呼び出し前:", {
    dragSrcIndex: dragSrcIndex,
    actualToIndex: actualToIndex,
    AppUtils: !!window.AppUtils,
    showToast: !!(window.AppUtils && window.AppUtils.showToast),
  });
  showDragDropSuccessMessage(dragSrcIndex + 1, actualToIndex + 1);

  console.log("[MEMO D&D] renderListView()呼び出し前");
  await renderListView();
  console.log("[MEMO D&D] renderListView()完了");

  // ドラッグ＆ドロップ後の再初期化処理
  console.log("[MEMO D&D] 再初期化処理開始");

  // メモデータを再読み込み
  memos = await loadStorage(MEMO_KEY);
  window.memos = memos;
  console.log("[MEMO D&D] データ再読み込み完了:", memos);

  // 一覧画面を再表示
  await renderListView();
  console.log("[MEMO D&D] 再初期化処理完了");
}
function handleDragEnd() {
  document
    .querySelectorAll(".memo-item")
    .forEach((el) =>
      el.classList.remove(
        "drop-indicator",
        "drop-above",
        "drop-below",
        "active",
        "drag-invalid"
      )
    );
  dragSrcIndex = null;
  dragSrcId = null;
  dragSrcStarred = null;
}

// ───────────────────────────────────────
// Renders the bottom footer depending on mode
// Modes:
//  - 'list'      → MEMO + Archive toggle
//  - 'clipboard' → Clipboard + Archive toggle
//  - 'edit'      → Save / Delete buttons
//  - 'archive'   → Back / Delete All buttons (set by renderArchiveNav)
// ───────────────────────────────────────
function setFooter(mode) {
  console.log("[FOOTER] setFooter", mode);
  const foot = document.querySelector(".memo-footer");
  foot.style.display = "flex";
  if (mode === "list") {
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

  // Footerボタンのホバー効果を設定
  setupFooterHoverEffects();
}

// ───────────────────────────────────────
// 1) MEMO + Archive toggle wiring
// ───────────────────────────────────────
async function renderListView() {
  console.log("renderListView: start");

  // 編集画面で設定した文字数カウンターを解除
  clearCharCountIntervalFn();

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("memo", {
      mode: "list",
    });
    window.PageStateManager.setActivePage("memo");
  }

  document.querySelector(".form-title")?.remove();

  // load memos
  memos = await loadStorage(MEMO_KEY);

  // グローバルに最新のmemosを設定
  window.memos = memos;

  // set footer for list & wire Archive button
  setFooter("list");
  document
    .getElementById("btn-archive-toggle")
    .addEventListener("click", () => renderArchiveNav("memo"));

  // ヘッダーのMEMOアイコンのクリックイベント
  const memoBtn = document.getElementById("btn-memo-list");
  if (memoBtn) {
    console.log("メインページ: MEMOヘッダーボタンを発見しました");
    // 既存のイベントリスナーを削除
    memoBtn.removeEventListener("click", handleMemoHeaderClick);
    // 新しいイベントリスナーを追加
    memoBtn.addEventListener("click", handleMemoHeaderClick);
    console.log(
      "メインページ: MEMOヘッダーボタンにイベントリスナーを設定しました"
    );
  } else {
    console.error("メインページ: MEMOヘッダーボタンが見つかりません");
  }

  // エクスポート機能の追加
  const exportBtn = document.querySelector(".encrypt-btn");
  if (exportBtn) {
    // 既存のイベントリスナーを削除
    exportBtn.removeEventListener("click", exportAllMemos);

    // 新しいイベントリスナーを追加（即座にトースト表示）
    exportBtn.addEventListener("click", async (e) => {
      console.log("[MEMO] バックアップボタンがクリックされました");

      // デバッグ情報を出力
      console.log("[MEMO] AppUtils デバッグ情報:", {
        AppUtils: !!window.AppUtils,
        showToast: !!(window.AppUtils && window.AppUtils.showToast),
        showToastType: typeof window.AppUtils?.showToast,
        AppUtilsKeys: window.AppUtils ? Object.keys(window.AppUtils) : [],
      });

      // 即座にトーストメッセージを表示
      if (window.AppUtils && window.AppUtils.showToast) {
        console.log("[MEMO] showToast関数を呼び出します");
        window.AppUtils.showToast("バックアップを開始しています...", "info");
      } else {
        console.error("[MEMO] AppUtils.showToastが利用できません");
        // フォールバック: 直接showToast関数を呼び出し
        if (typeof showToast === "function") {
          console.log("[MEMO] 直接showToast関数を呼び出します");
          showToast("バックアップを開始しています...", "info");
        } else {
          console.error("[MEMO] showToast関数も見つかりません");
          // 最後の手段: alert
          alert("バックアップを開始しています...");
        }
      }

      // 少し遅延させてから実際のエクスポート処理を実行
      setTimeout(async () => {
        await exportAllMemos();
      }, 100);
    });
  }

  // ボタンの状態を更新
  updateExportButtonState();

  // Footerボタンのホバー効果を設定
  setupFooterHoverEffects();

  // animate content
  const content = document.querySelector(".memo-content");
  content.classList.remove("edit-mode", "clipboard-mode", "archive");
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

  const newMemoBtn = content.querySelector(".btn-new-memo");
  console.log("新しいMEMOを追加ボタンの要素:", newMemoBtn);
  if (newMemoBtn) {
    newMemoBtn.addEventListener("click", () => {
      console.log("新しいMEMOを追加ボタンがクリックされました");
      renderInputForm();
    });
  } else {
    console.error("新しいMEMOを追加ボタンが見つかりません");
  }

  // populate list items
  const ul = content.querySelector(".memo-list");
  ul.innerHTML = "";

  const activeMemos = memos.filter((m) => !m.archived); // ← 追加：一覧は未アーカイブのみ

  // Empty State: アクティブなメモが何もない場合
  if (activeMemos.length === 0) {
    ul.innerHTML = `
      <div class="memo-empty-state">
        <div class="memo-empty-state-content">
          <div class="memo-empty-state-icon">
            <i class="bi bi-clipboard2-minus"></i>
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
    const firstMemoBtn = ul.querySelector(".btn-add-first-memo");
    console.log("最初のメモを作成ボタンの要素:", firstMemoBtn);
    if (firstMemoBtn) {
      firstMemoBtn.addEventListener("click", () => {
        console.log("最初のメモを作成ボタンがクリックされました");
        renderInputForm();
      });
    } else {
      console.error("最初のメモを作成ボタンが見つかりません");
    }

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".memo-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);

    return; // ここで処理を終了
  } else {
    // 通常のメモ一覧表示
    activeMemos.forEach((m, i) => {
      const li = document.createElement("li");
      li.className = "memo-item";
      li.draggable = true;
      // 表示用インデックスと識別用IDをデータ属性に持たせる
      li.dataset.index = i;
      li.dataset.id = m.id;

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
      span.textContent = m.title || "無題";
      li.appendChild(span);

      // archive-icon (just UI, no action)
      const arch = document.createElement("i");
      arch.className = "bi bi-archive-fill actions";
      arch.title = "アーカイブへ移動";
      arch.addEventListener("click", async (e) => {
        e.stopPropagation();

        // 空のメモまたは無題メモの判定
        const isEmptyMemo =
          (!m.title || m.title.trim() === "") &&
          (!m.content || m.content.trim() === "");
        const isUntitledMemo =
          (!m.title || m.title.trim() === "" || m.title.trim() === "無題") &&
          (!m.content || m.content.trim() === "");

        if (isEmptyMemo || isUntitledMemo) {
          console.log(
            "[MEMO] 空のメモまたは無題メモを一覧から削除（アーカイブには保存しない）:",
            m.id
          );

          // アニメーション付きで削除（アーカイブには保存しない）
          if (window.AppUtils && window.AppUtils.animateArchiveItem) {
            li.classList.add("archive-item"); // ←追加
            await window.AppUtils.animateArchiveItem(li, async () => {
              // メモを完全に削除（アーカイブではない）
              const memoIndex = memos.findIndex((memo) => memo.id === m.id);
              if (memoIndex !== -1) {
                memos.splice(memoIndex, 1);
                await saveStorage(MEMO_KEY, memos);
                // グローバルに最新のmemosを設定
                window.memos = memos;

                // 削除後、アクティブなメモが空になった場合は即座に画面を更新
                const activeMemos = memos.filter((m) => !m.archived);
                if (activeMemos.length === 0) {
                  renderListView();
                }
              }
            });
          } else {
            // AppUtilsが利用できない場合の代替処理
            console.log(
              "[MEMO] AppUtils.animateArchiveItemが利用できません。代替処理を実行します。"
            );

            // シンプルなアニメーション
            li.style.transition = "all 0.5s ease-in-out";
            li.style.transform = "translateY(-20px) scale(0.95)";
            li.style.opacity = "0";

            await new Promise((resolve) => {
              setTimeout(async () => {
                // メモを完全に削除（アーカイブではない）
                const memoIndex = memos.findIndex((memo) => memo.id === m.id);
                if (memoIndex !== -1) {
                  memos.splice(memoIndex, 1);
                  await saveStorage(MEMO_KEY, memos);
                  // グローバルに最新のmemosを設定
                  window.memos = memos;

                  // 削除後、アクティブなメモが空になった場合は即座に画面を更新
                  const activeMemos = memos.filter((m) => !m.archived);
                  if (activeMemos.length === 0) {
                    renderListView();
                  }
                }

                console.log("[MEMO] 代替削除アニメーション完了");
                resolve();
              }, 500);
            });
          }
          return;
        }

        // アニメーション付きでアーカイブ
        if (window.AppUtils && window.AppUtils.animateArchiveItem) {
          li.classList.add("archive-item"); // ←追加
          await window.AppUtils.animateArchiveItem(li, async () => {
            m.archived = true;
            await saveStorage(MEMO_KEY, memos);
            // グローバルに最新のmemosを設定
            window.memos = memos;

            // アーカイブ後、アクティブなメモが空になった場合は即座に画面を更新
            const activeMemos = memos.filter((m) => !m.archived);
            if (activeMemos.length === 0) {
              renderListView();
            }
          });
        } else {
          // AppUtilsが利用できない場合の代替処理
          console.log(
            "[MEMO] AppUtils.animateArchiveItemが利用できません。代替処理を実行します。"
          );

          // シンプルなアニメーション（CSP準拠）
          li.classList.add("archive-item", "archive-fallback-animating");

          // フォールバックアニメーション用のスタイルを動的に追加
          if (!document.querySelector("#archive-fallback-styles")) {
            const fallbackStyles = document.createElement("style");
            fallbackStyles.id = "archive-fallback-styles";
            fallbackStyles.textContent = `
              .archive-fallback-animating {
                transition: all 0.5s ease-in-out !important;
                transform: translateY(-20px) scale(0.95) !important;
                opacity: 0 !important;
                pointer-events: none !important;
              }
            `;
            document.head.appendChild(fallbackStyles);
          }

          await new Promise((resolve) => {
            setTimeout(async () => {
              // データ更新処理
              m.archived = true;
              await saveStorage(MEMO_KEY, memos);
              // グローバルに最新のmemosを設定
              window.memos = memos;

              // アーカイブ後、アクティブなメモが空になった場合は即座に画面を更新
              const activeMemos = memos.filter((m) => !m.archived);
              if (activeMemos.length === 0) {
                renderListView();
              }

              console.log("[MEMO] 代替アーカイブアニメーション完了");
              resolve();
            }, 500);
          });
        }
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
// 3) MEMO input / edit form
// ───────────────────────────────────────
async function renderInputForm(id) {
  console.log("renderInputForm: start, id=", id);
  memos = await loadStorage(MEMO_KEY);

  // 既存の文字数カウンターインターバルを解除してリセット
  clearCharCountIntervalFn();

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("memo", {
      mode: "edit",
      memoId: id,
    });
    window.PageStateManager.setActivePage("memo");
  }

  // グローバルに最新のmemosを設定
  window.memos = memos;

  // 現在編集中のメモIDを設定
  currentEditingMemoId = id;

  // MEMOページにはサブナビゲーションが不要なのでコメントアウト
  // document.querySelector(".card-nav").style.display = "flex";

  // footer → save / delete
  setFooter("edit");

  // ヘッダーのMEMOアイコンのクリックイベント（入力画面）
  const memoBtn = document.getElementById("btn-memo-list");
  if (memoBtn) {
    console.log("入力画面: MEMOヘッダーボタンを発見しました");
    // 既存のイベントリスナーを削除
    memoBtn.removeEventListener("click", handleMemoHeaderClick);
    // 新しいイベントリスナーを追加
    memoBtn.addEventListener("click", handleMemoHeaderClick);
    console.log("入力画面: MEMOヘッダーボタンにイベントリスナーを設定しました");
  } else {
    console.error("入力画面: MEMOヘッダーボタンが見つかりません");
  }

  // 他のHeaderアイコンの保存確認機能を設定
  const otherHeaderButtons = [
    "btn-clipboard",
    "btn-prompt",
    "btn-iframe",
    "btn-status",
    "btn-setting",
  ];

  otherHeaderButtons.forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    if (button) {
      console.log(`入力画面: ${buttonId}ボタンを発見しました`);
      // 既存のイベントリスナーを削除
      button.removeEventListener("click", handleOtherHeaderClick);
      // 新しいイベントリスナーを追加
      button.addEventListener("click", handleOtherHeaderClick);
      console.log(
        `入力画面: ${buttonId}ボタンにイベントリスナーを設定しました`
      );
    } else {
      console.error(`入力画面: ${buttonId}ボタンが見つかりません`);
    }
  });

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
  content.classList.add("edit-mode"); // edit-modeクラスを追加
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

  // Initialize Quill.js editor
  // const quillEditor = content.querySelector("#quill-editor");
  // console.log("Initializing Quill.js editor", quillEditor);

  // Quill.js configuration
  // const quill = new Quill("#quill-editor", {
  //   theme: "snow",
  //   placeholder: "テキストを入力...",
  //   modules: {
  //     toolbar: [
  //       ["bold", "italic", "underline"],
  //       ["link"],
  //       [{ list: "ordered" }, { list: "bullet" }],
  //       ["clean"],
  //     ],
  //   },
  //   bounds: "#quill-editor",
  // });

  // console.log("Quill.js editor initialized", quill);

  // Locate the textarea element for further manipulation
  const ta = content.querySelector(".text-input");
  console.log("Initialized MEMO textarea", ta);

  function setDynamicPaddingBottom() {
    const btns = content.querySelector(".textarea-buttons");
    if (btns) {
      const btnsHeight = btns.offsetHeight || 0;
      const extra = 12; // 余白
      ta.style.paddingBottom = btnsHeight + extra + "px";
      console.log(`Set textarea padding-bottom: ${btnsHeight + extra}px`);
    }
  }

  function autoResizeTextarea() {
    setDynamicPaddingBottom();
    ta.style.height = "auto";
    const minHeight = 200;
    const contentHeight = ta.scrollHeight;
    const lines = ta.value.split("\n").length;
    const computedStyle = window.getComputedStyle(ta);
    const lineHeight =
      parseInt(computedStyle.lineHeight) ||
      parseInt(computedStyle.fontSize) * 1.2;
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
    const viewportHeight = window.innerHeight;
    const headerHeight =
      document.querySelector(".memo-input-form .input-header")?.offsetHeight ||
      0;
    const footerHeight =
      document.querySelector(".memo-footer")?.offsetHeight || 0;
    const formTitleHeight =
      document.querySelector(".form-title")?.offsetHeight || 0;
    const cardNavHeight =
      document.querySelector(".card-nav")?.offsetHeight || 0;
    const margins = 20; // 余白をさらに縮小
    const maxAvailableHeight =
      viewportHeight -
      headerHeight -
      footerHeight -
      formTitleHeight -
      cardNavHeight -
      margins;
    const minLinesHeight =
      Math.max(50, lines + 20) * lineHeight + paddingTop + paddingBottom;
    const calculatedHeight = Math.max(
      contentHeight,
      minLinesHeight,
      maxAvailableHeight
    );
    const newHeight = Math.max(minHeight, calculatedHeight);
    ta.style.height = newHeight + "px";
    console.log(
      `MEMO textarea auto-resized: ${newHeight}px (content: ${contentHeight}px, lines: ${lines}, minLinesHeight: ${minLinesHeight}px, maxAvailableHeight: ${maxAvailableHeight}px, viewportHeight: ${viewportHeight}px)`
    );
  }

  // 初期化時にもpadding-bottomを設定
  setTimeout(setDynamicPaddingBottom, 30);

  // 自動リサイズのイベントリスナーを追加
  ta.addEventListener("input", autoResizeTextarea);
  ta.addEventListener("paste", () => setTimeout(autoResizeTextarea, 10));
  ta.addEventListener("cut", autoResizeTextarea);
  ta.addEventListener("compositionend", autoResizeTextarea);
  ta.addEventListener("focus", autoResizeTextarea);
  ta.addEventListener("blur", autoResizeTextarea);
  ta.addEventListener("change", autoResizeTextarea);
  ta.addEventListener("keydown", (e) => {
    // エンターキーで改行した時も自動リサイズ
    if (e.key === "Enter") {
      setTimeout(autoResizeTextarea, 10);
    }
  });

  // ドラッグ&ドロップ対応
  ta.addEventListener("drop", () => setTimeout(autoResizeTextarea, 10));

  // 初期化時の高さ設定
  setTimeout(autoResizeTextarea, 50);

  // ウィンドウリサイズ時にも高さを調整
  window.addEventListener("resize", () => {
    setTimeout(autoResizeTextarea, 100);
  });

  // 強制的に最大高さを設定する関数（フォントサイズ変更に対応）
  function forceMaxHeight() {
    const viewportHeight = window.innerHeight;
    const maxHeight = Math.floor(viewportHeight * 0.7); // ビューポートの70%

    // フォントサイズ変更時は強制的な高さ設定をスキップして自動調整を優先
    if (ta.style.fontSize && parseInt(ta.style.fontSize) !== 16) {
      console.log(
        `Skipping forced height due to custom font size: ${ta.style.fontSize}`
      );
      autoResizeTextarea();
      return;
    }

    ta.style.height = maxHeight + "px";
    console.log(
      `Forced max height: ${maxHeight}px (viewport: ${viewportHeight}px)`
    );
  }

  // 初期化時に強制的に最大高さを設定
  setTimeout(forceMaxHeight, 100);

  console.log("MEMO textarea auto-resize enabled");

  // クリックで任意の行に自動入力・カーソル移動（textarea対応）
  ta.addEventListener("mousedown", function (e) {
    // クリック座標から行位置を計算
    const rect = ta.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollTop = ta.scrollTop;
    const adjustedY = y + scrollTop;
    const computedStyle = window.getComputedStyle(ta);
    const lineHeight =
      parseInt(computedStyle.lineHeight) ||
      parseInt(computedStyle.fontSize) * 1.2;
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const clickedLine = Math.floor((adjustedY - paddingTop) / lineHeight);

    const text = ta.value;
    const lines = text.split("\n");
    if (clickedLine > lines.length - 1) {
      // 不足分の改行を挿入
      const addLines = clickedLine - (lines.length - 1);
      const currentValue = ta.value;
      ta.value = currentValue + "\n".repeat(addLines);

      // 高さ調整
      setTimeout(() => {
        autoResizeTextarea();
        // カーソルをクリック行の先頭に移動
        let pos = 0;
        for (let i = 0; i < clickedLine; i++)
          pos += (lines[i] ? lines[i].length : 0) + 1;
        ta.setSelectionRange(pos, pos);
        ta.focus();
      }, 0);
      e.preventDefault();
      e.stopPropagation();
    }
    // 既存行数内なら標準動作
  });

  // デバッグ用：クリックイベントの詳細ログ
  ta.addEventListener("click", function (e) {
    console.log("MEMO textarea click event:", {
      text: ta.value,
      textLength: ta.value.length,
      selectionStart: ta.selectionStart,
      selectionEnd: ta.selectionEnd,
      scrollTop: ta.scrollTop,
      scrollLeft: ta.scrollLeft,
      clientX: e.clientX,
      clientY: e.clientY,
    });
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
    // textareaのフォントサイズを更新
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

    // フォントサイズ変更後にtextareaの高さを再調整
    setTimeout(() => {
      autoResizeTextarea();
      console.log(
        `Font size changed to ${currentFontSize}px, textarea height adjusted`
      );
    }, 10);
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
    console.log("Scrolled to top of MEMO textarea");
  });

  // コピーボタンの機能を追加
  const copyBtn = content.querySelector(".copy-text-btn");
  copyBtn.addEventListener("click", async () => {
    // テキスト末尾の空白を除去してコピーする
    const textToCopy = ta.value.trimEnd();
    console.log("[Memo] copy requested", {
      originalLength: ta.value.length,
      trimmedLength: textToCopy.length,
    });

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
        // textareaのテキストを選択してコピー
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
  // char-counterが一時的に見つからない場合の警告状態
  let missingCounterWarned = false;

  function updateButtonVisibility() {
    const text = ta.value;
    const hasText = text.trim().length > 0;
    const lines = text.split("\n").length;
    const isLongText = lines > 10; // 10行以上の場合に表示

    // 文字数カウント：改行文字を除外した実際の文字数を表示
    const charCountWithoutNewlines = text.replace(/\n/g, "").length;

    // 文字数カウンターを更新
    // 画面切替直後などで要素が存在しないケースに備える
    const charCounter = content.querySelector(".char-counter");
    if (charCounter) {
      // 改行を除いた文字数を表示
      charCounter.textContent = `${charCountWithoutNewlines}文字`;
      if (missingCounterWarned) {
        console.log("[MEMO] char-counter element restored");
        missingCounterWarned = false;
      }
      console.log("[MEMO] charCounter updated", charCountWithoutNewlines);
    } else {
      // 要素が見つからない場合はエラーを避けつつログを出力
      if (!missingCounterWarned) {
        console.warn(
          `[MEMO] char-counter element missing when updating count ` +
            `(updateButtonVisibility at ${new Date().toISOString()})`
        );
        missingCounterWarned = true;
        // 編集画面を離れた可能性が高いのでインターバルを解除
        clearCharCountIntervalFn();
      }
      return;
    }

    // コピーボタン：テキストがある場合に表示
    copyBtn.style.display = hasText ? "flex" : "none";

    // スクロールボタン：10行以上の場合に表示
    scrollToTopBtn.style.display = isLongText ? "flex" : "none";
  }

  // 初期状態でボタンの表示を設定
  updateButtonVisibility();

  // 文字数カウンターの確実な更新のための包括的イベント監視
  let lastValue = ta.value;

  // textareaのイベント監視
  ta.addEventListener("input", () => {
    setTimeout(updateButtonVisibility, 10);
  });

  // 定期的な監視（最強の保険として）
  charCountInterval = setInterval(() => {
    const currentValue = ta.value;
    if (currentValue !== lastValue) {
      lastValue = currentValue;
      updateButtonVisibility();
      console.log("文字数カウンター：定期監視で差分検出", currentValue.length);
    }
  }, 100); // 100msごとにチェック
  console.log("[MEMO] charCountInterval started");

  // メモリリーク防止：ページ離脱時にインターバルをクリア
  window.removeEventListener("beforeunload", clearCharCountIntervalFn);
  window.addEventListener("beforeunload", clearCharCountIntervalFn);

  // preload data when editing
  const starIcon = content.querySelector(".star-input");
  if (id !== undefined) {
    const existing = memos.find((m) => m.id === id);
    if (existing) {
      content.querySelector(".title-input").value = existing.title;
      // textareaにコンテンツを設定
      ta.value = existing.content;
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
      window.AppUtils.showSaveConfirmDialog({
        title: "変更を保存しますか？",
        message:
          "メモ内容に変更があります。<br>保存せずに戻ると変更が失われます。",
        onSave: async () => {
          // 保存して戻る
          const titleInput = content.querySelector(".title-input").value.trim();
          const body = ta.value.trim();
          const starred = starIcon.dataset.starred === "true";

          // タイトルが空で内容もない場合のみ「無題」とする
          const title = titleInput || (body ? titleInput : "無題");

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
        onDiscard: () => {
          // 破棄して戻る
          console.log("[BACK] 変更を破棄して戻りました");
          renderListView();
        },
      });
    } else {
      // 変更がない場合は直接戻る
      console.log("[BACK] 変更なしで戻りました");
      renderListView();
    }
  });

  // save handler
  document.querySelector(".save-btn").addEventListener("click", async () => {
    const titleInput = content.querySelector(".title-input").value.trim();
    const body = ta.value.trim();
    const starred = starIcon.dataset.starred === "true";

    // タイトルが空で内容もない場合のみ「無題」とする
    const title = titleInput || (body ? titleInput : "無題");

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
    // 削除前の確認処理
    const originalMemo =
      id !== undefined ? memos.find((m) => m.id === id) : null;
    const hasChanges = checkForUnsavedMemoChanges(
      originalMemo,
      id === undefined
    );

    // タイトルまたは内容がある場合は削除確認ダイアログを表示
    if (
      hasChanges ||
      (originalMemo && (originalMemo.title || originalMemo.content))
    ) {
      window.AppUtils.showSaveConfirmDialog({
        title: "本当に削除しますか？",
        message: "メモ内容に変更があります。保存せずに戻ると変更が失われます。",
        discardLabel: "削除",
        cancelLabel: "キャンセル",
        discardColor: "#D93544",
        cancelColor: "#4A5568",
        showSave: false,
        showDiscard: true,
        showCancel: true,
        iconClass: "bi bi-trash-fill",
        onDiscard: async () => {
          // 削除処理
          if (id !== undefined) {
            memos = memos.filter((m) => m.id !== id);
            console.log("delete memo id=", id);
            await saveStorage(MEMO_KEY, memos);
            // グローバルに最新のmemosを設定
            window.memos = memos;
          }
          renderListView();
        },
        onCancel: () => {
          // キャンセル処理
        },
      });
    } else {
      // 空のメモまたは新規作成で内容がない場合は直接削除
      if (id !== undefined) {
        memos = memos.filter((m) => m.id !== id);
        console.log("delete empty memo id=", id);
        await saveStorage(MEMO_KEY, memos);
        // グローバルに最新のmemosを設定
        window.memos = memos;
      }
      renderListView();
    }
  });

  console.log("renderInputForm: end");
}

// ───────────────────────────────────────
// 4) Archive mode: swap sub-nav & footer
// ───────────────────────────────────────
function renderArchiveNav(type) {
  console.log("renderArchiveNav: start, type=", type);
  archiveType = type;

  // 編集画面の文字数カウンターを解除
  clearCharCountIntervalFn();

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("memo", {
      mode: "archive",
      archiveType: type,
    });
    window.PageStateManager.setActivePage("memo");
  }

  // MEMOページにはサブナビゲーションが不要なのでコメントアウト
  // swap card-nav buttons to Archive/MEMO ⇔ Archive/Clipboard
  // const nav = document.querySelector(".card-nav");
  // nav.innerHTML = `
  //   <button class="nav-btn" id="btn-archive-memo">
  //     <i class="bi bi-archive-fill"></i> アーカイブ/MEMO
  //   </button>
  //   <button class="nav-btn" id="btn-archive-clip">
  //     <i class="bi bi-archive-fill"></i> アーカイブ/clipboard
  //   </button>
  // `;
  // // activate correct
  // document
  //   .getElementById("btn-archive-memo")
  //   .classList.toggle("active", archiveType === "memo");
  // document
  //   .getElementById("btn-archive-clip")
  //   .classList.toggle("active", archiveType === "clip");

  // // set click handlers to re-render archive lists
  // document
  //   .getElementById("btn-archive-memo")
  //   .addEventListener("click", () => renderArchiveNav("memo"));
  // document
  //   .getElementById("btn-archive-clip")
  //   .addEventListener("click", () => renderArchiveNav("clip"));

  // now render the archive list + footer
  renderArchiveList();
  renderArchiveFooter();

  // アーカイブ画面でもヘッダーのMEMOアイコンのクリックイベントを設定
  setTimeout(() => {
    const memoBtn = document.getElementById("btn-memo-list");
    if (memoBtn) {
      console.log("アーカイブ画面: MEMOヘッダーボタンを発見しました");
      // 既存のイベントリスナーを削除
      memoBtn.removeEventListener("click", handleMemoHeaderClick);
      // 新しいイベントリスナーを追加
      memoBtn.addEventListener("click", handleMemoHeaderClick);
      console.log(
        "アーカイブ画面: MEMOヘッダーボタンにイベントリスナーを設定しました"
      );
    } else {
      console.error("アーカイブ画面: MEMOヘッダーボタンが見つかりません");
    }
  }, 100);

  console.log("renderArchiveNav: end");
}

// Renders the actual archive list inside .memo-content (PROMPTパターンに統一)
async function renderArchiveList() {
  console.log("renderArchiveList: start", archiveType);

  document.querySelector(".memo-content").classList.add("archive");
  const content = document.querySelector(".memo-content");
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  /* 1) ストレージ読み込み */
  const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY;
  const rawItems = await loadStorage(key);

  // 既存のアーカイブデータから空のアイテムをクリーンアップ
  if (archiveType === "memo") {
    const hasEmptyItems = rawItems.some((m) => m.archived && isEmptyMemo(m));
    if (hasEmptyItems) {
      console.log("[ARCH] 空のアーカイブメモをクリーンアップ中...");
      const cleanedItems = rawItems.filter(
        (m) => !(m.archived && isEmptyMemo(m))
      );
      await saveStorage(MEMO_KEY, cleanedItems);
      console.log("[ARCH] 空のアーカイブメモのクリーンアップ完了");
    }
  }

  const listData =
    archiveType === "memo"
      ? rawItems.filter((m) => m.archived && !isEmptyMemo(m))
      : rawItems;

  console.log("[ARCH] アーカイブデータ:", {
    key: key,
    rawItems: rawItems.length,
    listData: listData.length,
    archiveType: archiveType,
  });

  /* 2) HTML 骨格（PROMPTパターンに統一） */
  content.innerHTML = `
    <div class="archive-header">
      <h3 class="archive-title">アーカイブ</h3>
    <label class="select-all-label">
      <input type="checkbox" id="chk-select-all" /> 全て選択する
    </label>
    </div>
    <ul class="archive-list"></ul>`;
  const ul = content.querySelector(".archive-list");

  console.log("[ARCH] アーカイブリスト要素:", ul);

  /* 3) 行生成（MEMO固有のプレビュー付き）またはEmpty State */
  if (listData.length === 0) {
    // Empty State: アーカイブが空の場合
    ul.innerHTML = `
      <div class="memo-empty-state">
        <div class="memo-empty-state-content">
          <div class="memo-empty-state-icon">
            <i class="bi bi-clipboard2-minus"></i>
          </div>
          <h3 class="memo-empty-state-title">アーカイブされた<br>メモはありません</h3>
          <p class="memo-empty-state-message">
            メモをアーカイブすると、<br>ここに表示されます。
          </p>
        </div>
      </div>
    `;

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".memo-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  } else {
    // 通常のアーカイブアイテム表示
    listData.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "archive-item";

      /* 左：チェック */
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "arch-check";
      cb.dataset.index = idx;
      li.appendChild(cb);

      /* 中央：タイトル＋プレビューコンテナ */
      const contentDiv = document.createElement("div");
      contentDiv.className = "arch-content";

      // タイトル
      const titleSpan = document.createElement("span");
      titleSpan.className = "arch-title";
      titleSpan.textContent = archiveType === "memo" ? it.title || "無題" : it;
      contentDiv.appendChild(titleSpan);

      // MEMO固有：内容プレビュー
      if (archiveType === "memo" && it.content) {
        const previewSpan = document.createElement("div");
        previewSpan.className = "memo-preview";
        // 内容の最初の100文字をプレビューとして表示
        const previewText =
          it.content.length > 100
            ? it.content.substring(0, 100) + "..."
            : it.content;
        previewSpan.textContent = previewText;
        contentDiv.appendChild(previewSpan);
      }

      li.appendChild(contentDiv);

      /* 右：復元ボタン */
      const btn = document.createElement("button");
      btn.className = "restore-btn";
      btn.innerHTML = '<i class="bi bi-upload"></i>';
      btn.title = "復元";

      console.log("[ARCH] 復元ボタンを作成しました:", {
        index: idx,
        itemId: it.id,
        archiveType: archiveType,
      });

      btn.addEventListener("click", async (e) => {
        console.log("[ARCH] 復元ボタンがクリックされました！");
        e.preventDefault();
        e.stopPropagation();

        // 重複クリックを防ぐ
        if (btn.disabled) {
          console.log("[ARCH] 復元処理中です...");
          return;
        }

        console.log("[ARCH] restore idx:", idx, "archiveType:", archiveType);

        // ボタンを一時的に無効化
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        try {
          console.log("[ARCH] 復元処理を開始します...");

          if (archiveType === "memo") {
            /* MEMO: archived → false */
            const memos = await loadStorage(MEMO_KEY);
            console.log("[ARCH] 現在のメモ数:", memos.length);

            const target = memos.find((m) => m.id === it.id);
            console.log("[ARCH] 復元対象のメモ:", target);

            if (target) {
              target.archived = false;
              console.log("[ARCH] メモを復元しました:", target.title);

              await saveStorage(MEMO_KEY, memos);
              // グローバルに最新のmemosを設定
              window.memos = memos;
              console.log("[ARCH] メモストレージを更新しました");

              // 復元アニメーションを実行
              if (window.AppUtils && window.AppUtils.animateRestoreItem) {
                await window.AppUtils.animateRestoreItem(li, async () => {
                  console.log("[ARCH] 復元アニメーション完了");
                });
              } else {
                // AppUtilsが利用できない場合の代替処理
                console.log(
                  "[ARCH] AppUtils.animateRestoreItemが利用できません。代替処理を実行します。"
                );

                // シンプルなアニメーション
                li.style.transition = "all 0.5s ease-in-out";
                li.style.transform = "translateY(-50px) scale(0.9)";
                li.style.opacity = "0";
                li.style.filter = "blur(2px)";

                await new Promise((resolve) => {
                  setTimeout(() => {
                    console.log("[ARCH] 代替復元アニメーション完了");
                    resolve();
                  }, 500);
                });
              }

              // 復元後にアーカイブリストを再描画
              renderArchiveList();
            } else {
              console.error("[ARCH] 復元対象のメモが見つかりません:", it.id);
              // ボタンを再度有効化
              btn.disabled = false;
              btn.style.opacity = "1";
              btn.style.cursor = "pointer";
            }
          } else {
            /* CLIP: アーカイブ → アクティブへ移動 */
            const act = await loadStorage(CLIP_KEY);
            const arch = await loadStorage(CLIP_ARCH_KEY);
            const restoredItem = arch.splice(idx, 1)[0];
            act.push(restoredItem);
            await saveStorage(CLIP_KEY, act);
            await saveStorage(CLIP_ARCH_KEY, arch);
            console.log("[ARCH] クリップを復元しました:", restoredItem);

            // 復元アニメーションを実行
            if (window.AppUtils && window.AppUtils.animateRestoreItem) {
              await window.AppUtils.animateRestoreItem(li, async () => {
                console.log("[ARCH] 復元アニメーション完了");
              });
            } else {
              // AppUtilsが利用できない場合の代替処理
              console.log(
                "[ARCH] AppUtils.animateRestoreItemが利用できません。代替処理を実行します。"
              );

              // シンプルなアニメーション
              li.style.transition = "all 0.5s ease-in-out";
              li.style.transform = "translateY(-50px) scale(0.9)";
              li.style.opacity = "0";
              li.style.filter = "blur(2px)";

              await new Promise((resolve) => {
                setTimeout(() => {
                  console.log("[ARCH] 代替復元アニメーション完了");
                  resolve();
                }, 500);
              });
            }

            // 復元後にアーカイブリストを再描画
            renderArchiveList();
          }

          console.log("[ARCH] 復元処理が完了しました");
        } catch (error) {
          console.error("[ARCH] 復元処理中にエラーが発生しました:", error);
          // エラーが発生した場合はボタンを再度有効化
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }
      });

      li.appendChild(btn);

      ul.appendChild(li);
    });
  }

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

  // Footerボタンのホバー効果を設定
  setupFooterHoverEffects();

  // Back → go back to last mode (we'll default to MEMO list)
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // 1) Archive 表示を解除
    document.querySelector(".memo-content").classList.remove("archive");
    document.querySelector(".sub-archive-nav")?.remove();
    footer.classList.remove("archive");

    // 2) MEMOページにはサブナビゲーションが不要なのでコメントアウト
    // const nav = document.querySelector(".card-nav");
    // nav.innerHTML = `
    //  <button class="nav-btn" id="btn-memolist">MEMO</button>
    //  <button class="nav-btn" id="btn-clipboard">clipboard</button>
    // `;
    // document
    //   .getElementById("btn-memolist")
    //   .addEventListener("click", renderListView);
    // document
    //   .getElementById("btn-clipboard")
    //   .addEventListener("click", renderClipboardView);

    // 3) 画面遷移
    if (archiveType === "memo") renderListView();
    // else renderClipboardView(); // MEMOページではclipboard機能は使用しない
  });
  // Delete All → delete selected items or clear all storage & re-render archive list
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const selectedChecks = document.querySelectorAll(".arch-check:checked");

      // 削除対象の数を確認
      let deleteCount = 0;
      let confirmMessage = "";

      if (selectedChecks.length === 0) {
        // 全削除の場合
        const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY;
        const rawItems = await loadStorage(key);
        const archivedItems =
          archiveType === "memo"
            ? rawItems.filter((m) => m.archived)
            : rawItems;
        deleteCount = archivedItems.length;

        if (deleteCount === 0) {
          console.log("削除対象のアーカイブアイテムがありません");
          return;
        }

        confirmMessage = `アーカイブされた全ての${
          archiveType === "memo" ? "メモ" : "クリップ"
        }（${deleteCount}件）を完全に削除しますか？`;
      } else {
        // 選択削除の場合
        deleteCount = selectedChecks.length;
        confirmMessage = `選択された${deleteCount}件の${
          archiveType === "memo" ? "メモ" : "クリップ"
        }を完全に削除しますか？`;
      }

      // 確認ダイアログを表示
      window.AppUtils.showSaveConfirmDialog({
        title: "削除の確認",
        message: `${confirmMessage}<br><span class="delete-warning">この操作は取り消せません。</span>`,
        centerHeader: true,
        discardLabel: "削除",
        cancelLabel: "キャンセル",
        discardColor: "#D93544",
        cancelColor: "#4A5568",
        showSave: false,
        showDiscard: true,
        showCancel: true,
        iconClass: "bi bi-trash-fill",
        onDiscard: async () => {
          // 削除処理
          if (selectedChecks.length === 0) {
            // 何も選択されていない場合は全削除
            if (archiveType === "memo") {
              const memos = await loadStorage(MEMO_KEY);
              const filteredMemos = memos.filter((m) => !m.archived);
              await saveStorage(MEMO_KEY, filteredMemos);
              // グローバルに最新のmemosを設定
              window.memos = filteredMemos;
            } else {
              await saveStorage(CLIP_ARCH_KEY, []);
            }
          } else {
            // 選択されたアイテムのみ削除
            const indicesToDelete = Array.from(selectedChecks).map((cb) =>
              parseInt(cb.dataset.index)
            );

            if (archiveType === "memo") {
              const memos = await loadStorage(MEMO_KEY);
              const archivedMemos = memos.filter((m) => m.archived);

              // 選択されたインデックスを逆順でソートして削除（インデックスずれを防ぐ）
              indicesToDelete
                .sort((a, b) => b - a)
                .forEach((idx) => {
                  if (idx < archivedMemos.length) {
                    const targetMemo = archivedMemos[idx];
                    const realIdx = memos.findIndex(
                      (m) => m.id === targetMemo.id
                    );
                    if (realIdx !== -1) {
                      memos.splice(realIdx, 1);
                    }
                  }
                });

              await saveStorage(MEMO_KEY, memos);
              // グローバルに最新のmemosを設定
              window.memos = memos;
            } else {
              const archivedClips = await loadStorage(CLIP_ARCH_KEY);
              indicesToDelete
                .sort((a, b) => b - a)
                .forEach((idx) => {
                  if (idx < archivedClips.length) {
                    archivedClips.splice(idx, 1);
                  }
                });
              await saveStorage(CLIP_ARCH_KEY, archivedClips);
            }
          }

          console.log(`[ARCHIVE] ${deleteCount}件のアイテムを削除しました`);
          renderArchiveList();
        },
        onCancel: () => {
          console.log("[ARCHIVE] 削除をキャンセルしました");
        },
      });
    });
  console.log("renderArchiveFooter: end");
}

// ───────────────────────────────────────
// Initialization on load
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("MEMOページ DOMContentLoaded fired");

  // AppUtilsの読み込み状況を確認
  console.log("[MEMO] AppUtils check:", {
    AppUtils: !!window.AppUtils,
    animateRestoreItem: !!(
      window.AppUtils && window.AppUtils.animateRestoreItem
    ),
    animateArchiveItem: !!(
      window.AppUtils && window.AppUtils.animateArchiveItem
    ),
  });

  // 現在のページがMEMOページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/memo/")) {
    console.log("現在のページはMEMOページではありません:", currentPage);
    return; // MEMOページでない場合は初期化をスキップ
  }

  // 起動時は常に一覧画面を表示（ページ状態の復元を無効化）
  console.log("MEMOページ: 起動時に一覧画面を表示");
  await renderListView();

  // ヘッダーのMEMOアイコンのクリックイベント（初期化時）
  const memoButton = document.getElementById("btn-memo-list");
  if (memoButton) {
    console.log("初期化時: MEMOヘッダーボタンを発見しました");
    // 既存のイベントリスナーを削除
    memoButton.removeEventListener("click", handleMemoHeaderClick);
    // 新しいイベントリスナーを追加
    memoButton.addEventListener("click", handleMemoHeaderClick);
    console.log("初期化時: MEMOヘッダーボタンにイベントリスナーを設定しました");
  } else {
    console.error("初期化時: MEMOヘッダーボタンが見つかりません");
  }

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

  console.log("checkForUnsavedMemoChanges デバッグ:", {
    currentTitle: currentTitle,
    currentContent: currentContent,
    currentStarred: currentStarred,
    isNew: isNew,
    originalMemo: originalMemo,
    titleInput: document.querySelector(".title-input"),
    textInput: document.querySelector(".text-input"),
    starInput: document.querySelector(".star-input"),
  });

  // 新規作成の場合
  if (isNew) {
    // タイトルまたは内容があれば変更あり
    const hasChanges = currentTitle !== "" || currentContent !== "";
    console.log("新規作成の場合の変更チェック:", hasChanges);
    return hasChanges;
  }

  // 既存編集の場合
  if (!originalMemo) {
    console.log("既存メモが見つからない場合");
    return false;
  }

  // 各項目の変更をチェック
  const titleChanged = currentTitle !== (originalMemo.title || "");
  const contentChanged = currentContent !== (originalMemo.content || "");
  const starredChanged = currentStarred !== (originalMemo.starred || false);

  const hasChanges = titleChanged || contentChanged || starredChanged;

  console.log("既存編集の場合の変更チェック:", {
    titleChanged: titleChanged,
    contentChanged: contentChanged,
    starredChanged: starredChanged,
    hasChanges: hasChanges,
    originalTitle: originalMemo.title,
    originalContent: originalMemo.content,
    originalStarred: originalMemo.starred,
  });

  return hasChanges;
}

/*━━━━━━━━━━ 空のメモ判定機能 ━━━━━━━━━━*/
function isEmptyMemo(memo) {
  return (
    (!memo.title || memo.title.trim() === "") &&
    (!memo.content || memo.content.trim() === "")
  );
}

// 削除：showMemoSaveConfirmDialog関数はutils.jsのshowSaveConfirmDialogを使用

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderListView = renderListView;
window.checkForUnsavedMemoChanges = checkForUnsavedMemoChanges;
// 削除：showMemoSaveConfirmDialog関数はutils.jsに統合
window.memos = memos;
window.saveStorage = saveStorage;
window.getCurrentEditingMemoId = () => currentEditingMemoId;

// 保存して戻る関数
async function saveAndGoBack() {
  const titleInput = document.querySelector(".title-input")?.value.trim() || "";
  const body = document.querySelector(".text-input")?.value.trim() || "";
  const starred =
    document.querySelector(".star-input")?.dataset.starred === "true";

  // タイトルが空で内容もない場合のみ「無題」とする
  const title = titleInput || (body ? titleInput : "無題");

  if (currentEditingMemoId !== undefined) {
    // update existing
    const idx = memos.findIndex((m) => m.id === currentEditingMemoId);
    memos[idx] = { id: currentEditingMemoId, title, content: body, starred };
    console.log("[MEMO] 変更を保存して戻りました:", memos[idx]);
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
    console.log("[MEMO] 新規メモを保存して戻りました:", newM);
  }
  await saveStorage(MEMO_KEY, memos);
  // グローバルに最新のmemosを設定
  window.memos = memos;
  await renderListView();
}

// 破棄して戻る関数
function discardAndGoBack() {
  console.log("[MEMO] 変更を破棄して戻りました");
  renderListView();
}

/*━━━━━━━━━━ ドラッグ＆ドロップ成功メッセージ ━━━━━━━━━━*/
function showDragDropSuccessMessage(fromPosition, toPosition) {
  const message = "順番を入れ替えました";
  const toast = document.createElement("div");
  toast.className = "drag-drop-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 10);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// ───────────────────────────────────────
// エクスポート機能
// ───────────────────────────────────────
async function exportAllMemos() {
  try {
    // アクティブなメモ（アーカイブされていないメモ）のみをフィルタリング
    const activeMemos = memos ? memos.filter((m) => !m.archived) : [];

    // アクティブなメモが0件の場合は処理を停止
    if (activeMemos.length === 0) {
      return;
    }

    // 現在時刻を取得してファイル名を生成
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const fileName = `${year}${month}${day}_${hours}${minutes}${seconds}.json`;

    // エクスポート用のデータ構造を作成（アクティブなメモのみ）
    const exportData = {
      // 特別なID（この拡張機能からのエクスポートであることを示す）
      extensionId: "sideeffect-v1.0",
      extensionName: "SideEffect",
      extensionVersion: "1.0.0",
      // 既存のデータ
      version: "1.0",
      exportDate: now.toISOString(),
      memoCount: activeMemos.length,
      totalMemoCount: memos ? memos.length : 0,
      archivedMemoCount: memos ? memos.filter((m) => m.archived).length : 0,
      memos: activeMemos,
    };

    // 正しいハッシュ値を計算（認証用）
    const dataForHash = { ...exportData };
    const hashResult = await generateSecurityHash(dataForHash);

    // エクスポートデータに設定
    exportData.securityHash = hashResult.securityHash; // 実際のハッシュ値（認証用）
    exportData.backupnumber = hashResult.backupnumber; // 前半32文字（認証用）

    // JSONファイルとしてダウンロード
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 成功メッセージを表示
    showExportSuccessMessage(fileName);
  } catch (error) {
    console.error("エクスポートエラー:", error);
    showExportErrorMessage();
  }
}

// SHA-256ハッシュを生成し、分割してセキュリティ強化する関数
async function generateSecurityHash(data) {
  try {
    // データを文字列化
    const dataString = JSON.stringify(data);

    // 文字列をUint8Arrayに変換
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);

    // SHA-256ハッシュを計算
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);

    // ArrayBufferをUint8Arrayに変換
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // 16進数文字列に変換
    const sha256Hash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // SHA-256ハッシュを前半と後半に分割（各32文字）
    const firstHalf = sha256Hash.substring(0, 32);
    const secondHalf = sha256Hash.substring(32, 64);

    // ランダムな32文字のハッシュを生成
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const randomHash = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // backupnumber: 32桁（SHA-256の前半32桁のみ）
    // securityHash: 64桁（ランダム32桁 + SHA-256の後半32桁）
    const combinedHash = randomHash + secondHalf;

    return {
      backupnumber: firstHalf,
      securityHash: combinedHash,
    };
  } catch (error) {
    console.error("内緒だよ");
    return null;
  }
}

// 偽のハッシュ値を生成する関数（表示用）- より自然なランダムハッシュ
function generateFakeHash(data, targetLength) {
  try {
    // データを文字列化してハッシュを生成
    const dataString = JSON.stringify(data);
    let hash = 0;

    // 異なるアルゴリズムでハッシュを生成（偽装用）
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 3) + hash + char; // 異なる計算式
      hash = hash & hash;
    }

    // 16進数文字列に変換
    let fakeHash = hash.toString(16);

    // より自然なランダムハッシュを生成
    const randomBytes = new Uint8Array(targetLength / 2); // 16進数なので半分のバイト数
    crypto.getRandomValues(randomBytes);
    const randomHash = Array.from(randomBytes).map((b) =>
      b.toString(16).padStart(2, "0")
    );

    // 元のハッシュとランダムハッシュを組み合わせて自然なハッシュを作成
    const combinedHash = (fakeHash + randomHash).substring(0, targetLength);

    // 長さを調整（短い場合はランダムで埋める、長い場合は切り詰める）
    if (combinedHash.length < targetLength) {
      const remainingLength = targetLength - combinedHash.length;
      const additionalRandomBytes = new Uint8Array(
        Math.ceil(remainingLength / 2)
      );
      crypto.getRandomValues(additionalRandomBytes);
      const additionalHash = Array.from(additionalRandomBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, remainingLength);
      return combinedHash + additionalHash;
    } else {
      return combinedHash;
    }
  } catch (error) {
    console.error("偽ハッシュ生成エラー:", error);
    // エラー時もランダムハッシュを生成
    const fallbackBytes = new Uint8Array(targetLength / 2);
    crypto.getRandomValues(fallbackBytes);
    return Array.from(fallbackBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, targetLength);
  }
}

// エクスポート成功メッセージ
function showExportSuccessMessage(fileName) {
  console.log("[MEMO] showExportSuccessMessage呼び出し:", {
    fileName: fileName,
    AppUtils: !!window.AppUtils,
    showToast: !!(window.AppUtils && window.AppUtils.showToast),
  });

  if (window.AppUtils && window.AppUtils.showToast) {
    console.log("[MEMO] エクスポート成功トーストを表示");
    window.AppUtils.showToast(`エクスポート完了: ${fileName}`, "success");
  } else {
    console.error("[MEMO] AppUtils.showToastが利用できません");
  }
}

// エクスポートエラーメッセージ
function showExportErrorMessage() {
  console.log("[MEMO] showExportErrorMessage呼び出し:", {
    AppUtils: !!window.AppUtils,
    showToast: !!(window.AppUtils && window.AppUtils.showToast),
  });

  if (window.AppUtils && window.AppUtils.showToast) {
    console.log("[MEMO] エクスポートエラートーストを表示");
    window.AppUtils.showToast("エクスポートに失敗しました", "error");
  } else {
    console.error("[MEMO] AppUtils.showToastが利用できません");
  }
}

// エクスポートボタンの状態を更新
function updateExportButtonState() {
  const exportBtn = document.querySelector(".encrypt-btn");
  if (exportBtn) {
    // アクティブなメモ（アーカイブされていないメモ）のみをカウント
    const activeMemos = memos ? memos.filter((m) => !m.archived) : [];
    const hasActiveMemos = activeMemos.length > 0;

    exportBtn.disabled = !hasActiveMemos;
    exportBtn.title = hasActiveMemos ? "バックアップ" : "メモがありません";

    console.log("エクスポートボタン状態更新:", {
      hasActiveMemos,
      disabled: !hasActiveMemos,
      totalMemoCount: memos ? memos.length : 0,
      activeMemoCount: activeMemos.length,
    });
  }
}

// Footerボタンのホバー効果を設定する関数
function setupFooterHoverEffects() {
  const footer = document.querySelector(".memo-footer");
  if (!footer) return;

  footer.querySelectorAll(".nav-btn").forEach((btn) => {
    const textSpan = btn.querySelector(".nav-text");
    if (!textSpan) return;

    // 既存のイベントリスナーを削除
    btn.removeEventListener("mouseenter", btn._footerHoverEnter);
    btn.removeEventListener("mouseleave", btn._footerHoverLeave);

    // 新しいイベントリスナーを設定
    btn._footerHoverEnter = () => {
      const textWidth = textSpan.scrollWidth;
      btn.style.setProperty("--nav-text-max", `${textWidth}px`);
      btn.classList.add("show-text");
      console.log("[MEMO FOOTER] hover start:", btn.className, {
        btnWidth: btn.offsetWidth,
        textWidth,
      });
    };

    btn._footerHoverLeave = () => {
      btn.classList.remove("show-text");
      btn.style.removeProperty("--nav-text-max");
      console.log("[MEMO FOOTER] hover end:", btn.className, {
        btnWidth: btn.offsetWidth,
      });
    };

    btn.addEventListener("mouseenter", btn._footerHoverEnter);
    btn.addEventListener("mouseleave", btn._footerHoverLeave);
  });
}

// Function to save the current state of the memo page
function saveMemoState() {
  const memoContent = document.querySelector(".memo-content");
  const state = {
    archiveType: archiveType,
    currentEditingMemoId: currentEditingMemoId,
    isEditMode: memoContent && memoContent.classList.contains("edit-mode"),
  };
  chrome.storage.local.set({ memoState: state }, () => {
    console.log("Memo state saved:", state);
  });
}

// Function to restore the memo page state
function restoreMemoState() {
  chrome.storage.local.get(["memoState"], (result) => {
    const state = result.memoState || {};
    archiveType = state.archiveType || null;
    currentEditingMemoId = state.currentEditingMemoId || null;
    const memoContent = document.querySelector(".memo-content");
    if (memoContent && state.isEditMode) {
      memoContent.classList.add("edit-mode");
    } else if (memoContent) {
      memoContent.classList.remove("edit-mode");
    }
    console.log("Memo state restored:", state);
  });
}

// Add event listeners to save and restore state
window.addEventListener("beforeunload", saveMemoState);
document.addEventListener("DOMContentLoaded", restoreMemoState);

// サイドパネルを開く機能
document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "[MEMO] ページ初期化完了 - ヘッダーホバー時UI改善版 v2（アイコンとテキスト表示修正）"
  );
  const openSidePanelBtn = document.getElementById("open-side-panel");
  if (openSidePanelBtn) {
    openSidePanelBtn.addEventListener("click", async () => {
      try {
        // 現在のタブを取得
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        // サイドパネルを有効化して設定
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          enabled: true,
          path: "pages/memo/memo.html",
        });

        // サイドパネルを開く
        await chrome.sidePanel.open({ tabId: tab.id });

        console.log("サイドパネルを開きました");
      } catch (error) {
        console.error("サイドパネルを開くのに失敗しました:", error);
      }
    });
  }
});
