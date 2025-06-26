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

/* ━━━━━━━━━ 1. グローバル状態 ━━━━━━━━━ */
let prompts = []; // カード一覧
let runs = []; // 実行履歴

/* ━━━━━━━━━ 2. 初期化 ━━━━━━━━━ */
document.addEventListener("DOMContentLoaded", async () => {
  prompts = (await load(PROMPT_KEY)) ?? [];
  runs = (await load(RUN_KEY)) ?? [];
  console.log("[INIT] prompts =", prompts.length);
  renderList();
});

/* ══════════════════════════════════════════════════════
   3. 一覧ビュー   renderList()
══════════════════════════════════════════════════════ */
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

  fx(card, body);
  console.log("[renderList] end");

  /*─── 内部：1 カード生成 ───────────────────*/
  function cardNode(o) {
    const li = ce("li", "prompt-item");
    li.draggable = true;

    /* DnD 省略（元コードそのまま） … */

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
  /* … 元コードと同じ（編集機能のロジックは変更なし） … */
}

/* ══════════════════════════════════════════════════════
   5. 実行ビュー   renderRun()
══════════════════════════════════════════════════════ */
function renderRun(idx) {
  console.log("[renderRun] idx =", idx);

  const card = $(".card-container");
  const body = $(".memo-content");
  const footer = $(".memo-footer");
  const root = card.parentNode;
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
  root.insertBefore(header, card);

  /* ── フッター ── */
  footer.innerHTML = `
    <button class="footer-btn btn-back-run"><i class="bi bi-caret-left-fill"></i> 戻る</button>
    <button class="footer-btn btn-history"><i class="bi bi-list"></i> 実行履歴</button>`;
  $(".btn-back-run").onclick = () => {
    header.remove();
    renderList();
  };
  $(".btn-history").onclick = () => console.log("[TODO] 履歴画面");

  /* ── 本体 HTML ── */
  body.innerHTML = `
    <div class="prompt-run-box">
      ${obj.fields.map((f, i) => block(i + 1, f)).join("")}
      <button class="btn-exec w-100 mt-3" style="background:#00A31E;color:#fff;">一括入力</button>
      <div class="form-check form-switch mt-3">
        <input id="hist-sw" class="form-check-input" type="checkbox" checked>
        <label for="hist-sw" class="form-check-label text-success">履歴を保存</label>
      </div>
    </div>`;
  fx(card, body);

  /* ── ドラフト復元・保存 ── */
  body.querySelectorAll("textarea.extra").forEach((ta, i) => {
    chrome.storage.local.get(draftKey(obj.id, i), (res) => {
      if (res[draftKey(obj.id, i)]) ta.value = res[draftKey(obj.id, i)];
    });
    ta.addEventListener("input", () =>
      chrome.storage.local.set({ [draftKey(obj.id, i)]: ta.value })
    );
  });

  /* ── COPY / EXEC ハンドラ（★120 ms デバウンス付き・1 定義のみ） ── */
  body.querySelectorAll(".btn-copy").forEach((btn) => {
    let locked = false;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (locked) return;
      locked = true;
      send(+btn.dataset.idx);
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

    /* ドラフト削除・履歴保存は元コードそのまま … */
    if (index === "all") {
      obj.fields.forEach((_, i) =>
        chrome.storage.local.remove(draftKey(obj.id, i))
      );
    } else {
      chrome.storage.local.remove(draftKey(obj.id, index));
    }
    if (index === "all" && $("#hist-sw").checked) {
      runs.push({
        id: Date.now(),
        when: new Date().toISOString(),
        title: obj.title,
        text: payload,
        count: obj.fields.filter((f) => f.on).length,
      });
      await save(RUN_KEY, runs);
    }
  }

  /* ── ブロック生成 ── */
  function block(no, f) {
    return `<div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong>プロンプト ${no}</strong>
        <button class="btn-copy" data-idx="${no - 1}">
          <i class="bi bi-copy"></i> COPY
        </button>
      </div>
      <p class="mb-2" style="white-space:pre-line;">${f.text}</p>
      <textarea rows="3" class="form-control extra" placeholder="プロンプト追加入力（都度）"></textarea>
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
