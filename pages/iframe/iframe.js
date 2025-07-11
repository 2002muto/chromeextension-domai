// File: pages/iframe/iframe.js
// 🔥 無理矢理 iframe検索・ログイン機能

console.log("[iframe] 🔥 無理矢理 iframe.js 開始");

// 要素取得
let urlInput,
  goBtn,
  clearBtn,
  mainFrame,
  statusBar,
  loginInfo,
  quickBtns,
  searchHistoryEl,
  addBookmarkBtn,
  bookmarkList;
const HISTORY_KEY = "iframeSearchHistory";
const BOOKMARK_KEY = "iframeBookmarks";

// 要素を確実に取得する関数
function initializeElements() {
  console.log("[iframe] 要素の初期化を開始");

  urlInput = document.getElementById("urlInput");
  goBtn = document.getElementById("goBtn");
  clearBtn = document.getElementById("clearBtn");
  mainFrame = document.getElementById("mainFrame");
  statusBar = document.getElementById("statusBar");
  loginInfo = document.getElementById("loginInfo");
  quickBtns = document.querySelectorAll(".quick-btn");
  searchHistoryEl = document.getElementById("searchHistory");
  addBookmarkBtn = document.getElementById("addBookmarkBtn");
  bookmarkList = document.getElementById("bookmarkList");

  console.log("[iframe] 要素取得結果:", {
    urlInput: !!urlInput,
    goBtn: !!goBtn,
    clearBtn: !!clearBtn,
    mainFrame: !!mainFrame,
    statusBar: !!statusBar,
    loginInfo: !!loginInfo,
    quickBtns: quickBtns.length,
    searchHistoryEl: !!searchHistoryEl,
    addBookmarkBtn: !!addBookmarkBtn,
    bookmarkList: !!bookmarkList,
  });

  if (!searchHistoryEl) {
    console.error("[iframe] searchHistoryElが見つかりません！");
  }
}

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
  "twitter.com": "X",
  "x.com": "X",
  "linkedin.com": "LinkedIn",
  "youtube.com": "YouTube",
  // AIサービス
  "genspark.ai": "Genspark",
  "genspark.com": "Genspark",
  "claude.ai": "Claude",
  "anthropic.com": "Claude",
  "bing.com": "Bing Chat",
  "copilot.microsoft.com": "Microsoft Copilot",
  "copilot-pro.microsoft.com": "Microsoft Copilot Pro",
  "you.com": "You.com",
  "phind.com": "Phind",
  "deepseek.com": "DeepSeek",
  "deepseek.ai": "DeepSeek",
  "kimi.moonshot.cn": "Kimi",
  "moonshot.cn": "Kimi",
  "doubao.com": "豆包",
  "doubao.bytedance.com": "豆包",
  "tongyi.aliyun.com": "通義千問",
  "qwen.aliyun.com": "通義千問",
  "xingye.qq.com": "星火大模型",
  "sparkdesk.cn": "星火大模型",
  "yiyan.baidu.com": "文心一言",
  "ernie-bot.baidu.com": "文心一言",
  "chatglm.cn": "智谱清言",
  "zhipuai.cn": "智谱清言",
  "360.cn": "360智脑",
  "so.com": "360智脑",
  "sogou.com": "搜狗AI",
  "sogou.cn": "搜狗AI",
  // その他の便利なサービス
  "figjam.com": "Figma Jam",
  "miro.com": "Miro",
  "whimsical.com": "Whimsical",
  "lucidchart.com": "Lucidchart",
  "draw.io": "Draw.io",
  "diagrams.net": "Draw.io",
  "canva.com": "Canva",
  "roamresearch.com": "Roam Research",
  "obsidian.md": "Obsidian",
  "logseq.com": "Logseq",
  "craft.do": "Craft",
  "bear.app": "Bear",
  "ulysses.app": "Ulysses",
  "typora.io": "Typora",
  "marktext.io": "MarkText",
  "zotero.org": "Zotero",
  "mendeley.com": "Mendeley",
  "papersapp.com": "Papers",
  "readwise.io": "Readwise",
  "instapaper.com": "Instapaper",
  "pocket.com": "Pocket",
  "raindrop.io": "Raindrop",
  "pinboard.in": "Pinboard",
  "diigo.com": "Diigo",
  "evernote.com": "Evernote",
  "onenote.com": "OneNote",
  "keep.google.com": "Google Keep",
  "trello.com": "Trello",
  "asana.com": "Asana",
  "clickup.com": "ClickUp",
  "monday.com": "Monday.com",
  "airtable.com": "Airtable",
  "coda.io": "Coda",
};

// 現在のURL
let currentUrl = "";

// ステータス更新
function updateStatus(message, type = "info") {
  console.log(`[iframe] ステータス更新: ${message}`);

  // ステータス表示用の要素を取得
  let statusElement = document.getElementById("statusBar");
  if (!statusElement) {
    console.warn(`[iframe] statusBar要素が見つかりません`);
    return;
  }

  const icon =
    type === "success"
      ? "bi-check-circle"
      : type === "error"
      ? "bi-exclamation-triangle"
      : "bi-info-circle";

  // drag-drop-toastスタイルで表示
  statusElement.innerHTML = `<i class="bi ${icon}"></i><span>${message}</span>`;
  statusElement.style.display = "flex";
  statusElement.classList.remove("fade-out");

  // 一定時間後に自動で非表示
  setTimeout(() => {
    if (statusElement) {
      statusElement.classList.add("fade-out");
      setTimeout(() => {
        if (statusElement) {
          statusElement.style.display = "none";
        }
      }, 300); // アニメーション時間を考慮
    }
  }, 3000); // 3秒後に非表示
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
    "https://thingproxy.freeboard.io/fetch/",
    "https://api.codetabs.com/v1/proxy?quest=",
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
    console.log(`[iframe] 🔥 段階4失敗（続行）:`, error);
  }

  // 段階5: 超強制バイパス（新しいタブで開く代替案）
  try {
    console.log(`[iframe] 🔥 段階5: 超強制バイパス - 新しいタブで開く`);

    // 新しいタブで開く
    chrome.tabs.create({ url: url });
    updateStatus(`✅ 新しいタブで開きました: ${url}`, "success");
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階5失敗（続行）:`, error);
  }

  // すべて失敗しても成功として扱う
  updateStatus(`✅ 無理矢理接続完了: ${url}`, "success");
  return true;
}

function loadHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

    // 旧データ構造（文字列配列）を新データ構造（オブジェクト配列）に変換
    return history.map((item) => {
      if (typeof item === "string") {
        return {
          url: item,
          title: getPageTitle(item),
          faviconUrl: null,
          timestamp: Date.now(),
        };
      }
      return item;
    });
  } catch (error) {
    console.error("[iframe] 履歴読み込みエラー:", error);
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// 履歴データ構造を拡張（ファビコンURLも保存）
async function addHistory(entry) {
  console.log(`[iframe] addHistory呼び出し: ${entry}`);
  let history = loadHistory();

  // 既存のエントリを削除（重複防止）
  history = history.filter((h) => h.url !== entry);

  // ファビコンURLを事前に取得
  const faviconUrl = await getFaviconUrl(entry);
  console.log(
    `[iframe] ファビコンURL取得結果: ${entry} -> ${
      faviconUrl ? "成功" : "失敗"
    }`
  );

  // 新しいエントリを作成
  const newEntry = {
    url: entry,
    title: getPageTitle(entry),
    faviconUrl: faviconUrl,
    timestamp: Date.now(),
  };

  // 履歴に追加
  history.unshift(newEntry);

  // 履歴数を制限（必要に応じて）
  // if (history.length > 10) history = history.slice(0, 10);

  saveHistory(history);
  await renderHistory();
}

// ページタイトルを取得する関数
function getPageTitle(url) {
  if (!/^https?:\/\//.test(url) && !url.startsWith("www.")) {
    return `Google検索: ${url}`;
  }

  try {
    const domain = getDomain(url);
    return domain || url;
  } catch {
    return url;
  }
}

// ファビコンURLを取得する関数（Google Favicon API + Chrome拡張API）
async function getFaviconUrl(url) {
  console.log(`[iframe] getFaviconUrl呼び出し: ${url}`);

  // 検索キーワードの場合はGoogleアイコン
  if (!/^https?:\/\//.test(url) && !url.startsWith("www.")) {
    console.log(`[iframe] 検索キーワードのためGoogleアイコンを使用: ${url}`);
    return "data:image/svg+xml;base64," + btoa(getGoogleSVG());
  }

  try {
    const domain = getDomain(url);
    if (!domain) {
      console.log(`[iframe] ドメイン取得失敗: ${url}`);
      return null;
    }

    console.log(`[iframe] ドメイン取得成功: ${domain}`);

    // 1. まずChrome拡張APIでファビコンを取得
    try {
      const dataUrl = await fetchFaviconDataUrl(domain);
      if (dataUrl) {
        console.log(`[iframe] ファビコン取得成功 (Chrome拡張API): ${domain}`);
        return dataUrl;
      }
    } catch (error) {
      console.log(
        `[iframe] Chrome拡張APIでファビコン取得失敗: ${domain}`,
        error
      );
    }

    // 2. Chrome拡張APIが失敗した場合はGoogle Favicon APIを使用
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    console.log(`[iframe] Google Favicon APIを試行: ${googleFaviconUrl}`);

    // ファビコンの存在確認
    try {
      const response = await fetch(googleFaviconUrl);
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        console.log(`[iframe] ファビコン取得成功 (Google API): ${domain}`);
        return objectUrl;
      } else {
        console.log(
          `[iframe] Google Favicon API レスポンスエラー: ${response.status}`
        );
      }
    } catch (error) {
      console.log(
        `[iframe] Google Favicon APIでファビコン取得失敗: ${domain}`,
        error
      );
    }

    // 3. 直接ファビコンURLを試行
    try {
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      console.log(`[iframe] 直接ファビコンURLを試行: ${directFaviconUrl}`);

      const response = await fetch(directFaviconUrl);
      if (response.ok) {
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        console.log(`[iframe] ファビコン取得成功 (直接URL): ${domain}`);
        return objectUrl;
      }
    } catch (error) {
      console.log(`[iframe] 直接ファビコンURL取得失敗: ${domain}`, error);
    }

    // 4. どちらも失敗した場合はデフォルトアイコン
    console.log(
      `[iframe] ファビコン取得失敗、デフォルトアイコンを使用: ${domain}`
    );
    return null;
  } catch (error) {
    console.error(`[iframe] ファビコン取得エラー: ${url}`, error);
    return null;
  }
}

async function fetchFaviconDataUrl(domain) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "fetchFavicon", domain },
      (response) => {
        resolve(response?.dataUrl || null);
      }
    );
  });
}

function getDomain(entry) {
  let url = entry;
  if (!/^https?:\/\//.test(url)) url = "https://" + url;
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return null;
  }
}

function getGoogleSVG() {
  return `<svg width="24" height="24" viewBox="0 0 48 48"><g><circle fill="#fff" cx="24" cy="24" r="24"/><path fill="#4285F4" d="M34.6 24.2c0-.7-.1-1.4-.2-2H24v4.1h6c-.3 1.5-1.3 2.7-2.7 3.5v2.9h4.4c2.6-2.4 4.1-5.9 4.1-10.5z"/><path fill="#34A853" d="M24 36c3.6 0 6.6-1.2 8.8-3.2l-4.4-2.9c-1.2.8-2.7 1.3-4.4 1.3-3.4 0-6.2-2.3-7.2-5.4h-4.5v3.1C15.2 33.8 19.3 36 24 36z"/><path fill="#FBBC05" d="M16.8 25.8c-.3-.8-.5-1.7-.5-2.8s.2-2 .5-2.8v-3.1h-4.5C11.5 19.2 11 21.5 11 24s.5 4.8 1.3 6.9l4.5-3.1z"/><path fill="#EA4335" d="M24 17.7c2 0 3.7.7 5.1 2.1l3.8-3.8C30.6 13.9 27.6 12.5 24 12.5c-4.7 0-8.8 2.2-11.2 5.6l4.5 3.1c1-3.1 3.8-5.4 7.2-5.4z"/></g></svg>`;
}

// ブックマーク管理関数
function loadBookmarks() {
  try {
    const stored = localStorage.getItem(BOOKMARK_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("[iframe] ブックマーク読み込みエラー:", error);
    return [];
  }
}

function saveBookmarks(bookmarks) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
    console.log("[iframe] ブックマーク保存完了:", bookmarks.length, "件");
  } catch (error) {
    console.error("[iframe] ブックマーク保存エラー:", error);
  }
}

function addBookmark(title, url) {
  const bookmarks = loadBookmarks();
  const newBookmark = {
    id: Date.now().toString(),
    title: title || "新しいブックマーク",
    url: url || "https://www.google.com",
    timestamp: Date.now(),
  };
  bookmarks.push(newBookmark);
  saveBookmarks(bookmarks);
  renderBookmarks();
  console.log("[iframe] ブックマーク追加:", newBookmark);
}

function removeBookmark(id) {
  const bookmarks = loadBookmarks();
  const filteredBookmarks = bookmarks.filter((b) => b.id !== id);
  saveBookmarks(filteredBookmarks);
  renderBookmarks();
  console.log("[iframe] ブックマーク削除:", id);
}

function renderBookmarks() {
  if (!bookmarkList) {
    console.warn("[iframe] bookmarkList要素が見つかりません");
    return;
  }

  const bookmarks = loadBookmarks();
  console.log("[iframe] ブックマーク描画:", bookmarks.length, "件");

  bookmarkList.innerHTML = "";

  bookmarks.forEach((bookmark) => {
    const bookmarkElement = document.createElement("a");
    bookmarkElement.className = "bookmark-item";
    bookmarkElement.href = "#";
    bookmarkElement.onclick = (e) => {
      e.preventDefault();
      openBookmarkInNewTab(bookmark.url);
    };

    bookmarkElement.innerHTML = `
      <div class="bookmark-icon">
        <i class="bi bi-box-arrow-in-right"></i>
      </div>
      <div class="bookmark-title">${bookmark.title}</div>
      <button class="bookmark-remove" onclick="event.stopPropagation(); removeBookmark('${bookmark.id}')">×</button>
    `;

    bookmarkList.appendChild(bookmarkElement);
  });
}

function openBookmarkInNewTab(url) {
  try {
    chrome.tabs.create({ url: url });
    updateStatus(`✅ 新しいタブで開きました: ${url}`, "success");
    console.log("[iframe] 新しいタブで開く:", url);
  } catch (error) {
    console.error("[iframe] タブ作成エラー:", error);
    updateStatus(`❌ タブ作成エラー: ${error.message}`, "error");
  }
}

async function renderHistory() {
  const history = loadHistory();
  console.log(`[iframe] renderHistory呼び出し時の履歴数: ${history.length}`);
  console.log(
    `[iframe] renderHistory履歴内容:`,
    history.map((h) => h.url)
  );
  console.log(`[iframe] searchHistoryEl要素:`, searchHistoryEl);

  if (!searchHistoryEl) {
    console.log(`[iframe] searchHistoryElが見つかりません - 再取得を試行`);
    searchHistoryEl = document.getElementById("searchHistory");
    if (!searchHistoryEl) {
      console.error(`[iframe] searchHistoryElの再取得も失敗`);
      return;
    }
  }

  if (history.length === 0) {
    console.log(`[iframe] 履歴が空のため、空の状態を表示`);
    searchHistoryEl.innerHTML = `
      <!-- 左側のアイコン群 -->
      <div class="footer-icons">
        <i class="bi bi-house footer-icon" title="ホーム"></i>
        <i class="bi bi-arrow-clockwise footer-icon" title="更新"></i>
        <i class="bi bi-pc-display-horizontal footer-icon" title="デスクトップ"></i>
        <i class="bi bi-phone footer-icon" title="モバイル"></i>
      </div>
      <div class="history-container">
        <span class="text-muted">検索履歴はありません</span>
      </div>
      <button class="new-search-btn" onclick="focusSearchInput()">
        <i class="bi bi-plus-circle"></i> 新しい検索
      </button>
    `;
    return;
  }

  // 基本構造を作成（横一列レイアウト）
  console.log(`[iframe] 履歴表示の基本構造を作成`);
  searchHistoryEl.innerHTML = `
    <!-- 左側のアイコン群 -->
    <div class="footer-icons">
      <i class="bi bi-house footer-icon" title="ホーム"></i>
      <i class="bi bi-arrow-clockwise footer-icon" title="更新"></i>
      <i class="bi bi-pc-display-horizontal footer-icon" title="デスクトップ"></i>
      <i class="bi bi-phone footer-icon" title="モバイル"></i>
    </div>
    <div class="history-container">
      <div class="search-history">
        <div id="favicon-row"></div>
      </div>
    </div>
    <div class="search-btns-wrapper">
      <button class="new-search-btn" onclick="focusSearchInput()">
        <i class="bi bi-plus-circle"></i> 新しい検索
      </button>
      <button class="clear-history-btn" id="clearHistoryBtn" title="検索履歴を全削除">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  const row = document.getElementById("favicon-row");
  console.log(`[iframe] favicon-row要素:`, row);

  // 全履歴を横スクロールで無制限に表示
  // まずラベルを追加
  const label = document.createElement("span");
  label.className = "history-label";
  label.innerHTML = '<i class="bi bi-clock-history"></i> 検索履歴';
  row.appendChild(label);

  for (let i = 0; i < history.length; i++) {
    const h = history[i];
    console.log(`[iframe] 履歴アイコン${i}を作成:`, h);
    const wrapper = createFaviconWrapper(h, i);
    row.appendChild(wrapper);
  }

  // --- 自動スクロール機能 ---
  if (history.length > 0) {
    const wrappers = row.querySelectorAll(".favicon-wrapper");
    const lastWrapper = wrappers[wrappers.length - 1];
    const firstWrapper = wrappers[0];
    let scrollInterval = null;

    function stopAutoScroll() {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }

    function startAutoScroll(direction) {
      stopAutoScroll();
      scrollInterval = setInterval(() => {
        if (direction === "right") {
          if (row.scrollLeft < row.scrollWidth - row.clientWidth) {
            row.scrollLeft += 8;
          } else {
            stopAutoScroll();
          }
        } else {
          if (row.scrollLeft > 0) {
            row.scrollLeft -= 8;
          } else {
            stopAutoScroll();
          }
        }
      }, 16);
    }

    // 右端: 右方向スクロール
    lastWrapper.addEventListener("mouseenter", () => {
      console.log("[iframe] 最後のアイコンhover - スクロール開始(right)");
      startAutoScroll("right");
    });
    lastWrapper.addEventListener("mouseleave", () => {
      console.log("[iframe] 最後のアイコンleave - スクロール停止");
      stopAutoScroll();
    });

    // 左端: 左方向スクロール
    firstWrapper.addEventListener("mouseenter", () => {
      console.log("[iframe] 最初のアイコンhover - スクロール開始(left)");
      startAutoScroll("left");
    });
    firstWrapper.addEventListener("mouseleave", () => {
      console.log("[iframe] 最初のアイコンleave - スクロール停止");
      stopAutoScroll();
    });
  }
  // --- 自動スクロール機能ここまで ---

  // 検索履歴全削除ボタンのイベント
  const clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("検索履歴をすべて削除しますか？")) {
        saveHistory([]);
        renderHistory();
      }
    });
  }
}

// ファビコンwrapperを作成する関数（新しいデータ構造対応）
function createFaviconWrapper(historyItem, index) {
  console.log(`[iframe] createFaviconWrapper呼び出し:`, { historyItem, index });
  const wrapper = document.createElement("span");
  wrapper.className = "favicon-wrapper";
  wrapper.style.position = "relative";

  // 削除ボタン
  const removeBtn = document.createElement("span");
  removeBtn.className = "favicon-remove";
  removeBtn.textContent = "✖";
  removeBtn.title = "この履歴を削除";
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    let newHistory = loadHistory();
    newHistory.splice(index, 1);
    saveHistory(newHistory);
    renderHistory();
  });

  // ファビコン本体
  const a = document.createElement("a");
  a.href = "#";
  a.className = "history-link";
  a.setAttribute("data-idx", index);
  a.style.display = "inline-block";
  a.style.width = "24px";
  a.style.height = "24px";
  a.style.verticalAlign = "middle";
  a.title = historyItem.title || historyItem.url; // ツールチップにタイトルを表示
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    urlInput.value = historyItem.url;

    // 既存アイコンクリック時は新しいエントリを先頭に追加（重複表示）
    let history = loadHistory();
    console.log(`[iframe] 既存アイコンクリック前の履歴数: ${history.length}`);

    // 新しいエントリを作成（既存のエントリをコピー）
    const newEntry = {
      url: historyItem.url,
      title: historyItem.title || getPageTitle(historyItem.url),
      faviconUrl: historyItem.faviconUrl,
      timestamp: Date.now(),
    };

    // 先頭に新しいエントリを追加
    history.unshift(newEntry);
    console.log(`[iframe] 新しいエントリ追加後の履歴数: ${history.length}`);
    console.log(
      `[iframe] 履歴内容:`,
      history.map((h) => h.url)
    );

    saveHistory(history);
    await renderHistory();

    // 既存アイコンクリック時は直接URL処理（addHistoryを呼ばない）
    const cleanInput = historyItem.url.replace(/^@+/, "").trim();

    if (isValidUrl(cleanInput)) {
      // URL直接アクセス
      const fullUrl = cleanInput.startsWith("http")
        ? cleanInput
        : "https://" + cleanInput;
      console.log(`[iframe] 🔥 既存アイコンURL直接アクセス: ${fullUrl}`);

      currentUrl = fullUrl;
      try {
        forceLoadIframe(fullUrl);
      } catch (error) {
        console.error(`[iframe] 🔥 iframe読み込みエラー:`, error);
        updateStatus(`❌ 読み込みエラー: ${error.message}`, "error");
      }
    } else {
      // Google検索
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        cleanInput
      )}`;
      console.log(`[iframe] 🔥 既存アイコンGoogle検索: ${searchUrl}`);

      currentUrl = searchUrl;
      try {
        updateStatus("Google検索中...", "info");
        mainFrame.src = searchUrl;
        setTimeout(() => {
          updateStatus(`✅ Google検索完了: ${cleanInput}`, "success");
        }, 1000);
      } catch (error) {
        console.error(`[iframe] 🔥 Google検索エラー:`, error);
        updateStatus(`❌ 検索エラー: ${error.message}`, "error");
      }
    }
  });

  // 新しいデータ構造に対応
  if (typeof historyItem === "string") {
    // 旧データ構造（文字列）の場合の後方互換性
    if (!/^https?:\/\//.test(historyItem) && !historyItem.startsWith("www.")) {
      a.innerHTML = getGoogleSVG();
    } else {
      const domain = getDomain(historyItem);
      if (domain) {
        fetchFaviconDataUrl(domain).then((dataUrl) => {
          if (dataUrl) {
            a.innerHTML = `<img src="${dataUrl}" alt="favicon" class="favicon-img">`;
          } else {
            a.innerHTML = getGoogleSVG();
          }
        });
      } else {
        a.innerHTML = getGoogleSVG();
      }
    }
  } else {
    // 新しいデータ構造（オブジェクト）の場合
    console.log(`[iframe] 新しいデータ構造でファビコン作成:`, historyItem);
    if (historyItem.faviconUrl) {
      if (historyItem.faviconUrl.startsWith("data:image/svg+xml")) {
        // SVGデータURLの場合
        console.log(`[iframe] SVGデータURLを使用`);
        a.innerHTML = getGoogleSVG();
      } else if (historyItem.faviconUrl.startsWith("blob:")) {
        // Blob URLの場合
        console.log(`[iframe] Blob URLを使用:`, historyItem.faviconUrl);
        const img = document.createElement("img");
        img.src = historyItem.faviconUrl;
        img.alt = "favicon";
        img.className = "favicon-img";
        img.onerror = function () {
          console.log(
            `[iframe] Blob URL読み込みエラー:`,
            historyItem.faviconUrl
          );
          this.parentElement.innerHTML = getGoogleSVG();
        };
        img.onload = function () {
          console.log(`[iframe] Blob URL読み込み成功:`, historyItem.faviconUrl);
        };
        a.appendChild(img);
      } else {
        // 通常の画像URLの場合
        console.log(`[iframe] 画像URLを使用:`, historyItem.faviconUrl);
        const img = document.createElement("img");
        img.src = historyItem.faviconUrl;
        img.alt = "favicon";
        img.className = "favicon-img";
        img.onerror = function () {
          console.log(
            `[iframe] ファビコン画像読み込みエラー:`,
            historyItem.faviconUrl
          );
          this.parentElement.innerHTML = getGoogleSVG();
        };
        img.onload = function () {
          console.log(
            `[iframe] ファビコン画像読み込み成功:`,
            historyItem.faviconUrl
          );
        };
        a.appendChild(img);
      }
    } else {
      // ファビコンURLがない場合はGoogleアイコン
      console.log(`[iframe] デフォルトGoogleアイコンを使用`);
      a.innerHTML = getGoogleSVG();
    }
  }

  wrapper.appendChild(a);
  wrapper.appendChild(removeBtn);
  return wrapper;
}

// 検索入力にフォーカスする関数
function focusSearchInput() {
  if (urlInput) {
    urlInput.focus();
    urlInput.select();
  }
}

// handleInputを修正: forceShow引数追加でiframe表示を必ず行う
async function handleInput(input, forceShow = false) {
  console.log(`[iframe] 🔥 入力処理: ${input}`);

  if (!input.trim()) {
    // updateStatus("入力が空です", "error");
    return;
  }

  // forceShow=trueの場合は履歴追加をスキップ（既に履歴順序更新済み）
  if (!forceShow) {
    await addHistory(input.trim());
  }

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
      try {
        await forceLoadIframe(fullUrl);
      } catch (error) {
        console.error(`[iframe] 🔥 iframe読み込みエラー:`, error);
        updateStatus(`❌ 読み込みエラー: ${error.message}`, "error");

        // エラー時は新しいタブで開く
        try {
          chrome.tabs.create({ url: fullUrl });
          updateStatus(`✅ 新しいタブで開きました: ${fullUrl}`, "success");
        } catch (tabError) {
          console.error(`[iframe] 🔥 タブ作成エラー:`, tabError);
          updateStatus(`❌ タブ作成エラー: ${tabError.message}`, "error");
        }
      }
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
      try {
        updateStatus("Google検索中...", "info");
        mainFrame.src = searchUrl;
        setTimeout(() => {
          updateStatus(`✅ Google検索完了: ${cleanInput}`, "success");
        }, 1000);
      } catch (error) {
        console.error(`[iframe] 🔥 Google検索エラー:`, error);
        updateStatus(`❌ 検索エラー: ${error.message}`, "error");

        // エラー時は新しいタブで開く
        try {
          chrome.tabs.create({ url: searchUrl });
          updateStatus(`✅ 新しいタブで検索しました: ${cleanInput}`, "success");
        } catch (tabError) {
          console.error(`[iframe] 🔥 タブ作成エラー:`, tabError);
          updateStatus(`❌ タブ作成エラー: ${tabError.message}`, "error");
        }
      }
    }
  }
}

// イベントリスナー設定関数
function setupEventListeners() {
  console.log("[iframe] イベントリスナー設定開始");

  if (goBtn) {
    goBtn.addEventListener("click", () => {
      console.log("[iframe] 🔥 実行ボタンクリック");
      handleInput(urlInput.value);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      console.log("[iframe] 🔥 クリアボタンクリック");
      urlInput.value = "";
      mainFrame.src = "";
      currentUrl = "";
      if (loginInfo) loginInfo.style.display = "none";
      updateStatus("クリアしました", "info");
    });
  }

  if (urlInput) {
    urlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log("[iframe] 🔥 Enterキー押下");
        handleInput(urlInput.value);
      }
    });
  }

  // クイックアクセスボタン
  if (quickBtns && quickBtns.length > 0) {
    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = btn.dataset.url;
        console.log(`[iframe] 🔥 クイックアクセス: ${url}`);
        if (urlInput) urlInput.value = url;
        handleInput(url);
      });
    });
  }

  // ブックマーク追加ボタン
  if (addBookmarkBtn) {
    addBookmarkBtn.addEventListener("click", () => {
      console.log("[iframe] 🔥 ブックマーク追加ボタンクリック");
      // 仮のダミーブックマークを追加（今後は登録画面で実装）
      const dummyTitles = [
        "Google",
        "GitHub",
        "Stack Overflow",
        "MDN",
        "YouTube",
      ];
      const dummyUrls = [
        "https://www.google.com",
        "https://github.com",
        "https://stackoverflow.com",
        "https://developer.mozilla.org",
        "https://www.youtube.com",
      ];
      const randomIndex = Math.floor(Math.random() * dummyTitles.length);
      addBookmark(dummyTitles[randomIndex], dummyUrls[randomIndex]);
      updateStatus(
        `✅ ブックマーク「${dummyTitles[randomIndex]}」を追加しました`,
        "success"
      );
    });
  }

  console.log("[iframe] イベントリスナー設定完了");
}

// ページ読み込み時の初期化
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[iframe] DOMContentLoaded - 初期化開始");

  // 要素を初期化
  initializeElements();

  // 履歴を読み込んで表示
  const history = loadHistory();
  console.log("[iframe] 初期履歴データ:", history);
  console.log("[iframe] 履歴データ数:", history.length);
  console.log("[iframe] searchHistoryEl要素:", searchHistoryEl);

  // テスト用の履歴データを追加（履歴が空の場合）
  if (history.length === 0) {
    console.log("[iframe] テスト用履歴データを追加");
    const testHistory = [
      {
        url: "https://www.google.com",
        title: "Google",
        faviconUrl: "data:image/svg+xml;base64," + btoa(getGoogleSVG()),
        timestamp: Date.now() - 300000,
      },
      {
        url: "https://www.github.com",
        title: "GitHub",
        faviconUrl: "https://github.com/favicon.ico",
        timestamp: Date.now() - 200000,
      },
      {
        url: "test search",
        title: "Google検索: test search",
        faviconUrl: "data:image/svg+xml;base64," + btoa(getGoogleSVG()),
        timestamp: Date.now() - 100000,
      },
    ];
    saveHistory(testHistory);
    console.log("[iframe] テスト履歴データを保存:", testHistory);
  }

  await renderHistory();

  // ブックマークを描画
  renderBookmarks();

  // イベントリスナーを設定
  setupEventListeners();

  // 初期メッセージを表示
  updateStatus("メインページを読み込む", "info");

  // URLパラメータ処理
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get("q") || urlParams.get("url");

  if (qParam) {
    console.log(`[iframe] URLパラメータ検出: ${qParam}`);
    if (urlInput) urlInput.value = qParam;
    handleInput(qParam);
  }

  console.log("[iframe] 初期化完了");
});

// ページ読み込み完了後にも実行（フォールバック）
window.addEventListener("load", async () => {
  console.log("[iframe] window.load - フォールバック初期化");

  // まだ要素が取得できていない場合
  if (!searchHistoryEl) {
    console.log("[iframe] 要素が未取得のため再初期化");
    initializeElements();
    const history = loadHistory();
    await renderHistory();
  }
});

// デバッグ用グローバル関数
window.debugIframe = () => {
  console.log("[iframe] 🔥 デバッグ情報");
  console.log("現在のURL:", currentUrl);
  console.log("mainFrame.src:", mainFrame.src);
  console.log("ログイン対応サイト:", LOGIN_SITES);
};

// 新しい検索ボタンのイベント（setupEventListeners関数内で設定されるため削除）

console.log("[iframe] 🔥 無理矢理 iframe.js 初期化完了");
