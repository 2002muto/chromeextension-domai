// File: pages/setting/setting.js

// 設定ページをデフォルト状態に戻す関数
function renderSettingMain() {
  console.log("renderSettingMain: 設定ページをデフォルト状態に戻す");

  const content = document.querySelector(".memo-content");

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

  // MEMO・PROMPTと同じアニメーション
  if (content) {
    content.classList.remove("show", "animate");
    void content.offsetWidth;
    content.classList.add("animate", "show");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("SETTINGページ DOMContentLoaded fired");

  // 現在のページがSETTINGページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/setting/")) {
    console.log("現在のページはSETTINGページではありません:", currentPage);
    return; // SETTINGページでない場合は初期化をスキップ
  }

  // Add event listener to SETTING button
  const settingButton = document.getElementById("btn-setting");
  if (settingButton) {
    settingButton.addEventListener("click", () => {
      console.log("SETTING page button clicked");
      // ヘッダーをクリックした時はメイン画面をリフレッシュ
      renderSettingMain();
    });
  }

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("setting", {
      mode: "main",
    });
    window.PageStateManager.setActivePage("setting");
  }

  const content = document.querySelector(".memo-content");

  // ─── 初回ロード時にMEMO・PROMPTと同じアニメーション ───
  if (content) {
    content.classList.remove("show", "animate");
    // 強制リフロー
    void content.offsetWidth;
    content.classList.add("animate");

    // 少し遅延してからshowクラスを追加（フェードイン効果）
    setTimeout(() => {
      content.classList.add("show");
    }, 100);
  }

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
      const targetPanel = document.querySelector(targetId);
      if (targetPanel) {
        targetPanel.classList.add("show");
      } else {
        // データターゲットが設定されていない場合はデフォルトパネルを表示
        const defaultPanel = document.querySelector(".detail-panel");
        if (defaultPanel) {
          defaultPanel.classList.add("show");
        }
      }
    });
  });

  // ─── フッターボタンのイベント処理 ───
  const contactBtn = document.querySelector(".setting-contact-btn");
  const shareBtn = document.querySelector(".setting-share-btn");

  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      console.log("お問合せボタンがクリックされました");
      // お問合せ機能の実装
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      console.log("共有ボタンがクリックされました");
      // 共有機能の実装
    });
  }
});

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderSettingMain = renderSettingMain;
