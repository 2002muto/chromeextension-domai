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
  new Promise((r) => chrome.storage.local.get(k, (v) => r(v[k])));
const save = (k, v) =>
  new Promise((r) => chrome.storage.local.set({ [k]: v }, r));
const ce = (tag, cls = "", html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.innerHTML = html;
  return e;
};
const draftKey = (promptId, fieldIdx) => `draft_${promptId}_${fieldIdx}`;

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

// ───────────────────────────────────────
// Drag & Drop handlers for prompt list
// ───────────────────────────────────────
function handlePromptDragStart(e) {
  dragPromptIndex = +this.dataset.index;
  dragPromptStarred = prompts[dragPromptIndex]?.star || false;
  console.log(
    "[PRM] drag start:",
    dragPromptIndex,
    "starred:",
    dragPromptStarred
  );
  e.dataTransfer.effectAllowed = "move";
  this.classList.add("dragging");
}
function handlePromptDragOver(e) {
  e.preventDefault();

  // ドロップ先の星状態をチェック
  const dropIndex = +this.dataset.index;
  const dropTargetStarred = prompts[dropIndex]?.star || false;

  // 異なるカテゴリ間のドロップを禁止
  if (dragPromptStarred !== dropTargetStarred) {
    this.classList.add("drag-invalid");
    this.classList.remove("drag-over");
    console.log("[PRM] drag invalid: different categories");
    return;
  }

  this.classList.add("drag-over");
  this.classList.remove("drag-invalid");
}
function handlePromptDragLeave() {
  this.classList.remove("drag-over", "drag-invalid");
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

  const [moved] = prompts.splice(dragPromptIndex, 1);
  prompts.splice(dropIndex, 0, moved);
  await save(PROMPT_KEY, prompts);
  renderList();
}
function handlePromptDragEnd() {
  document
    .querySelectorAll(".prompt-item")
    .forEach((el) =>
      el.classList.remove("drag-over", "dragging", "drag-invalid")
    );
  dragPromptIndex = null;
  dragPromptStarred = null;
}

/* ━━━━━━━━━ 2. 初期化 ━━━━━━━━━ */
document.addEventListener("DOMContentLoaded", async () => {
  prompts = (await load(PROMPT_KEY)) ?? [];
  runs = (await load(RUN_KEY)) ?? [];
  console.log("[INIT] prompts =", prompts.length);

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  renderList();
});

/* ══════════════════════════════════════════════════════
  3. 一覧ビュー   renderList()
══════════════════════════════════════════════════════ */
async function renderList() {
  console.log("[renderList] start");
  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body; // HTMLの直接の親要素を取得

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
    <button class="nav-btn archive-btn">
      <i class="bi bi-archive-fill"></i>
      <span class="nav-text">アーカイブ</span>
    </button>
    <button class="nav-btn extra-btn">
      <i class="bi bi-three-dots"></i>
      <span class="nav-text">予備</span>
    </button>`;

  // アーカイブボタンの機能を実装
  footer.querySelector(".archive-btn").addEventListener("click", () => {
    console.log("アーカイブボタンがクリックされました");
    renderArchiveView();
  });

  // 予備ボタンの機能を実装（将来の拡張用）
  footer.querySelector(".extra-btn").addEventListener("click", () => {
    console.log("予備ボタンがクリックされました - 将来の機能用");
    // 将来的にはバックアップ機能などを実装予定
  });

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
            <i class="bi bi-terminal-x"></i>
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
              <i class="bi bi-archive"></i>
            </div>
            <h3 class="prompt-empty-state-title">
              ${
                hasArchived
                  ? "すべてアーカイブされています"
                  : "新しいプロンプトを作成"
              }
            </h3>
            <p class="prompt-empty-state-message">
              新しいプロンプトを作成するか、<br>アーカイブから復元してください。
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
    activePrompts.forEach((p, i) => {
      // 元の配列でのインデックスを取得
      const originalIndex = prompts.findIndex((prompt) => prompt.id === p.id);

      const li = document.createElement("li");
      li.className = "prompt-item";
      li.draggable = true;
      li.dataset.index = originalIndex; // 元の配列でのインデックスを設定

      // DnD handlers
      li.addEventListener("dragstart", handlePromptDragStart);
      li.addEventListener("dragover", handlePromptDragOver);
      li.addEventListener("dragleave", handlePromptDragLeave);
      li.addEventListener("drop", handlePromptDrop);
      li.addEventListener("dragend", handlePromptDragEnd);

      // ★ star
      const star = document.createElement("i");
      star.className = p.star
        ? "bi bi-star-fill star on"
        : "bi bi-star-fill star off";
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
      li.appendChild(titleElement);

      // 一括入力ボタン
      const runBtn = document.createElement("button");
      runBtn.className = "prompt-action";
      runBtn.textContent = "一括入力";
      runBtn.title = "プロンプトを一括入力";
      runBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log(`一括入力ボタンクリック: ${p.title}`);
        renderRun(originalIndex);
      });
      li.appendChild(runBtn);

      // archive-icon
      const archiveIcon = document.createElement("i");
      archiveIcon.className = "bi bi-archive-fill prompt-archive";
      archiveIcon.title = "アーカイブへ移動";
      archiveIcon.addEventListener("click", async (e) => {
        e.stopPropagation();

        // アニメーション付きでアーカイブ
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
      });
      li.appendChild(archiveIcon);

      // click row → edit（元の配列でのインデックスを使用）
      li.addEventListener("click", () => renderEdit(originalIndex));

      list.appendChild(li);
    });
  }

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  currentPromptIndex = -1; // 一覧画面に戻ったのでリセット
  console.log("[renderList] end");
}

/* ══════════════════════════════════════════════════════
  3.5. アーカイブビュー   renderArchiveView()
══════════════════════════════════════════════════════ */
async function renderArchiveView() {
  console.log("[renderArchiveView] start");
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
            <i class="bi bi-archive-x"></i>
          </div>
          <h3 class="prompt-empty-state-title">アーカイブは空です</h3>
          <p class="prompt-empty-state-message">
            アーカイブされたプロンプトはありません。
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
      const restoreBtn = document.createElement("button");
      restoreBtn.className = "restore-btn";
      restoreBtn.innerHTML = '<i class="bi bi-upload"></i>';
      restoreBtn.title = "復元";
      restoreBtn.addEventListener("click", async () => {
        console.log(`[ARCHIVE] restore prompt: ${p.title}`);
        p.archived = false;
        await save(PROMPT_KEY, prompts);
        window.prompts = prompts;
        renderArchiveView(); // アーカイブ画面を再描画
      });
      li.appendChild(restoreBtn);

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
      window.AppUtils.showConfirmDialog({
        title: "削除の確認",
        message: `${confirmMessage}<br><span style="color: #dc3545; font-weight: bold;">この操作は取り消せません。</span>`,
        onConfirm: async () => {
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
          renderArchiveView(); // アーカイブ画面を再描画
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
  } else {
    obj = prompts[idx];
    console.log("[renderEdit] 既存オブジェクトを編集:", obj);
  }

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  /*━━━━━━━━━━ 1. 旧ヘッダーを除去 ━━━━━━━━━━*/
  root.querySelector(".form-header")?.remove();

  /*━━━━━━━━━━ 2. ヘッダーを "カードの外" に生成 ━━━━━*/
  const head = ce(
    "div",
    "form-header d-flex justify-content-between align-items-center mb-2 px-2",
    `
      <span class="text-success fw-bold">プロンプト編集中</span>
      <button class="btn-dup">
        <i class="bi bi-copy me-1"></i> 複製する
      </button>`
  );
  head.querySelector(".btn-dup").onclick = () => duplicate(idx);

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
    <div id="field-wrap" class="d-flex flex-column gap-3 mb-4"></div>
    <button class="btn-add-field w-100 mb-4">
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
    // 変更があるかチェック
    const hasChanges = checkForUnsavedChanges(obj, isNew);

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

  /*━━━━━━━━━━ 6. プロンプト行生成 ━━━━━━━━━━*/
  function addField(text = "", enabled = true) {
    const row = ce("div", "prompt-field");
    row.draggable = true;

    /* --- DnD handlers (同じ) --- */
    row.addEventListener("dragstart", (e) => {
      const from = [...wrap.children].indexOf(row);
      e.dataTransfer.setData("text/plain", from);
      row.classList.add("dragging");
    });
    row.addEventListener("dragover", (e) => {
      e.preventDefault();
      wrap
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (e) => {
      const from = +e.dataTransfer.getData("text/plain");
      const to = [...wrap.children].indexOf(row);
      if (from === to) return;
      const nodes = [...wrap.children];
      wrap.insertBefore(nodes[from], nodes[to]);
      renumber();
      row.classList.remove("drag-over");
    });
    row.addEventListener("dragend", () =>
      row.classList.remove("dragging", "drag-over")
    );

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
            ${enabled ? "有効" : "無効"}
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
      window.AppUtils.showDeleteConfirmDialog({
        title: "プロンプトフィールドを削除しますか？",
        message: "この操作は元に戻すことができません。",
        onConfirm: async () => {
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
      label.textContent = on ? "有効" : "無効";
      label.classList.toggle("on", on);
      label.classList.toggle("off", !on);
    };

    wrap.appendChild(row);
    renumber();

    // 新しく追加されたフィールドにフェードインアニメーションを適用
    setTimeout(() => {
      row.classList.add("show");
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
    const currentTitle = $(".title-input").value.trim() || "(無題)";
    const clone = structuredClone(prompts[i]);
    clone.id = Date.now();
    clone.title = currentTitle + " (複製)";
    prompts.push(clone);
    await save(PROMPT_KEY, prompts);
    head.remove();
    renderList();
    console.log("[DUP] 複製完了 →", clone.title);
  }
}

/* ══════════════════════════════════════════════════════
  5. 実行ビュー   renderRun()
══════════════════════════════════════════════════════ */
function renderRun(idx) {
  console.log("[renderRun] idx =", idx);
  currentPromptIndex = idx; // 現在のプロンプトインデックスを設定

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
  // プロンプトが0個の場合はEmpty Stateを表示
  if (!obj.fields.length || obj.fields.every((f) => !f.text.trim())) {
    body.innerHTML = `
      <div class="prompt-empty-state">
        <div class="empty-state-content">
          <div class="empty-state-icon">
            <i class="bi bi-pencil-square"></i>
          </div>
          <h3 class="empty-state-title">プロンプトがありません</h3>
          <p class="empty-state-message">
            プロンプトを追加してください。
          </p>
          <div class="empty-state-action">
            <button class="btn-edit-prompt">
              <i class="bi bi-pencil-fill me-1"></i> 編集してプロンプトを追加
            </button>
          </div>
        </div>
      </div>`;

    // 編集ボタンのクリックイベント
    body.querySelector(".btn-edit-prompt").onclick = () => {
      header.remove();
      renderEdit(idx);
    };
  } else {
    // 通常のプロンプト実行画面
    body.innerHTML = `
    <div class="prompt-run-box">
        ${obj.fields.map((f, i) => block(i + 1, f, i)).join("")}
      <button class="btn-exec w-100 mt-3" style="background:#00A31E;color:#fff;">一括入力</button>
      <div class="form-check form-switch mt-3">
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
  if (!obj.fields.length || obj.fields.every((f) => !f.text.trim())) {
    // Empty Stateのフェードインアニメーション
    setTimeout(() => {
      const emptyContent = body.querySelector(".empty-state-content");
      if (emptyContent) {
        emptyContent.classList.add("show");
      }
    }, 100);
    return;
  }

  /* ── フェードインアニメーション ── */
  const runBox = body.querySelector(".prompt-run-box");
  const promptBlocks = body.querySelectorAll(".prompt-block");
  const execBtn = body.querySelector(".btn-exec");
  const formCheck = body.querySelector(".form-check");

  // 初期状態設定（CSS transitionが適用されるまで少し待つ）
  setTimeout(() => {
    // 1. メインボックスをフェードイン
    runBox.classList.add("show");

    // 2. プロンプトブロックを順次フェードイン
    promptBlocks.forEach((block, index) => {
      setTimeout(() => {
        block.classList.add("show");
      }, 150 + index * 100); // 各ブロック100ms間隔
    });

    // 3. 下部ボタンエリアをフェードイン
    setTimeout(() => {
      execBtn.classList.add("show");
      setTimeout(() => {
        formCheck.classList.add("show");
      }, 100);
    }, 300 + promptBlocks.length * 100);
  }, 50);

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

  /* ── 自動リサイズ関数 ── */
  function autoResize(textarea) {
    // 一時的に高さをリセットして正確なscrollHeightを取得
    textarea.style.height = "auto";

    // 最小高さ（80px）と内容に応じた高さの大きい方を設定
    const minHeight = 80;
    const contentHeight = textarea.scrollHeight;
    const newHeight = Math.max(minHeight, contentHeight);

    textarea.style.height = newHeight + "px";
  }

  /* ── COPY / EXEC ハンドラ（★120 ms デバウンス付き・1 定義のみ） ── */
  body.querySelectorAll(".btn-copy").forEach((btn) => {
    let locked = false;
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (locked) return;
      locked = true;

      // clipboardにコピー
      const index = +btn.dataset.idx;
      const extras = [...body.querySelectorAll(".extra")].map((t) => t.value);
      const payload = `${obj.fields[index].text}\n${extras[index]}`.trim();

      try {
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

        console.log("[COPY] clipboardにコピーしました");
      } catch (err) {
        console.error("[COPY] clipboardコピーに失敗:", err);
      }

      setTimeout(() => (locked = false), 120);
    });
  });
  {
    const exec = $(".btn-exec");
    let locked = false;
    exec.addEventListener("click", (e) => {
      e.stopPropagation();
      if (locked) return;
      locked = true;
      send("all");
      setTimeout(() => (locked = false), 120);
    });
  }

  /* ── 内部 send() ── */
  async function send(index) {
    const extras = [...body.querySelectorAll(".extra")].map((t) => t.value);
    const payload =
      index === "all"
        ? obj.fields
            .map((f, i) => (f.on ? `${f.text}\n${extras[i]}`.trim() : ""))
            .filter(Boolean)
            .join("\n\n")
        : `${obj.fields[index].text}\n${extras[index]}`.trim();

    sendToFocused(payload); // ★ ここで 1 回だけ送信

    /* 実行時：ドラフト削除は常に実行、履歴保存はトグルボタンで制御 */
    const histToggleChecked = $("#hist-sw").checked;
    const actionType =
      index === "all" ? "一括入力ボタン" : `COPYボタン${index}`;
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
    } else {
      chrome.storage.local.remove(draftKey(obj.id, index));
      console.log(`[EXECUTION] ${actionType} - 個別ドラフトを削除しました`);
    }

    // 履歴保存はトグルボタンがオンの時のみ実行
    if (index === "all" && histToggleChecked) {
      runs.push({
        id: Date.now(),
        when: new Date().toISOString(),
        title: obj.title,
        text: payload,
        count: obj.fields.filter((f) => f.on).length,
      });
      await save(RUN_KEY, runs);
      console.log(`[EXECUTION] ${actionType} - 履歴に保存しました`);
    } else if (histToggleChecked) {
      console.log(
        `[EXECUTION] ${actionType} - トグルボタンがオンですが一括入力でないため履歴保存はスキップ`
      );
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
    // 他の要素の drag-over クラスを削除
    body
      .querySelectorAll(".prompt-block")
      .forEach((block) => block.classList.remove("drag-over"));
    // 現在の要素に drag-over クラスを追加
    e.currentTarget.classList.add("drag-over");
  }

  function handleRunDragLeave(e) {
    e.currentTarget.classList.remove("drag-over");
  }

  function handleRunDrop(e) {
    e.preventDefault();
    const fromIndex = +e.dataTransfer.getData("text/plain");
    const toIndex = +e.currentTarget.dataset.index;

    if (fromIndex !== toIndex) {
      console.log("[DRAG DROP] from:", fromIndex, "to:", toIndex);

      // obj.fields の順序を変更
      const movedField = obj.fields.splice(fromIndex, 1)[0];
      obj.fields.splice(toIndex, 0, movedField);

      // プロンプトデータを保存
      save(PROMPT_KEY, prompts);

      // 画面を再描画
      renderRun(idx);
    }

    e.currentTarget.classList.remove("drag-over");
  }

  function handleRunDragEnd(e) {
    e.target.classList.remove("dragging");
    // 全ての drag-over クラスをクリーンアップ
    body
      .querySelectorAll(".prompt-block")
      .forEach((block) => block.classList.remove("drag-over"));
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

  // 新規作成の場合
  if (isNew) {
    // タイトルまたはフィールドに内容があれば変更あり
    return (
      currentTitle !== "" || currentFields.some((f) => f.text.trim() !== "")
    );
  }

  // 既存編集の場合
  // タイトルの変更をチェック
  if (currentTitle !== (originalObj.title || "")) {
    return true;
  }

  // フィールド数の変更をチェック
  if (currentFields.length !== originalObj.fields.length) {
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
      return true;
    }
  }

  return false;
}

// 削除：showSaveConfirmDialog関数はutils.jsのshowSaveConfirmDialogを使用

// 削除：showDeleteConfirmDialog関数はutils.jsのshowDeleteConfirmDialogを使用

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderList = renderList;
window.renderArchiveView = renderArchiveView;
window.checkForUnsavedChanges = checkForUnsavedChanges;
// 削除：showSaveConfirmDialog関数はutils.jsに統合
window.prompts = prompts;
window.save = save;
window.getCurrentPromptIndex = getCurrentPromptIndex;
