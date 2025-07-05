"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const IFRAME_KEY = "iframes";
let iframes = [];

// ───────────────────────────────────────
// DeclarativeNetRequest制御
// ───────────────────────────────────────
let iframeRulesEnabled = true;

// ルールの有効/無効を切り替え
async function toggleIframeRules(enable) {
  console.log(`[IFRAME] Toggling iframe rules: ${enable}`);

  try {
    const response = await chrome.runtime.sendMessage({
      type: "TOGGLE_IFRAME_RULES",
      enable: enable,
    });

    if (response.success) {
      iframeRulesEnabled = enable;
      console.log(`[IFRAME] Iframe rules ${enable ? "enabled" : "disabled"}`);
    }
  } catch (error) {
    console.error("[IFRAME] Failed to toggle iframe rules:", error);
  }
}

// 特定のドメインのルールを動的に追加
async function addDynamicIframeRule(domain) {
  console.log(`[IFRAME] Adding dynamic iframe rule for: ${domain}`);

  try {
    const response = await chrome.runtime.sendMessage({
      type: "ADD_DYNAMIC_IFRAME_RULE",
      domain: domain,
    });

    if (response.success) {
      console.log(
        `[IFRAME] Dynamic rule added for ${domain} with ID: ${response.ruleId}`
      );
      return response.ruleId;
    }
  } catch (error) {
    console.error(`[IFRAME] Failed to add dynamic rule for ${domain}:`, error);
  }
  return null;
}

// URLからドメインを抽出
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    console.error("[IFRAME] Failed to extract domain:", error);
    return null;
  }
}

// ───────────────────────────────────────
// Promise-wrapped Chrome Storage API
// ───────────────────────────────────────
function loadStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (res) => resolve(res[key] || []));
  });
}

function saveStorage(key, arr) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: arr }, () => resolve());
  });
}

// ───────────────────────────────────────
// 初期化
// ───────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  console.log("IFRAMEページ DOMContentLoaded fired");

  // 現在のページがIFRAMEページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/iframe/")) {
    console.log("現在のページはIFRAMEページではありません:", currentPage);
    return; // IFRAMEページでない場合は初期化をスキップ
  }

  // iframeルールを有効化
  await toggleIframeRules(true);

  // URL入力とiframe表示の初期化
  initializeIframePage();
});

// ───────────────────────────────────────
// IFRAMEページの初期化
// ───────────────────────────────────────
function initializeIframePage() {
  console.log("IFRAMEページを初期化中...");

  const searchInput = document.querySelector(".search-input");
  const submitBtn = document.querySelector(".search-submit-btn");
  const iframeDisplay = document.getElementById("iframe-display");
  const iframeDisplayContainer = document.getElementById(
    "iframe-display-container"
  );
  const emptyState = document.getElementById("iframe-empty-state");
  const emptyStateContent = emptyState?.querySelector(
    ".iframe-empty-state-content"
  );
  const urlInputRow = document.querySelector(".iframe-url-input-row");

  if (
    !searchInput ||
    !submitBtn ||
    !iframeDisplay ||
    !iframeDisplayContainer ||
    !emptyState ||
    !urlInputRow
  ) {
    console.error("必要な要素が見つかりません:", {
      searchInput: !!searchInput,
      submitBtn: !!submitBtn,
      iframeDisplay: !!iframeDisplay,
      iframeDisplayContainer: !!iframeDisplayContainer,
      emptyState: !!emptyState,
      urlInputRow: !!urlInputRow,
    });
    return;
  }

  // 初期状態: Empty State表示、iframe非表示
  showEmptyState();
  iframeDisplayContainer.style.display = "none";

  // 検索送信ボタンのクリックイベント
  submitBtn.addEventListener("click", () => {
    console.log("検索ボタンがクリックされました");
    performSearch();
  });

  // Enterキーでの検索
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("Enterキーが押されました");
      performSearch();
    }
  });

  // 検索入力フィールドのフォーカス
  searchInput.addEventListener("focus", () => {
    searchInput.select();
  });

  // 入力欄の内容が空になったらEmpty Stateを再表示
  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      showEmptyState();
      iframeDisplayContainer.style.display = "none";
      iframeDisplay.src = "";
      // 入力行を表示
      urlInputRow.style.display = "flex";
    }
  });

  // 新しい検索ボタンのイベントリスナー
  const newSearchBtn = document.getElementById("new-search-btn");
  if (newSearchBtn) {
    newSearchBtn.addEventListener("click", () => {
      console.log("新しい検索ボタンがクリックされました");
      // 入力行を表示、iframeを非表示
      urlInputRow.style.display = "flex";
      iframeDisplayContainer.style.display = "none";
      iframeDisplay.src = "";
      // 検索入力欄をクリアしてフォーカス
      searchInput.value = "";
      searchInput.focus();
      // Empty Stateを表示
      showEmptyState();
    });
  }

  // 初期状態で検索入力フィールドにフォーカス
  setTimeout(() => {
    searchInput.focus();
    showEmptyState();
  }, 100);

  function showEmptyState() {
    console.log("Empty Stateを表示");
    emptyState.style.display = "flex";
    setTimeout(() => {
      emptyStateContent?.classList.add("show");
    }, 100);
    // 入力行を表示
    urlInputRow.style.display = "flex";
  }

  function hideEmptyState() {
    console.log("Empty Stateを非表示");
    emptyStateContent?.classList.remove("show");
    setTimeout(() => {
      emptyState.style.display = "none";
    }, 200);
    // 入力行を非表示
    urlInputRow.style.display = "none";
  }

  console.log("IFRAMEページの初期化完了");
}

// ───────────────────────────────────────
// 検索またはURLをiframeに読み込む
// ───────────────────────────────────────
async function performSearch() {
  const searchInput = document.querySelector(".search-input");
  const iframeDisplay = document.getElementById("iframe-display");
  const submitBtn = document.querySelector(".search-submit-btn");
  const iframeDisplayContainer = document.getElementById(
    "iframe-display-container"
  );
  const emptyState = document.getElementById("iframe-empty-state");
  const emptyStateContent = emptyState?.querySelector(
    ".iframe-empty-state-content"
  );
  const urlInputRow = document.querySelector(".iframe-url-input-row");

  if (
    !searchInput ||
    !iframeDisplay ||
    !iframeDisplayContainer ||
    !emptyState ||
    !urlInputRow
  ) {
    console.error("必要な要素が見つかりません");
    return;
  }

  let query = searchInput.value.trim();
  console.log("入力された検索語:", query);

  if (!query) {
    console.log("検索語が空です - Empty Stateを表示");
    // 空欄ならEmpty State表示・iframe非表示・入力行表示
    emptyState.style.display = "flex";
    urlInputRow.style.display = "flex";
    setTimeout(() => {
      emptyStateContent?.classList.add("show");
    }, 100);
    iframeDisplayContainer.style.display = "none";
    iframeDisplay.src = "";
    return;
  }

  let url;

  // URLかどうかを判定（http/httpsスキームまたはドメイン形式）
  // @記号や特殊文字が含まれている場合は検索として処理
  if (
    (query.startsWith("http://") || query.startsWith("https://")) &&
    !query.includes("@") &&
    !query.includes("#") &&
    !query.includes("?") &&
    !query.includes("&")
  ) {
    // URLとして処理
    url = query;
    console.log("URLとして処理:", url);
  } else if (
    query.includes(".") &&
    !query.includes(" ") &&
    !query.includes("@") &&
    !query.includes("#") &&
    !query.includes("?") &&
    !query.includes("&")
  ) {
    // ドメイン形式として処理
    url = "https://" + query;
    console.log("ドメインとして処理:", url);
  } else {
    // Google検索として処理
    url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log("Google検索として処理:", url);
  }

  try {
    new URL(url);
    console.log("有効なURLです - iframeに読み込み中:", url);

    // ドメインを抽出して動的ルールを追加
    const domain = extractDomain(url);
    if (domain) {
      console.log(`[IFRAME] Extracted domain: ${domain}`);
      await addDynamicIframeRule(domain);
    }

    // Empty Stateと入力行を非表示、iframeを表示
    emptyStateContent?.classList.remove("show");
    setTimeout(() => {
      emptyState.style.display = "none";
      urlInputRow.style.display = "none";
    }, 200);

    iframeDisplayContainer.style.display = "block";
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

    // エラーハンドリングを設定してからsrcを設定
    iframeDisplay.onload = () => {
      console.log("iframe読み込み完了");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
    };

    iframeDisplay.onerror = () => {
      console.log("iframe読み込みエラー");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
      showHostError();
    };

    // タイムアウト処理を追加
    const timeoutId = setTimeout(() => {
      console.log("iframe読み込みタイムアウト");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
      showHostError();
    }, 10000); // 10秒でタイムアウト

    iframeDisplay.onload = () => {
      clearTimeout(timeoutId);
      console.log("iframe読み込み完了");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
    };

    iframeDisplay.src = url;

    // エラーページ表示関数
    function showHostError() {
      iframeDisplay.srcdoc = `
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
                color: #333;
              }
              .error-container {
                text-align: center;
                padding: 20px;
              }
              .error-icon {
                font-size: 48px;
                color: #dc3545;
                margin-bottom: 16px;
              }
              .error-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
              }
              .error-message {
                font-size: 16px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class='error-container'>
              <div class='error-icon'>⚠️</div>
              <div class='error-title'>host側のエラーです</div>
              <div class='error-message'>ネットワークエラー、サーバーエラー、CORSエラーなどの可能性があります</div>
            </div>
          </body>
        </html>
      `;
    }
  } catch (error) {
    console.log("無効なURLです:", error);
    // 無効なURL
    emptyStateContent?.classList.remove("show");
    setTimeout(() => {
      emptyState.style.display = "none";
      urlInputRow.style.display = "flex";
    }, 200);

    iframeDisplayContainer.style.display = "block";
    iframeDisplay.srcdoc = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
              color: #333;
            }
            .error-container {
              text-align: center;
              padding: 20px;
            }
            .error-icon {
              font-size: 48px;
              color: #dc3545;
              margin-bottom: 16px;
            }
            .error-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .error-message {
              font-size: 16px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class='error-container'>
            <div class='error-icon'>❌</div>
            <div class='error-title'>host側のエラーです</div>
            <div class='error-message'>ネットワークエラー、サーバーエラー、CORSエラーなどの可能性があります</div>
          </div>
        </body>
      </html>
    `;
  }
}

// ───────────────────────────────────────
// グローバル関数として公開
// ───────────────────────────────────────
window.initializeIframePage = initializeIframePage;
window.performSearch = performSearch;
window.toggleIframeRules = toggleIframeRules;
window.addDynamicIframeRule = addDynamicIframeRule;
