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
// Header click handlers
// ───────────────────────────────────────
function handleClipboardHeaderClick(e) {
  e.preventDefault(); // デフォルトのリンク動作を防ぐ
  e.stopPropagation(); // イベントの伝播を停止
  console.log("CLIPBOARDヘッダーアイコンがクリックされました");
  console.log("現在のページ状態:", {
    archiveType: archiveType,
    currentMode: document
      .querySelector(".memo-content")
      .classList.contains("archive")
      ? "archive"
      : "main",
  });
  renderClipboardView(); // メインページに遷移
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

  // 他の要素のドロップインジケーターをクリア
  document.querySelectorAll(".clip-item.drop-indicator").forEach((el) => {
    el.classList.remove("drop-indicator", "drop-above", "drop-below", "active");
  });

  // マウスの位置に基づいてドロップ位置を判定
  const rect = this.getBoundingClientRect();
  const mouseY = e.clientY;
  const itemCenter = rect.top + rect.height / 2;

  // ドロップ位置のインジケーターを表示
  this.classList.add("drop-indicator", "active");

  if (mouseY < itemCenter) {
    // マウスが要素の上半分にある場合、要素の上に挿入
    this.classList.add("drop-above");
    console.log("[CLIP DND] ドロップ位置: 上に挿入");
  } else {
    // マウスが要素の下半分にある場合、要素の下に挿入
    this.classList.add("drop-below");
    console.log("[CLIP DND] ドロップ位置: 下に挿入");
  }
}
function handleClipDragLeave() {
  this.classList.remove("drop-indicator", "drop-above", "drop-below", "active");
}
async function handleClipDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;

  console.log(`CLIPBOARD drop from ${dragClipIndex} to ${dropIndex}`);
  if (dragClipIndex === null || dragClipIndex === dropIndex) return;

  // ドロップ位置を判定
  const rect = this.getBoundingClientRect();
  const mouseY = e.clientY;
  const itemCenter = rect.top + rect.height / 2;
  const dropAbove = mouseY < itemCenter;

  let actualToIndex = dropIndex;

  // reorder in array
  const [moved] = clips.splice(dragClipIndex, 1);

  if (dropAbove) {
    // 要素の上に挿入
    clips.splice(dropIndex, 0, moved);
    console.log("[CLIP DND] 要素の上に挿入:", dragClipIndex, "→", dropIndex);
  } else {
    // 要素の下に挿入
    actualToIndex = dropIndex + 1;
    clips.splice(actualToIndex, 0, moved);
    console.log(
      "[CLIP DND] 要素の下に挿入:",
      dragClipIndex,
      "→",
      actualToIndex
    );
  }

  console.log("[CLIPBOARD D&D] 保存前のclips配列:", clips);
  await saveStorage(CLIP_KEY, clips);
  console.log("[CLIPBOARD D&D] 保存完了");

  // グローバルに最新のclipsを設定
  window.clips = clips;
  console.log("[CLIPBOARD D&D] window.clipsを更新:", window.clips);

  // ドラッグ＆ドロップ成功メッセージを表示
  console.log("[CLIPBOARD D&D] showDragDropSuccessMessage呼び出し前:", {
    dragClipIndex: dragClipIndex,
    actualToIndex: actualToIndex,
    AppUtils: !!window.AppUtils,
  });
  showDragDropSuccessMessage(dragClipIndex + 1, actualToIndex + 1);

  console.log("[CLIPBOARD D&D] renderClipboardView()呼び出し前");
  await renderClipboardView();
  console.log("[CLIPBOARD D&D] renderClipboardView()完了");

  // ドラッグ＆ドロップ後の再初期化処理
  console.log("[CLIPBOARD D&D] 再初期化処理開始");

  // クリップデータを再読み込み
  clips = await loadStorage(CLIP_KEY);
  window.clips = clips;
  console.log("[CLIPBOARD D&D] データ再読み込み完了:", clips);

  // 一覧画面を再表示
  await renderClipboardView();
  console.log("[CLIPBOARD D&D] 再初期化処理完了");
}
function handleClipDragEnd() {
  document
    .querySelectorAll(".clip-item")
    .forEach((el) =>
      el.classList.remove(
        "drop-indicator",
        "drop-above",
        "drop-below",
        "active"
      )
    );
  dragClipIndex = null;
}

// ───────────────────────────────────────
// Clipboard view + Archive toggle
// ───────────────────────────────────────
async function renderClipboardView() {
  console.log("renderClipboardView: start");

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("clipboard", {
      mode: "list",
    });
    window.PageStateManager.setActivePage("clipboard");
  }

  document.querySelector(".form-title")?.remove();

  clips = await loadStorage(CLIP_KEY);

  // footer + archive wiring
  const archiveToggleBtn = document.getElementById("btn-archive-toggle");
  if (archiveToggleBtn) {
    archiveToggleBtn.addEventListener("click", () => renderArchiveNav("clip"));
    console.log("アーカイブトグルボタンにイベントリスナーを設定しました");
  } else {
    console.error("アーカイブトグルボタンが見つかりません");
  }

  // ヘッダーのクリップボードアイコンのクリックイベント
  const clipboardBtn = document.getElementById("btn-clipboard");
  if (clipboardBtn) {
    console.log("メインページ: クリップボードヘッダーボタンを発見しました");
    // 既存のイベントリスナーを削除
    clipboardBtn.removeEventListener("click", handleClipboardHeaderClick);
    // 新しいイベントリスナーを追加
    clipboardBtn.addEventListener("click", handleClipboardHeaderClick);
    console.log(
      "メインページ: クリップボードヘッダーボタンにイベントリスナーを設定しました"
    );
  } else {
    console.error("メインページ: クリップボードヘッダーボタンが見つかりません");
  }

  // エクスポート機能の追加
  const exportBtn = document.querySelector(".encrypt-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportAllClips);
  }

  // ボタンの状態を更新
  updateExportButtonState();

  // animate
  const content = document.querySelector(".memo-content");
  if (!content) {
    console.error(".memo-content要素が見つかりません");
    return;
  }
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
      clips.unshift(""); // 配列の先頭に追加（一番上に表示）
      await saveStorage(CLIP_KEY, clips);
      renderClipboardView();
      updateExportButtonState(); // ボタン状態を更新
    });
  }

  // populate clips
  const ul = content.querySelector(".clipboard-list");
  if (!ul) {
    console.error(".clipboard-list要素が見つかりません");
    return;
  }
  ul.innerHTML = "";

  // Empty State: アクティブなクリップボードが何もない場合
  if (clips.length === 0) {
    ul.innerHTML = `
      <div class="clipboard-empty-state">
        <div class="clipboard-empty-state-content">
          <div class="clipboard-empty-state-icon">
            <i class="bi bi-journal-text"></i>
          </div>
          <h3 class="clipboard-empty-state-title">クリップボードがありません</h3>
          <p class="clipboard-empty-state-message">
            最初のクリップボードを作成してみましょう。
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
        clips.unshift(""); // 配列の先頭に追加（一番上に表示）
        await saveStorage(CLIP_KEY, clips);
        renderClipboardView();
        updateExportButtonState(); // ボタン状態を更新
      });
    }

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".clipboard-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);

    // メイン画面のfooterを設定（Empty Stateの場合）
    renderMainFooter();
    return; // ここで処理を終了
  }

  // 通常のクリップ一覧表示
  clips.forEach((txt, i) => {
    const li = document.createElement("li");
    li.className = "clip-item";
    li.draggable = false; // ドラッグ開始はハンドルのみ
    li.dataset.index = i;

    // DnD handlers for drop targets only
    li.addEventListener("dragover", handleClipDragOver);
    li.addEventListener("dragleave", handleClipDragLeave);
    li.addEventListener("drop", handleClipDrop);

    // 左側：戻るボタン（緑色の丸いボタン）
    const insertBtn = document.createElement("button");
    insertBtn.className = "clipboard-insert";
    insertBtn.innerHTML = '<i class="bi bi-arrow-left"></i>'; // 左向き矢印アイコン
    console.log("init: insert button created with arrow icon");
    insertBtn.title = "挿入";
    insertBtn.addEventListener("click", () => {
      // 最新の textarea の値を取得して送信
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
              console.log("insert:", currentText);
            }
          }
        );
      });
    });

    // auto-resize textarea（MEMOページと同様の包括的な自動リサイズ）- 真ん中
    const ta = document.createElement("textarea");
    ta.className = "clipboard-textarea";
    ta.rows = 1;
    ta.value = txt;
    ta.placeholder = "テキストを入力";

    // 自動リサイズ関数（改行・エンターで無限に広がる）
    function autoResize() {
      // 一時的に高さをリセットして正確なscrollHeightを取得
      ta.style.height = "auto";

      // 行の高さを取得（CSSで24pxに固定）
      const lineHeight = 24;

      // 最小高さ（2行分）を設定（最大高さ制限なし）
      const minHeight = lineHeight * 2; // 48px（CSSのmin-heightと一致）
      const contentHeight = ta.scrollHeight;

      // 最小高さ以上で高さを設定（最大高さ制限なし）
      const newHeight = Math.max(minHeight, contentHeight);

      ta.style.height = newHeight + "px";

      // スクロールは不要（無限に広がるため）
      ta.classList.remove("scrollable");

      // 親要素（clip-item）の最小高さを動的調整
      const clipItem = ta.closest(".clip-item");
      if (clipItem) {
        const itemPadding = 32; // 上下パディング16px * 2
        const buttonHeight = 36; // copyボタンとarchiveアイコンの高さ
        const itemMinHeight = Math.max(
          64, // 最小高さ
          newHeight + itemPadding,
          buttonHeight + itemPadding
        );
        clipItem.style.minHeight = itemMinHeight + "px";

        // レイアウト調整のためのクラス管理
        if (newHeight > minHeight) {
          clipItem.classList.add("expanded");
        } else {
          clipItem.classList.remove("expanded");
        }
      }

      console.log(
        `Clipboard textarea auto-resized: ${newHeight}px (content: ${contentHeight}px, min: ${minHeight}px)`
      );
    }

    // 値の変更時に保存し、高さを調整
    function handleTextChange() {
      clips[i] = ta.value;
      saveStorage(CLIP_KEY, clips);
      autoResize();
    }

    // 最適化されたイベント監視
    ta.addEventListener("input", handleTextChange);
    ta.addEventListener("paste", () => setTimeout(handleTextChange, 10));
    ta.addEventListener("cut", handleTextChange);
    ta.addEventListener("compositionend", handleTextChange);
    ta.addEventListener("focus", autoResize);
    ta.addEventListener("blur", autoResize);
    ta.addEventListener("change", handleTextChange);
    ta.addEventListener("keydown", (e) => {
      // エンターキーで改行した時も自動リサイズ
      if (e.key === "Enter") {
        setTimeout(autoResize, 10);
      }
    });

    // ドラッグ&ドロップ対応
    ta.addEventListener("drop", () => setTimeout(handleTextChange, 10));

    // 初期化時の高さ設定（少し遅延させて確実に実行）
    setTimeout(() => {
      autoResize();
    }, 50);

    // 正しい順序で要素を追加：左→真ん中→右
    li.appendChild(insertBtn); // 左：挿入ボタン
    li.appendChild(ta); // 真ん中：テキストエリア

    // 右側のアクションボタン群を作成
    const actionsContainer = document.createElement("div");
    actionsContainer.className = "clipboard-actions";

    // 右１：コピーボタン（重なった四角形アイコン）
    const copyBtn = document.createElement("button");
    copyBtn.className = "clipboard-copy";
    copyBtn.innerHTML = '<i class="bi bi-files"></i>';
    copyBtn.title = "コピー";
    copyBtn.addEventListener("click", async () => {
      const currentText = ta.value;

      if (currentText.trim() === "") {
        console.log("No text to copy");
        return;
      }

      try {
        await navigator.clipboard.writeText(currentText);
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

    // 右２：ドラッグハンドル（bi bi-grip-vertical）
    const dragHandle = document.createElement("div");
    dragHandle.className = "clipboard-drag-handle";
    dragHandle.innerHTML = '<i class="bi bi-grip-vertical grip-icon"></i>';
    dragHandle.title = "ドラッグして並び替え";
    dragHandle.draggable = true; // ハンドルのみドラッグ可能
    dragHandle.addEventListener("dragstart", (e) => {
      console.log("drag start handle index", li.dataset.index);
      handleClipDragStart.call(li, e);
      li.classList.add("dragging");
    });
    dragHandle.addEventListener("dragend", (e) => {
      console.log("drag end handle index", li.dataset.index);
      handleClipDragEnd.call(li, e);
      document.querySelectorAll(".clip-item").forEach((item) => {
        item.classList.remove(
          "dragging",
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active",
          "drag-invalid"
        );
      });
    });

    // 右３：アーカイブボタン（bi bi-archive-fill）
    const archiveBtn = document.createElement("button");
    archiveBtn.className = "clipboard-archive";
    archiveBtn.innerHTML = '<i class="bi bi-archive-fill"></i>';
    archiveBtn.title = "アーカイブへ移動";
    archiveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();

      // 現在のテキストエリアの値を取得
      const currentText = ta.value;

      // アニメーション付きでアーカイブ
      if (window.AppUtils && window.AppUtils.animateArchiveItem) {
        console.log("✅ [DEBUG] AppUtils.animateArchiveItem が利用可能");
        console.log("✅ [DEBUG] 対象要素:", li);
        console.log("✅ [DEBUG] 要素のクラス:", li.className);
        console.log("✅ [DEBUG] 要素のスタイル:", li.style);

        li.classList.add("archive-item");
        console.log("✅ [DEBUG] archive-itemクラスを追加:", li.className);

        await window.AppUtils.animateArchiveItem(li, async () => {
          console.log("✅ [DEBUG] アニメーション完了、データ更新開始");
          // アーカイブ処理
          const archivedClips = await loadStorage(CLIP_ARCH_KEY);
          archivedClips.push(currentText);
          await saveStorage(CLIP_ARCH_KEY, archivedClips);

          // アクティブなクリップから削除
          clips.splice(i, 1);
          await saveStorage(CLIP_KEY, clips);

          // グローバルに最新のclipsを設定
          window.clips = clips;

          // トースト通知
          if (window.AppUtils && window.AppUtils.showArchiveToast) {
            window.AppUtils.showArchiveToast();
          }

          // リスト再描画
          renderClipboardView();
        });
      } else {
        console.log("❌ [DEBUG] AppUtils.animateArchiveItem が利用できません");
        console.log("❌ [DEBUG] window.AppUtils:", window.AppUtils);
        console.log(
          "❌ [DEBUG] window.AppUtils?.animateArchiveItem:",
          window.AppUtils?.animateArchiveItem
        );
        // アニメーションなしでアーカイブ
        const archivedClips = await loadStorage(CLIP_ARCH_KEY);
        archivedClips.push(currentText);
        await saveStorage(CLIP_ARCH_KEY, archivedClips);
        clips.splice(i, 1);
        await saveStorage(CLIP_KEY, clips);
        window.clips = clips;
        if (window.AppUtils && window.AppUtils.showArchiveToast) {
          window.AppUtils.showArchiveToast();
        }
        renderClipboardView();
      }
    });

    // アクションボタン群を右側に追加
    actionsContainer.appendChild(copyBtn);
    actionsContainer.appendChild(dragHandle);
    actionsContainer.appendChild(archiveBtn);
    li.appendChild(actionsContainer);

    ul.appendChild(li);

    // 初期化時の高さ設定（改良版）
    setTimeout(() => {
      autoResize();
    }, 50); // DOM追加後に実行（少し長めの遅延で確実に実行）
  });

  // メイン画面のfooterを設定
  renderMainFooter();

  console.log("renderClipboardView: end");
}

// ───────────────────────────────────────
// Archive mode: swap sub-nav & footer
// ───────────────────────────────────────
function renderArchiveNav(type) {
  console.log("renderArchiveNav: start, type=", type);
  archiveType = type;

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("clipboard", {
      mode: "archive",
      archiveType: type,
    });
    window.PageStateManager.setActivePage("clipboard");
  }

  // swap card-nav buttons to Archive/MEMO ⇔ Archive/Clipboard

  // now render the archive list + footer
  renderArchiveList();
  renderArchiveFooter();

  // アーカイブ画面でもヘッダーのクリップボードアイコンのクリックイベントを設定
  setTimeout(() => {
    const clipboardBtn = document.getElementById("btn-clipboard");
    if (clipboardBtn) {
      console.log("アーカイブ画面: クリップボードヘッダーボタンを発見しました");
      // 既存のイベントリスナーを削除
      clipboardBtn.removeEventListener("click", handleClipboardHeaderClick);
      // 新しいイベントリスナーを追加
      clipboardBtn.addEventListener("click", handleClipboardHeaderClick);
      console.log(
        "アーカイブ画面: クリップボードヘッダーボタンにイベントリスナーを設定しました"
      );
    } else {
      console.error(
        "アーカイブ画面: クリップボードヘッダーボタンが見つかりません"
      );
    }
  }, 100);

  console.log("renderArchiveNav: end");
}

// Renders the actual archive list inside .memo-content
async function renderArchiveList() {
  console.log("renderArchiveList: start", archiveType);

  const content = document.querySelector(".memo-content");
  if (!content) {
    console.error(".memo-content要素が見つかりません");
    return;
  }

  content.classList.add("archive");
  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  /* 1) ストレージ読み込み */
  const rawItems = await loadStorage(CLIP_ARCH_KEY);

  // ★修正★ 空のアイテムは表示しないが、ストレージからは削除しない
  const listData = rawItems.filter((item) => !isEmptyClip(item));

  console.log("[ARCH] 空のクリップを除外して表示:", {
    totalItems: rawItems.length,
    displayItems: listData.length,
    hiddenEmptyItems: rawItems.length - listData.length,
  });

  console.log("[ARCH] アーカイブデータ:", {
    key: CLIP_ARCH_KEY,
    rawItems: rawItems.length,
    listData: listData.length,
    archiveType: archiveType,
  });

  /* 2) HTML 骨格（MEMO・PROMPTパターンに統一） */
  content.innerHTML = `
    <div class="archive-header">
      <h3 class="archive-title">アーカイブ</h3>
      <label class="select-all-label">
        <input type="checkbox" id="chk-select-all" /> 全て選択する
      </label>
    </div>
    <ul class="archive-list"></ul>`;
  const ul = content.querySelector(".archive-list");
  if (!ul) {
    console.error(".archive-list要素が見つかりません");
    return;
  }

  console.log("[ARCH] アーカイブリスト要素:", ul);

  /* 3) 行生成またはEmpty State */
  if (listData.length === 0) {
    // Empty State: アーカイブが空の場合
    ul.innerHTML = `
      <div class="clipboard-empty-state">
        <div class="clipboard-empty-state-content">
          <div class="clipboard-empty-state-icon">
            <i class="bi bi-journal-text"></i>
          </div>
          <h3 class="clipboard-empty-state-title">アーカイブされた<br>クリップボードはありません</h3>
          <p class="clipboard-empty-state-message">
            クリップボードをアーカイブすると、<br>ここに表示されます。
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
    // 通常のアーカイブアイテム表示
    listData.forEach((it, displayIdx) => {
      // ★修正★ 元の配列での実際のインデックスを取得
      const actualIdx = rawItems.findIndex((item) => item === it);

      const li = document.createElement("li");
      li.className = "archive-item";

      /* 左：チェック */
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "arch-check";
      cb.dataset.index = actualIdx; // 実際のインデックスを使用
      li.appendChild(cb);

      /* 中央：タイトル＋プレビューコンテナ */
      const contentDiv = document.createElement("div");
      contentDiv.className = "arch-content";

      // タイトル
      const titleSpan = document.createElement("span");
      titleSpan.className = "arch-title";
      titleSpan.textContent = it;
      contentDiv.appendChild(titleSpan);

      // CLIPBOARD固有：内容プレビュー
      if (it && it.length > 0) {
        const previewSpan = document.createElement("div");
        previewSpan.className = "clipboard-preview";
        // 内容の最初の100文字をプレビューとして表示
        const previewText = it.length > 100 ? it.substring(0, 100) + "..." : it;
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
        displayIndex: displayIdx,
        actualIndex: actualIdx,
        itemContent: it.substring(0, 50) + "...",
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

        console.log(
          "[ARCH] restore actualIdx:",
          actualIdx,
          "archiveType:",
          archiveType
        );

        // ボタンを一時的に無効化
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        try {
          console.log("[ARCH] 復元処理を開始します...");

          /* CLIP: アーカイブ → アクティブへ移動 */
          const act = await loadStorage(CLIP_KEY);
          const arch = await loadStorage(CLIP_ARCH_KEY);
          const restoredItem = arch.splice(actualIdx, 1)[0]; // 実際のインデックスを使用
          act.push(restoredItem);
          await saveStorage(CLIP_KEY, act);
          await saveStorage(CLIP_ARCH_KEY, arch);
          console.log(
            "[ARCH] クリップを復元しました:",
            restoredItem.substring(0, 50) + "..."
          );

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
  console.log("renderArchiveFooter: back button icon set to white via CSS");
  footer.style.display = "flex";

  // Footerボタンのホバー効果を設定
  setupFooterHoverEffects();

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
      const selectedChecks = document.querySelectorAll(".arch-check:checked");

      // 削除対象の数を確認
      let deleteCount = 0;
      let confirmMessage = "";

      if (selectedChecks.length === 0) {
        // 全削除の場合
        const rawItems = await loadStorage(CLIP_ARCH_KEY);
        deleteCount = rawItems.length;

        if (deleteCount === 0) {
          console.log("削除対象のアーカイブアイテムがありません");
          return;
        }

        confirmMessage = `アーカイブされた全てのクリップ（${deleteCount}件）を完全に削除しますか？`;
      } else {
        // 選択削除の場合
        deleteCount = selectedChecks.length;
        confirmMessage = `選択された${deleteCount}件のクリップを完全に削除しますか？`;
      }

      // 確認ダイアログを表示
      if (window.AppUtils && window.AppUtils.showSaveConfirmDialog) {
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
            // 削除処理を実行
            if (selectedChecks.length === 0) {
              // 何も選択されていない場合は全削除
              await saveStorage(CLIP_ARCH_KEY, []);
            } else {
              // 選択されたアイテムのみ削除
              const indicesToDelete = Array.from(selectedChecks).map((cb) =>
                parseInt(cb.dataset.index)
              );

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

            console.log(`[ARCHIVE] ${deleteCount}件のアイテムを削除しました`);
            renderArchiveList();
          },
          onCancel: () => {
            console.log("[ARCHIVE] 削除をキャンセルしました");
          },
        });
      } else {
        // AppUtilsが利用できない場合は標準のconfirmを使用
        if (confirm(`${confirmMessage}\n\nこの操作は取り消せません。`)) {
          // 削除処理を実行
          if (selectedChecks.length === 0) {
            // 何も選択されていない場合は全削除
            await saveStorage(CLIP_ARCH_KEY, []);
          } else {
            // 選択されたアイテムのみ削除
            const indicesToDelete = Array.from(selectedChecks).map((cb) =>
              parseInt(cb.dataset.index)
            );

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

          console.log(`[ARCHIVE] ${deleteCount}件のアイテムを削除しました`);
          renderArchiveList();
        } else {
          console.log("[ARCHIVE] 削除をキャンセルしました");
        }
      }
    });
  console.log("renderArchiveFooter: end");
}

// ───────────────────────────────────────
// アーカイブアニメーション機能（memo.jsから移植）

// ───────────────────────────────────────
// Initialization on load
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("CLIPBOARDページ DOMContentLoaded fired");

  // AppUtilsの読み込み状況を確認
  console.log("[CLIPBOARD] AppUtils check:", {
    AppUtils: !!window.AppUtils,
    animateRestoreItem: !!(
      window.AppUtils && window.AppUtils.animateRestoreItem
    ),
    showConfirmDialog: !!(window.AppUtils && window.AppUtils.showConfirmDialog),
  });

  // 現在のページがCLIPBOARDページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/clipboard/")) {
    console.log("現在のページはCLIPBOARDページではありません:", currentPage);
    return; // CLIPBOARDページでない場合は初期化をスキップ
  }

  // 起動時は常に一覧画面を表示（ページ状態の復元を無効化）
  console.log("CLIPBOARDページ: 起動時に一覧画面を表示");
  await renderClipboardView();

  // Add event listener to CLIPBOARD button
  const clipboardButton = document.getElementById("btn-clipboard");
  if (clipboardButton) {
    clipboardButton.addEventListener("click", () => {
      console.log("CLIPBOARD page button clicked");
      // ヘッダーをクリックした時は常に一覧画面を表示
      renderClipboardView();
    });
  }

  // グローバルに最新のclipsを設定
  window.clips = clips;
});

// グローバルに公開
window.renderClipboardView = renderClipboardView;

async function renderClipboardEdit(id) {
  console.log("renderClipboardEdit: start, id=", id);
  clips = await loadStorage(CLIP_KEY);

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("clipboard", {
      mode: "edit",
      clipIndex: id,
    });
    window.PageStateManager.setActivePage("clipboard");
  }

  // グローバルに最新のclipsを設定
  window.clips = clips;
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

/*━━━━━━━━━━ 空のクリップ判定機能 ━━━━━━━━━━*/
function isEmptyClip(clip) {
  return !clip || clip.trim() === "";
}

// ───────────────────────────────────────
// エクスポート機能
// ───────────────────────────────────────
async function exportAllClips() {
  try {
    // アクティブなクリップ（アーカイブされていないクリップ）のみをフィルタリング
    const activeClips = clips
      ? clips.filter((clip, index) => {
          // アーカイブされたクリップを除外（アーカイブ機能がある場合）
          // 現在のCLIPBOARDページではアーカイブ機能が実装されているか確認が必要
          return true; // 一旦全てのクリップを対象とする
        })
      : [];

    // アクティブなクリップが0件の場合は処理を停止
    if (activeClips.length === 0) {
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

    // エクスポート用のデータ構造を作成（アクティブなクリップのみ）
    const exportData = {
      // 特別なID（この拡張機能からのエクスポートであることを示す）
      extensionId: "sideeffect-v1.0",
      extensionName: "SideEffect",
      extensionVersion: "1.0.0",
      // 既存のデータ
      version: "1.0",
      exportDate: now.toISOString(),
      clipCount: activeClips.length,
      totalClipCount: clips ? clips.length : 0,
      clips: activeClips,
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
    const randomHash = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

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
  console.log("[CLIPBOARD] showExportSuccessMessage呼び出し:", {
    fileName: fileName,
    AppUtils: !!window.AppUtils,
  });
}

// エクスポートエラーメッセージ
function showExportErrorMessage() {
  console.log("[CLIPBOARD] showExportErrorMessage呼び出し:", {
    AppUtils: !!window.AppUtils,
  });
}

// エクスポートボタンとアーカイブボタンの状態を更新
function updateExportButtonState() {
  const exportBtn = document.querySelector(".encrypt-btn");
  const archiveBtn = document.querySelector("#btn-archive-toggle");

  // アクティブなクリップ（アーカイブされていないクリップ）のみをカウント
  const activeClips = clips
    ? clips.filter((clip, index) => {
        // アーカイブされたクリップを除外（アーカイブ機能がある場合）
        return true; // 一旦全てのクリップを対象とする
      })
    : [];
  const hasActiveClips = activeClips.length > 0;

  // エクスポートボタンの状態更新
  if (exportBtn) {
    exportBtn.disabled = !hasActiveClips;

    // ホバーテキストも更新
    const exportText = exportBtn.querySelector(".nav-text");
    if (exportText) {
      exportText.textContent = hasActiveClips
        ? "バックアップ"
        : "クリップはありません";
    }
  }

  // アーカイブボタンの状態更新（MEMOページと同様に常に有効）
  if (archiveBtn) {
    archiveBtn.disabled = false; // 常に有効（MEMOページと同様）

    // ホバーテキストも更新
    const archiveText = archiveBtn.querySelector(".nav-text");
    if (archiveText) {
      archiveText.textContent = "アーカイブへ移動";
    }
  }

  console.log("ボタン状態更新:", {
    hasActiveClips,
    exportDisabled: !hasActiveClips,
    totalClipCount: clips ? clips.length : 0,
    activeClipCount: activeClips.length,
  });
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
      console.log("[CLIPBOARD FOOTER] hover start:", btn.className, {
        btnWidth: btn.offsetWidth,
        textWidth,
      });
    };

    btn._footerHoverLeave = () => {
      btn.classList.remove("show-text");
      btn.style.removeProperty("--nav-text-max");
      console.log("[CLIPBOARD FOOTER] hover end:", btn.className, {
        btnWidth: btn.offsetWidth,
      });
    };

    btn.addEventListener("mouseenter", btn._footerHoverEnter);
    btn.addEventListener("mouseleave", btn._footerHoverLeave);
  });
}

// ───────────────────────────────────────
// 初期化処理
// ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  console.log("CLIPBOARDページ: DOMContentLoaded");
  // 新しいスタイル適用を確認
  console.log(
    "style patch: drop indicator uses ::after; drag via grip handle only"
  );
  console.log("style patch: insert button centered within green accent");

  // ヘッダーのクリップボードアイコンのクリックイベントを初期設定
  const clipboardBtn = document.getElementById("btn-clipboard");
  if (clipboardBtn) {
    console.log("初期化: クリップボードヘッダーボタンを発見しました");
    clipboardBtn.addEventListener("click", handleClipboardHeaderClick);
    console.log(
      "初期化: クリップボードヘッダーボタンにイベントリスナーを設定しました"
    );
  } else {
    console.error("初期化: クリップボードヘッダーボタンが見つかりません");
  }

  // アーカイブトグルボタンの初期設定
  const archiveToggleBtn = document.getElementById("btn-archive-toggle");
  if (archiveToggleBtn) {
    console.log("初期化: アーカイブトグルボタンを発見しました");
    // デバッグ用: サイズとスタイルをログ出力
    const archStyle = window.getComputedStyle(archiveToggleBtn);
    console.log("archiveToggleBtn center check", {
      width: archStyle.width,
      height: archStyle.height,
      padding: archStyle.padding,
      lineHeight: archStyle.lineHeight,
    });
    // アイコンの位置も確認
    const icon = archiveToggleBtn.querySelector("i");
    if (icon) {
      const iconStyle = window.getComputedStyle(icon);
      console.log("archive icon style", {
        width: iconStyle.width,
        height: iconStyle.height,
        marginLeft: iconStyle.marginLeft,
      });
    }
  } else {
    console.error("初期化: アーカイブトグルボタンが見つかりません");
  }

  // .memo-content要素の確認
  const memoContent = document.querySelector(".memo-content");
  if (memoContent) {
    console.log("初期化: .memo-content要素を発見しました");
  } else {
    console.error("初期化: .memo-content要素が見つかりません");
  }

  // 初期表示を実行
  renderClipboardView();
});

// ───────────────────────────────────────
// デバッグ・テスト用関数
// ───────────────────────────────────────
function testArchiveAnimation() {
  console.log("=== アーカイブアニメーションテスト ===");

  // 1. AppUtils確認
  console.log("1. AppUtils確認:");
  console.log("  - AppUtils存在:", !!window.AppUtils);
  console.log(
    "  - animateArchiveItem存在:",
    !!(window.AppUtils && window.AppUtils.animateArchiveItem)
  );

  // 2. テスト要素作成
  const testElement = document.createElement("div");
  testElement.textContent = "テスト要素";
  testElement.style.padding = "10px";
  testElement.style.background = "#f0f0f0";
  testElement.style.margin = "10px";
  testElement.style.border = "1px solid #ccc";
  testElement.classList.add("archive-item");
  document.body.appendChild(testElement);

  console.log("2. テスト要素作成:", testElement);
  console.log("  - クラス:", testElement.className);

  // 3. アニメーションテスト
  if (window.AppUtils && window.AppUtils.animateArchiveItem) {
    console.log("3. アニメーションテスト開始");
    window.AppUtils.animateArchiveItem(testElement, async () => {
      console.log("4. アニメーション完了");
      testElement.remove();
      console.log("5. テスト要素削除完了");
    });
  } else {
    console.log("3. AppUtilsが利用できないため、テスト要素を削除");
    testElement.remove();
  }
}

// ブラウザコンソールで実行: testArchiveAnimation()

// メイン画面用のfooter設定関数
function renderMainFooter() {
  console.log("renderMainFooter: start");
  const footer = document.querySelector(".memo-footer");
  if (!footer) {
    console.error(".memo-footer要素が見つかりません");
    return;
  }

  // アーカイブ状態をクリア
  footer.classList.remove("archive");

  // メイン画面用のfooterを設定
  footer.innerHTML = `
    <button class="nav-btn archive-toggle" id="btn-archive-toggle">
      <i class="bi bi-archive"></i>
      <span class="nav-text">アーカイブ</span>
    </button>
    <button class="nav-btn encrypt-btn">
      <i class="bi bi-download"></i>
      <span class="nav-text">エクスポート</span>
    </button>
  `;

  footer.style.display = "flex";

  // アーカイブボタンのイベントリスナー
  const archiveToggleBtn = footer.querySelector("#btn-archive-toggle");
  if (archiveToggleBtn) {
    archiveToggleBtn.addEventListener("click", () => renderArchiveNav("clip"));
    console.log(
      "メイン画面: アーカイブトグルボタンにイベントリスナーを設定しました"
    );
  }

  // エクスポートボタンのイベントリスナー
  const exportBtn = footer.querySelector(".encrypt-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportAllClips);
    console.log(
      "メイン画面: エクスポートボタンにイベントリスナーを設定しました"
    );
  }

  // ボタンの状態を更新
  updateExportButtonState();

  // Footerボタンのホバー効果を設定
  setupFooterHoverEffects();

  console.log("renderMainFooter: end");
}
