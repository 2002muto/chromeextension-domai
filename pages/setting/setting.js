// File: pages/setting/setting.js

// 設定ページをデフォルト状態に戻す関数
function renderSettingMain() {
  console.log("renderSettingMain: 設定ページをデフォルト状態に戻す");

  const card = document.querySelector(".setting-card");

  // すべての設定ボタンの active を削除
  document
    .querySelectorAll(".setting-btn")
    .forEach((b) => b.classList.remove("active"));

  // デフォルトのdetail-panelを表示（設定ページには常に1つのパネルがある）
  const defaultPanel = document.querySelector(".detail-panel");
  if (defaultPanel) {
    // すべてのパネルからshowを削除してから、デフォルトパネルにshowを追加
    document
      .querySelectorAll(".detail-panel")
      .forEach((p) => p.classList.remove("show"));
    defaultPanel.classList.add("show");
  }

  // 最初の設定ボタンを active にする（存在する場合）
  const firstBtn = document.querySelector(".setting-btn");
  if (firstBtn) {
    firstBtn.classList.add("active");
  }

  // カードアニメーションをリフレッシュ
  if (card) {
    card.classList.remove("show");
    void card.offsetWidth;
    card.classList.add("show");
  }
}

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

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderSettingMain = renderSettingMain;
