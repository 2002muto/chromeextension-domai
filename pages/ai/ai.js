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
  console.log("AI page loaded - COMING SOON");

  // 現在のページがAIページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/ai/")) {
    console.log("現在のページはAIページではありません:", currentPage);
    return; // AIページでない場合は初期化をスキップ
  }

  // アクティブページを確認
  const activePage = window.PageStateManager
    ? window.PageStateManager.getActivePage()
    : null;

  // 現在のページとアクティブページが一致しない場合は、このページをアクティブに設定
  if (activePage !== "ai") {
    console.log("アクティブページをAIに設定:", activePage);
    window.PageStateManager.setActivePage("ai");
  }

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("ai", {
      mode: "main",
    });
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
