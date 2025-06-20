// File: pages/setting/setting.js

window.addEventListener("DOMContentLoaded", () => {
  const card = document.querySelector(".setting-card");
  const gearBtn = document.getElementById("btn-setting");

  // ─── 初回ロード時にも一度アニメ再生 ───
  card.classList.remove("show");
  // 強制リフロー
  void card.offsetWidth;
  card.classList.add("show");

  // ─── 歯車アイコンを押すと必ず再アニメ ───
  gearBtn.addEventListener("click", (e) => {
    e.preventDefault(); // リンク遷移を抑制
    card.classList.remove("show"); // リセット
    void card.offsetWidth; // 再リフロー
    card.classList.add("show"); // 再付与で必ず動く
  });

  // ─── 以下、既存のメニュー切替＋詳細パネル表示 ───
  document.querySelectorAll(".setting-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // ボタンの active 切替
      document
        .querySelectorAll(".setting-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 全 detail-panel を一旦 hidden
      document
        .querySelectorAll(".detail-panel")
        .forEach((p) => p.classList.remove("show"));
      // クリックしたボタンに対応するパネルを show
      const targetId = btn.dataset.target;
      document.querySelector(targetId)?.classList.add("show");
    });
  });
});
