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

  const urlInput = document.querySelector(".url-input");
  const submitBtn = document.querySelector(".url-submit-btn");
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
    !urlInput ||
    !submitBtn ||
    !iframeDisplay ||
    !iframeDisplayContainer ||
    !emptyState ||
    !urlInputRow
  ) {
    console.error("必要な要素が見つかりません:", {
      urlInput: !!urlInput,
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

  // URL送信ボタンのクリックイベント
  submitBtn.addEventListener("click", () => {
    console.log("実行ボタンがクリックされました");
    loadUrlInIframe();
  });

  // Enterキーでの送信
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      console.log("Enterキーが押されました");
      loadUrlInIframe();
    }
  });

  // URL入力フィールドのフォーカス
  urlInput.addEventListener("focus", () => {
    urlInput.select();
  });

  // 入力欄の内容が空になったらEmpty Stateを再表示
  urlInput.addEventListener("input", () => {
    if (!urlInput.value.trim()) {
      showEmptyState();
      iframeDisplayContainer.style.display = "none";
      iframeDisplay.src = "";
      // 入力行を表示
      urlInputRow.style.display = "flex";
    }
  });

  // 新しいURLボタンのイベントリスナー
  const newUrlBtn = document.getElementById("new-url-btn");
  if (newUrlBtn) {
    newUrlBtn.addEventListener("click", () => {
      console.log("新しいURLボタンがクリックされました");
      // 入力行を表示、iframeを非表示
      urlInputRow.style.display = "flex";
      iframeDisplayContainer.style.display = "none";
      iframeDisplay.src = "";
      // URL入力欄をクリアしてフォーカス
      urlInput.value = "";
      urlInput.focus();
      // Empty Stateを表示
      showEmptyState();
    });
  }

  // 初期状態でURL入力フィールドにフォーカス
  setTimeout(() => {
    urlInput.focus();
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
// URLをiframeに読み込む
// ───────────────────────────────────────
function loadUrlInIframe() {
  const urlInput = document.querySelector(".url-input");
  const iframeDisplay = document.getElementById("iframe-display");
  const submitBtn = document.querySelector(".url-submit-btn");
  const iframeDisplayContainer = document.getElementById(
    "iframe-display-container"
  );
  const emptyState = document.getElementById("iframe-empty-state");
  const emptyStateContent = emptyState?.querySelector(
    ".iframe-empty-state-content"
  );
  const urlInputRow = document.querySelector(".iframe-url-input-row");

  if (
    !urlInput ||
    !iframeDisplay ||
    !iframeDisplayContainer ||
    !emptyState ||
    !urlInputRow
  ) {
    console.error("必要な要素が見つかりません");
    return;
  }

  let url = urlInput.value.trim();
  console.log("入力されたURL:", url);

  if (!url) {
    console.log("URLが空です - Empty Stateを表示");
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

  // URLスキームがない場合はhttps://を追加
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
    console.log("URLスキームを追加:", url);
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

    iframeDisplay.onload = () => {
      console.log("iframe読み込み完了");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
    };

    iframeDisplay.onerror = () => {
      console.log("iframe読み込みエラー");
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
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
              <div class='error-message'>URLを確認して再度お試しください</div>
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
            <div class='error-title'>無効なURLです</div>
            <div class='error-message'>正しいURLを入力してください</div>
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
window.loadUrlInIframe = loadUrlInIframe;
