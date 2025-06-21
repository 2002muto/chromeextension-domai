// pages/prompt/prompt.js
/******************************************************************
 * PROMPT 画面 2024-06-xx
 *   ✔ ＋ボタン   → 編集ビュー（プロンプト編集中）
 *   ✔ タイトル   → 実行ビュー
 *   ✔ chrome.storage.local 保存 & “ふわっ” アニメ共通
 ******************************************************************/

/* ────────── 共通定数・ユーティリティ ────────── */
const PROMPT_KEY = "prompts"; // プロンプト保存
const RUN_KEY = "promptRuns"; // 実行履歴保存
const $ = (s, p = document) => p.querySelector(s);

const load = (k) =>
  new Promise((r) => chrome.storage.local.get(k, (v) => r(v[k])));
const save = (k, v) =>
  new Promise((r) => chrome.storage.local.set({ [k]: v }, r));

function fx(card, body) {
  // “ふわっ” 再演出
  card.classList.remove("animate");
  body.classList.remove("show");
  void card.offsetWidth;
  card.classList.add("animate");
  body.classList.add("show");
}

/* ────────── グローバル状態 ────────── */
let prompts = []; // 一覧 / 編集 / 実行ビュー共通
let runs = []; // 実行履歴（UI は後日）

/* ────────── 初期化 ────────── */
document.addEventListener("DOMContentLoaded", async () => {
  prompts = (await load(PROMPT_KEY)) ?? [];
  runs = (await load(RUN_KEY)) ?? [];
  renderList();
});

/*==============================================================
 * 1) 一覧ビュー（カード）
 ==============================================================*/
async function renderList() {
  const card = $(".card-container"),
    body = $(".memo-content");
  const footer = $(".memo-footer");

  /* footer - 一覧モードへ戻す */
  footer.innerHTML = `
    <button class="footer-btn"><i class="bi bi-archive-fill"></i> アーカイブ</button>
    <button class="footer-btn btn-extra">予備</button>
  `;

  /* body に骨格 */
  body.innerHTML = `
    <button class="btn-add-prompt w-100">
      <i class="bi bi-plus-lg"></i> 新しいプロンプトを追加
    </button>
    <ul class="prompt-list"></ul>
  `;
  const list = $(".prompt-list", body);

  /* カード描画 */
  list.innerHTML = "";
  prompts.forEach((o, i) => list.appendChild(cardNode(o, i)));

  /* + ボタン → 新規作成して **編集ビュー** へ */
  $(".btn-add-prompt", body).onclick = async () => {
    const obj = {
      id: Date.now(),
      title: "(新規)",
      star: false,
      fields: [{ text: "", on: true }],
    };
    prompts.push(obj);
    await save(PROMPT_KEY, prompts);
    renderEdit(prompts.length - 1); // ★ 編集ビューへ遷移
  };

  fx(card, body);

  /* 内部：カード１枚生成 */
  function cardNode(o, idx) {
    const li = document.createElement("li");
    li.className = "prompt-item";

    const star = ce("i", `bi bi-star-fill star ${o.star ? "on" : "off"}`);
    star.onclick = async () => {
      o.star = !o.star;
      prompts.splice(idx, 1); // 一旦抜く
      o.star ? prompts.unshift(o) : prompts.push(o);
      await save(PROMPT_KEY, prompts);
      renderList();
    };

    const t = ce("span", "prompt-title", o.title);
    t.style.cursor = "pointer";
    t.onclick = () => renderRun(idx); // ★ 実行ビュー

    const exec = ce("button", "prompt-action", "一括出力");
    exec.onclick = () => console.log("[demo] output", o);

    const arch = ce(
      "button",
      "prompt-archive",
      '<i class="bi bi-archive-fill"></i>'
    );
    arch.onclick = async () => {
      prompts.splice(idx, 1);
      await save(PROMPT_KEY, prompts);
      renderList();
    };

    [star, t, exec, arch].forEach((el) => li.appendChild(el));
    return li;
  }
}

/*==============================================================
 * 2) 編集ビュー（プロンプト編集中）
 ==============================================================*/
function renderEdit(idx) {
  const card = $(".card-container"),
    body = $(".memo-content"),
    footer = $(".memo-footer"),
    root = card.parentNode;
  const obj = prompts[idx];

  /* ヘッダー（カード外）*/
  root.querySelector(".form-header")?.remove();
  const head = ce(
    "div",
    "form-header",
    `
    <span class="text-success fw-bold">プロンプト編集中</span>
    <button class="btn btn-success btn-sm">複製する</button>`
  );
  head.querySelector("button").onclick = async () => {
    const c = structuredClone(obj);
    c.id = Date.now();
    c.title += "(複製)";
    prompts.push(c);
    await save(PROMPT_KEY, prompts);
    renderList();
  };
  root.insertBefore(head, card);

  /* footer を編集モードに */
  footer.innerHTML = `
    <button class="footer-btn btn-back"><i class="bi bi-caret-left-fill"></i> 保存せず戻る</button>
    <button class="footer-btn btn-save" style="background:#00A31E"><i class="bi bi-save-fill"></i> 保存</button>`;
  $(".btn-back", footer).onclick = () => {
    head.remove();
    renderList();
  };

  body.innerHTML = `
    <label class="form-label w-100 mb-3">
      タイトル
      <input type="text" id="e-title" class="form-control">
    </label>
    <div id="field-wrap" class="d-flex flex-column gap-3 mb-4"></div>
    <button class="btn-add-field w-100 mb-4">＋ プロンプトを追加</button>`;
  $("#e-title").value = obj.title;

  const wrap = $("#field-wrap");
  if (!obj.fields.length) obj.fields = [{ text: "", on: true }];
  obj.fields.forEach((f) => addField(f.text, f.on));
  $(".btn-add-field").onclick = () => addField("", true);

  $(".btn-save", footer).onclick = async () => {
    obj.title = $("#e-title").value.trim() || "(無題)";
    obj.fields = [...wrap.children].map((w) => ({
      text: w.querySelector(".field-text").value,
      on: w.querySelector(".field-toggle").checked,
    }));
    await save(PROMPT_KEY, prompts);
    head.remove();
    renderList();
  };

  fx(card, body);

  function addField(text, on) {
    const n = wrap.children.length + 1;
    const div = ce(
      "div",
      "prompt-field position-relative",
      `
      <label class="form-label d-flex justify-content-between align-items-center mb-1">
        プロンプト ${n}
        <span><input type="checkbox" class="form-check-input field-toggle" ${
          on ? "checked" : ""
        }>
        <small>${on ? "有効" : "無効"}</small></span>
      </label>
      <textarea rows="3" class="form-control field-text">${text}</textarea>
      <button class="btn-remove-field position-absolute top-0 end-0 mt-1 me-1">
        <i class="bi bi-x-circle-fill text-danger"></i></button>`
    );
    div.querySelector(".field-toggle").onchange = (e) =>
      (div.querySelector("small").textContent = e.target.checked
        ? "有効"
        : "無効");
    div.querySelector(".btn-remove-field").onclick = () => div.remove();
    wrap.appendChild(div);
  }
}

/*==============================================================
 * 3) 実行ビュー
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

/*───────── DOM 生成ヘルパ ─────────*/
function ce(tag, cls = "", html = "") {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = html;
  return el;
}
