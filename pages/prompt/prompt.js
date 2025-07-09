// popup/prompt.js  （2025-07-XX fix: 二重入力完全解消版）
/****************************************************************************************
 * PROMPT 画面  ─ 一覧・編集・実行ビュー
 * --------------------------------------------------------------------------------------
 * ▸ 重複していた sendToFocused / click ハンドラを完全に統合
 * ▸ COPY／一括入力ボタンに 120 ms デバウンスを追加
 * ▸ コメントで変更点を明示
 ****************************************************************************************/

/* ━━━━━━━━━ 0. 共通ユーティリティ ━━━━━━━━━ */
const PROMPT_KEY = "prompts";
const RUN_KEY = "promptRuns";
const $ = (sel, el = document) => el.querySelector(sel);
const load = (k) =>
  new Promise((r) => chrome.storage.local.get([k], (v) => r(v[k] || [])));
const save = (k, v) =>
  new Promise((r) => chrome.storage.local.set({ [k]: v }, r));
const ce = (tag, cls = "", html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.innerHTML = html;
  return e;
};
const draftKey = (promptId, fieldIdx) => `draft_${promptId}_${fieldIdx}`;

/* ───────────────────────────────────────
  textarea自動リサイズ
  編集画面だけでなく他の箇所でも利用できるよう
  ここで定義してwindowに公開しておく
─────────────────────────────────────── */
function autoResize(textarea) {
  // 高さをリセットしてscrollHeightを取得
  textarea.style.height = "auto";

  const minHeight = 80;
  const contentHeight = textarea.scrollHeight;
  const newHeight = Math.max(minHeight, contentHeight);

  textarea.style.height = `${newHeight}px`;

  console.log(
    `[AUTO RESIZE] height=${newHeight} content=${contentHeight} min=${minHeight}`
  );
}
window.autoResize = autoResize;

/* ━━━━━━━━━ ヘルパー関数 ━━━━━━━━━ */
const getCurrentPromptIndex = () => currentPromptIndex;

// 画面遷移時の処理：履歴保存のみ、ドラフトは保持
async function handleScreenTransition(
  obj,
  extras,
  saveContext,
  shouldSaveHistory = false
) {
  console.log(
    `[SCREEN TRANSITION] ${saveContext} - 処理開始 (履歴保存: ${
      shouldSaveHistory ? "オン" : "オフ"
    })`
  );

  const hasExtraContent = extras.some((extra) => extra.trim() !== "");
  console.log(`[SCREEN TRANSITION] 追加入力内容の有無: ${hasExtraContent}`);

  // 履歴保存（トグルボタンがオンで内容がある場合のみ）
  if (shouldSaveHistory && hasExtraContent) {
    // 有効なフィールドのみでペイロード作成
    const payload = obj.fields
      .map((f, i) => (f.on ? `${f.text}\n${extras[i]}`.trim() : ""))
      .filter(Boolean)
      .join("\n\n");

    if (payload.trim()) {
      runs.push({
        id: Date.now(),
        when: new Date().toISOString(),
        title: obj.title,
        text: payload,
        count: obj.fields.filter((f) => f.on).length,
      });
      await save(RUN_KEY, runs);
      console.log(
        `[SCREEN TRANSITION] ${saveContext}で追加入力内容を履歴に保存しました`
      );
    }
  } else if (shouldSaveHistory) {
    console.log(
      `[SCREEN TRANSITION] ${saveContext} - 履歴保存はオンですが追加入力がないためスキップ`
    );
  } else {
    console.log(
      `[SCREEN TRANSITION] ${saveContext} - 履歴保存はオフのためスキップ`
    );
  }

  // ドラフト処理：トグルボタンがオフの時のみ削除
  if (!shouldSaveHistory) {
    obj.fields.forEach((_, i) =>
      chrome.storage.local.remove(draftKey(obj.id, i))
    );
    console.log(
      `[SCREEN TRANSITION] ${saveContext} - トグルオフのためドラフトを削除しました`
    );
  } else {
    console.log(
      `[SCREEN TRANSITION] ${saveContext} - トグルオンのためドラフトを保持します`
    );
  }
}

/* ━━━━━━━━━ 1. グローバル状態 ━━━━━━━━━ */
let prompts = []; // カード一覧
let runs = []; // 実行履歴
let dragPromptIndex = null; // ドラッグ元インデックス
let dragPromptStarred = null; // ドラッグ元の星状態を記録
let currentPromptIndex = -1; // 現在の実行画面のプロンプトインデックス
let editingOriginalPrompt = null; // 編集開始時点のプロンプトスナップショット
// ナビゲーション側から参照できるようにグローバルにも保持
window.editingOriginalPrompt = editingOriginalPrompt;

// ───────────────────────────────────────
// Drag & Drop handlers for prompt list
// ───────────────────────────────────────
function handlePromptDragStart(e) {
  console.log("[PROMPT DEBUG] dragstart イベント発火");
  console.log("[PROMPT DEBUG] dragstart 詳細:", {
    target: e.target,
    currentTarget: e.currentTarget,
    dataset: e.currentTarget.dataset,
    draggable: e.currentTarget.draggable,
  });

  dragPromptIndex = +this.dataset.index;
  dragPromptStarred = prompts[dragPromptIndex]?.star || false;
  console.log(
    "[PRM] drag start:",
    dragPromptIndex,
    "starred:",
    dragPromptStarred,
    "element:",
    this,
    "dataset.index:",
    this.dataset.index
  );
  e.dataTransfer.effectAllowed = "move";
  this.classList.add("dragging");
  console.log("[PROMPT DEBUG] dragging クラス追加完了");
}
function handlePromptDragOver(e) {
  console.log("[PROMPT DEBUG] dragover イベント発火");
  e.preventDefault();

  // ドロップ先の星状態をチェック
  const dropIndex = +this.dataset.index;
  const dropTargetStarred = prompts[dropIndex]?.star || false;

  console.log("[PROMPT DEBUG] dragover 詳細:", {
    dropIndex: dropIndex,
    dropTargetStarred: dropTargetStarred,
    dragPromptStarred: dragPromptStarred,
    element: this,
  });

  // 異なるカテゴリ間のドロップを禁止
  if (dragPromptStarred !== dropTargetStarred) {
    this.classList.add("drag-invalid");
    this.classList.remove(
      "drop-indicator",
      "drop-above",
      "drop-below",
      "active"
    );
    console.log("[PRM] drag invalid: different categories");
    return;
  }

  // 他の要素のドロップインジケーターをクリア
  document.querySelectorAll(".prompt-item.drop-indicator").forEach((el) => {
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
    console.log("[PRM DND] ドロップ位置: 上に挿入");
  } else {
    // マウスが要素の下半分にある場合、要素の下に挿入
    this.classList.add("drop-below");
    console.log("[PRM DND] ドロップ位置: 下に挿入");
  }
}
function handlePromptDragLeave() {
  this.classList.remove(
    "drop-indicator",
    "drop-above",
    "drop-below",
    "active",
    "drag-invalid"
  );
}
async function handlePromptDrop(e) {
  e.stopPropagation();
  const dropIndex = +this.dataset.index;

  // カテゴリ間のドロップを再度チェック
  const dropTargetStarred = prompts[dropIndex]?.star || false;

  if (dragPromptStarred !== dropTargetStarred) {
    console.log("[PRM] drop rejected: different categories");
    return;
  }

  console.log(`[PRM] drop from ${dragPromptIndex} to ${dropIndex}`);
  if (dragPromptIndex === null || dragPromptIndex === dropIndex) return;

  // ドロップ位置を判定
  const rect = this.getBoundingClientRect();
  const mouseY = e.clientY;
  const itemCenter = rect.top + rect.height / 2;
  const dropAbove = mouseY < itemCenter;

  let actualToIndex = dropIndex;

  const [moved] = prompts.splice(dragPromptIndex, 1);

  if (dropAbove) {
    // 要素の上に挿入
    prompts.splice(dropIndex, 0, moved);
    console.log("[PRM DND] 要素の上に挿入:", dragPromptIndex, "→", dropIndex);
  } else {
    // 要素の下に挿入
    actualToIndex = dropIndex + 1;
    prompts.splice(actualToIndex, 0, moved);
    console.log(
      "[PRM DND] 要素の下に挿入:",
      dragPromptIndex,
      "→",
      actualToIndex
    );
  }

  console.log("[PROMPT D&D] 保存前のprompts配列:", prompts);
  await save(PROMPT_KEY, prompts);
  console.log("[PROMPT D&D] 保存完了");

  // グローバルに最新のpromptsを設定（確実に更新）
  window.prompts = [...prompts]; // 配列のコピーを作成して確実に更新
  console.log("[PROMPT D&D] window.promptsを更新:", window.prompts);

  // ドラッグ＆ドロップ成功メッセージを表示
  console.log("[PROMPT D&D] showDragDropSuccessMessage呼び出し前:", {
    dragPromptIndex: dragPromptIndex,
    actualToIndex: actualToIndex,
    AppUtils: !!window.AppUtils,
  });
  showDragDropSuccessMessage(dragPromptIndex + 1, actualToIndex + 1);

  // 一覧画面を即座に再表示（MEMO・CLIPBOARDと同様）
  console.log("[PROMPT D&D] renderList()呼び出し前");
  await renderList();
  console.log("[PROMPT D&D] renderList()完了");

  // ドラッグ＆ドロップ後の再初期化処理（MEMO・CLIPBOARDと同様）
  console.log("[PROMPT D&D] 再初期化処理開始");

  // プロンプトデータを再読み込み
  prompts = await load(PROMPT_KEY);
  window.prompts = [...prompts]; // 配列のコピーを作成して確実に更新
  console.log("[PROMPT D&D] データ再読み込み完了:", prompts);

  // 一覧画面を再表示
  await renderList();
  console.log("[PROMPT D&D] 再初期化処理完了");
}
function handlePromptDragEnd() {
  document
    .querySelectorAll(".prompt-item")
    .forEach((el) =>
      el.classList.remove(
        "drop-indicator",
        "drop-above",
        "drop-below",
        "active",
        "dragging",
        "drag-invalid"
      )
    );
  dragPromptIndex = null;
  dragPromptStarred = null;
}

/* ━━━━━━━━━ 2. 初期化 ━━━━━━━━━ */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("PROMPTページ DOMContentLoaded fired");

  // AppUtilsの読み込み状況を確認
  console.log("[PROMPT] AppUtils check:", {
    AppUtils: !!window.AppUtils,
    animateRestoreItem: !!(
      window.AppUtils && window.AppUtils.animateRestoreItem
    ),
    animateArchiveItem: !!(
      window.AppUtils && window.AppUtils.animateArchiveItem
    ),
  });

  // 現在のページがPROMPTページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/prompt/")) {
    console.log("現在のページはPROMPTページではありません:", currentPage);
    return; // PROMPTページでない場合は初期化をスキップ
  }

  // プロンプトデータを読み込み
  prompts = await load(PROMPT_KEY);

  // グローバルに最新のpromptsを設定（common.jsで使用される）
  window.prompts = [...prompts]; // 配列のコピーを作成して確実に更新
  console.log("[PROMPT] window.promptsを設定しました:", window.prompts);

  // 起動時は常に一覧画面を表示（ページ状態の復元を無効化）
  console.log("PROMPTページ: 起動時に一覧画面を表示");
  await renderList();

  // ヘッダーボタンのクリック時の変更検知は common.js で統一して処理されるため、
  // ここでは重複するイベントリスナーの追加は行わない

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  // ヘッダーボタンのクリック時の変更検知は common.js で統一して処理されるため、
  // ここでは重複するイベントリスナーの追加は行わない
});

/* ══════════════════════════════════════════════════════
  3. 一覧ビュー   renderList()
══════════════════════════════════════════════════════ */
async function renderList() {
  console.log("[renderList] start");

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("prompt", {
      mode: "list",
    });
    window.PageStateManager.setActivePage("prompt");
  }

  console.log("[renderList] データ読み込み前のprompts:", prompts);
  prompts = await load(PROMPT_KEY);
  console.log("[renderList] データ読み込み後のprompts:", prompts);

  // グローバルに最新のpromptsを設定（確実に更新）
  window.prompts = [...prompts]; // 配列のコピーを作成して確実に更新
  console.log("[renderList] window.promptsを更新:", window.prompts);

  // 既存のアーカイブデータから空のアイテムをクリーンアップ
  const hasEmptyItems = prompts.some((p) => p.archived && isEmptyPrompt(p));
  if (hasEmptyItems) {
    console.log("[ARCH] 空のアーカイブプロンプトをクリーンアップ中...");
    const cleanedPrompts = prompts.filter(
      (p) => !(p.archived && isEmptyPrompt(p))
    );
    await save(PROMPT_KEY, cleanedPrompts);
    prompts = cleanedPrompts;
    console.log("[ARCH] 空のアーカイブプロンプトのクリーンアップ完了");
  }

  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body; // HTMLの直接の親要素を取得

  // 実行モードで付与されたクラスが残っている場合は除去する
  body.classList.remove("run-mode");

  // 実行画面から戻る場合の自動保存処理
  const runBox = body.querySelector(".prompt-run-box");
  if (runBox) {
    const histSwitch = runBox.querySelector("#hist-sw");
    const histToggleChecked = histSwitch && histSwitch.checked;
    console.log(
      `[PROMPTナビ] 実行画面から遷移 - トグルボタンの状態: ${
        histToggleChecked ? "オン" : "オフ"
      }`
    );

    const currentIndex = getCurrentPromptIndex();
    if (currentIndex !== -1) {
      const obj = prompts[currentIndex];
      const extras = [...runBox.querySelectorAll(".extra")].map((t) => t.value);
      console.log(`[PROMPTナビ] 追加入力内容:`, extras);
      await handleScreenTransition(
        obj,
        extras,
        "PROMPTナビクリック時",
        histToggleChecked
      );
    }
  }

  // 編集画面や実行画面で追加されたヘッダーを削除
  root.querySelector(".form-header")?.remove();

  footer.innerHTML = `
    <button
      id="btn-archive-toggle"
      class="nav-btn archive-toggle"
      title="アーカイブへ移動"
    >
      <i class="bi bi-archive"></i>
      <span class="nav-text">アーカイブ</span>
    </button>
    <button class="nav-btn encrypt-btn">
      <i class="bi bi-download"></i>
      <span class="nav-text">バックアップ</span>
    </button>`;

  // フッターボタンのイベントリスナーを設定
  const archiveToggleBtn = footer.querySelector("#btn-archive-toggle");
  if (archiveToggleBtn) {
    archiveToggleBtn.addEventListener("click", () => {
      console.log("アーカイブボタンがクリックされました");
      renderArchiveNav("prompt");
    });
  }

  const exportBtn = footer.querySelector(".encrypt-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportAllPrompts);
  }

  // ボタンの状態を更新
  updateExportButtonState();

  // アニメーション処理（MEMOページと同じ順序）
  body.classList.remove("edit-mode", "run-mode");
  body.classList.remove("animate");
  void body.offsetWidth;
  body.classList.add("animate");

  body.innerHTML = `
    <button class="btn-add-prompt w-100">
      <i class="bi bi-plus-lg"></i> 新しいプロンプトを追加
    </button>
    <ul class="prompt-list"></ul>`;

  // HTMLが生成された直後にイベントリスナーを設定
  const addPromptBtn = body.querySelector(".btn-add-prompt");
  console.log("新しいプロンプト追加ボタンの要素:", addPromptBtn);
  if (addPromptBtn) {
    addPromptBtn.addEventListener("click", () => {
      console.log("新しいプロンプト追加ボタンがクリックされました");
      // renderEdit()を引数なしで呼び出すと新規作成モードになる
      renderEdit();
    });
  } else {
    console.error("新しいプロンプト追加ボタンが見つかりません");
  }

  body.classList.remove("show");
  void body.offsetWidth;
  body.classList.add("show");

  const list = $(".prompt-list", body);

  /* カード生成 */
  // Empty State: プロンプトが何もない場合
  if (prompts.length === 0) {
    list.innerHTML = `
      <div class="prompt-empty-state">
        <div class="prompt-empty-state-content">
          <div class="prompt-empty-state-icon">
            <i class="bi bi-terminal"></i>
          </div>
          <h3 class="prompt-empty-state-title">プロンプトがありません</h3>
          <p class="prompt-empty-state-message">
            最初のプロンプトを作成してみましょう。
          </p>
          <div class="prompt-empty-state-action">
            <button class="btn-add-first-prompt">
              <i class="bi bi-plus-lg"></i> 最初のプロンプトを作成
            </button>
          </div>
        </div>
      </div>
    `;

    // 最初のプロンプト作成ボタンのイベント
    const firstPromptBtn = list.querySelector(".btn-add-first-prompt");
    console.log("最初のプロンプトを作成ボタンの要素:", firstPromptBtn);
    if (firstPromptBtn) {
      firstPromptBtn.addEventListener("click", () => {
        console.log("最初のプロンプトを作成ボタンがクリックされました");
        renderEdit();
      });
    } else {
      console.error("最初のプロンプトを作成ボタンが見つかりません");
    }

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = list.querySelector(".prompt-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  } else {
    // アクティブなプロンプトのみ表示（アーカイブされていないもの）
    const activePrompts = prompts.filter((p) => !p.archived);

    // Empty State: アクティブなプロンプトが何もない場合
    if (activePrompts.length === 0) {
      const hasArchived = prompts.some((p) => p.archived);
      list.innerHTML = `
        <div class="prompt-empty-state">
          <div class="prompt-empty-state-content">
            <div class="prompt-empty-state-icon">
              <i class="bi bi-terminal"></i>
            </div>
            <h3 class="prompt-empty-state-title">プロンプトがありません</h3>
            <p class="prompt-empty-state-message">
              最初のプロンプトを作成してみましょう。
            </p>
            <div class="prompt-empty-state-action">
              <button class="btn-add-first-prompt">
                <i class="bi bi-plus-lg"></i> 最初のプロンプトを作成
              </button>
            </div>
          </div>
        </div>
      `;

      // 新しいプロンプト作成ボタンのイベント
      const firstPromptBtn = list.querySelector(".btn-add-first-prompt");
      if (firstPromptBtn) {
        firstPromptBtn.addEventListener("click", () => {
          console.log("最初のプロンプトを作成ボタンがクリックされました");
          renderEdit();
        });
      }

      // Empty Stateのフェードインアニメーション
      setTimeout(() => {
        const emptyContent = list.querySelector(".prompt-empty-state-content");
        if (emptyContent) {
          emptyContent.classList.add("show");
        }
      }, 100);

      return; // ここで処理を終了
    }

    // 通常のプロンプト一覧表示
    console.log("[renderList] アクティブなプロンプト数:", activePrompts.length);
    activePrompts.forEach((p, i) => {
      // 元の配列でのインデックスを取得
      const originalIndex = prompts.findIndex((prompt) => prompt.id === p.id);

      const li = document.createElement("li");
      li.className = "prompt-item";
      li.draggable = true;
      li.dataset.index = originalIndex; // 元の配列でのインデックスを設定

      console.log("[PROMPT DEBUG] プロンプトアイテム作成:", {
        promptId: p.id,
        promptTitle: p.title,
        originalIndex: originalIndex,
        li: li,
        draggable: li.draggable,
        dataset: li.dataset,
      });

      // DnD handlers
      console.log("[PROMPT DEBUG] D&Dイベントハンドラー設定開始:", li);
      li.addEventListener("dragstart", handlePromptDragStart);
      li.addEventListener("dragover", handlePromptDragOver);
      li.addEventListener("dragleave", handlePromptDragLeave);
      li.addEventListener("drop", handlePromptDrop);
      li.addEventListener("dragend", handlePromptDragEnd);
      console.log("[PROMPT DEBUG] D&Dイベントハンドラー設定完了:", li);

      // ★ star
      const star = document.createElement("i");
      star.className = p.star
        ? "bi bi-star-fill star on"
        : "bi bi-star-fill star off";
      star.draggable = false; // ドラッグを無効化
      star.addEventListener("click", async (e) => {
        e.stopPropagation();
        p.star = !p.star;
        console.log(`star toggle id=${p.id} → ${p.star}`);
        // move starred to top / unstar to bottom
        const realIdx = prompts.findIndex((prompt) => prompt.id === p.id);
        if (realIdx !== -1) {
          prompts.splice(realIdx, 1);
          if (p.star) prompts.unshift(p);
          else prompts.push(p);
        }
        await save(PROMPT_KEY, prompts);
        renderList();
      });
      li.appendChild(star);

      // title
      const titleElement = document.createElement("span");
      titleElement.className = "prompt-title";
      titleElement.textContent = p.title;
      titleElement.title = p.title; // Add title attribute for tooltip
      titleElement.draggable = false; // ドラッグを無効化
      li.appendChild(titleElement);

      // 一括入力ボタン
      const runBtn = document.createElement("button");
      runBtn.className = "prompt-action";
      runBtn.textContent = "一括入力";
      runBtn.title = "プロンプトを一括入力";
      runBtn.draggable = false; // ドラッグを無効化
      // デバウンス用のlocked変数
      let locked = false;

      runBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (locked) return;
        locked = true;

        console.log(`一括入力ボタンクリック: ${p.title}`);

        // 実行画面と同じ一括入力処理を実行
        try {
          // 有効なフィールドのみを抽出
          const validFields = p.fields
            .map((field, index) => ({
              ...field,
              index,
            }))
            .filter((field) => field.on && field.text.trim());

          if (validFields.length === 0) {
            console.warn(
              "[一覧一括入力] 有効なプロンプトフィールドがありません"
            );
            return;
          }

          // 一括入力用のペイロードを作成
          const payload = validFields
            .map((field) => field.text.trim())
            .join("\n\n");

          // 実行画面と同じsendToFocused関数を使用
          sendToFocused(payload);

          console.log(
            `[一覧一括入力] 成功: ${p.title} (${validFields.length}個のフィールド)`
          );

          // 成功時の視覚的フィードバック
          const originalText = runBtn.textContent;
          runBtn.textContent = "送信完了";
          runBtn.style.filter = "brightness(1.2)";

          setTimeout(() => {
            runBtn.textContent = originalText;
            runBtn.style.filter = "";
            locked = false; // ロック解除
          }, 120); // 実行画面と同じ120ms
        } catch (error) {
          console.error("[一覧一括入力] エラー:", error);

          // エラー時の視覚的フィードバック
          const originalText = runBtn.textContent;
          runBtn.textContent = "エラー";
          runBtn.style.filter = "brightness(0.8)";

          setTimeout(() => {
            runBtn.textContent = originalText;
            runBtn.style.filter = "";
            locked = false; // ロック解除
          }, 120); // 実行画面と同じ120ms
        }
      });
      li.appendChild(runBtn);

      // archive-icon
      const archiveIcon = document.createElement("i");
      archiveIcon.className = "bi bi-archive-fill prompt-archive";
      archiveIcon.title = "アーカイブへ移動";
      archiveIcon.draggable = false; // ドラッグを無効化
      archiveIcon.addEventListener("click", async (e) => {
        e.stopPropagation();

        // 空のプロンプトまたは無題プロンプトの判定
        const isEmptyPrompt =
          (!p.title || p.title.trim() === "") &&
          (!p.fields ||
            p.fields.length === 0 ||
            p.fields.every((field) => !field.text || field.text.trim() === ""));
        const isUntitledPrompt =
          (!p.title || p.title.trim() === "" || p.title.trim() === "(無題)") &&
          (!p.fields ||
            p.fields.length === 0 ||
            p.fields.every((field) => !field.text || field.text.trim() === ""));

        if (isEmptyPrompt || isUntitledPrompt) {
          console.log(
            "[PROMPT] 空のプロンプトまたは無題プロンプトを一覧から削除（アーカイブには保存しない）:",
            p.id
          );

          // アニメーション付きで削除（アーカイブには保存しない）
          if (window.AppUtils && window.AppUtils.animateArchiveItem) {
            await window.AppUtils.animateArchiveItem(li, async () => {
              // プロンプトを完全に削除（アーカイブではない）
              const promptIndex = prompts.findIndex(
                (prompt) => prompt.id === p.id
              );
              if (promptIndex !== -1) {
                prompts.splice(promptIndex, 1);
                await save(PROMPT_KEY, prompts);
                window.prompts = prompts;

                // 削除後、アクティブなプロンプトが空になった場合は即座に画面を更新
                const activePrompts = prompts.filter((p) => !p.archived);
                if (activePrompts.length === 0) {
                  renderList();
                }
              }
            });
          } else {
            // AppUtilsが利用できない場合の代替処理
            console.log(
              "[PROMPT] AppUtils.animateArchiveItemが利用できません。代替処理を実行します。"
            );

            // シンプルなアニメーション
            li.style.transition = "all 0.5s ease-in-out";
            li.style.transform = "translateY(-20px) scale(0.95)";
            li.style.opacity = "0";

            await new Promise((resolve) => {
              setTimeout(async () => {
                // プロンプトを完全に削除（アーカイブではない）
                const promptIndex = prompts.findIndex(
                  (prompt) => prompt.id === p.id
                );
                if (promptIndex !== -1) {
                  prompts.splice(promptIndex, 1);
                  await save(PROMPT_KEY, prompts);
                  window.prompts = prompts;

                  // 削除後、アクティブなプロンプトが空になった場合は即座に画面を更新
                  const activePrompts = prompts.filter((p) => !p.archived);
                  if (activePrompts.length === 0) {
                    renderList();
                  }
                }

                console.log("[PROMPT] 代替削除アニメーション完了");
                resolve();
              }, 500);
            });
          }
          return;
        }

        // アニメーション付きでアーカイブ
        if (window.AppUtils && window.AppUtils.animateArchiveItem) {
          await window.AppUtils.animateArchiveItem(li, async () => {
            p.archived = true;
            await save(PROMPT_KEY, prompts);
            // グローバルに最新のpromptsを設定
            window.prompts = prompts;

            // アーカイブ後、アクティブなプロンプトが空になった場合は即座に画面を更新
            const activePrompts = prompts.filter((p) => !p.archived);
            if (activePrompts.length === 0) {
              renderList();
            }
          });
        } else {
          // AppUtilsが利用できない場合の代替処理
          console.log(
            "[PROMPT] AppUtils.animateArchiveItemが利用できません。代替処理を実行します。"
          );

          // シンプルなアニメーション
          li.style.transition = "all 0.5s ease-in-out";
          li.style.transform = "translateY(-20px) scale(0.95)";
          li.style.opacity = "0";

          await new Promise((resolve) => {
            setTimeout(async () => {
              // データ更新処理
              p.archived = true;
              await save(PROMPT_KEY, prompts);
              // グローバルに最新のpromptsを設定
              window.prompts = prompts;

              // アーカイブ後、アクティブなプロンプトが空になった場合は即座に画面を更新
              const activePrompts = prompts.filter((p) => !p.archived);
              if (activePrompts.length === 0) {
                renderList();
              }

              console.log("[PROMPT] 代替アーカイブアニメーション完了");
              resolve();
            }, 500);
          });
        }
      });
      li.appendChild(archiveIcon);

      // click row → run（元の配列でのインデックスを使用）
      li.addEventListener("click", () => renderRun(originalIndex));

      console.log("[PROMPT DEBUG] リストアイテムをDOMに追加:", {
        promptId: p.id,
        promptTitle: p.title,
        originalIndex: originalIndex,
        element: li,
      });
      list.appendChild(li);
    });
  }

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  currentPromptIndex = -1; // 一覧画面に戻ったのでリセット
  console.log("[renderList] end");

  // リストの最後にデバッグ情報を追加
  setTimeout(() => {
    console.log("[PROMPT DEBUG] 最終的なDOM状態確認:");
    const promptItems = list.querySelectorAll(".prompt-item");
    console.log(`[PROMPT DEBUG] プロンプトアイテム数: ${promptItems.length}`);

    promptItems.forEach((item, index) => {
      console.log(`[PROMPT DEBUG] アイテム${index}:`, {
        element: item,
        draggable: item.draggable,
        dataset: item.dataset,
        classList: Array.from(item.classList),
        childElements: Array.from(item.children).map((child) => ({
          tagName: child.tagName,
          className: child.className,
          draggable: child.draggable,
        })),
      });
    });

    // トーストメッセージのテスト
    console.log("[PROMPT DEBUG] トーストメッセージテスト開始");
    console.log("[PROMPT DEBUG] AppUtils確認:", {
      AppUtils: !!window.AppUtils,
    });
  }, 100);
}

/* ══════════════════════════════════════════════════════
  3.5. アーカイブビュー   renderArchiveView()
══════════════════════════════════════════════════════ */
async function renderArchiveView() {
  console.log("[renderArchiveView] start");

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("prompt", {
      mode: "archive",
    });
    window.PageStateManager.setActivePage("prompt");
  }

  prompts = await load(PROMPT_KEY);

  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body;

  // 編集画面や実行画面で追加されたヘッダーを削除
  root.querySelector(".form-header")?.remove();

  // フッターをアーカイブモード用に変更
  footer.innerHTML = `
    <button class="nav-btn back-btn">
      <i class="bi bi-arrow-left-circle"></i>
      <span class="nav-text">戻る</span>
    </button>
    <button class="nav-btn delete-all-btn">
      <i class="bi bi-trash"></i>
      <span class="nav-text">一括削除</span>
    </button>`;

  // アニメーション処理
  body.classList.remove("edit-mode", "run-mode");
  body.classList.remove("animate");
  void body.offsetWidth;
  body.classList.add("animate");

  // アーカイブされたプロンプトを取得
  const archivedPrompts = prompts.filter((p) => p.archived);

  // アーカイブ一覧のHTML生成
  if (archivedPrompts.length === 0) {
    body.innerHTML = `
      <div class="prompt-empty-state">
        <div class="prompt-empty-state-content">
          <div class="prompt-empty-state-icon">
            <i class="bi bi-terminal"></i>
          </div>
          <h3 class="prompt-empty-state-title">アーカイブされた<br>プロンプトはありません</h3>
          <p class="prompt-empty-state-message">
            プロンプトをアーカイブすると、<br>ここに表示されます。
          </p>
        </div>
      </div>`;
  } else {
    body.innerHTML = `
      <div class="archive-header">
        <h2 class="archive-title">アーカイブ (${archivedPrompts.length}件)</h2>
        <label class="select-all-label">
          <input type="checkbox" id="chk-select-all" /> 全て選択する
        </label>
      </div>
      <ul class="archive-list"></ul>`;

    const ul = body.querySelector(".archive-list");

    archivedPrompts.forEach((p, idx) => {
      const li = document.createElement("li");
      li.className = "archive-item";

      // チェックボックス
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "arch-check";
      cb.dataset.index = idx;
      li.appendChild(cb);

      // タイトル
      const span = document.createElement("span");
      span.className = "arch-title";
      span.textContent = p.title || "(無題)";
      span.title = p.title; // Add title attribute for tooltip
      li.appendChild(span);

      // 復元ボタン
      const btn = document.createElement("button");
      btn.className = "restore-btn";
      btn.innerHTML = '<i class="bi bi-upload"></i>';
      btn.title = "復元";
      btn.addEventListener("click", async (e) => {
        console.log("[ARCH] 復元ボタンがクリックされました！");
        e.preventDefault();
        e.stopPropagation();

        // 重複クリックを防ぐ
        if (btn.disabled) {
          console.log("[ARCH] 復元処理中です...");
          return;
        }

        console.log("[ARCH] restore idx:", idx);

        // ボタンを一時的に無効化
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        try {
          console.log("[ARCH] 復元処理を開始します...");

          /* PROMPT: archived → false */
          const prompts = await load(PROMPT_KEY);
          console.log("[ARCH] 現在のプロンプト数:", prompts.length);

          const target = prompts.find((prompt) => prompt.id === p.id);
          console.log("[ARCH] 復元対象のプロンプト:", target);

          if (target) {
            target.archived = false;
            console.log("[ARCH] プロンプトを復元しました:", target.title);

            await save(PROMPT_KEY, prompts);
            // グローバルに最新のpromptsを設定
            window.prompts = prompts;
            console.log("[ARCH] プロンプトストレージを更新しました");

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
            console.error("[ARCH] 復元対象のプロンプトが見つかりません:", p.id);
            // ボタンを再度有効化
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
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

    // 全選択チェック
    body.querySelector("#chk-select-all").addEventListener("change", (e) => {
      ul.querySelectorAll(".arch-check").forEach(
        (c) => (c.checked = e.target.checked)
      );
    });
  }

  body.classList.remove("show");
  void body.offsetWidth;
  body.classList.add("show");

  // Empty Stateのフェードインアニメーション
  if (archivedPrompts.length === 0) {
    setTimeout(() => {
      const emptyContent = body.querySelector(".prompt-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  }

  // 戻るボタンの機能
  footer.querySelector(".back-btn").addEventListener("click", () => {
    console.log("アーカイブから一覧に戻ります");
    renderList();
  });

  // 一括削除ボタンの機能（確認ダイアログ付き）
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const checkedItems = body.querySelectorAll(".arch-check:checked");

      // 削除対象の数を確認
      let deleteCount = 0;
      let confirmMessage = "";

      if (checkedItems.length === 0) {
        // 全削除の場合
        deleteCount = archivedPrompts.length;

        if (deleteCount === 0) {
          console.log("削除対象のアーカイブプロンプトがありません");
          return;
        }

        confirmMessage = `アーカイブされた全てのプロンプト（${deleteCount}件）を完全に削除しますか？`;
      } else {
        // 選択削除の場合
        deleteCount = checkedItems.length;
        confirmMessage = `選択された${deleteCount}件のプロンプトを完全に削除しますか？`;
      }

      // 確認ダイアログを表示
      window.AppUtils.showSaveConfirmDialog({
        title: "削除の確認",
        message: `${confirmMessage}<br><span style="color: #FF0000; font-weight: bold;">この操作は取り消せません。</span>`,
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
          if (checkedItems.length === 0) {
            // 全削除の場合
            prompts = prompts.filter((p) => !p.archived);
          } else {
            // 選択されたアイテムのみ削除
            const selectedIndices = Array.from(checkedItems).map((cb) =>
              parseInt(cb.dataset.index)
            );
            console.log(`[ARCHIVE] 一括削除対象: ${selectedIndices.length}件`);

            // 選択されたアーカイブプロンプトを削除
            selectedIndices.sort((a, b) => b - a); // 逆順でソート（インデックスずれを防ぐ）
            selectedIndices.forEach((idx) => {
              const archivedPrompt = archivedPrompts[idx];
              const originalIndex = prompts.findIndex(
                (p) => p.id === archivedPrompt.id
              );
              if (originalIndex !== -1) {
                prompts.splice(originalIndex, 1);
              }
            });
          }

          await save(PROMPT_KEY, prompts);
          window.prompts = prompts;
          console.log(`[ARCHIVE] ${deleteCount}件のプロンプトを削除しました`);
          renderArchiveList(); // アーカイブ画面を再描画
        },
        onCancel: () => {
          console.log("[ARCHIVE] 削除をキャンセルしました");
        },
      });
    });

  console.log("[renderArchiveView] end");
}

/* ══════════════════════════════════════════════════════
  4. 編集ビュー   renderEdit()
══════════════════════════════════════════════════════ */
function renderEdit(idx, isNew = false) {
  console.log("[renderEdit] idx =", idx, "isNew =", isNew);

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("prompt", {
      mode: "edit",
      promptIndex: idx,
      isNew: isNew,
    });
    window.PageStateManager.setActivePage("prompt");
  }

  // 新規作成時の処理
  if (idx === undefined || idx === null) {
    isNew = true;
    idx = prompts.length; // 新しいインデックスを設定
    console.log("[renderEdit] 新規作成モード - 新しいインデックス:", idx);
  }

  currentPromptIndex = idx; // 編集中のプロンプトインデックスを設定

  /* ルート要素取得 */
  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body; // HTMLの直接の親要素を取得
  body.classList.remove("run-mode"); // remove run-mode when editing

  // 新規作成時は仮のオブジェクトを作成
  let obj;
  if (isNew && idx >= prompts.length) {
    obj = {
      id: Date.now(),
      title: "",
      star: false,
      fields: [{ text: "", on: true }],
      archived: false,
    };
    console.log("[renderEdit] 新規オブジェクトを作成:", obj);
    editingOriginalPrompt = null; // 新規作成時は比較対象なし
    window.editingOriginalPrompt = editingOriginalPrompt; // グローバルも更新
  } else {
    obj = prompts[idx];
    console.log("[renderEdit] 既存オブジェクトを編集:", obj);
    // 既存オブジェクトのスナップショットを保持
    editingOriginalPrompt = structuredClone(obj);
    window.editingOriginalPrompt = editingOriginalPrompt; // グローバルも更新
  }

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  /*━━━━━━━━━━ 1. 旧ヘッダーを除去 ━━━━━━━━━━*/
  root.querySelector(".form-header")?.remove();

  /*━━━━━━━━━━ 2. ヘッダーを "カードの外" に生成 ━━━━━*/
  const head = document.createElement("div");
  head.className =
    "form-header d-flex justify-content-between align-items-center mb-2 px-2";

  const status = document.createElement("span");
  status.className = "text-success fw-bold";
  status.textContent = "プロンプト編集中";

  const dupBtn = document.createElement("button");
  dupBtn.className = "btn-dup";

  const dupIcon = document.createElement("i");
  dupIcon.className = "bi bi-copy me-1";
  dupBtn.appendChild(dupIcon);
  dupBtn.appendChild(document.createTextNode(" 複製する"));

  dupBtn.addEventListener("click", () => {
    console.log("[DUP] 複製ボタンがクリックされました, idx:", idx);
    duplicate(idx);
  });

  head.appendChild(status);
  head.appendChild(dupBtn);

  console.log("[renderEdit] ヘッダーDOM生成完了");

  /* ★★★ ここが重要 ★★★
     MEMO 入力画面と同じく "カードの手前" に挿入する */
  root.insertBefore(head, body);

  /*━━━━━━━━━━ 3. フッター ━━━━━━━━━━*/
  footer.innerHTML = `
    <button class="nav-btn back-btn">
      <i class="bi bi-arrow-left-circle"></i>
      <span class="nav-text">戻る</span>
    </button>
    <button class="nav-btn save-btn">
      <i class="bi bi-save"></i>
      <span class="nav-text">保存</span>
    </button>`;

  /*━━━━━━━━━━ 4. 本体フォーム ━━━━━━━━━━*/
  body.innerHTML = `
    <div class="memo-input-form">
      <div class="title-section">
        <label class="title-label">タイトル</label>
        <input type="text" class="title-input" placeholder="タイトルを入力" />
      </div>
    <div id="field-wrap" class="d-flex flex-column gap-2 mb-3"></div>
    <button class="btn-add-field w-100 mb-3">
      ＋ プロンプトを追加
      </button>
    </div>`;
  $(".title-input").value = obj.title;

  const wrap = $("#field-wrap");
  if (!obj.fields.length) obj.fields = [{ text: "", on: true }];
  obj.fields.forEach((f) => addField(f.text, f.on));
  $(".btn-add-field").onclick = () => addField("", true);

  /*━━━━━━━━━━ 5. 保存 / 戻る ━━━━━━━━━━*/
  $(".save-btn").onclick = async () => {
    obj.title = $(".title-input").value.trim() || "(無題)";
    obj.fields = [...wrap.children].map((w) => ({
      text: w.querySelector(".prompt-field-textarea").value,
      on: w.querySelector(".field-toggle").checked,
    }));

    // 新規作成の場合はpromptsに追加
    if (isNew && idx >= prompts.length) {
      prompts.push(obj);
      console.log("[SAVE] 新規プロンプトを追加:", obj);
    } else {
      prompts[idx] = obj;
      console.log("[SAVE] 既存プロンプトを更新:", obj);
    }

    await save(PROMPT_KEY, prompts);
    head.remove();
    renderList();
  };

  $(".back-btn").onclick = async () => {
    // 編集開始時のスナップショットと比較
    const base = editingOriginalPrompt || obj;
    const hasChanges = checkForUnsavedChanges(base, isNew);

    if (hasChanges) {
      // 変更がある場合は保存確認ダイアログを表示
      window.AppUtils.showSaveConfirmDialog({
        title: "変更を保存しますか？",
        message:
          "編集内容に変更があります。<br>保存せずに戻ると変更が失われます。",
        onSave: () => {
          // 保存して戻る
          saveAndGoBack();
        },
        onDiscard: () => {
          // 保存せずに戻る
          discardAndGoBack();
        },
      });
    } else {
      // 変更がない場合は直接戻る
      discardAndGoBack();
    }

    // 保存して戻る処理
    async function saveAndGoBack() {
      obj.title = $(".title-input").value.trim() || "(無題)";
      obj.fields = [...wrap.children].map((w) => ({
        text: w.querySelector(".prompt-field-textarea").value,
        on: w.querySelector(".field-toggle").checked,
      }));

      // 新規作成の場合はpromptsに追加
      if (isNew && idx >= prompts.length) {
        prompts.push(obj);
        console.log("[BACK] 新規プロンプトを保存して追加:", obj);
      } else {
        prompts[idx] = obj;
        console.log("[BACK] 既存プロンプトを保存して更新:", obj);
      }

      await save(PROMPT_KEY, prompts);
      console.log("[BACK] 変更を保存して戻りました");
      head.remove();
      renderList();
    }

    // 保存せずに戻る処理
    async function discardAndGoBack() {
      if (isNew && idx < prompts.length) {
        // 既にpromptsに追加されている新規作成の場合のみ削除
        const titleEmpty = $(".title-input").value.trim() === "";
        const allEmpty = [
          ...wrap.querySelectorAll(".prompt-field-textarea"),
        ].every((t) => t.value.trim() === "");
        if (titleEmpty && allEmpty) {
          prompts.splice(idx, 1);
          await save(PROMPT_KEY, prompts);
          console.log("[BACK] 空カードを削除");
        }
      }
      console.log("[BACK] 変更を破棄して戻りました");
      head.remove();
      renderList();
    }
  };

  // 編集モードのクラスを設定
  body.classList.add("edit-mode");

  // MEMOページと同じアニメーション処理を追加
  body.classList.remove("animate");
  void body.offsetWidth; // 1フレーム reflow
  body.classList.add("animate");

  body.classList.remove("show");
  void body.offsetWidth;
  body.classList.add("show");

  // 編集画面の段階的フェードインアニメーション（実行画面と統一）
  const form = body.querySelector(".memo-input-form");
  const titleSection = form.querySelector(".title-section");
  const promptFields = form.querySelectorAll(".prompt-field");

  // 既存のtextareaに自動リサイズ機能を適用
  setTimeout(() => {
    const existingTextareas = form.querySelectorAll(".prompt-field-textarea");
    existingTextareas.forEach((textarea) => {
      // 自動リサイズのイベントリスナーを追加
      textarea.addEventListener("input", () => autoResize(textarea));
      textarea.addEventListener("paste", () =>
        setTimeout(() => autoResize(textarea), 10)
      );
      textarea.addEventListener("cut", () => autoResize(textarea));
      textarea.addEventListener("compositionend", () => autoResize(textarea));
      textarea.addEventListener("focus", () => autoResize(textarea));
      textarea.addEventListener("blur", () => autoResize(textarea));
      textarea.addEventListener("change", () => autoResize(textarea));
      textarea.addEventListener("keydown", (e) => {
        // エンターキーで改行した時も自動リサイズ
        if (e.key === "Enter") {
          setTimeout(() => autoResize(textarea), 10);
        }
      });

      // ドラッグ&ドロップ対応
      textarea.addEventListener("drop", () =>
        setTimeout(() => autoResize(textarea), 10)
      );

      // 初期化時の高さ設定
      setTimeout(() => autoResize(textarea), 50);
    });

    console.log(
      `PROMPT編集画面の既存textarea ${existingTextareas.length}個に自動リサイズ機能を適用しました`
    );
  }, 100);
  const addFieldBtn = form.querySelector(".btn-add-field");

  // 初期状態設定（CSS transitionが適用されるまで少し待つ）
  setTimeout(() => {
    // 1. メインフォームをフェードイン
    form.classList.add("show");

    // 2. タイトルセクションをフェードイン
    setTimeout(() => {
      titleSection.classList.add("show");
    }, 150);

    // 3. プロンプトフィールドを順次フェードイン
    promptFields.forEach((field, index) => {
      setTimeout(() => {
        field.classList.add("show");
      }, 250 + index * 100); // 各フィールド100ms間隔
    });

    // 4. 追加ボタンをフェードイン
    setTimeout(() => {
      addFieldBtn.classList.add("show");
    }, 350 + promptFields.length * 100);
  }, 50);

  // 既存のプロンプトフィールドのドラッグ＆ドロップを確実に初期化
  setTimeout(() => {
    const existingFields = wrap.querySelectorAll(".prompt-field");
    console.log(
      "[DND] 既存フィールドのドラッグ＆ドロップ初期化:",
      existingFields.length,
      "個"
    );

    existingFields.forEach((field, index) => {
      if (field.draggable) {
        console.log(
          `[DND] フィールド ${index + 1} のドラッグ＆ドロップ確認済み`
        );
      }
    });
  }, 100);

  /*━━━━━━━━━━ 6. プロンプト行生成 ━━━━━━━━━━*/
  function addField(text = "", enabled = true) {
    const row = ce("div", "prompt-field");
    row.draggable = true;

    /* --- 改善されたDnD handlers --- */
    let dragStartIndex = null;

    row.addEventListener("dragstart", (e) => {
      console.log("[DND] ドラッグ開始");
      dragStartIndex = [...wrap.children].indexOf(row);
      e.dataTransfer.setData("text/plain", dragStartIndex.toString());
      e.dataTransfer.effectAllowed = "move";
      row.classList.add("dragging");
      console.log("[DND] ドラッグ開始インデックス:", dragStartIndex);
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // 他の要素のドロップインジケーターをクリア
      wrap.querySelectorAll(".drop-indicator").forEach((el) => {
        el.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        );
      });

      // マウスの位置に基づいてドロップ位置を判定
      const rect = row.getBoundingClientRect();
      const mouseY = e.clientY;
      const rowCenter = rect.top + rect.height / 2;

      // ドロップ位置のインジケーターを表示
      row.classList.add("drop-indicator", "active");

      if (mouseY < rowCenter) {
        // マウスが要素の上半分にある場合、要素の上に挿入
        row.classList.add("drop-above");
        console.log("[DND] ドロップ位置: 上に挿入");
      } else {
        // マウスが要素の下半分にある場合、要素の下に挿入
        row.classList.add("drop-below");
        console.log("[DND] ドロップ位置: 下に挿入");
      }
    });

    row.addEventListener("dragleave", (e) => {
      // 子要素にドラッグが入った場合はドロップインジケーターを維持
      if (!row.contains(e.relatedTarget)) {
        row.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        );
      }
    });

    row.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
      const toIndex = [...wrap.children].indexOf(row);

      console.log("[DND] ドロップ処理:", { fromIndex, toIndex });

      if (fromIndex === toIndex || fromIndex === -1 || toIndex === -1) {
        console.log("[DND] 無効なドロップ - 処理をスキップ");
        row.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        );
        return;
      }

      try {
        // DOM操作
        const nodes = [...wrap.children];
        const movedNode = nodes[fromIndex];

        if (movedNode) {
          // ドロップ位置を判定
          const rect = row.getBoundingClientRect();
          const mouseY = e.clientY;
          const rowCenter = rect.top + rect.height / 2;
          const dropAbove = mouseY < rowCenter;

          let actualToIndex = toIndex;

          if (dropAbove) {
            // 要素の上に挿入
            wrap.insertBefore(movedNode, nodes[toIndex]);
            console.log("[DND] 要素の上に挿入:", fromIndex, "→", toIndex);
          } else {
            // 要素の下に挿入
            if (toIndex + 1 < nodes.length) {
              wrap.insertBefore(movedNode, nodes[toIndex + 1]);
            } else {
              wrap.appendChild(movedNode);
            }
            actualToIndex = toIndex + 1;
            console.log("[DND] 要素の下に挿入:", fromIndex, "→", actualToIndex);
          }

          console.log("[DND] ドロップ処理完了");
          renumber(); // 番号を再採番

          // ドラッグ＆ドロップ成功メッセージを表示
          showDragDropSuccessMessage(fromIndex + 1, actualToIndex + 1);
        }
      } catch (error) {
        console.error("[DND] ドロップ処理中にエラー:", error);
      }

      row.classList.remove(
        "drop-indicator",
        "drop-above",
        "drop-below",
        "active"
      );
    });

    row.addEventListener("dragend", (e) => {
      console.log("[DND] ドラッグ終了");
      row.classList.remove("dragging");
      dragStartIndex = null;

      // 他の要素のドロップインジケーターも削除
      wrap.querySelectorAll(".drop-indicator").forEach((el) => {
        el.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        );
      });
    });

    /* --- 行 HTML --- */
    row.innerHTML = `
      <div class="prompt-section">
        <div class="prompt-header-row">
          <label class="prompt-field-label"></label>
          <div class="prompt-field-actions">
            <div class="form-check form-switch">
          <input class="form-check-input field-toggle" type="checkbox" ${
            enabled ? "checked" : ""
          }>
          <label class="form-check-label toggle-label ms-2 ${
            enabled ? "on" : "off"
          }">
            ${enabled ? "表示" : "非表示"}
          </label>
        </div>
                    <button class="btn-remove-field">
          <i class="bi bi-trash"></i>
        </button>
      </div>
        </div>
        <div class="textarea-container">
          <textarea class="prompt-field-textarea"
                    placeholder="プロンプトを入力"
                    rows="4">${text}</textarea>
        </div>
      </div>`;
    row.querySelector(".btn-remove-field").onclick = async () => {
      console.log("削除ボタンがクリックされました");

      // おしゃれな削除確認ポップアップを表示
      const slider = document.querySelector('.size-slider') || document.querySelector('#sizeSlider');
      const removeTitle =
        slider && parseInt(slider.value) === parseInt(slider.min)
          ? "プロンプトフィールドを<br>削除しますか？"
          : "プロンプトフィールドを削除しますか？";
      console.log('削除ダイアログタイトル:', removeTitle, 'slider', slider?.value);

      window.AppUtils.showSaveConfirmDialog({
        title: removeTitle,
        message:
          "この操作は元に戻すことができません。<br><span style='color: #FF0000; font-weight: bold;'>この操作は取り消せません。</span>",
        discardLabel: "削除",
        cancelLabel: "キャンセル",
        discardColor: "#D93544",
        cancelColor: "#4A5568",
        showSave: false,
        showDiscard: true,
        showCancel: true,
        iconClass: "bi bi-trash-fill",
        onDiscard: async () => {
          console.log("削除確認ダイアログで「削除」が選択されました");

          // 削除前の状態をログ出力
          const wrap = $("#field-wrap");
          console.log("削除前のフィールド数:", wrap.children.length);
          console.log("削除対象の行:", row);

          // 1. UI上から削除
          row.remove();
          console.log("UI上から行を削除しました");

          renumber(); // 削除後にプロンプト番号を再採番
          console.log("削除後のフィールド数:", wrap.children.length);

          // 2. データを即座に更新・保存
          const titleValue = $(".title-input").value.trim() || "(無題)";
          const updatedFields = [...wrap.children].map((w) => ({
            text: w.querySelector(".prompt-field-textarea").value,
            on: w.querySelector(".field-toggle").checked,
          }));
          console.log("更新されたフィールドデータ:", updatedFields);

          // 3. プロンプトオブジェクトを更新
          obj.title = titleValue;
          obj.fields = updatedFields;
          console.log("プロンプトオブジェクトを更新しました:", obj);

          // 4. ストレージに保存
          await save(PROMPT_KEY, prompts);
          console.log("ストレージに保存しました");

          console.log("プロンプトフィールドを削除して保存しました");
        },
      });
    };

    const toggle = row.querySelector(".field-toggle");
    const label = row.querySelector(".toggle-label");
    toggle.onchange = (e) => {
      const on = e.target.checked;
      label.textContent = on ? "表示" : "非表示";
      label.classList.toggle("on", on);
      label.classList.toggle("off", !on);
    };

    wrap.appendChild(row);
    renumber();

    // 新しく追加されたフィールドにフェードインアニメーションを適用
    setTimeout(() => {
      row.classList.add("show");

      // 新しく追加されたtextareaに自動リサイズ機能を適用
      const newTextarea = row.querySelector(".prompt-field-textarea");
      if (newTextarea) {
        // 自動リサイズのイベントリスナーを追加
        newTextarea.addEventListener("input", () => autoResize(newTextarea));
        newTextarea.addEventListener("paste", () =>
          setTimeout(() => autoResize(newTextarea), 10)
        );
        newTextarea.addEventListener("cut", () => autoResize(newTextarea));
        newTextarea.addEventListener("compositionend", () =>
          autoResize(newTextarea)
        );
        newTextarea.addEventListener("focus", () => autoResize(newTextarea));
        newTextarea.addEventListener("blur", () => autoResize(newTextarea));
        newTextarea.addEventListener("change", () => autoResize(newTextarea));
        newTextarea.addEventListener("keydown", (e) => {
          // エンターキーで改行した時も自動リサイズ
          if (e.key === "Enter") {
            setTimeout(() => autoResize(newTextarea), 10);
          }
        });

        // ドラッグ&ドロップ対応
        newTextarea.addEventListener("drop", () =>
          setTimeout(() => autoResize(newTextarea), 10)
        );

        // 初期化時の高さ設定
        setTimeout(() => autoResize(newTextarea), 50);

        console.log("PROMPT編集画面のtextareaに自動リサイズ機能を適用しました");
      }

      // ドラッグ＆ドロップの初期化を確実に行う
      if (row.draggable) {
        console.log("[DND] 新しいフィールドのドラッグ＆ドロップを初期化:", row);
      }
    }, 50);
  }

  function renumber() {
    [...wrap.children].forEach(
      (el, i) =>
        (el.querySelector(".prompt-field-label").textContent = `プロンプト ${
          i + 1
        }`)
    );
  }

  /*━━━━━━━━━━ 7. 複製処理 ━━━━━━━━━━*/
  async function duplicate(i) {
    console.log(
      "[DUP] 複製処理開始, i:",
      i,
      "prompts.length:",
      prompts.length,
      "isNew:",
      isNew
    );

    // 新規作成時の場合は、現在編集中の内容を複製
    if (isNew && i >= prompts.length) {
      console.log("[DUP] 新規作成時の複製処理");

      const currentTitle = $(".title-input").value.trim() || "(無題)";
      const currentFields = [...wrap.children].map((w) => ({
        text: w.querySelector(".prompt-field-textarea").value,
        on: w.querySelector(".field-toggle").checked,
      }));

      const newPrompt = {
        id: Date.now(),
        title: currentTitle + " (複製)",
        fields: currentFields,
        archived: false,
      };

      console.log("[DUP] 新規作成時の複製プロンプト:", newPrompt);

      prompts.push(newPrompt);
      await save(PROMPT_KEY, prompts);

      console.log("[DUP] 新規作成時の複製完了");
      head.remove();
      renderList();
      return;
    }

    // 既存プロンプトの複製
    if (i < 0 || i >= prompts.length) {
      console.error("[DUP] 無効なインデックス:", i);
      return;
    }

    const currentTitle = $(".title-input").value.trim() || "(無題)";
    console.log("[DUP] 現在のタイトル:", currentTitle);

    const originalPrompt = prompts[i];
    console.log("[DUP] 元のプロンプト:", originalPrompt);

    const clone = structuredClone(originalPrompt);
    clone.id = Date.now();
    clone.title = currentTitle + " (複製)";

    console.log("[DUP] 複製されたプロンプト:", clone);

    prompts.push(clone);
    await save(PROMPT_KEY, prompts);

    console.log(
      "[DUP] ストレージに保存完了, 新しいprompts.length:",
      prompts.length
    );

    head.remove();
    renderList();
    console.log("[DUP] 複製完了 →", clone.title);
  }
}

/*━━━━━━━━━━ ドラッグ＆ドロップ成功メッセージ（グローバル関数） ━━━━━━━━━━*/
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

/* ══════════════════════════════════════════════════════
  5. 実行ビュー   renderRun()
══════════════════════════════════════════════════════ */
function renderRun(idx) {
  console.log("[renderRun] idx =", idx);
  currentPromptIndex = idx; // 現在のプロンプトインデックスを設定

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("prompt", {
      mode: "run",
      promptIndex: idx,
    });
    window.PageStateManager.setActivePage("prompt");
  }

  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body;
  const obj = prompts[idx];

  /* ── ヘッダー（編集ボタンなど） ── */
  root.querySelector(".form-header")?.remove();
  const header = ce(
    "div",
    "form-header d-flex justify-content-between align-items-center mb-2 px-2",
    `<h2 class="fw-bold fs-4 mb-0">${obj.title}</h2>
     <button class="btn btn-edit btn-sm px-3">
       <i class="bi bi-pencil-fill me-1"></i> 編集
     </button>`
  );
  header.querySelector("button").onclick = () => {
    header.remove();
    renderEdit(idx);
  };
  root.insertBefore(header, body);

  /* ── フッター ── */
  footer.innerHTML = `
    <button class="nav-btn back-btn">
      <i class="bi bi-arrow-left-circle"></i>
      <span class="nav-text">戻る</span>
    </button>
    <button class="nav-btn history-btn">
      <i class="bi bi-list"></i>
      <span class="nav-text">実行履歴</span>
    </button>`;
  $(".back-btn").onclick = async () => {
    // 画面遷移時：トグルオフなら削除、オンなら保持
    const histToggleChecked = $("#hist-sw").checked;
    console.log(
      `[戻るボタン] トグルボタンの状態: ${histToggleChecked ? "オン" : "オフ"}`
    );

    const extras = [...body.querySelectorAll(".extra")].map((t) => t.value);
    console.log(`[戻るボタン] 追加入力内容:`, extras);
    await handleScreenTransition(
      obj,
      extras,
      "戻るボタンクリック時",
      histToggleChecked
    );

    header.remove();
    renderList();
  };
  $(".history-btn").onclick = () => console.log("[TODO] 履歴画面");

  /* ── 本体 HTML ── */
  // プロンプトが0個の場合、または有効なプロンプトがない場合はEmpty Stateを表示
  const enabledFields = obj.fields.filter((f) => f.on && f.text.trim());
  if (enabledFields.length === 0) {
    body.innerHTML = `
      <div class="prompt-empty-state">
        <div class="prompt-empty-state-content">
          <div class="prompt-empty-state-icon">
            <i class="bi bi-terminal"></i>
          </div>
          <h3 class="prompt-empty-state-title">プロンプトがありません</h3>
          <p class="prompt-empty-state-message">
            最初のプロンプトを作成してみましょう。
          </p>
          <div class="prompt-empty-state-action">
            <button class="btn-add-first-prompt">
              <i class="bi bi-plus-lg"></i> プロンプトを追加
            </button>
          </div>
        </div>
      </div>`;

    // プロンプト追加ボタンのクリックイベント
    body.querySelector(".btn-add-first-prompt").onclick = () => {
      header.remove();
      renderEdit(idx);
    };
  } else {
    // 通常のプロンプト実行画面
    body.innerHTML = `
    <div class="prompt-run-box">
        ${enabledFields
          .map((f, i) => {
            const originalIndex = obj.fields.findIndex((field) => field === f);
            return block(i + 1, f, originalIndex); // i + 1 で連番表示
          })
          .join("")}
      <button class="btn-exec w-100 mt-2">一括入力</button>
      <div class="form-check form-switch mt-2">
          <input id="hist-sw" class="form-check-input" type="checkbox">
        <label for="hist-sw" class="form-check-label text-success">履歴を保存</label>
      </div>
    </div>`;
  }

  // MEMOページと同じアニメーション処理を追加
  body.classList.remove("edit-mode"); // 実行画面なので編集モードを削除
  body.classList.add("run-mode"); // 実行画面のクラスを追加
  body.classList.remove("animate");
  void body.offsetWidth; // 1フレーム reflow
  body.classList.add("animate");

  body.classList.remove("show");
  void body.offsetWidth;
  body.classList.add("show");

  // Empty Stateの場合は早期リターン（以下の処理をスキップ）
  if (enabledFields.length === 0) {
    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = body.querySelector(".prompt-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
    return;
  }

  /* ── ボタンイベント設定 ── */
  // 一括入力ボタンのイベント（即座に設定）
  const execBtn = body.querySelector(".btn-exec");
  console.log("[renderRun] 一括入力ボタンの要素:", execBtn);
  if (execBtn) {
    let locked = false; // locked変数を追加
    execBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (locked) return;
      locked = true;
      send("all");
      setTimeout(() => (locked = false), 120);
    });
    console.log("[renderRun] 一括入力ボタンのイベントリスナーを設定しました");
    console.log("[renderRun] ボタンのスタイル:", {
      display: execBtn.style.display,
      opacity: execBtn.style.opacity,
      visibility: execBtn.style.visibility,
      zIndex: execBtn.style.zIndex,
    });
  } else {
    console.error("[renderRun] 一括入力ボタンが見つかりません");
  }

  // COPYボタンのイベント（即座に設定）
  const copyBtns = body.querySelectorAll(".btn-copy");
  copyBtns.forEach((btn) => {
    let locked = false; // locked変数を各ボタンごとに定義
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      e.preventDefault(); // 追加：デフォルト動作を完全に防ぐ
      if (locked) return;
      locked = true;

      // clipboardにコピーのみ（自動入力は絶対にしない）
      const index = +btn.dataset.idx;
      const extras = [...body.querySelectorAll(".extra")].map((t) => t.value);
      const payload =
        obj.fields[index].on && obj.fields[index].text.trim()
          ? `${obj.fields[index].text}\n${extras[index]}`.trim()
          : "";

      if (!payload.trim()) {
        console.warn("[COPY] コピー対象のプロンプトがありません");
        setTimeout(() => (locked = false), 120);
        return;
      }

      try {
        // 純粋にクリップボードにコピーのみ
        await navigator.clipboard.writeText(payload);

        // ボタンのテキストとアイコンをCOPIEDに変更
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check"></i> COPIED';
        btn.classList.add("copied");

        // 2秒後に元に戻す
        setTimeout(() => {
          btn.innerHTML = originalContent;
          btn.classList.remove("copied");
        }, 2000);

        console.log(
          "[COPY] クリップボードにコピーのみ実行しました（自動入力なし）"
        );
      } catch (err) {
        console.error("[COPY] クリップボードコピーに失敗:", err);
      }

      setTimeout(() => (locked = false), 120);
    });
  });

  /* ── ドラッグ&ドロップイベントハンドラー ── */
  promptBlocks.forEach((block) => {
    block.addEventListener("dragstart", handleRunDragStart);
    block.addEventListener("dragover", handleRunDragOver);
    block.addEventListener("dragleave", handleRunDragLeave);
    block.addEventListener("drop", handleRunDrop);
    block.addEventListener("dragend", handleRunDragEnd);
  });

  /* ── ドラフト復元・保存 + 自動リサイズ ── */
  const textareas = body.querySelectorAll("textarea.extra");
  const draftPromises = [];

  textareas.forEach((ta, i) => {
    // ドラフト復元のPromiseを作成
    const draftPromise = new Promise((resolve) => {
      chrome.storage.local.get(draftKey(obj.id, i), (res) => {
        const draftContent = res[draftKey(obj.id, i)] || "";
        if (draftContent) {
          ta.value = draftContent;
          // 復元後に自動リサイズ実行
          autoResize(ta);
        }
        resolve(draftContent.trim() !== "");
      });
    });
    draftPromises.push(draftPromise);

    ta.addEventListener("input", () => {
      chrome.storage.local.set({ [draftKey(obj.id, i)]: ta.value });
      // 入力時に自動リサイズ実行
      autoResize(ta);
    });

    // 初期状態でもリサイズ適用
    autoResize(ta);
  });

  // 全てのドラフト読み込み完了後にトグルボタンの状態を設定
  Promise.all(draftPromises).then((hasContentArray) => {
    const hasAnyDraftContent = hasContentArray.some((hasContent) => hasContent);
    const histSwitch = $("#hist-sw");

    if (hasAnyDraftContent && histSwitch) {
      histSwitch.checked = true;
      console.log("[AUTO] ドラフト内容があるため履歴保存をオンにしました");
    }
  });


  /* ── 内部 send() ── */
  async function send(index) {
    const extras = [...body.querySelectorAll(".extra")].map((t) => t.value);
    const payload =
      index === "all"
        ? obj.fields
            .map((f, i) =>
              f.on && f.text.trim() ? `${f.text}\n${extras[i]}`.trim() : ""
            )
            .filter(Boolean)
            .join("\n\n")
        : obj.fields[index].on && obj.fields[index].text.trim()
        ? `${obj.fields[index].text}\n${extras[index]}`.trim()
        : "";

    if (!payload.trim()) {
      console.warn("[EXECUTION] 送信対象のプロンプトがありません");
      return;
    }

    sendToFocused(payload); // ★ ここで 1 回だけ送信

    /* 実行時：ドラフト削除は常に実行、履歴保存はトグルボタンで制御 */
    const histToggleChecked = $("#hist-sw").checked;
    const actionType = "一括入力ボタン";
    console.log(
      `[EXECUTION] ${actionType} - トグルボタンの状態: ${
        histToggleChecked ? "オン" : "オフ"
      }`
    );
    console.log(`[EXECUTION] ${actionType} - 追加入力内容:`, extras);

    // 実行時はドラフト削除を常に実行（送信済みなので不要）
    if (index === "all") {
      obj.fields.forEach((_, i) =>
        chrome.storage.local.remove(draftKey(obj.id, i))
      );
      console.log(`[EXECUTION] ${actionType} - ドラフトを削除しました`);
    }

    // 履歴保存はトグルボタンがオンの時のみ実行
    if (index === "all" && histToggleChecked) {
      runs.push({
        id: Date.now(),
        when: new Date().toISOString(),
        title: obj.title,
        text: payload,
        count: obj.fields.filter((f) => f.on && f.text.trim()).length,
      });
      await save(RUN_KEY, runs);
      console.log(`[EXECUTION] ${actionType} - 履歴に保存しました`);
    } else {
      console.log(
        `[EXECUTION] ${actionType} - トグルボタンがオフのため履歴保存をスキップ`
      );
    }
  }

  /* ── ドラッグ&ドロップハンドラー ── */
  function handleRunDragStart(e) {
    const fromIndex = +e.target.dataset.index;
    e.dataTransfer.setData("text/plain", fromIndex);
    e.target.classList.add("dragging");
    console.log("[DRAG START] from index:", fromIndex);
  }

  function handleRunDragOver(e) {
    e.preventDefault();

    // 他の要素のドロップインジケーターをクリア
    body
      .querySelectorAll(".prompt-block.drop-indicator")
      .forEach((block) =>
        block.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        )
      );

    // マウスの位置に基づいてドロップ位置を判定
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseY = e.clientY;
    const blockCenter = rect.top + rect.height / 2;

    // ドロップ位置のインジケーターを表示
    e.currentTarget.classList.add("drop-indicator", "active");

    if (mouseY < blockCenter) {
      // マウスが要素の上半分にある場合、要素の上に挿入
      e.currentTarget.classList.add("drop-above");
      console.log("[RUN DND] ドロップ位置: 上に挿入");
    } else {
      // マウスが要素の下半分にある場合、要素の下に挿入
      e.currentTarget.classList.add("drop-below");
      console.log("[RUN DND] ドロップ位置: 下に挿入");
    }
  }

  function handleRunDragLeave(e) {
    e.currentTarget.classList.remove(
      "drop-indicator",
      "drop-above",
      "drop-below",
      "active"
    );
  }

  function handleRunDrop(e) {
    e.preventDefault();
    const fromIndex = +e.dataTransfer.getData("text/plain");
    const toIndex = +e.currentTarget.dataset.index;

    if (fromIndex !== toIndex) {
      console.log("[DRAG DROP] from:", fromIndex, "to:", toIndex);

      // ドロップ位置を判定
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseY = e.clientY;
      const blockCenter = rect.top + rect.height / 2;
      const dropAbove = mouseY < blockCenter;

      let actualToIndex = toIndex;

      // obj.fields の順序を変更
      const movedField = obj.fields.splice(fromIndex, 1)[0];

      if (dropAbove) {
        // 要素の上に挿入
        obj.fields.splice(toIndex, 0, movedField);
        console.log("[RUN DND] 要素の上に挿入:", fromIndex, "→", toIndex);
      } else {
        // 要素の下に挿入
        actualToIndex = toIndex + 1;
        obj.fields.splice(actualToIndex, 0, movedField);
        console.log("[RUN DND] 要素の下に挿入:", fromIndex, "→", actualToIndex);
      }

      // プロンプトデータを保存
      save(PROMPT_KEY, prompts);

      // ドラッグ＆ドロップ成功メッセージを表示
      console.log("[PROMPT RUN D&D] showDragDropSuccessMessage呼び出し前:", {
        fromIndex: fromIndex,
        actualToIndex: actualToIndex,
        AppUtils: !!window.AppUtils,
      });
      showDragDropSuccessMessage(fromIndex + 1, actualToIndex + 1);

      // 画面を再描画
      renderRun(idx);
    }

    e.currentTarget.classList.remove(
      "drop-indicator",
      "drop-above",
      "drop-below",
      "active"
    );
  }

  function handleRunDragEnd(e) {
    e.target.classList.remove("dragging");
    // 全ての ドロップインジケーターをクリーンアップ
    body
      .querySelectorAll(".prompt-block")
      .forEach((block) =>
        block.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "active"
        )
      );
  }

  /* ── ブロック生成 ── */
  function block(no, f, index) {
    return `<div class="prompt-block" draggable="true" data-index="${index}">
      <div class="prompt-header">
        <strong class="prompt-label">プロンプト${no}</strong>
        <button class="btn-copy" data-idx="${index}">
          <i class="bi bi-copy"></i> COPY
        </button>
      </div>
      <div class="prompt-content">${f.text}</div>
      <textarea rows="3" class="prompt-textarea extra" placeholder="プロンプト追加入力（都度）"></textarea>
    </div>`;
  }
}

/* ══════════════════════════════════════════════════════
  6. 共通アニメ & 他ユーティリティ
══════════════════════════════════════════════════════ */
function fx(card, content) {
  card.classList.remove("animate");
  content.classList.remove("show");
  void card.offsetWidth;
  card.classList.add("animate");
  content.classList.add("show");
}

/* ══════════════════════════════════════════════════════
  7. ★ sendToFocused() – 全フレーム先送り & 万能 execScript
══════════════════════════════════════════════════════ */
function sendToFocused(text) {
  const reqId = Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  console.log("[sendToFocused] len", text.length);

  /* ❶ 現ウィンドウのアクティブタブ取得 */
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return clipboard();

    /* ── A. broadcast to all frames first ── */
    chrome.tabs.sendMessage(
      tab.id,
      { type: "INSERT_CLIP", text, requestId: reqId },
      /* options 省略 → 全フレーム */
      () => {
        if (!chrome.runtime.lastError) {
          console.log("[deliver] OK via msg all-frames");
          return;
        }
        console.warn(
          "[deliver] msg all-frames failed:",
          chrome.runtime.lastError.message
        );

        /* ── B. execScript on every frame ── */
        chrome.scripting.executeScript(
          {
            target: { tabId: tab.id, allFrames: true }, // ★ すべてのフレーム
            args: [text, reqId],
            func: (t, id) => {
              if (window._lastReq === id) return;
              window._lastReq = id;

              /* a) まず現在の activeElement を試す */
              let el = document.activeElement;
              const isEditable = (n) =>
                n &&
                (n.isContentEditable ||
                  n instanceof HTMLTextAreaElement ||
                  (n instanceof HTMLInputElement &&
                    /^(text|search|url|email|number|tel|password)$/i.test(
                      n.type
                    )));

              /* b) 無ければ入力候補を探して focus */
              if (!isEditable(el)) {
                el = document.querySelector(
                  'div[contenteditable="true"][role="textbox"], textarea, input[type="text"]'
                );
                if (el) el.focus();
              }
              if (!isEditable(el)) throw "no-editable-element";

              /* c) 挿入 */
              if (el.isContentEditable) {
                document.execCommand("insertText", false, t);
              } else {
                el.setRangeText(t, el.selectionStart, el.selectionEnd, "end");
              }
            },
          },
          () => {
            if (!chrome.runtime.lastError) {
              console.log("[deliver] OK via execScript allFrames");
              return;
            }
            console.warn(
              "[deliver] execScript failed:",
              chrome.runtime.lastError.message
            );
            clipboard(); // ─ C. 最終 fallback
          }
        );
      }
    );
  });

  /* ── C. Clipboard fallback ── */
  function clipboard() {
    navigator.clipboard
      .writeText(text)
      .then(() => console.warn("[fallback] Copied to clipboard"))
      .catch(() => console.error("[fallback] clipboard write failed"));
  }
}

/*━━━━━━━━━━ トースト通知（簡易版）━━━━━━━━━━*/
function toast(msg) {
  console.log(msg);
}

/*━━━━━━━━━━ 変更検知機能 ━━━━━━━━━━*/
function checkForUnsavedChanges(originalObj, isNew) {
  const currentTitle = $(".title-input")?.value.trim() || "";
  const wrap = $("#field-wrap");

  if (!wrap) return false;

  const currentFields = [...wrap.children].map((w) => ({
    text: w.querySelector(".prompt-field-textarea")?.value || "",
    on: w.querySelector(".field-toggle")?.checked || false,
  }));

  console.log("[CHECK UNSAVED]", {
    isNew,
    hasOriginal: !!originalObj,
    currentTitle,
    fieldCount: currentFields.length,
  });

  // 新規作成、または比較対象がない場合
  if (isNew || !originalObj) {
    const result =
      currentTitle !== "" ||
      currentFields.some((f) => f.text.trim() !== "");
    console.log("[CHECK UNSAVED] new or no original ->", result);
    return result;
  }

  // 既存編集の場合
  // タイトルの変更をチェック
  if (currentTitle !== (originalObj.title || "")) {
    console.log("[CHECK UNSAVED] title changed");
    return true;
  }

  // フィールド数の変更をチェック
  if (currentFields.length !== originalObj.fields.length) {
    console.log("[CHECK UNSAVED] field length changed");
    return true;
  }

  // 各フィールドの内容変更をチェック
  for (let i = 0; i < currentFields.length; i++) {
    const current = currentFields[i];
    const original = originalObj.fields[i];

    if (
      !original ||
      current.text !== original.text ||
      current.on !== original.on
    ) {
      console.log("[CHECK UNSAVED] field", i, "changed");
      return true;
    }
  }

  console.log("[CHECK UNSAVED] no changes");
  return false;
}

/* ───────────────────────────────────────
  現在の編集内容が保存されていないか判定するヘルパー
  ナビゲーション側からも呼び出せるようwindowに公開
─────────────────────────────────────── */
function hasUnsavedPromptChanges() {
  const idx = getCurrentPromptIndex ? getCurrentPromptIndex() : -1;
  const total = Array.isArray(prompts) ? prompts.length : 0;

  const isNew = !window.editingOriginalPrompt && (idx === -1 || idx >= total);
  const base = window.editingOriginalPrompt || (prompts ? prompts[idx] : null);

  const result = checkForUnsavedChanges(base, isNew);
  console.log("[CHECK UNSAVED GLOBAL]", { idx, total, isNew, hasChanges: result });
  return result;
}
window.hasUnsavedPromptChanges = hasUnsavedPromptChanges;

/*━━━━━━━━━━ 空のプロンプト判定機能 ━━━━━━━━━━*/
function isEmptyPrompt(prompt) {
  return (
    (!prompt.title || prompt.title.trim() === "") &&
    (!prompt.fields ||
      prompt.fields.length === 0 ||
      prompt.fields.every((field) => !field.text || field.text.trim() === ""))
  );
}

// 削除：showSaveConfirmDialog関数はutils.jsのshowSaveConfirmDialogを使用

// 削除：showDeleteConfirmDialog関数はutils.jsのshowDeleteConfirmDialogを使用

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderList = renderList;
window.renderArchiveNav = renderArchiveNav;
window.renderArchiveList = renderArchiveList;
window.checkForUnsavedChanges = checkForUnsavedChanges;
// 削除：showSaveConfirmDialog関数はutils.jsに統合
window.prompts = prompts;
window.save = save;
window.getCurrentPromptIndex = getCurrentPromptIndex;
window.editingOriginalPrompt = editingOriginalPrompt;

// 保存・破棄関数をグローバルに公開
window.saveAndGoBack = async function () {
  // 現在編集中のプロンプト情報を取得
  const currentIndex = getCurrentPromptIndex();
  const totalCount = Array.isArray(prompts) ? prompts.length : 0;
  const isNew = currentIndex === -1 || currentIndex >= totalCount;
  const originalObj = !isNew && prompts[currentIndex] ? prompts[currentIndex] : null;

  // 現在の入力内容を取得
  const currentTitle = $(".title-input")?.value.trim() || "";
  const wrap = $("#field-wrap");

  if (!wrap) {
    console.error("[PROMPT] field-wrapが見つかりません");
    return;
  }

  const currentFields = [...wrap.children].map((w) => ({
    text: w.querySelector(".prompt-field-textarea")?.value || "",
    on: w.querySelector(".field-toggle")?.checked || false,
  }));

  try {
    if (isNew) {
      // 新規作成
      const newPrompt = {
        id: Date.now(),
        title: currentTitle || "無題",
        fields: currentFields,
        archived: false,
      };
      prompts.push(newPrompt);
      console.log("[PROMPT] 新規プロンプトを保存:", newPrompt);
    } else {
      // 既存編集
      const original = prompts[currentIndex];
      original.title = currentTitle || "無題";
      original.fields = currentFields;
      console.log("[PROMPT] 既存プロンプトを更新:", original);
    }

    await save(PROMPT_KEY, prompts);
    window.prompts = prompts;
    editingOriginalPrompt = null; // 編集完了後はスナップショットを破棄
    window.editingOriginalPrompt = editingOriginalPrompt; // グローバルも更新
    console.log("[PROMPT] 保存完了");
  } catch (error) {
    console.error("[PROMPT] 保存中にエラー:", error);
  }
};

window.discardAndGoBack = function () {
  console.log("[PROMPT] 変更を破棄して戻ります");
  editingOriginalPrompt = null; // スナップショットを破棄
  window.editingOriginalPrompt = editingOriginalPrompt; // グローバルも更新
  // 何も保存せずに一覧画面に戻る
};

// ───────────────────────────────────────
// アーカイブ機能
// ───────────────────────────────────────
const PROMPT_ARCH_KEY = "prompts_arch";
let archiveType = null;

// アーカイブ画面の表示
function renderArchiveNav(type) {
  console.log("renderArchiveNav: start, type=", type);
  archiveType = type;

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("prompt", {
      mode: "archive",
      archiveType: type,
    });
    window.PageStateManager.setActivePage("prompt");
  }

  // アーカイブリストとフッターを描画
  renderArchiveList();
  renderArchiveFooter();

  console.log("renderArchiveNav: end");
}

// アーカイブリストの描画
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

  // ストレージからプロンプトデータを読み込み（PROMPT_KEYから）
  const rawItems = (await load(PROMPT_KEY)) || [];

  // アーカイブされたプロンプトのみをフィルタリング
  const archivedItems = rawItems.filter((item) => item.archived === true);

  // 空のプロンプトは表示しないが、ストレージからは削除しない
  const listData = archivedItems.filter((item) => !isEmptyPrompt(item));

  console.log("[ARCH] アーカイブプロンプトを表示:", {
    totalItems: rawItems.length,
    archivedItems: archivedItems.length,
    displayItems: listData.length,
    hiddenEmptyItems: archivedItems.length - listData.length,
  });

  // HTML骨格
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

  // 行生成またはEmpty State
  if (listData.length === 0) {
    // Empty State: アーカイブが空の場合
    ul.innerHTML = `
      <div class="prompt-empty-state">
        <div class="prompt-empty-state-content">
          <div class="prompt-empty-state-icon">
            <i class="bi bi-terminal"></i>
          </div>
          <h3 class="prompt-empty-state-title">アーカイブされた<br>プロンプトはありません</h3>
          <p class="prompt-empty-state-message">
            プロンプトをアーカイブすると、<br>ここに表示されます。
          </p>
        </div>
      </div>
    `;

    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = ul.querySelector(".prompt-empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
  } else {
    // 通常のアーカイブアイテム表示
    listData.forEach((it, displayIdx) => {
      // 元の配列での実際のインデックスを取得
      const actualIdx = rawItems.findIndex((item) => item.id === it.id);

      const li = document.createElement("li");
      li.className = "archive-item";

      // 左：チェック
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "arch-check";
      cb.dataset.index = actualIdx;
      li.appendChild(cb);

      // 中央：タイトル＋プレビューコンテナ
      const contentDiv = document.createElement("div");
      contentDiv.className = "arch-content";

      // タイトル
      const titleSpan = document.createElement("span");
      titleSpan.className = "arch-title";
      titleSpan.textContent = it.title || "無題";
      contentDiv.appendChild(titleSpan);

      // プロンプト固有：内容プレビュー
      if (it.fields && it.fields.length > 0) {
        const previewSpan = document.createElement("div");
        previewSpan.className = "prompt-preview";
        // 最初の有効なフィールドの内容をプレビューとして表示
        const firstField = it.fields.find(
          (field) => field.text && field.text.trim() !== ""
        );
        const previewText = firstField
          ? firstField.text.length > 100
            ? firstField.text.substring(0, 100) + "..."
            : firstField.text
          : "内容なし";
        previewSpan.textContent = previewText;
        contentDiv.appendChild(previewSpan);
      }

      li.appendChild(contentDiv);

      // 右：復元ボタン
      const btn = document.createElement("button");
      btn.className = "restore-btn";
      btn.innerHTML = '<i class="bi bi-upload"></i>';
      btn.title = "復元";

      console.log("[ARCH] 復元ボタンを作成しました:", {
        displayIndex: displayIdx,
        actualIndex: actualIdx,
        itemTitle: it.title || "無題",
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

        // ボタンを一時的に無効化
        btn.disabled = true;
        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        try {
          console.log("[ARCH] 復元処理を開始します...");

          // プロンプト: archived → false に変更
          const prompts = await load(PROMPT_KEY);
          const target = prompts.find((prompt) => prompt.id === it.id);
          if (target) {
            target.archived = false;
            await save(PROMPT_KEY, prompts);
            // グローバルに最新のpromptsを設定
            window.prompts = prompts;
            console.log(
              "[ARCH] プロンプトを復元しました:",
              target.title || "無題"
            );
          } else {
            console.error(
              "[ARCH] 復元対象のプロンプトが見つかりません:",
              it.id
            );
            // ボタンを再度有効化
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
            return;
          }

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

  // アーカイブフッターを描画
  renderArchiveFooter();
}

// アーカイブフッターの描画
function renderArchiveFooter() {
  console.log("renderArchiveFooter: start");

  const footer = document.querySelector(".memo-footer");
  if (!footer) {
    console.error(".memo-footer要素が見つかりません");
    return;
  }

  // アーカイブモード用のフッターに変更
  footer.innerHTML = `
    <button class="nav-btn back-btn" title="戻る">
      <i class="bi bi-arrow-left-circle"></i>
      <span class="nav-text">戻る</span>
    </button>
    <button class="nav-btn delete-all-btn" title="一括削除">
      <i class="bi bi-trash"></i>
      <span class="nav-text">一括削除</span>
    </button>
  `;

  // 戻るボタンのイベントリスナー
  footer.querySelector(".back-btn").addEventListener("click", () => {
    // アーカイブ表示を解除
    document.querySelector(".memo-content").classList.remove("archive");
    document.querySelector(".sub-archive-nav")?.remove();
    footer.classList.remove("archive");

    // 一覧画面に戻る
    renderList();
  });

  // 一括削除ボタンのイベントリスナー
  footer
    .querySelector(".delete-all-btn")
    .addEventListener("click", async () => {
      const checkedItems = document.querySelectorAll(".arch-check:checked");

      // 削除対象の数を確認
      let deleteCount = 0;
      let confirmMessage = "";

      if (checkedItems.length === 0) {
        // 全削除の場合
        const prompts = await load(PROMPT_KEY);
        const archivedPrompts = prompts.filter((p) => p.archived);
        deleteCount = archivedPrompts.length;

        if (deleteCount === 0) {
          console.log("削除対象のアーカイブプロンプトがありません");
          return;
        }

        confirmMessage = `アーカイブされた全てのプロンプト（${deleteCount}件）を完全に削除しますか？`;
      } else {
        // 選択削除の場合
        deleteCount = checkedItems.length;
        confirmMessage = `選択された${deleteCount}件のプロンプトを完全に削除しますか？`;
      }

      // 確認ダイアログを表示
      window.AppUtils.showSaveConfirmDialog({
        title: "削除の確認",
        message: `${confirmMessage}<br><span style="color: #FF0000; font-weight: bold;">この操作は取り消せません。</span>`,
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
          if (checkedItems.length === 0) {
            // 全削除の場合
            prompts = prompts.filter((p) => !p.archived);
          } else {
            // 選択されたアイテムのみ削除
            const selectedIndices = Array.from(checkedItems).map((cb) =>
              parseInt(cb.dataset.index)
            );
            console.log(`[ARCHIVE] 一括削除対象: ${selectedIndices.length}件`);

            // 選択されたアーカイブプロンプトを削除
            selectedIndices.sort((a, b) => b - a); // 逆順でソート（インデックスずれを防ぐ）
            selectedIndices.forEach((idx) => {
              const archivedPrompt = archivedPrompts[idx];
              const originalIndex = prompts.findIndex(
                (p) => p.id === archivedPrompt.id
              );
              if (originalIndex !== -1) {
                prompts.splice(originalIndex, 1);
              }
            });
          }

          await save(PROMPT_KEY, prompts);
          window.prompts = prompts;
          console.log(`[ARCHIVE] ${deleteCount}件のプロンプトを削除しました`);
          renderArchiveList(); // アーカイブ画面を再描画
        },
        onCancel: () => {
          console.log("[ARCHIVE] 削除をキャンセルしました");
        },
      });
    });

  console.log("renderArchiveFooter: end");
}

// ───────────────────────────────────────
// エクスポート機能
// ───────────────────────────────────────
async function exportAllPrompts() {
  console.log("[PROMPT] exportAllPrompts開始");

  try {
    // アクティブなプロンプト（アーカイブされていないプロンプト）のみをフィルタリング
    const activePrompts = prompts
      ? prompts.filter((prompt) => {
          return !prompt.archived;
        })
      : [];

    console.log("[PROMPT] エクスポート対象:", {
      totalPrompts: prompts ? prompts.length : 0,
      activePrompts: activePrompts.length,
    });

    // アクティブなプロンプトが0件の場合は処理を停止
    if (activePrompts.length === 0) {
      console.log("[PROMPT] エクスポート対象が0件のため処理を停止");
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

    console.log("[PROMPT] ファイル名生成:", fileName);

    // エクスポート用のデータ構造を作成（アクティブなプロンプトのみ）
    const exportData = {
      // 特別なID（この拡張機能からのエクスポートであることを示す）
      extensionId: "sideeffect-v1.0",
      extensionName: "SideEffect",
      extensionVersion: "1.0.0",
      // 既存のデータ
      version: "1.0",
      exportDate: now.toISOString(),
      promptCount: activePrompts.length,
      totalPromptCount: prompts ? prompts.length : 0,
      prompts: activePrompts,
    };

    console.log("[PROMPT] エクスポートデータ作成完了");

    // 正しいハッシュ値を計算（認証用）
    const dataForHash = { ...exportData };
    const hashResult = await generateSecurityHash(dataForHash);

    console.log("[PROMPT] セキュリティハッシュ生成完了");

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

    console.log("[PROMPT] ファイルダウンロード完了");

    // 成功メッセージを表示
    console.log("[PROMPT] 成功メッセージ表示開始");
    showExportSuccessMessage(fileName);
  } catch (error) {
    console.error("[PROMPT] エクスポートエラー:", error);
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
  console.log("[PROMPT] showExportSuccessMessage呼び出し:", {
    fileName: fileName,
    AppUtils: !!window.AppUtils,
  });

  if (window.AppUtils && window.AppUtils.showToast) {
    console.log("[PROMPT] エクスポート成功トーストを表示");
    window.AppUtils.showToast(`エクスポート完了: ${fileName}`, "success");
  } else {
    console.error("[PROMPT] AppUtils.showToastが利用できません");
  }
}

// エクスポートエラーメッセージ
function showExportErrorMessage() {
  console.log("[PROMPT] showExportErrorMessage呼び出し:", {
    AppUtils: !!window.AppUtils,
  });

  if (window.AppUtils && window.AppUtils.showToast) {
    console.log("[PROMPT] エクスポートエラートーストを表示");
    window.AppUtils.showToast("エクスポートに失敗しました", "error");
  } else {
    console.error("[PROMPT] AppUtils.showToastが利用できません");
  }
}

// エクスポートボタンとアーカイブボタンの状態を更新
function updateExportButtonState() {
  const exportBtn = document.querySelector(".encrypt-btn");
  const archiveBtn = document.querySelector("#btn-archive-toggle");

  // アクティブなプロンプト（アーカイブされていないプロンプト）のみをカウント
  const activePrompts = prompts
    ? prompts.filter((prompt) => {
        return !prompt.archived;
      })
    : [];
  const hasActivePrompts = activePrompts.length > 0;

  // エクスポートボタンの状態更新
  if (exportBtn) {
    exportBtn.disabled = !hasActivePrompts;
    exportBtn.title = hasActivePrompts
      ? "バックアップ"
      : "プロンプトはありません";

    // ホバーテキストも更新
    const exportText = exportBtn.querySelector(".nav-text");
    if (exportText) {
      exportText.textContent = hasActivePrompts
        ? "バックアップ"
        : "プロンプトはありません";
    }
  }

  // アーカイブボタンの状態更新（MEMOページと同様に常に有効）
  if (archiveBtn) {
    archiveBtn.disabled = false; // 常に有効（MEMOページと同様）
    archiveBtn.title = "アーカイブへ移動";

    // ホバーテキストも更新
    const archiveText = archiveBtn.querySelector(".nav-text");
    if (archiveText) {
      archiveText.textContent = "アーカイブへ移動";
    }
  }

  console.log("ボタン状態更新:", {
    hasActivePrompts,
    exportDisabled: !hasActivePrompts,
    totalPromptCount: prompts ? prompts.length : 0,
    activePromptCount: activePrompts.length,
  });
}

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderList = renderList;
window.checkForUnsavedChanges = checkForUnsavedChanges;
window.hasUnsavedPromptChanges = hasUnsavedPromptChanges;
window.prompts = prompts;
window.save = save;
window.getCurrentPromptIndex = getCurrentPromptIndex;
window.editingOriginalPrompt = editingOriginalPrompt;
window.autoResize = autoResize;
