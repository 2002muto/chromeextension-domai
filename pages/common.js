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
