// pages/memo/archive.js
"use strict";

/* ─────────────────────────────────────────────
   Archive (アーカイブ/MEMO・clipboard) モジュール
   ほかの JS と衝突しないよう IIFE で包む
──────────────────────────────────────────── */
(() => {
  /* ストレージキーは memo.js と同値に合わせる */
  const MEMO_KEY = "memos";
  const CLIP_KEY = "clips";
  const CLIP_ARCH_KEY = "clips_arch";
  /* memo or clip どちらを表示しているか */
  let archiveType = "memo"; // "memo" | "clip"

  /* ------------ Storage Helper -------------- */
  const loadStorage = (key) =>
    new Promise((res) =>
      chrome.storage.local.get([key], (o) => res(o[key] || []))
    );

  const saveStorage = (key, arr) =>
    new Promise((res) => chrome.storage.local.set({ [key]: arr }, () => res()));

  /* ───────── アーカイブモード開始 ───────── */
  function startArchiveMode(type = "memo") {
    console.log("[ARCH] startArchiveMode", type);
    archiveType = type;

    /* コンテンツに archive クラスを付与 */
    document.querySelector(".memo-content").classList.add("archive");

    /* ① サブナビを生成 or 更新 */
    renderArchiveNav();

    /* ② リスト本体を描画 */
    renderArchiveList();

    /* ③ アーカイブ用フッターに差し替え */
    renderArchiveFooter();
  }

  /* ----------------------------------------- */
  function renderArchiveNav() {
    let nav = document.querySelector(".sub-archive-nav");
    if (!nav) {
      nav = document.createElement("div");
      nav.className = "sub-archive-nav";
      nav.innerHTML = `
        <div class="nav-btn" id="arch-memo">アーカイブ/MEMO</div>
        <div class="nav-btn" id="arch-clip">アーカイブ/clipboard</div>
      `;
      document
        .querySelector(".memo-content")
        .parentNode.insertBefore(nav, document.querySelector(".memo-content"));
      /* イベント登録は初回だけ */
      nav.querySelector("#arch-memo").addEventListener("click", () => {
        archiveType = "memo";
        setArchiveNavActive(); // active 切替
        renderArchiveList();
      });
      nav.querySelector("#arch-clip").addEventListener("click", () => {
        archiveType = "clip";
        setArchiveNavActive();
        renderArchiveList();
      });
    }
    setArchiveNavActive();
  }

  /* active クラス切替 */
  function setArchiveNavActive() {
    document.querySelectorAll(".sub-archive-nav .nav-btn").forEach((b) => {
      b.classList.toggle(
        "active",
        (archiveType === "memo" && b.id === "arch-memo") ||
          (archiveType === "clip" && b.id === "arch-clip")
      );
    });
  }

  /* ───────── リスト描画 ───────── */
  async function renderArchiveList() {
    console.log("▶ renderArchiveList start", archiveType);

    /* 1) 対象データ取得 */
    const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY;
    const items = await loadStorage(key);
    const list =
      archiveType === "memo" ? items.filter((m) => m.archived) : items;

    /* 2) HTML 骨格 */
    const content = document.querySelector(".memo-content");
    content.innerHTML = `
    <label class="select-all">
      <input type="checkbox" class="arch-select-all"> 全て選択する
    </label>
    <ul class="archive-list"></ul>`;
    const ul = content.querySelector(".archive-list");

    /* 全選択 */
    content.querySelector(".arch-select-all").onchange = (e) =>
      ul
        .querySelectorAll(".arch-check")
        .forEach((c) => (c.checked = e.target.checked));

    /* 3) 行生成 */
    list.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "archive-item";

      /* 左：チェック */
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "arch-check";
      cb.dataset.index = idx;
      li.appendChild(cb);

      /* 中：タイトル／本文 */
      const span = document.createElement("span");
      span.className = "arch-title";
      span.textContent = archiveType === "memo" ? it.title || "無題" : it;
      li.appendChild(span);

      /* 右：復元ボタン */
      const btn = document.createElement("button");
      btn.className = "restore-btn";
      btn.innerHTML = '<i class="bi bi-upload"></i>';
      btn.title = "復元";
      btn.onclick = async () => {
        console.log("[ARCH] restore idx=", idx, "type=", archiveType);

        if (archiveType === "memo") {
          /* MEMO: archived → false */
          const memos = await loadStorage(MEMO_KEY);
          const target = memos.find((m) => m.id === it.id);
          if (target) target.archived = false;
          await saveStorage(MEMO_KEY, memos);
        } else {
          /* CLIP: アーカイブ配列 → 現役配列へ移動 */
          const act = await loadStorage(CLIP_KEY);
          const arch = await loadStorage(CLIP_ARCH_KEY);
          act.push(arch.splice(idx, 1)[0]); // ① act に追加 & arch から削除
          await saveStorage(CLIP_KEY, act); // ② act 保存
          await saveStorage(CLIP_ARCH_KEY, arch); // ③ arch 保存
        }
        renderArchiveList(); // ④ 再描画
      };
      li.appendChild(btn);

      ul.appendChild(li);
    });
    console.log("▶ renderArchiveList end");
  }
  /*─────────────────────────────────────────*/

  /* ───────── フッター描画 ───────── */
  function renderArchiveFooter() {
    console.log("[ARCH] renderArchiveFooter start");
    const footer = document.querySelector(".memo-footer");
    footer.classList.add("archive");
    footer.style.display = "flex";
    footer.innerHTML = `
      <button class="nav-btn back-btn">
        <i class="bi bi-arrow-left-circle"></i>
        <span class="nav-text">戻る</span>
      </button>
      <button class="nav-btn delete-all-btn">
        <i class="bi bi-trash"></i>
        <span class="nav-text">一括削除</span>
      </button>`;

    /* 戻る */
    footer.querySelector(".back-btn").onclick = () => {
      document.querySelector(".memo-content").classList.remove("archive");
      document.querySelector(".sub-archive-nav")?.remove();
      footer.classList.remove("archive");
      renderListView(); // MEMOに戻す
    };

    /* 一括削除 */
    footer.querySelector(".delete-all-btn").onclick = async () => {
      const key = archiveType === "memo" ? MEMO_KEY : CLIP_ARCH_KEY; // ★変更
      await saveStorage(key, []);
      renderArchiveList();
    };
  }

  /* Public API として window へ */
  window.startArchiveMode = startArchiveMode;
})();
