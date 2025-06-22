// /****************************************************************************************
//  * PROMPT 画面  ─ 一覧・編集・実行ビュー  (2024-06 Refactor, DnD v2)
//  * --------------------------------------------------------------------------------------
//  * ✦ 新規カード             →  renderEdit(…, /* isNew */ true)
//  * ✦ タイトルクリック       →  renderRun()
//  * ✦ 編集ビュー             →  保存／保存せず戻る／複製（Copy ボタン）
//  * ✦ 一覧 & 編集 どちらも   →  ドラッグ＆ドロップで並べ替え   ←★ MEMO と同じ UX
//  *
//  * ▸ ステップバイステップで書いたので読みやすさ重視
//  * ▸ console.log を随所に入れてデバッグしやすく
//  * ▸ swapArray/renumber など共通ヘルパをまとめて管理
//  ****************************************************************************************/

/* ━━━━━━━━━━━━━━━━━ 0. 汎用ユーティリティ ━━━━━━━━━━━━━━━━━ */
const PROMPT_KEY = "prompts";
const RUN_KEY = "promptRuns";
const $ = (sel, el = document) => el.querySelector(sel);

const load = (k) =>
  new Promise((r) => chrome.storage.local.get(k, (v) => r(v[k])));

const save = (k, v) =>
  new Promise((r) => chrome.storage.local.set({ [k]: v }, r));

/* フワッとアニメ：カード本体 + 内容 */
function fx(card, content) {
  card.classList.remove("animate");
  content.classList.remove("show");
  void card.offsetWidth; // reflow
  card.classList.add("animate");
  content.classList.add("show");
}

/* 配列内要素を from→to に移動 */
function swapArray(arr, from, to) {
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
}

/* ━━━━━━━━━━━━━━━ 1. グローバル状態 ━━━━━━━━━━━━━━━ */
let prompts = []; // カード一覧
let runs = []; // 実行履歴（UI 未実装）

/* ━━━━━━━━━━━━━━━ 2. 初期化 ━━━━━━━━━━━━━━━ */
document.addEventListener("DOMContentLoaded", async () => {
  prompts = (await load(PROMPT_KEY)) ?? [];
  runs = (await load(RUN_KEY)) ?? [];
  console.log("[INIT] prompts =", prompts.length);
  renderList();
});

/* ═════════════════════════════════════════════════════════════
  3. 一覧ビュー
═════════════════════════════════════════════════════════════*/
async function renderList() {
  console.log("[renderList] start");
  const card = $(".card-container");
  const body = $(".memo-content");
  const footer = $(".memo-footer");

  footer.innerHTML = `
    <button class="footer-btn"><i class="bi bi-archive-fill"></i> アーカイブ</button>
    <button class="footer-btn btn-extra">予備</button>`;

  body.innerHTML = `
    <button class="btn-add-prompt w-100">
      <i class="bi bi-plus-lg"></i> 新しいプロンプトを追加
    </button>
    <ul class="prompt-list"></ul>`;
  const list = $(".prompt-list", body);

  /* カード生成 */
  list.replaceChildren(...prompts.map(cardNode));

  /* + ボタン：新規カード → 編集ビュー(isNew=true) */
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

  fx(card, body);
  console.log("[renderList] end");

  /* ── 内部：カード 1 枚 ───────────────────────── */
  function cardNode(o, _idx) {
    const li = document.createElement("li");
    li.className = "prompt-item";
    li.draggable = true;

    /*▶ DnD – dragstart */
    li.addEventListener("dragstart", (e) => {
      const from = [...list.children].indexOf(li); // 最新 idx
      e.dataTransfer.setData("text/plain", from);
      li.classList.add("dragging");
    });

    /*▶ DnD – dragover / dragleave */
    li.addEventListener("dragover", (e) => {
      e.preventDefault();
      list
        .querySelectorAll(".drag-over")
        .forEach((el) => el.classList.remove("drag-over"));
      li.classList.add("drag-over");
    });
    li.addEventListener("dragleave", () => li.classList.remove("drag-over"));

    /*▶ DnD – drop */
    li.addEventListener("drop", async (e) => {
      const from = +e.dataTransfer.getData("text/plain");
      const to = [...list.children].indexOf(li);
      if (from === to) return;
      console.log(`[DnD] move card ${from} → ${to}`);
      swapArray(prompts, from, to);
      await save(PROMPT_KEY, prompts);
      renderList();
    });

    li.addEventListener("dragend", () =>
      li.classList.remove("dragging", "drag-over")
    );

    /* スター・タイトル・ボタン群 */
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
      '<i class="bi bi-archive-fill"></i>' // ← bi-trash3 から差し替え
    );
    arch.title = "アーカイブへ移動"; // ホバー時のツールチップ
    arch.onclick = async () => {
      /* ★ 今は “削除” と同じ挙動。
           アーカイブ配列に移動したい場合は
           ここで prompts → prompt_arch へ push */
      prompts.splice(prompts.indexOf(o), 1);
      await save(PROMPT_KEY, prompts);
      renderList();
    };

    li.append(star, title, exec, arch);
    return li;
  }
}

/* ═════════════════════════════════════════════════════════════
  4. 編集ビュー
═════════════════════════════════════════════════════════════*/
function renderEdit(idx, isNew = false) {
  console.log("[renderEdit] idx =", idx, "isNew =", isNew);

  /* ルート要素取得 */
  const card = $(".card-container");
  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = card.parentNode; // ← カード親を覚えておく
  const obj = prompts[idx];

  /*━━━━━━━━━━ 1. 旧ヘッダーを除去 ━━━━━━━━━━*/
  root.querySelector(".form-header")?.remove();

  /*━━━━━━━━━━ 2. ヘッダーを “カードの外” に生成 ━━━━━*/
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
     MEMO 入力画面と同じく “カードの手前” に挿入する */
  root.insertBefore(head, card);

  /*━━━━━━━━━━ 3. フッター ━━━━━━━━━━*/
  footer.innerHTML = `
    <button class="footer-btn btn-back">
      <i class="bi bi-caret-left-fill"></i> 保存せず戻る
    </button>
    <button class="footer-btn btn-save" style="background:#00A31E">
      <i class="bi bi-save-fill"></i> 保存
    </button>`;

  /*━━━━━━━━━━ 4. 本体フォーム ━━━━━━━━━━*/
  body.innerHTML = `
    <label class="form-label mb-3">タイトル
      <input  id="e-title"
              type="text"
              class="form-control"
              placeholder="タイトルを入力">
    </label>

    <div id="field-wrap" class="d-flex flex-column gap-3 mb-4"></div>

    <button class="btn-add-field w-100 mb-4">
      ＋ プロンプトを追加
    </button>`;
  $("#e-title").value = obj.title;

  const wrap = $("#field-wrap");
  if (!obj.fields.length) obj.fields = [{ text: "", on: true }];
  obj.fields.forEach((f) => addField(f.text, f.on));
  $(".btn-add-field").onclick = () => addField("", true);

  /*━━━━━━━━━━ 5. 保存 / 戻る ━━━━━━━━━━*/
  $(".btn-save").onclick = async () => {
    obj.title = $("#e-title").value.trim() || "(無題)";
    obj.fields = [...wrap.children].map((w) => ({
      text: w.querySelector(".field-textarea").value,
      on: w.querySelector(".field-toggle").checked,
    }));
    await save(PROMPT_KEY, prompts);
    head.remove();
    renderList();
  };

  $(".btn-back").onclick = async () => {
    if (isNew) {
      const titleEmpty = $("#e-title").value.trim() === "";
      const allEmpty = [...wrap.querySelectorAll(".field-textarea")].every(
        (t) => t.value.trim() === ""
      );
      if (titleEmpty && allEmpty) {
        prompts.splice(idx, 1);
        await save(PROMPT_KEY, prompts);
        console.log("[BACK] 空カードを削除");
      }
    }
    head.remove();
    renderList();
  };

  fx(card, body); // アニメ

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
      <div class="pf-head d-flex align-items-center mb-1">
        <strong></strong>
        <div class="flex-grow-1"></div>
        <div class="form-check form-switch d-flex align-items-center me-2">
          <input class="form-check-input field-toggle" type="checkbox" ${
            enabled ? "checked" : ""
          }>
          <label class="form-check-label toggle-label ms-2 ${
            enabled ? "on" : "off"
          }">
            ${enabled ? "有効" : "無効"}
          </label>
        </div>
        <button class="btn-remove-field"><i class="bi bi-trash3"></i></button>
      </div>
      <textarea rows="4"
                class="form-control field-textarea"
                placeholder="プロンプトを入力">${text}</textarea>`;
    row.querySelector(".btn-remove-field").onclick = () => row.remove();

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
  }

  function renumber() {
    [...wrap.children].forEach(
      (el, i) =>
        (el.querySelector("strong").textContent = `プロンプト ${i + 1}`)
    );
  }

  /*━━━━━━━━━━ 7. 複製処理 ━━━━━━━━━━*/
  async function duplicate(i) {
    const currentTitle = $("#e-title").value.trim() || "(無題)";
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
/*==============================================================
 *  5.  実行ビュー
==============================================================*/
function renderRun(idx) {
  const card = $(".card-container"),
    body = $(".memo-content"),
    footer = $(".memo-footer"),
    root = card.parentNode;
  const obj = prompts[idx];

  /* header */
  root.querySelector(".form-header")?.remove();
  const h = ce(
    "div",
    "form-header",
    `
    <h2 class="fw-bold fs-4 mb-0">${obj.title}</h2>
    <button class="btn btn-success btn-sm px-3"><i class="bi bi-pencil-fill me-1"></i>編集</button>`
  );
  h.querySelector("button").onclick = () => {
    h.remove();
    renderEdit(idx);
  };
  root.insertBefore(h, card);

  /* footer */
  footer.innerHTML = `
    <button class="footer-btn btn-back-run"><i class="bi bi-caret-left-fill"></i> 戻る</button>
    <button class="footer-btn btn-history"><i class="bi bi-list"></i> 実行履歴</button>`;
  $(".btn-back-run", footer).onclick = () => {
    h.remove();
    renderList();
  };
  $(".btn-history", footer).onclick = () => console.log("履歴画面は後日");

  /* body */
  body.innerHTML = `
    <div class="prompt-run-box">
      ${obj.fields.map((f, i) => block(i + 1, f)).join("")}
      <button class="btn-exec w-100 mt-3" style="background:#00A31E;color:#fff;">一括入力</button>
      <div class="form-check form-switch mt-3">
        <input class="form-check-input" type="checkbox" id="hist-sw" checked>
        <label class="form-check-label text-success" for="hist-sw">履歴を保存</label>
      </div>
    </div>`;
  fx(card, body);

  /* 個別 COPY */
  body.querySelectorAll(".btn-copy").forEach((b, i) => {
    b.onclick = () =>
      sendToFocused(
        `${obj.fields[i].text}\n${
          body.querySelectorAll(".extra")[i].value
        }`.trim()
      );
  });

  /* 一括入力 */
  $(".btn-exec", body).onclick = async () => {
    const txt = obj.fields
      .map((f, i) => {
        if (!f.on) return "";
        const ex = body.querySelectorAll(".extra")[i].value;
        return `${f.text}\n${ex}`.trim();
      })
      .filter(Boolean)
      .join("\n\n");
    sendToFocused(txt);

    if ($("#hist-sw").checked) {
      runs.push({
        id: Date.now(),
        when: new Date().toISOString(),
        title: obj.title,
        text: txt,
        count: obj.fields.filter((f) => f.on).length,
      });
      await save(RUN_KEY, runs);
    }
  };

  function block(no, f) {
    return `
      <div class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <strong>プロンプト${no}</strong>
          <button class="btn btn-outline-light btn-sm btn-copy"><i class="bi bi-clipboard"></i> COPY</button>
        </div>
        <p class="mb-2" style="white-space:pre-line;">${f.text}</p>
        <textarea class="form-control extra" rows="3" placeholder="プロンプト追加入力（都度）"></textarea>
      </div>`;
  }

  function sendToFocused(text) {
    chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
      if (!t.length) return;
      chrome.tabs.sendMessage(t[0].id, { type: "INSERT_CLIP", text });
    });
  }
}

/* ━━━━━━━━━━━━━━━ 6. DOM helper ━━━━━━━━━━━━━━━ */
function ce(tag, cls = "", html = "") {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.innerHTML = html;
  return e;
}
