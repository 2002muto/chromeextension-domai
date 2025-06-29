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

  body.classList.remove("show");
  void body.offsetWidth;
  body.classList.add("show");

  const list = $(".prompt-list", body);

  /* カード生成 */
  list.replaceChildren(...prompts.map(cardNode));

  // グローバルに最新のpromptsを設定
  window.prompts = prompts;

  /* + ボタン ─ 新規カード */
  $(".btn-add-prompt").onclick = async () => {
    const obj = {
      id: Date.now(),
      title: "",
      star: false,
      fields: [{ text: "", on: true }],
    };
    prompts.push(obj);
    await save(PROMPT_KEY, prompts);
    renderEdit(prompts.length - 1, true);
  };

  currentPromptIndex = -1; // 一覧画面に戻ったのでリセット
  console.log("[renderList] end");

  /*─── 内部：1 カード生成 ───────────────────*/
  function cardNode(o, i) {
    const li = ce("li", "prompt-item");
    li.draggable = true;
    li.dataset.index = i;

    // Drag & drop handlers
    li.addEventListener("dragstart", handlePromptDragStart);
    li.addEventListener("dragover", handlePromptDragOver);
    li.addEventListener("dragleave", handlePromptDragLeave);
    li.addEventListener("drop", handlePromptDrop);
    li.addEventListener("dragend", handlePromptDragEnd);

    const star = ce("i", `bi bi-star-fill star ${o.star ? "on" : "off"}`);
    star.onclick = async () => {
      o.star = !o.star;
      prompts.sort((a, b) => b.star - a.star);
      await save(PROMPT_KEY, prompts);
      renderList();
    };

    const title = ce("span", "prompt-title", o.title || "(無題)");
    title.style.cursor = "pointer";
    title.onclick = () => renderRun(prompts.indexOf(o));

    const exec = ce("button", "prompt-action", "一括出力");
    exec.onclick = () => console.log("[EXEC demo]", o.id);

    const arch = ce(
      "button",
      "prompt-archive",
      '<i class="bi bi-archive-fill"></i>'
    );
    arch.title = "アーカイブへ移動";
    arch.onclick = async () => {
      prompts.splice(prompts.indexOf(o), 1);
      await save(PROMPT_KEY, prompts);
      renderList();
    };

    li.append(star, title, exec, arch);
    return li;
  }
}

/* ══════════════════════════════════════════════════════
  4. 編集ビュー   renderEdit()
══════════════════════════════════════════════════════ */
function renderEdit(idx, isNew = false) {
  console.log("[renderEdit] idx =", idx, "isNew =", isNew);
  currentPromptIndex = idx; // 編集中のプロンプトインデックスを設定

  /* ルート要素取得 */
  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = document.body; // HTMLの直接の親要素を取得
  const obj = prompts[idx];

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
    await save(PROMPT_KEY, prompts);
    head.remove();
    renderList();
  };

  $(".back-btn").onclick = async () => {
    // 変更があるかチェック
    const hasChanges = checkForUnsavedChanges(obj, isNew);

    if (hasChanges) {
      // 変更がある場合は保存確認ダイアログを表示
      showSaveConfirmDialog(
        () => {
          // 保存して戻る
          saveAndGoBack();
        },
        () => {
          // 保存せずに戻る
          discardAndGoBack();
        }
      );
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
      await save(PROMPT_KEY, prompts);
      console.log("[BACK] 変更を保存して戻りました");
      head.remove();
      renderList();
    }

    // 保存せずに戻る処理
    async function discardAndGoBack() {
      if (isNew) {
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
      // おしゃれな削除確認ポップアップを表示
      showDeleteConfirmDialog(
        "プロンプトフィールドを削除しますか？",
        async () => {
          // 1. UI上から削除
          row.remove();
          renumber(); // 削除後にプロンプト番号を再採番

          // 2. データを即座に更新・保存
          const titleValue = $(".title-input").value.trim() || "(無題)";
          const wrap = $("#field-wrap");
          const updatedFields = [...wrap.children].map((w) => ({
            text: w.querySelector(".prompt-field-textarea").value,
            on: w.querySelector(".field-toggle").checked,
          }));

          // 3. プロンプトオブジェクトを更新
          obj.title = titleValue;
          obj.fields = updatedFields;

          // 4. ストレージに保存
          await save(PROMPT_KEY, prompts);

          console.log("プロンプトフィールドを削除して保存しました");
        }
      );
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

      // クリップボードにコピー
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

        console.log("[COPY] クリップボードにコピーしました");
      } catch (err) {
        console.error("[COPY] クリップボードコピーに失敗:", err);
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

/*━━━━━━━━━━ おしゃれな保存確認ダイアログ ━━━━━━━━━━*/
function showSaveConfirmDialog(onSave, onDiscard) {
  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".save-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "save-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-exclamation-circle dialog-icon"></i>
          <h3 class="dialog-title">変更を保存しますか？</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">
            編集内容に変更があります。<br>
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
  if (!document.querySelector("#save-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "save-confirm-styles";
    styles.textContent = `
      .save-confirm-dialog {
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

      .save-confirm-dialog .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .save-confirm-dialog .dialog-content {
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

      .save-confirm-dialog .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .save-confirm-dialog .dialog-icon {
        font-size: 24px;
        color: #3b82f6;
      }

      .save-confirm-dialog .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .save-confirm-dialog .dialog-body {
        padding: 16px 20px;
      }

      .save-confirm-dialog .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
      }

      .save-confirm-dialog .dialog-footer {
        display: flex;
        gap: 8px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
      }

      .save-confirm-dialog .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 70px;
      }

      .save-confirm-dialog .discard-btn {
        background: #dc3545;
        color: #ffffff;
      }

      .save-confirm-dialog .discard-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .save-confirm-dialog .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .save-btn {
        background: #00a31e;
        color: #ffffff;
      }

      .save-confirm-dialog .save-btn:hover {
        background: #008a1a;
        transform: translateY(-1px);
      }

      .save-confirm-dialog .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .save-confirm-dialog .dialog-overlay.closing {
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

/*━━━━━━━━━━ おしゃれな削除確認ダイアログ ━━━━━━━━━━*/
function showDeleteConfirmDialog(message, onConfirm) {
  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".delete-confirm-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "delete-confirm-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <i class="bi bi-exclamation-triangle dialog-icon"></i>
          <h3 class="dialog-title">確認</h3>
        </div>
        <div class="dialog-body">
          <p class="dialog-message">${message}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-btn cancel-btn">キャンセル</button>
          <button class="dialog-btn confirm-btn">削除</button>
        </div>
      </div>
    </div>
  `;

  // スタイルを動的に追加
  if (!document.querySelector("#delete-confirm-styles")) {
    const styles = document.createElement("style");
    styles.id = "delete-confirm-styles";
    styles.textContent = `
      .delete-confirm-dialog {
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

      .dialog-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease-out;
      }

      .dialog-content {
        position: relative;
        background: #2d2d2d;
        border-radius: 12px;
        min-width: 320px;
        max-width: 400px;
        margin: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease-out;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 20px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dialog-icon {
        font-size: 24px;
        color: #f59e0b;
      }

      .dialog-title {
        color: #ffffff;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .dialog-body {
        padding: 16px 20px;
      }

      .dialog-message {
        color: #e2e8f0;
        font-size: 0.95rem;
        line-height: 1.4;
        margin: 0;
      }

      .dialog-footer {
        display: flex;
        gap: 12px;
        padding: 16px 20px 20px;
        justify-content: flex-end;
      }

      .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
      }

      .cancel-btn {
        background: #4a5568;
        color: #ffffff;
      }

      .cancel-btn:hover {
        background: #5a6578;
        transform: translateY(-1px);
      }

      .confirm-btn {
        background: #dc3545;
        color: #ffffff;
      }

      .confirm-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .dialog-content.closing {
        animation: slideDown 0.2s ease-in forwards;
      }

      .dialog-overlay.closing {
        animation: fadeOut 0.2s ease-in forwards;
      }

      @keyframes slideDown {
        to {
          opacity: 0;
          transform: translateY(10px) scale(0.98);
        }
      }

      @keyframes fadeOut {
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }

  // body に追加
  document.body.appendChild(dialog);

  // イベントリスナー設定
  const overlay = dialog.querySelector(".dialog-overlay");
  const content = dialog.querySelector(".dialog-content");
  const cancelBtn = dialog.querySelector(".cancel-btn");
  const confirmBtn = dialog.querySelector(".confirm-btn");

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 200);
  }

  // キャンセルボタン
  cancelBtn.addEventListener("click", closeDialog);

  // 確認ボタン
  confirmBtn.addEventListener("click", () => {
    closeDialog();
    onConfirm();
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
    cancelBtn.focus();
  }, 100);
}

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderList = renderList;
window.checkForUnsavedChanges = checkForUnsavedChanges;
window.showSaveConfirmDialog = showSaveConfirmDialog;
window.prompts = prompts;
window.save = save;
window.getCurrentPromptIndex = getCurrentPromptIndex;
