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
  this.classList.add("drag-over");
}
function handleClipDragLeave() {
  this.classList.remove("drag-over");
}
async function handleClipDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;

  console.log(`CLIPBOARD drop from ${dragClipIndex} to ${dropIndex}`);
  if (dragClipIndex === null || dragClipIndex === dropIndex) return;

  // reorder in array
  const [moved] = clips.splice(dragClipIndex, 1);
  clips.splice(dropIndex, 0, moved);
  await saveStorage(CLIP_KEY, clips);

  // ドラッグ＆ドロップ成功メッセージを表示
  showDragDropSuccessMessage(dragClipIndex + 1, dropIndex + 1);

  renderClipboardView();
}
function handleClipDragEnd() {
  document
    .querySelectorAll(".clipboard-item")
    .forEach((el) => el.classList.remove("drag-over"));
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

    // 挿入ボタン（Arrow-left-circle）- 左側
    const copy = document.createElement("button");
    copy.className = "clipboard-copy";
    copy.innerHTML = '<i class="bi bi-arrow-left-circle"></i>';
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
    li.appendChild(copy); // 左：コピーボタン
    li.appendChild(ta); // 真ん中：テキストエリア

    // アーカイブアイコン（MEMOページと同様のスタイル）
    const arch = document.createElement("i");
    arch.className = "bi bi-archive-fill actions";
    arch.title = "アーカイブ";
    arch.addEventListener("click", async (e) => {
      e.stopPropagation();

      // ★修正★ 現在のテキストエリアの値を取得
      const currentText = ta.value;

      // ★修正★ 空のクリップでもアーカイブを実行（アーカイブ画面で非表示にする）
      console.log(
        "[CLIPBOARD] クリップをアーカイブします:",
        currentText.substring(0, 50) + "..."
      );

      // アニメーション付きでアーカイブ
      if (window.AppUtils && window.AppUtils.animateArchiveItem) {
        await window.AppUtils.animateArchiveItem(li, async () => {
          // アーカイブ処理
          const archivedClips = await loadStorage(CLIP_ARCH_KEY);
          archivedClips.push(currentText);
          await saveStorage(CLIP_ARCH_KEY, archivedClips);

          // アクティブなクリップから削除
          clips.splice(i, 1);
          await saveStorage(CLIP_KEY, clips);

          // グローバルに最新のclipsを設定
          window.clips = clips;
        });
      } else {
        // AppUtilsが利用できない場合の代替処理
        console.log(
          "[CLIPBOARD] AppUtils.animateArchiveItemが利用できません。代替処理を実行します。"
        );

        // シンプルなアニメーション
        li.style.transition = "all 0.5s ease-in-out";
        li.style.transform = "translateY(-20px) scale(0.95)";
        li.style.opacity = "0";

        await new Promise((resolve) => {
          setTimeout(async () => {
            // アーカイブ処理
            const archivedClips = await loadStorage(CLIP_ARCH_KEY);
            archivedClips.push(currentText);
            await saveStorage(CLIP_ARCH_KEY, archivedClips);

            // アクティブなクリップから削除
            clips.splice(i, 1);
            await saveStorage(CLIP_KEY, clips);

            // グローバルに最新のclipsを設定
            window.clips = clips;

            console.log("[CLIPBOARD] 代替アーカイブアニメーション完了");
            resolve();
          }, 500);
        });
      }

      // ★修正★ アーカイブ処理後は常に画面を再描画
      renderClipboardView();
    });
    li.appendChild(arch);

    ul.appendChild(li);

    // 初期化時の高さ設定（改良版）
    setTimeout(() => {
      autoResize();
    }, 50); // DOM追加後に実行（少し長めの遅延で確実に実行）
  });

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
      if (window.AppUtils && window.AppUtils.showConfirmDialog) {
        window.AppUtils.showConfirmDialog({
          title: "削除の確認",
          message: `${confirmMessage}<br><span style="color: #dc3545; font-weight: bold;">この操作は取り消せません。</span>`,
          onConfirm: async () => {
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
    showToast: !!(window.AppUtils && window.AppUtils.showToast),
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
  console.log("[DND] 成功メッセージを表示:", { fromPosition, toPosition });

  // AppUtilsのトースト通知が利用可能な場合
  if (window.AppUtils && window.AppUtils.showToast) {
    const message = `クリップ ${fromPosition} を ${toPosition} 番目に移動しました`;
    window.AppUtils.showToast(message, "success");
  } else {
    // AppUtilsが利用できない場合の代替処理
    showFallbackDragDropMessage(fromPosition, toPosition);
  }
}

function showFallbackDragDropMessage(fromPosition, toPosition) {
  // 既存のトーストがあれば削除
  const existingToast = document.querySelector(".drag-drop-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // 新しいトーストを作成
  const toast = document.createElement("div");
  toast.className = "drag-drop-toast";
  toast.innerHTML = `
    <i class="bi bi-check-circle-fill"></i>
    クリップ ${fromPosition} を ${toPosition} 番目に移動しました
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

/*━━━━━━━━━━ 空のクリップ判定機能 ━━━━━━━━━━*/
function isEmptyClip(clip) {
  return !clip || clip.trim() === "";
}

// ───────────────────────────────────────
// エクスポート機能
// ───────────────────────────────────────
async function exportAllClips() {
  try {
    console.log("CLIPBOARDエクスポート機能を開始します");

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
      console.log("アクティブなクリップが0件のためエクスポートを中止します");
      return;
    }

    // 現在時刻を取得してファイル名を生成
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const fileName = `${hours}${minutes}${seconds}.json`;

    console.log("ファイル名:", fileName);
    console.log("アクティブなクリップ数:", activeClips.length);

    // エクスポート用のデータ構造を作成（アクティブなクリップのみ）
    const exportData = {
      version: "1.0",
      exportDate: now.toISOString(),
      clipCount: activeClips.length,
      totalClipCount: clips ? clips.length : 0,
      clips: activeClips,
    };

    console.log("エクスポートデータ:", exportData);

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

    console.log("エクスポート完了:", fileName);

    // 成功メッセージを表示
    showExportSuccessMessage(fileName);
  } catch (error) {
    console.error("エクスポートエラー:", error);
    showExportErrorMessage();
  }
}

// エクスポート成功メッセージ
function showExportSuccessMessage(fileName) {
  const message = document.createElement("div");
  message.className = "export-message success";
  message.innerHTML = `
    <i class="bi bi-check-circle"></i>
    <span>エクスポート完了: ${fileName}</span>
  `;
  document.body.appendChild(message);

  setTimeout(() => {
    message.classList.add("show");
  }, 100);

  setTimeout(() => {
    message.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(message);
    }, 300);
  }, 3000);
}

// エクスポートエラーメッセージ
function showExportErrorMessage() {
  const message = document.createElement("div");
  message.className = "export-message error";
  message.innerHTML = `
    <i class="bi bi-exclamation-triangle"></i>
    <span>エクスポートに失敗しました</span>
  `;
  document.body.appendChild(message);

  setTimeout(() => {
    message.classList.add("show");
  }, 100);

  setTimeout(() => {
    message.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(message);
    }, 300);
  }, 3000);
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
    exportBtn.title = hasActiveClips ? "バックアップ" : "クリップはありません";

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
    archiveBtn.title = "アーカイブ";

    // ホバーテキストも更新
    const archiveText = archiveBtn.querySelector(".nav-text");
    if (archiveText) {
      archiveText.textContent = "アーカイブ";
    }
  }

  console.log("ボタン状態更新:", {
    hasActiveClips,
    exportDisabled: !hasActiveClips,
    totalClipCount: clips ? clips.length : 0,
    activeClipCount: activeClips.length,
  });
}

// ───────────────────────────────────────
// 初期化処理
// ───────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  console.log("CLIPBOARDページ: DOMContentLoaded");

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
});
