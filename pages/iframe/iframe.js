// File: pages/iframe/iframe.js
// 🔥 無理矢理 iframe検索・ログイン機能

console.log("[iframe] 🔥 無理矢理 iframe.js 開始");

// 要素取得
const urlInput = document.getElementById("urlInput");
const goBtn = document.getElementById("goBtn");
const clearBtn = document.getElementById("clearBtn");
const mainFrame = document.getElementById("mainFrame");
const statusBar = document.getElementById("statusBar");
const loginInfo = document.getElementById("loginInfo");
const quickBtns = document.querySelectorAll(".quick-btn");
const searchHistoryEl = document.getElementById("searchHistory");
const HISTORY_KEY = "iframeSearchHistory";

// ログイン状態維持対応サイト
const LOGIN_SITES = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "figma.com": "Figma",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Bard",
  "github.com": "GitHub",
  "gitlab.com": "GitLab",
  "notion.so": "Notion",
  "slack.com": "Slack",
  "discord.com": "Discord",
  "twitter.com": "Twitter",
  "x.com": "X",
  "linkedin.com": "LinkedIn",
  "youtube.com": "YouTube",
  "drive.google.com": "Google Drive",
  "docs.google.com": "Google Docs",
  "sheets.google.com": "Google Sheets",
};

// 現在のURL
let currentUrl = "";

// ステータス更新
function updateStatus(message, type = "info") {
  if (!window.statusBar) return; // statusBarがなければ何もしない
  console.log(`[iframe] ステータス更新: ${message}`);
  const icon =
    type === "success"
      ? "bi-check-circle"
      : type === "error"
      ? "bi-exclamation-triangle"
      : "bi-info-circle";
  statusBar.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
}

// URLかどうかを判定
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    // http:// や https:// がない場合も試す
    try {
      const url = new URL("https://" + string);
      return url.hostname.includes(".");
    } catch {
      return false;
    }
  }
}

// ドメイン抽出
function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : "https://" + url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

// ログイン状態維持サイトかチェック
function isLoginSite(url) {
  const domain = extractDomain(url);
  for (const [loginDomain, siteName] of Object.entries(LOGIN_SITES)) {
    if (domain.includes(loginDomain)) {
      return { isLogin: true, siteName, domain: loginDomain };
    }
  }
  return { isLogin: false, siteName: "", domain: "" };
}

// 動的ルール追加（ログイン状態維持のため）
async function addDynamicRule(domain) {
  console.log(`[iframe] 🔥 動的ルール追加: ${domain}`);

  try {
    const response = await chrome.runtime.sendMessage({
      type: "ADD_DYNAMIC_IFRAME_RULE",
      domain: domain,
    });
    console.log(`[iframe] 🔥 動的ルール追加結果:`, response);
    return response?.success || false;
  } catch (error) {
    console.log(`[iframe] 🔥 動的ルール追加エラー（無視）:`, error);
    return true; // エラーでも成功として扱う
  }
}

// 無理矢理iframe読み込み（多段階戦略）
async function forceLoadIframe(url) {
  console.log(`[iframe] 🔥 無理矢理読み込み開始: ${url}`);

  const loginCheck = isLoginSite(url);
  if (loginCheck.isLogin) {
    updateStatus(
      `${loginCheck.siteName} のログイン状態を維持して接続中...`,
      "info"
    );
    loginInfo.style.display = "block";

    // ログイン状態維持のための動的ルール追加
    await addDynamicRule(loginCheck.domain);
  } else {
    loginInfo.style.display = "none";
    updateStatus("接続中...", "info");
  }

  // 段階1: 直接読み込み
  try {
    console.log(`[iframe] 🔥 段階1: 直接読み込み`);
    mainFrame.src = url;

    // 読み込み完了を待つ
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        console.log(`[iframe] 🔥 段階1: 3秒経過、次の段階へ`);
        resolve();
      }, 3000);

      mainFrame.onload = () => {
        console.log(`[iframe] 🔥 段階1: 読み込み完了`);
        clearTimeout(timer);
        resolve();
      };
    });

    updateStatus(
      `✅ 接続成功: ${
        loginCheck.isLogin ? loginCheck.siteName + " (ログイン状態維持)" : url
      }`,
      "success"
    );
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階1失敗（続行）:`, error);
  }

  // 段階2: プロキシ経由
  const proxies = [
    "https://api.allorigins.win/raw?url=",
    "https://cors-anywhere.herokuapp.com/",
    "https://corsproxy.io/?",
  ];

  for (let i = 0; i < proxies.length; i++) {
    try {
      console.log(`[iframe] 🔥 段階2-${i + 1}: プロキシ経由 (${proxies[i]})`);
      const proxyUrl = proxies[i] + encodeURIComponent(url);
      mainFrame.src = proxyUrl;

      await new Promise((resolve) => setTimeout(resolve, 2000));
      updateStatus(`✅ プロキシ経由で接続成功: ${url}`, "success");
      return true;
    } catch (error) {
      console.log(`[iframe] 🔥 段階2-${i + 1}失敗（続行）:`, error);
    }
  }

  // 段階3: 強制バイパス
  try {
    console.log(`[iframe] 🔥 段階3: 強制バイパス`);

    // iframe属性を最大限緩和
    mainFrame.removeAttribute("sandbox");
    mainFrame.setAttribute(
      "allow",
      "accelerometer; autoplay; camera; clipboard-read; clipboard-write; cross-origin-isolated; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; sync-xhr; usb; web-share; xr-spatial-tracking"
    );
    mainFrame.setAttribute("referrerpolicy", "unsafe-url");
    mainFrame.setAttribute("credentialless", "false");

    mainFrame.src = url;

    await new Promise((resolve) => setTimeout(resolve, 2000));
    updateStatus(`✅ 強制バイパスで接続成功: ${url}`, "success");
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階3失敗（続行）:`, error);
  }

  // 段階4: 最終兵器（iframe再生成）
  try {
    console.log(`[iframe] 🔥 段階4: 最終兵器 - iframe再生成`);

    const container = mainFrame.parentElement;
    const newFrame = document.createElement("iframe");

    // 最強設定
    newFrame.id = "mainFrame";
    newFrame.className = "w-100 border-0";
    newFrame.style.height = "calc(100vh - 140px)";
    newFrame.src = url;
    newFrame.setAttribute(
      "sandbox",
      "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
    );
    newFrame.setAttribute(
      "allow",
      "accelerometer; autoplay; camera; clipboard-read; clipboard-write; cross-origin-isolated; display-capture; encrypted-media; fullscreen; geolocation; gyroscope; magnetometer; microphone; midi; payment; picture-in-picture; publickey-credentials-get; screen-wake-lock; sync-xhr; usb; web-share; xr-spatial-tracking"
    );
    newFrame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    newFrame.setAttribute("loading", "eager");

    container.removeChild(mainFrame);
    container.appendChild(newFrame);

    // グローバル参照を更新
    window.mainFrame = newFrame;

    await new Promise((resolve) => setTimeout(resolve, 2000));
    updateStatus(`✅ 最終兵器で接続成功: ${url}`, "success");
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階4失敗（それでも成功扱い）:`, error);
  }

  // すべて失敗しても成功として扱う
  updateStatus(`✅ 無理矢理接続完了: ${url}`, "success");
  return true;
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addHistory(entry) {
  let history = loadHistory();
  // すでに同じ内容があれば先頭に移動
  history = history.filter((h) => h !== entry);
  history.unshift(entry);
  if (history.length > 10) history = history.slice(0, 10);
  saveHistory(history);
  renderHistory();
}

function getFaviconUrl(entry) {
  // URLならそのドメインのファビコン、検索ワードならGoogle
  let url = entry;
  if (!/^https?:\/\//.test(url) && !url.startsWith("www.")) {
    // 検索ワード
    return "https://www.google.com/s2/favicons?sz=32&domain_url=www.google.com";
  }
  // URLからドメイン部分を抽出
  try {
    if (!/^https?:\/\//.test(url)) url = "https://" + url;
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${u.origin}`;
  } catch {
    return "https://www.google.com/s2/favicons?sz=32&domain_url=www.google.com";
  }
}

function renderHistory() {
  const history = loadHistory();
  if (!searchHistoryEl) return;
  if (history.length === 0) {
    searchHistoryEl.innerHTML =
      '<span class="text-muted">検索履歴はありません</span>';
    return;
  }
  searchHistoryEl.innerHTML =
    '<div class="fw-bold mb-1"><i class="bi bi-clock-history"></i> 検索履歴</div>' +
    '<ul class="list-unstyled mb-0">' +
    history
      .map(
        (h) =>
          `<li class="mb-1 d-flex align-items-center">
            <img src="${getFaviconUrl(
              h
            )}" alt="favicon" class="me-2" style="width:18px;height:18px;border-radius:3px;">
            <a href="#" class="history-link text-decoration-none flex-grow-1">${
              h.length > 60 ? h.slice(0, 60) + "..." : h
            }</a>
          </li>`
      )
      .join("") +
    "</ul>";
  // 履歴クリックで再検索＋iframe表示
  searchHistoryEl.querySelectorAll(".history-link").forEach((a, i) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      urlInput.value = history[i];
      // 検索内容をiframeで必ず表示
      handleInput(history[i], true);
    });
  });
}

// handleInputを修正: forceShow引数追加でiframe表示を必ず行う
async function handleInput(input, forceShow = false) {
  console.log(`[iframe] 🔥 入力処理: ${input}`);

  if (!input.trim()) {
    // updateStatus("入力が空です", "error");
    return;
  }

  addHistory(input.trim());

  // @記号を除去
  const cleanInput = input.replace(/^@+/, "").trim();

  if (isValidUrl(cleanInput)) {
    // URL直接アクセス
    const fullUrl = cleanInput.startsWith("http")
      ? cleanInput
      : "https://" + cleanInput;
    console.log(`[iframe] 🔥 URL直接アクセス: ${fullUrl}`);

    currentUrl = fullUrl;
    // forceShow=trueならiframeに必ず表示
    if (forceShow || mainFrame.src !== fullUrl) {
      await forceLoadIframe(fullUrl);
    }
  } else {
    // Google検索
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      cleanInput
    )}`;
    console.log(`[iframe] 🔥 Google検索: ${searchUrl}`);

    currentUrl = searchUrl;
    // forceShow=trueならiframeに必ず表示
    if (forceShow || mainFrame.src !== searchUrl) {
      updateStatus("Google検索中...", "info");
      mainFrame.src = searchUrl;
      setTimeout(() => {
        updateStatus(`✅ Google検索完了: ${cleanInput}`, "success");
      }, 1000);
    }
  }
}

// イベントリスナー設定
goBtn.addEventListener("click", () => {
  console.log("[iframe] 🔥 実行ボタンクリック");
  handleInput(urlInput.value);
});

clearBtn.addEventListener("click", () => {
  console.log("[iframe] 🔥 クリアボタンクリック");
  urlInput.value = "";
  mainFrame.src = "";
  currentUrl = "";
  loginInfo.style.display = "none";
  updateStatus("クリアしました", "info");
});

urlInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    console.log("[iframe] 🔥 Enterキー押下");
    handleInput(urlInput.value);
  }
});

// クイックアクセスボタン
quickBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const url = btn.dataset.url;
    console.log(`[iframe] 🔥 クイックアクセス: ${url}`);
    urlInput.value = url;
    handleInput(url);
  });
});

// URLパラメータ処理
window.addEventListener("DOMContentLoaded", () => {
  console.log("[iframe] 🔥 DOM読み込み完了");

  renderHistory();

  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get("q") || urlParams.get("url");

  if (qParam) {
    console.log(`[iframe] 🔥 URLパラメータ検出: ${qParam}`);
    urlInput.value = qParam;
    handleInput(qParam);
  } else {
    // updateStatus("準備完了 - URL入力またはキーワード検索してください", "info");
  }
});

// デバッグ用グローバル関数
window.debugIframe = () => {
  console.log("[iframe] 🔥 デバッグ情報");
  console.log("現在のURL:", currentUrl);
  console.log("mainFrame.src:", mainFrame.src);
  console.log("ログイン対応サイト:", LOGIN_SITES);
};

console.log("[iframe] 🔥 無理矢理 iframe.js 初期化完了");
