// File: pages/ai/ai.js

// AIページのメイン画面をリフレッシュする関数
function renderAIMain() {
  console.log("renderAIMain: AIページをリフレッシュ");

  // ページをリフレッシュ（必要に応じてここに特別な処理を追加）
  const main = document.querySelector("main");
  if (main) {
    main.classList.remove("show");
    void main.offsetWidth;
    main.classList.add("show");
  }
}

// DOMContentLoaded後に初期化
window.addEventListener("DOMContentLoaded", () => {
  console.log("AI page loaded");

  // 初回表示アニメーション
  const main = document.querySelector("main");
  if (main) {
    main.classList.add("show");
  }
});

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderAIMain = renderAIMain;
