// File: pages/common.js
// ナビゲーションボタンのクリック時展開機能

document.addEventListener("DOMContentLoaded", function () {
  // 全てのナビゲーションボタンを取得
  const navButtons = document.querySelectorAll(".nav-btn");

  navButtons.forEach((button) => {
    // クリック時のイベントリスナーを追加
    button.addEventListener("click", function (e) {
      // 現在のページへのリンクの場合はページ遷移を防ぐ
      if (this.classList.contains("active")) {
        e.preventDefault();

        // アクティブなボタンがクリックされた場合、一覧画面に戻る
        const currentPage = window.location.pathname;

        if (currentPage.includes("/memo/") && this.id === "btn-memo") {
          // MEMOページでMEMOボタンがクリックされた場合
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        } else if (
          currentPage.includes("/prompt/") &&
          this.id === "btn-prompt"
        ) {
          // PROMPTページでPROMPTボタンがクリックされた場合
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        } else if (currentPage.includes("/ai/") && this.id === "btn-ai") {
          // AIページでAIボタンがクリックされた場合
          if (typeof window.renderAIMain === "function") {
            window.renderAIMain();
          } else if (typeof renderAIMain === "function") {
            renderAIMain();
          }
        } else if (
          currentPage.includes("/setting/") &&
          this.id === "btn-setting"
        ) {
          // 設定ページで設定ボタンがクリックされた場合
          if (typeof window.renderSettingMain === "function") {
            window.renderSettingMain();
          } else if (typeof renderSettingMain === "function") {
            renderSettingMain();
          }
        }
      }

      // 展開状態のクラスを追加
      this.classList.add("expanded");

      // data-click-tooltip属性がある場合（AI専用メッセージ）
      if (this.hasAttribute("data-click-tooltip")) {
        this.classList.add("clicked");
      }

      // 2秒後にクラスを削除
      setTimeout(() => {
        this.classList.remove("expanded");
        this.classList.remove("clicked");
      }, 2000);
    });
  });
});
