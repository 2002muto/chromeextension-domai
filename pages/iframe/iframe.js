"use strict";

// ───────────────────────────────────────
// Storage keys & in-memory caches
// ───────────────────────────────────────
const IFRAME_KEY = "iframes";
let iframes = [];

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
  const tabsContainer = document.getElementById("iframe-tabs");

  let tabs = [];

  function createTab(url) {
    if (tabs.includes(url)) {
      setActiveTab(url);
      return;
    }
    tabs.push(url);
    const tabEl = document.createElement("div");
    tabEl.className = "iframe-tab";
    try {
      tabEl.textContent = new URL(url).hostname;
    } catch {
      tabEl.textContent = url;
    }
    tabEl.dataset.url = url;
    tabEl.addEventListener("click", () => {
      console.log("タブ切り替え:", url);
      setActiveTab(url);
      iframeDisplay.src = url;
    });
    tabsContainer.appendChild(tabEl);
    setActiveTab(url);
  }

  function setActiveTab(url) {
    Array.from(tabsContainer.children).forEach((el) => {
      el.classList.toggle("active", el.dataset.url === url);
    });
  }
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

  // ズームコントロールの初期化
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");
  const zoomLevelLabel = document.getElementById("zoom-level");
  let zoomLevel = 1;

  function updateZoom() {
    iframeDisplay.style.transform = `scale(${zoomLevel})`;
    iframeDisplay.style.transformOrigin = "0 0";
    zoomLevelLabel.textContent = Math.round(zoomLevel * 100) + "%";
  }

  zoomInBtn?.addEventListener("click", () => {
    zoomLevel = Math.min(zoomLevel + 0.1, 2);
    console.log("ズームイン:", zoomLevel);
    updateZoom();
  });

  zoomOutBtn?.addEventListener("click", () => {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
    console.log("ズームアウト:", zoomLevel);
    updateZoom();
  });

  updateZoom();

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
function performSearch() {
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
  if (
    query.startsWith("http://") ||
    query.startsWith("https://") ||
    (query.includes(".") && !query.includes(" "))
  ) {
    // URLとして処理
    url = query;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    console.log("URLとして処理:", url);
  } else {
    // Google検索として処理
    url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    console.log("Google検索として処理:", url);
  }

  try {
    new URL(url);
    console.log("有効なURLです - iframeに読み込み中:", url);

    // Empty Stateと入力行を非表示、iframeを表示
    emptyStateContent?.classList.remove("show");
    setTimeout(() => {
      emptyState.style.display = "none";
      urlInputRow.style.display = "none";
    }, 200);

    iframeDisplayContainer.style.display = "block";
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>';

    iframeDisplay.src = url;
    createTab(url);

    iframeDisplay.onload = () => {
      console.log("iframe読み込み完了");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
    };

    iframeDisplay.onerror = () => {
      console.log("iframe読み込みエラー");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-search"></i>';
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
              <div class='error-title'>ページを読み込めませんでした</div>
              <div class='error-message'>検索語やURLを確認して再度お試しください</div>
            </div>
          </body>
        </html>
      `;
    };
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
            <div class='error-title'>検索できませんでした</div>
            <div class='error-message'>検索語またはURLを確認してください</div>
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
