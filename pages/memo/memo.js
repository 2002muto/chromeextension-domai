// File: pages/memo/memo.js

"use strict";

/*
 * pages/memo/memo.js
 * MEMO & Clipboard SPA — 完全版
 * - MEMO一覧: 星 on/off、ドラッグ＆ドロップ、アーカイブアイコン
 * - MEMO入力: 編集フォーム、星トグル、保存・削除
 * - クリップボード: テキストエリアリスト、自動リサイズ、追加・削除
 * - モード切り替えクラスで footer の固定／スクロール制御
 * - console.log でデバッグ容易
 */

const MEMO_KEY = "memos";
const CLIP_KEY = "clips";
let memos = [];
let clips = [];

// ───────────────────────────────────────
// Storage ラッパー（Promise 化）
// ───────────────────────────────────────
function loadStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || []);
    });
  });
}

function saveStorage(key, arr) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: arr }, () => {
      resolve();
    });
  });
}

// ───────────────────────────────────────
// Footer 描画共通化
// ───────────────────────────────────────
function setFooter(mode) {
  const footer = document.querySelector(".memo-footer");
  footer.style.display = "flex";
  if (mode === "list" || mode === "clipboard") {
    footer.innerHTML = `
      <button class="footer-btn"><i class="bi bi-lock-fill"></i> 暗号化フォルダ</button>
      <button class="footer-btn"><i class="bi bi-archive-fill"></i> アーカイブ</button>
    `;
  } else if (mode === "edit") {
    footer.innerHTML = `
      <button class="footer-btn save-btn"><i class="bi bi-save"></i> 保存して戻る</button>
      <button class="footer-btn delete-btn"><i class="bi bi-trash"></i> 削除して戻る</button>
    `;
  }
}

// ───────────────────────────────────────
// ドラッグ＆ドロップハンドラ
// ───────────────────────────────────────
let dragSrcIndex = null;

function handleDragStart(e) {
  dragSrcIndex = Number(this.dataset.index);
  console.log("dragStart index=", dragSrcIndex);
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault(); // drop を許可
  this.classList.add("drag-over");
}

function handleDragLeave() {
  this.classList.remove("drag-over");
}

async function handleDrop(e) {
  e.stopPropagation();
  const dropIndex = Number(this.dataset.index);
  console.log("drop from", dragSrcIndex, "to", dropIndex);
  if (dragSrcIndex === null || dragSrcIndex === dropIndex) return;
  // 配列を移動
  const [moved] = memos.splice(dragSrcIndex, 1);
  memos.splice(dropIndex, 0, moved);
  console.log(
    "new memo order after drop:",
    memos.map((x) => x.title)
  );
  await saveStorage(MEMO_KEY, memos);
  renderListView();
}

function handleDragEnd() {
  document
    .querySelectorAll(".memo-item")
    .forEach((el) => el.classList.remove("drag-over"));
  dragSrcIndex = null;
}

// ───────────────────────────────────────
// MEMO一覧描画
// ───────────────────────────────────────
async function renderListView() {
  console.log("renderListView: start");
  try {
    memos = await loadStorage(MEMO_KEY);

    // 既存のフォームタイトルを削除
    document.querySelector(".form-title")?.remove();

    // サブナビ切替
    document
      .querySelectorAll(".card-nav .nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById("btn-memolist").classList.add("active");

    // フッター：一覧モード
    setFooter("list");

    // カード＆コンテンツフェードイン、モード解除
    const card = document.querySelector(".card-container");
    const content = document.querySelector(".memo-content");
    content.classList.remove("edit-mode", "clipboard-mode");
    [card, content].forEach((el) => {
      el.classList.remove("show");
      void el.offsetWidth;
      el.classList.add("show");
    });

    // 新規追加ボタン ＋ 空のリスト
    content.innerHTML = `
      <button class="btn-new-memo"><i class="bi bi-plus-lg"></i> 新しいMEMOを追加</button>
      <ul class="memo-list"></ul>
    `;
    content
      .querySelector(".btn-new-memo")
      .addEventListener("click", () => renderInputForm());

    // リスト描画
    const ul = content.querySelector(".memo-list");
    ul.innerHTML = "";
    memos.forEach((m, i) => {
      const li = document.createElement("li");
      li.className = "memo-item";
      li.draggable = true;
      li.dataset.index = i;

      // ドラッグイベント登録
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("dragleave", handleDragLeave);
      li.addEventListener("drop", handleDrop);
      li.addEventListener("dragend", handleDragEnd);

      // 星アイコン
      const star = document.createElement("i");
      star.className = m.starred
        ? "bi bi-star-fill star on"
        : "bi bi-star-fill star off";
      star.addEventListener("click", async (e) => {
        e.stopPropagation();
        m.starred = !m.starred;
        console.log(`toggle star id=${m.id} → ${m.starred}`);
        // 並び替え：先頭 or 末尾
        const idx = Number(li.dataset.index);
        memos.splice(idx, 1);
        if (m.starred) memos.unshift(m);
        else memos.push(m);
        console.log(
          "new order after star:",
          memos.map((x) => x.title)
        );
        await saveStorage(MEMO_KEY, memos);
        renderListView();
      });
      li.appendChild(star);

      // タイトル表示
      const span = document.createElement("span");
      span.className = "title";
      span.textContent = m.title;
      li.appendChild(span);

      // アーカイブアイコン
      const archive = document.createElement("i");
      archive.className = "bi bi-archive-fill actions";
      archive.addEventListener("click", (e) => e.stopPropagation());
      li.appendChild(archive);

      // クリックで編集モード
      li.addEventListener("click", () => renderInputForm(m.id));

      ul.appendChild(li);
    });
  } catch (err) {
    console.error("renderListView error:", err);
  }
  console.log("renderListView: end");
}

// ───────────────────────────────────────
// クリップボード描画
// ───────────────────────────────────────
async function renderClipboardView() {
  console.log("renderClipboardView: start");
  try {
    clips = await loadStorage(CLIP_KEY);
    document.querySelector(".form-title")?.remove();

    // サブナビ切替
    document
      .querySelectorAll(".card-nav .nav-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById("btn-clipboard").classList.add("active");

    // フッター：クリップボードモード
    setFooter("clipboard");

    // フェードイン + モードクラス付与
    const card = document.querySelector(".card-container");
    const content = document.querySelector(".memo-content");
    content.classList.remove("edit-mode");
    content.classList.add("clipboard-mode");
    [card, content].forEach((el) => {
      el.classList.remove("show");
      void el.offsetWidth;
      el.classList.add("show");
    });

    // 見出し＋リスト＋追加ボタン＋ヒント
    content.innerHTML = `
      <h2 class="clipboard-header">
        <i class="bi bi-clipboard-fill"></i> フォーム用クリップボード
      </h2>
      <ul class="clipboard-list"></ul>
      <button class="btn-add-clip">+ クリップを追加</button>
      <p class="clipboard-hint">※ 選択中のテキストエリアに入力されます</p>
    `;
    content
      .querySelector(".btn-add-clip")
      .addEventListener("click", async () => {
        clips.push("");
        await saveStorage(CLIP_KEY, clips);
        renderClipboardView();
      });

    // リスト描画
    const ul = content.querySelector(".clipboard-list");
    ul.innerHTML = "";
    clips.forEach((txt, i) => {
      const li = document.createElement("li");
      li.className = "clipboard-item";

      // コピーボタン
      const copy = document.createElement("button");
      copy.className = "clipboard-copy";
      copy.innerHTML = '<i class="bi bi-arrow-left-square-fill"></i>';
      copy.addEventListener("click", () => console.log("copy:", txt));
      li.appendChild(copy);

      // テキストエリア
      const textarea = document.createElement("textarea");
      textarea.setAttribute("rows", "1"); // 常に1行スタート
      textarea.className = "clipboard-textarea";
      textarea.value = txt;
      textarea.placeholder = "テキストを入力";
      // 入力時のみ縦拡張
      textarea.addEventListener("input", () => {
        clips[i] = textarea.value;
        saveStorage(CLIP_KEY, clips);
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
      });
      li.appendChild(textarea);

      // アーカイブボタン（削除）
      const arch = document.createElement("button");
      arch.className = "clipboard-archive";
      arch.innerHTML = '<i class="bi bi-archive-fill"></i>';
      arch.addEventListener("click", async () => {
        clips.splice(i, 1);
        await saveStorage(CLIP_KEY, clips);
        renderClipboardView();
      });
      li.appendChild(arch);
      // リストへ追加してから高さを再計算する
      ul.appendChild(li);
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    });
  } catch (err) {
    console.error("renderClipboardView error:", err);
  }
  console.log("renderClipboardView: end");
}

// ───────────────────────────────────────
// MEMO入力／編集フォーム描画
// ───────────────────────────────────────
async function renderInputForm(id) {
  console.log("renderInputForm: start, id=", id);
  try {
    memos = await loadStorage(MEMO_KEY);

    // サブナビは常に表示
    document.querySelector(".card-nav").style.display = "flex";

    // フッター：編集モード
    setFooter("edit");

    // フォームタイトル
    const card = document.querySelector(".card-container");
    let titleEl = document.querySelector(".form-title");
    if (!titleEl) {
      titleEl = document.createElement("h2");
      titleEl.className = "form-title";
      card.parentNode.insertBefore(titleEl, card);
    }
    titleEl.textContent = id ? "MEMO編集画面" : "MEMO入力画面";

    // フォーム本体
    const content = document.querySelector(".memo-content");
    content.innerHTML = `
      <div class="memo-input-form">
        <div class="input-header">
          <i class="bi bi-star-fill star-input off"></i>
          <input type="text" class="title-input" placeholder="タイトル" />
        </div>
        <textarea class="text-input" placeholder="テキストを入力…"></textarea>
      </div>
    `;

    // 既存データがあればセット
    const starIcon = content.querySelector(".star-input");
    if (id !== undefined) {
      const memo = memos.find((m) => m.id === id);
      if (memo) {
        content.querySelector(".title-input").value = memo.title;
        content.querySelector(".text-input").value = memo.content;
        starIcon.classList.toggle("on", memo.starred);
        starIcon.classList.toggle("off", !memo.starred);
        starIcon.dataset.starred = memo.starred;
      }
    }

    // 編集モードクラス＋フェードイン
    content.classList.remove("clipboard-mode");
    content.classList.add("edit-mode");
    [card, content].forEach((el) => {
      el.classList.remove("show");
      void el.offsetWidth;
      el.classList.add("show");
    });

    // 星トグル
    starIcon.dataset.starred = (starIcon.dataset.starred === "true").toString();
    starIcon.addEventListener("click", () => {
      const cur = starIcon.dataset.starred === "true";
      starIcon.dataset.starred = (!cur).toString();
      starIcon.classList.toggle("on", !cur);
      starIcon.classList.toggle("off", cur);
      console.log("star toggled:", !cur);
    });

    // 保存ボタン
    document.querySelector(".save-btn").addEventListener("click", async () => {
      const title =
        content.querySelector(".title-input").value.trim() || "無題";
      const body = content.querySelector(".text-input").value.trim();
      const starred = starIcon.dataset.starred === "true";

      if (id !== undefined) {
        // 更新
        const idx = memos.findIndex((m) => m.id === id);
        memos[idx] = { id, title, content: body, starred };
        console.log("update memo:", memos[idx]);
      } else {
        // 新規
        const newMemo = { id: Date.now(), title, content: body, starred };
        memos.push(newMemo);
        console.log("add memo:", newMemo);
      }
      await saveStorage(MEMO_KEY, memos);
      renderListView();
    });

    // 削除／キャンセルボタン
    document
      .querySelector(".delete-btn")
      .addEventListener("click", async () => {
        if (id !== undefined) {
          memos = memos.filter((m) => m.id !== id);
          console.log("delete memo id=", id);
          await saveStorage(MEMO_KEY, memos);
        }
        renderListView();
      });
  } catch (err) {
    console.error("renderInputForm error:", err);
  }
  console.log("renderInputForm: end");
}

// ───────────────────────────────────────
// 初期化
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired");
  document
    .getElementById("btn-memolist")
    .addEventListener("click", renderListView);
  document
    .getElementById("btn-clipboard")
    .addEventListener("click", renderClipboardView);
  await renderListView();
});
