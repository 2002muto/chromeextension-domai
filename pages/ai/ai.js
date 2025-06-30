// File: pages/ai/ai.js

// AIページのメイン画面をリフレッシュする関数
function renderAIMain() {
  console.log("renderAIMain: AIページをリフレッシュ");

  // ページをリフレッシュ（COMING SOON画面のアニメーションをリスタート）
  const main = document.querySelector(".ai-main");
  if (main) {
    main.classList.remove("show");

    // カードのアニメーションもリセット
    const card = main.querySelector(".coming-soon-card");
    if (card) {
      card.style.animation = "none";
      void card.offsetWidth; // リフローを強制
      card.style.animation = "";
    }

    void main.offsetWidth; // リフローを強制
    main.classList.add("show");
  }
}

// DOMContentLoaded後に初期化
window.addEventListener("DOMContentLoaded", () => {
  console.log("AIページ DOMContentLoaded fired");

  // 現在のページがAIページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/ai/")) {
    console.log("現在のページはAIページではありません:", currentPage);
    return; // AIページでない場合は初期化をスキップ
  }

  // Add event listener to AI button
  const aiButton = document.getElementById("btn-ai");
  if (aiButton) {
    aiButton.addEventListener("click", () => {
      console.log("AI page button clicked");
      // ヘッダーをクリックした時はメイン画面をリフレッシュ
      renderAIMain();
    });
  }

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("ai", {
      mode: "main",
    });
    window.PageStateManager.setActivePage("ai");
  }

  // 初回表示アニメーション
  const main = document.querySelector(".ai-main");
  if (main) {
    // 少し遅延させてからアニメーション開始
    setTimeout(() => {
      main.classList.add("show");
    }, 100);
  }
});

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderAIMain = renderAIMain;
