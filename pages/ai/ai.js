// File: pages/ai/ai.js

// TodoListページのメイン画面をリフレッシュする関数
function renderTodoListMain() {
  console.log("renderTodoListMain: TodoListページをリフレッシュ");

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
  console.log("TodoListページ DOMContentLoaded fired");

  // 現在のページがTodoListページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/ai/")) {
    console.log("現在のページはTodoListページではありません:", currentPage);
    return; // TodoListページでない場合は初期化をスキップ
  }

  // Add event listener to TodoList button
  const todoListButton = document.getElementById("btn-todolist");
  if (todoListButton) {
    todoListButton.addEventListener("click", () => {
      console.log("TodoList page button clicked");
      // ヘッダーをクリックした時はメイン画面をリフレッシュ
      renderTodoListMain();
    });
  }

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("todolist", {
      mode: "main",
    });
    window.PageStateManager.setActivePage("todolist");
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
window.renderTodoListMain = renderTodoListMain;
