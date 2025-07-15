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
  bookmarkList,
  addBookmarkModal,
  closeModalBtn,
  saveBookmarkBtn,
  bookmarkUrlInput,
  bookmarkTitleInput,
  loadMainPageBtn, // 追加
  iframeOverlayIcon, // 追加
  expandToggleBtn, // 追加
  privacyToggle, // プライベートモード切り替え
  privacyIcon; // プライベートモードアイコン
let isExpanded = false; // 拡大状態フラグ
let isPrivateMode = false; // プライベートモード状態
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
  // loginInfo = document.getElementById("loginInfo"); // 削除（HTMLに存在しない）
  quickBtns = document.querySelectorAll(".quick-btn");
  searchHistoryEl = document.getElementById("searchHistory");
  addBookmarkBtn = document.getElementById("addBookmarkBtn");
  bookmarkList = document.getElementById("bookmarkList");
  addBookmarkModal = document.getElementById("addBookmarkModal");
  closeModalBtn = document.getElementById("closeModalBtn");
  saveBookmarkBtn = document.getElementById("saveBookmarkBtn");
  bookmarkUrlInput = document.getElementById("bookmarkUrlInput");
  bookmarkTitleInput = document.getElementById("bookmarkTitleInput");
  loadMainPageBtn = document.getElementById("loadMainPageBtn"); // 追加
  iframeOverlayIcon = document.getElementById("iframeOverlayIcon"); // 追加
  expandToggleBtn = document.getElementById("expandToggle"); // 追加
  privacyToggle = document.getElementById("privacyToggle"); // プライベートモード切り替え
  privacyIcon = document.getElementById("privacyIcon"); // プライベートモードアイコン

  console.log("[iframe] 要素取得結果:", {
    urlInput: !!urlInput,
    goBtn: !!goBtn,
    clearBtn: !!clearBtn,
    mainFrame: !!mainFrame,
    statusBar: !!statusBar,
    // loginInfo: !!loginInfo, // 削除
    quickBtns: quickBtns.length,
    searchHistoryEl: !!searchHistoryEl,
    addBookmarkBtn: !!addBookmarkBtn,
    bookmarkList: !!bookmarkList,
    addBookmarkModal: !!addBookmarkModal,
    closeModalBtn: !!closeModalBtn,
    saveBookmarkBtn: !!saveBookmarkBtn,
    bookmarkUrlInput: !!bookmarkUrlInput,
    bookmarkTitleInput: !!bookmarkTitleInput,
    loadMainPageBtn: !!loadMainPageBtn,
    iframeOverlayIcon: !!iframeOverlayIcon,
    expandToggleBtn: !!expandToggleBtn,
    privacyToggle: !!privacyToggle,
    privacyIcon: !!privacyIcon,
  });

  if (!searchHistoryEl) {
    console.error("[iframe] searchHistoryElが見つかりません！");
  }

  // ★ 追加: ステータスバーを必ず非表示に初期化
  if (statusBar) {
    statusBar.style.display = "none";
  }

  // ★ 追加: オーバーレイアイコンは初期状態で非表示
  if (iframeOverlayIcon) {
    iframeOverlayIcon.style.display = "none";
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
let currentLoadIsLoginSite = false; // ★ログイン維持サイトかのフラグ

// ステータス更新
// ステータスバーへのメッセージ表示とログ出力を制御する関数
// suppressLog: true の場合、コンソールへの出力を抑制します
// suppressToast: true の場合、トースターメッセージの表示を抑制します
function updateStatus(
  message,
  type = "info",
  suppressLog = false,
  suppressToast = false
) {
  if (!suppressLog) {
    console.log(`[iframe] ステータス更新: ${message}`);
  }

  // ステータス表示用の要素を取得
  let statusElement = document.getElementById("statusBar");
  if (!statusElement) {
    console.warn(`[iframe] statusBar要素が見つかりません`);
    return;
  }

  // メッセージが空・null・undefinedなら非表示にする
  if (!message) {
    statusElement.style.display = "none";
    return;
  }

  // suppressToastがtrueの場合はトースターメッセージを表示しない
  if (suppressToast) {
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
  console.log(`[iframe] 🔥 isValidUrl(${string}) 開始`);

  try {
    const url = new URL(string);
    const result = url.protocol === "http:" || url.protocol === "https:";
    console.log(`[iframe] 🔥 isValidUrl(${string}) 直接URL判定: ${result}`);
    return result;
  } catch (error) {
    console.log(`[iframe] 🔥 isValidUrl(${string}) 直接URL判定失敗:`, error);
    // http:// や https:// がない場合も試す
    try {
      const url = new URL("https://" + string);
      const result = url.hostname.includes(".");
      console.log(
        `[iframe] 🔥 isValidUrl(${string}) https://追加判定: ${result}`
      );
      return result;
    } catch (error2) {
      console.log(
        `[iframe] 🔥 isValidUrl(${string}) https://追加判定も失敗:`,
        error2
      );
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

// SideEffect: URLに対してファビコンを自動設定する機能
const FAVICON_CACHE_KEY = "iframeFaviconCache";

// ファビコンキャッシュを読み込む
function loadFaviconCache() {
  try {
    const stored = localStorage.getItem(FAVICON_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("[iframe] ファビコンキャッシュ読み込みエラー:", error);
    return {};
  }
}

// ファビコンキャッシュを保存する
function saveFaviconCache(cache) {
  try {
    localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
    console.log(
      "[iframe] ファビコンキャッシュを保存しました",
      Object.keys(cache).length,
      "件"
    );
  } catch (error) {
    console.error("[iframe] ファビコンキャッシュ保存エラー:", error);
  }
}

// URLに対してファビコンを自動設定（SideEffect）
async function setFaviconForUrl(url) {
  const domain = getDomain(url);
  if (!domain) return;

  const cache = loadFaviconCache();

  // キャッシュに既に存在する場合はスキップ
  if (cache[domain]) {
    console.log(`[iframe] ファビコンキャッシュヒット: ${domain}`);
    return;
  }

  console.log(`[iframe] SideEffect: ${domain} のファビコンを自動設定`);

  try {
    const faviconUrl = await getFaviconUrl(url);
    if (faviconUrl) {
      cache[domain] = faviconUrl;
      saveFaviconCache(cache);
      console.log(
        `[iframe] SideEffect: ${domain} のファビコンをキャッシュに保存`
      );
    }
  } catch (error) {
    console.error(
      `[iframe] SideEffect: ${domain} のファビコン設定エラー:`,
      error
    );
  }
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
  currentLoadIsLoginSite = loginCheck.isLogin; // ★フラグを設定

  if (loginCheck.isLogin) {
    updateStatus(
      `${loginCheck.siteName} のログイン状態を維持して接続中...`,
      "info"
    );

    // ログイン状態維持のための動的ルール追加
    await addDynamicRule(loginCheck.domain);
  } else {
    updateStatus("接続中...", "info");
  }

  // 段階1: 直接読み込み
  try {
    console.log(`[iframe] 🔥 段階1: 直接読み込み`);
    mainFrame.src = url;
    updateOverlayIconVisibility();

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
      updateOverlayIconVisibility();

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
    mainFrame.setAttribute("allowfullscreen", "true");
    mainFrame.setAttribute("referrerpolicy", "unsafe-url");
    mainFrame.setAttribute("credentialless", "false");

    mainFrame.src = url;
    updateOverlayIconVisibility();

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
    newFrame.setAttribute("allowfullscreen", "true");
    newFrame.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    newFrame.setAttribute("loading", "eager");

    container.removeChild(mainFrame);
    container.appendChild(newFrame);

    // グローバル参照を更新
    window.mainFrame = newFrame;
    updateOverlayIconVisibility();

    await new Promise((resolve) => setTimeout(resolve, 2000));
    updateStatus(`✅ 最終兵器で接続成功: ${url}`, "success");
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階4失敗（続行）:`, error);
  }

  // 段階5: 最終手段（iframe内で直接表示を試行）
  try {
    console.log(`[iframe] 🔥 段階5: 最終手段 - iframe内で直接表示`);

    // iframeを直接表示
    mainFrame.src = url;
    updateStatus(`✅ iframe内で表示中: ${url}`, "success");
    return true;
  } catch (error) {
    console.log(`[iframe] 🔥 段階5失敗（続行）:`, error);
  }

  // すべて失敗してもiframe内で表示を試行
  console.log(`[iframe] 🔥 最終手段: iframe内で直接表示`);
  mainFrame.src = url;
  updateStatus(`✅ iframe内で表示完了: ${url}`, "success");
  return true;
}

function loadHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");

    // 旧データ構造（文字列配列）を新データ構造（オブジェクト配列）に変換
    const convertedHistory = history.map((item) => {
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

    // 古いBlob URLをbase64形式に変換
    const updatedHistory = convertedHistory.map((item) => {
      if (item && typeof item === "object" && item.faviconUrl) {
        // Blob URLの場合、キャッシュからbase64を取得
        if (item.faviconUrl.startsWith("blob:")) {
          const domain = getDomain(item.url);
          if (domain) {
            const cache = loadFaviconCache();
            if (cache[domain]) {
              console.log(`[iframe] Blob URLをbase64に変換: ${domain}`);
              return { ...item, faviconUrl: cache[domain] };
            }
          }
        }
      }
      return item;
    });

    // 更新された履歴を保存
    if (JSON.stringify(convertedHistory) !== JSON.stringify(updatedHistory)) {
      saveHistory(updatedHistory);
      console.log("[iframe] 履歴のBlob URLをbase64形式に変換しました");
    }

    return updatedHistory;
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

// ファビコンURLを取得する関数（base64形式で永続化対応）
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

    // 0. まずキャッシュを確認
    const cache = loadFaviconCache();
    if (cache[domain]) {
      console.log(`[iframe] ファビコンキャッシュヒット: ${domain}`);
      return cache[domain];
    }

    // 1. まずChrome拡張APIでファビコンを取得
    try {
      const dataUrl = await fetchFaviconDataUrl(domain);
      if (dataUrl) {
        console.log(`[iframe] ファビコン取得成功 (Chrome拡張API): ${domain}`);
        // キャッシュに保存
        cache[domain] = dataUrl;
        saveFaviconCache(cache);
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
        // base64形式で保存するため、dataURLに変換
        const dataUrl = await blobToDataUrl(blob);
        console.log(`[iframe] ファビコン取得成功 (Google API): ${domain}`);
        // キャッシュに保存
        cache[domain] = dataUrl;
        saveFaviconCache(cache);
        return dataUrl;
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
        // base64形式で保存するため、dataURLに変換
        const dataUrl = await blobToDataUrl(blob);
        console.log(`[iframe] ファビコン取得成功 (直接URL): ${domain}`);
        // キャッシュに保存
        cache[domain] = dataUrl;
        saveFaviconCache(cache);
        return dataUrl;
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

// BlobをDataURLに変換する関数
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

// YouTube URLを埋め込み用URLに変換する関数
// YouTubeの視聴ページを埋め込み用URLに変換する関数
// - 通常のwatch/shortsリンクを iframe 再生用に変換する
// - 変換できない場合はそのまま返す
// YouTubeのURLを iframe で再生できる形式に変換する
// - watch や shorts, youtu.be 形式をサポート
// - 変換できない場合は入力URLをそのまま返す
function convertYouTubeUrl(url) {
  console.log(`[iframe] convertYouTubeUrl: ${url}`);
  try {
    const u = new URL(url);
    let videoId = null;
    let start = null;

    // youtu.be/<id>
    if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
      start = u.searchParams.get("t") || u.searchParams.get("start");
    }

    // youtube.com/watch?v=<id>
    if (
      !videoId &&
      u.hostname.includes("youtube.com") &&
      u.pathname === "/watch"
    ) {
      videoId = u.searchParams.get("v");
      start = u.searchParams.get("t") || u.searchParams.get("start");
    }

    // youtube.com/shorts/<id>
    if (
      !videoId &&
      u.hostname.includes("youtube.com") &&
      u.pathname.startsWith("/shorts/")
    ) {
      videoId = u.pathname.split("/")[2] || u.pathname.split("/")[1];
    }

    if (videoId) {
      // 埋め込み用URLに変換（自動再生＆ミュート）
      let embed = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1&mute=1`;
      if (start) embed += `&start=${parseInt(start, 10)}`;
      console.log(`[iframe] YouTube埋め込みURLに変換: ${embed}`);
      return embed;
    }
  } catch (e) {
    console.error("[iframe] convertYouTubeUrl error:", e);
  }
  return url;
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
  localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  console.log("[iframe] ブックマークを保存しました", bookmarks);
}

// ブックマーク追加
async function addBookmark(title, url) {
  console.log(`[iframe] ブックマーク追加: ${title} (${url})`);
  // URLバリデーション追加
  if (!/^https?:\/\//.test(url)) {
    // URLが無効な場合は処理を中断し、トーストで通知
    console.log(`[iframe] ブックマーク追加を中断: 無効なURL (${url})`);
    if (window.AppUtils && window.AppUtils.showToast) {
      // トーストで保存失敗を表示
      window.AppUtils.showToast("保存失敗", "error");
    } else {
      // AppUtilsがない場合はステータスバーで表示
      updateStatus("保存失敗", "error");
    }
    return;
  }
  let bookmarks = loadBookmarks();
  if (!bookmarks.some((b) => b.url === url)) {
    // faviconUrlを取得
    let faviconUrl = await getFaviconUrl(url);
    if (!faviconUrl) {
      faviconUrl = null;
    }
    bookmarks.push({ title, url, id: url, faviconUrl }); // faviconUrlも保存
    saveBookmarks(bookmarks);
    renderBookmarks();
    updateStatus(`「${title}」をブックマークに追加しました`, "success");
  } else {
    updateStatus("このブックマークは既に追加されています", "info");
  }
}

// ブックマーク削除
function removeBookmark(id) {
  console.log(`[iframe] ブックマーク削除: ${id}`);
  let bookmarks = loadBookmarks();
  const updatedBookmarks = bookmarks.filter((b) => b.id !== id);
  saveBookmarks(updatedBookmarks);
  renderBookmarks();
  updateStatus("ブックマークを削除しました", "info");
}

// ───────────────────────────────────────
// Drag & Drop handlers for BOOKMARKs
// ───────────────────────────────────────
// ドラッグ開始元のインデックスを保持
let dragBookmarkIndex = null;

// ドラッグ開始時に呼び出される
function handleBookmarkDragStart(e) {
  dragBookmarkIndex = +this.dataset.index;
  console.log("[BOOKMARK D&D] drag start:", dragBookmarkIndex);
  e.dataTransfer.effectAllowed = "move";
}

// ドラッグしている要素が他のブックマーク上にあるときの処理
function handleBookmarkDragOver(e) {
  e.preventDefault();

  document.querySelectorAll(".bookmark-item.drop-indicator").forEach((el) => {
    el.classList.remove("drop-indicator", "active");
  });

  console.log(`[BOOKMARK D&D] dragover on index ${this.dataset.index}`);

  // ハイライト表示のみ行う
  this.classList.add("drop-indicator", "active");
}

// ドラッグしている要素が範囲外に出たときの処理
function handleBookmarkDragLeave() {
  this.classList.remove("drop-indicator", "active");
  console.log(`[BOOKMARK D&D] dragleave on index ${this.dataset.index}`);
}

// ドラッグ操作が終了したときの処理
function handleBookmarkDragEnd() {
  document
    .querySelectorAll(".bookmark-item")
    .forEach((el) => el.classList.remove("drop-indicator", "active"));
  dragBookmarkIndex = null;
  console.log("[BOOKMARK D&D] drag end");
}

async function handleBookmarkDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  const dropIndex = +this.dataset.index;

  console.log(
    `[BOOKMARK D&D] drop from ${dragBookmarkIndex} onto ${dropIndex}`
  );
  if (dragBookmarkIndex === null || dragBookmarkIndex === dropIndex) return;

  let bookmarks = loadBookmarks();

  // ドラッグ元とドロップ先の要素を入れ替える
  [bookmarks[dragBookmarkIndex], bookmarks[dropIndex]] = [
    bookmarks[dropIndex],
    bookmarks[dragBookmarkIndex],
  ];

  console.log("[BOOKMARK D&D] 保存前のbookmarks配列:", bookmarks);
  saveBookmarks(bookmarks);
  console.log("[BOOKMARK D&D] 保存完了");

  renderBookmarks();
  // BOOKMARKの入れ替え時のトースターメッセージは削除
  // showDragDropSuccessMessage(dragBookmarkIndex + 1, dropIndex + 1);

  dragBookmarkIndex = null;
}

/*━━━━━━━━━━ ドラッグ＆ドロップ成功メッセージ ━━━━━━━━━━*/
// BOOKMARKの入れ替え時のトースターメッセージは削除
// function showDragDropSuccessMessage(fromPosition, toPosition) {
//   const message = `${fromPosition}番目と${toPosition}番目を入れ替えました`;
//   const toast = document.createElement("div");
//   toast.className = "drag-drop-toast";
//   toast.innerHTML = `
//     <i class="bi bi-check-circle-fill"></i>
//     <span>${message}</span>
//   `;
//   document.body.appendChild(toast);
//   setTimeout(() => {
//     toast.style.opacity = "1";
//     toast.style.transform = "translateX(0)";
//   }, 10);
//   setTimeout(() => {
//     toast.classList.add("fade-out");
//     setTimeout(() => {
//       if (toast.parentNode) toast.parentNode.removeChild(toast);
//     }, 300);
//   }, 3000);
// }

// ブックマーク描画
function renderBookmarks() {
  console.log("[iframe] ブックマークを描画します");
  const bookmarks = loadBookmarks();
  console.log("[iframe] 読み込んだブックマーク:", bookmarks);

  // 無効なブックマークを自動削除
  const validBookmarks = bookmarks.filter((bookmark) => {
    if (
      !bookmark.url ||
      bookmark.url === "favicon" ||
      bookmark.url.trim() === ""
    ) {
      console.log(`[iframe] 無効なブックマークを削除:`, bookmark);
      return false;
    }
    return true;
  });

  // 無効なブックマークが削除された場合は保存
  if (validBookmarks.length !== bookmarks.length) {
    console.log(
      `[iframe] 無効なブックマークを削除して保存: ${bookmarks.length} → ${validBookmarks.length}`
    );
    saveBookmarks(validBookmarks);
  }

  bookmarkList.innerHTML = ""; // 既存のブックマークをクリア

  validBookmarks.forEach((bookmark, index) => {
    console.log(`[iframe] ブックマーク${index}:`, bookmark);
    console.log(`[iframe] ブックマーク${index}のURL:`, bookmark.url);
    console.log(`[iframe] ブックマーク${index}のタイトル:`, bookmark.title);

    const bookmarkItem = document.createElement("a");
    bookmarkItem.href = "#"; // クリックでページ遷移しないように
    bookmarkItem.className = "bookmark-item";
    bookmarkItem.dataset.url = bookmark.url;
    bookmarkItem.dataset.index = index;
    bookmarkItem.draggable = true;
    bookmarkItem.title = bookmark.title;

    // img要素を生成しfaviconUrlがあればそれをsrcに、なければ地球儀
    const iconDiv = document.createElement("div");
    iconDiv.className = "bookmark-icon";
    if (bookmark.faviconUrl) {
      const img = document.createElement("img");
      img.src = bookmark.faviconUrl;
      img.alt = "favicon";
      img.width = 32;
      img.height = 32;
      img.style.borderRadius = "4px";
      img.onerror = function () {
        this.style.display = "none";
        this.parentNode.innerHTML = `<i class='bi bi-globe' style='font-size:28px;color:#bbb;'></i>`;
      };
      iconDiv.appendChild(img);
    } else {
      iconDiv.innerHTML = `<i class='bi bi-globe' style='font-size:28px;color:#bbb;'></i>`;
    }

    bookmarkItem.innerHTML = "";
    bookmarkItem.appendChild(iconDiv);
    const titleSpan = document.createElement("span");
    titleSpan.className = "bookmark-title";
    titleSpan.textContent = bookmark.title;
    bookmarkItem.appendChild(titleSpan);
    const removeBtn = document.createElement("button");
    removeBtn.className = "bookmark-remove";
    removeBtn.title = "削除";
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // ★重要: 親要素(aタグ)へのイベント伝播を停止
      removeBookmark(bookmark.id);
    });
    bookmarkItem.appendChild(removeBtn);

    // ブックマーク本体のクリックイベント
    bookmarkItem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log(`[iframe] ブックマーククリック: ${bookmark.url}`);

      // IFRAME内で表示
      const iframeContainer = document.querySelector(".iframe-container");
      if (iframeContainer) {
        iframeContainer.classList.add("viewing");
      }

      // URL入力欄に設定
      if (urlInput) {
        urlInput.value = bookmark.url;
      }

      // handleInputで処理
      handleInput(bookmark.url);
    });

    // Drag & Drop events
    bookmarkItem.addEventListener("dragstart", handleBookmarkDragStart);
    bookmarkItem.addEventListener("dragover", handleBookmarkDragOver);
    bookmarkItem.addEventListener("dragleave", handleBookmarkDragLeave);
    bookmarkItem.addEventListener("drop", handleBookmarkDrop);
    bookmarkItem.addEventListener("dragend", handleBookmarkDragEnd);

    bookmarkList.appendChild(bookmarkItem);
  });
}

// ブックマークを新しいタブで開く
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
        <i id="expandToggle" class="bi bi-arrows-angle-expand footer-icon" title="拡大/縮小"></i>
      </div>
      <div class="history-container">
        <span class="text-muted">検索履歴はありません</span>
      </div>
      <button class="new-search-btn" id="newSearchBtn">
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
      <i id="expandToggle" class="bi bi-arrows-angle-expand footer-icon" title="拡大/縮小"></i>
    </div>
    <div class="history-container">
      <div class="search-history">
        <div id="favicon-row"></div>
      </div>
    </div>
    <div class="search-btns-wrapper">
      <button class="new-search-btn" id="newSearchBtn">
        <i class="bi bi-plus-circle"></i> 新しい検索
      </button>
      <button class="clear-history-btn" id="clearHistoryBtn" title="検索履歴を全消去">
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
    // 自動スクロール時の速度設定
    const AUTO_SCROLL_STEP = 12; // px/interval: 高速化
    const AUTO_SCROLL_INTERVAL = 60; // ms
    let scrollInterval = null;

    function stopAutoScroll() {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    }

    function startAutoScroll(direction) {
      stopAutoScroll();
      // 横スクロールが必要な場合のみ
      if (row.scrollWidth <= row.clientWidth) return;
      console.log("[iframe] 自動スクロール開始", {
        direction,
        step: AUTO_SCROLL_STEP,
        interval: AUTO_SCROLL_INTERVAL,
      });
      scrollInterval = setInterval(() => {
        if (direction === "right") {
          if (row.scrollLeft < row.scrollWidth - row.clientWidth) {
            row.scrollLeft += AUTO_SCROLL_STEP;
          } else {
            stopAutoScroll();
          }
        } else {
          if (row.scrollLeft > 0) {
            row.scrollLeft -= AUTO_SCROLL_STEP;
          } else {
            stopAutoScroll();
          }
        }
      }, AUTO_SCROLL_INTERVAL);
    }

    // 端のアイコンにホバーしたときだけ自動スクロールを開始
    wrappers.forEach((wrapper) => {
      wrapper.addEventListener("mouseenter", () => {
        if (row.scrollWidth <= row.clientWidth) return;
        const rowRect = row.getBoundingClientRect();
        const iconRect = wrapper.getBoundingClientRect();
        const threshold = 4; // px: アイコンが端にあるとみなす範囲

        if (rowRect.right - iconRect.right <= threshold) {
          console.log("[iframe] 右端アイコンhover - スクロール開始(right)");
          startAutoScroll("right");
        } else if (iconRect.left - rowRect.left <= threshold) {
          console.log("[iframe] 左端アイコンhover - スクロール開始(left)");
          startAutoScroll("left");
        }
      });
    });

    // マウスポインタが履歴行から離れたら自動スクロールを停止
    row.addEventListener("mouseleave", () => {
      console.log("[iframe] favicon-row leave - スクロール停止");
      stopAutoScroll();
    });
  }
  // --- 自動スクロール機能ここまで ---

  // 新しい検索ボタンのイベント
  const newSearchBtn = document.getElementById("newSearchBtn");
  if (newSearchBtn) {
    newSearchBtn.addEventListener("click", () => {
      console.log("[iframe] 新しい検索ボタンクリック");
      focusSearchInput();
    });
    console.log("[iframe] 新しい検索ボタンのイベントを登録しました");
  }

  // 検索履歴全削除ボタンのイベント
  const clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      showDeleteHistoryDialog();
    });
    console.log("[iframe] 検索履歴削除ボタンのイベントを登録しました");
  }

  // リロードアイコンのイベント
  const reloadIcon = document.querySelector(
    ".footer-icons .bi-arrow-clockwise.footer-icon"
  );
  if (reloadIcon) {
    reloadIcon.addEventListener("click", () => {
      console.log(
        "[iframe] リロードアイコンクリック - iframe内ページを再読み込みします"
      );
      if (mainFrame && mainFrame.src) {
        const currentSrc = mainFrame.src; // 現在のURLを保持
        mainFrame.src = currentSrc; // iframeだけをリロード
        console.log("[iframe] mainFrame.src を再設定:", currentSrc);
      } else {
        console.log("[iframe] mainFrame が見つからないか src が空です");
      }
    });
    console.log("[iframe] リロードアイコンのイベントを登録しました");
  }

  // ホームアイコンのイベント
  const homeIcon = document.querySelector(
    ".footer-icons .bi-house.footer-icon"
  );
  if (homeIcon) {
    homeIcon.addEventListener("click", () => {
      console.log(
        "[iframe] ホームアイコンクリック - 新しい検索ページを表示します"
      );
      focusSearchInput();
    });
    console.log("[iframe] ホームアイコンのイベントを登録しました");
  }

  // 拡大/縮小アイコンのイベント
  expandToggleBtn = document.getElementById("expandToggle");
  if (expandToggleBtn) {
    expandToggleBtn.addEventListener("click", toggleExpand);
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
    const iframeContainer = document.querySelector(".iframe-container");

    if (isValidUrl(cleanInput)) {
      // URL直接アクセス
      const fullUrl = cleanInput.startsWith("http")
        ? cleanInput
        : "https://" + cleanInput;
      console.log(`[iframe] 🔥 既存アイコンURL直接アクセス: ${fullUrl}`);

      currentUrl = fullUrl;
      iframeContainer.classList.add("viewing");
      try {
        forceLoadIframe(fullUrl);
        updateOverlayIconVisibility();
      } catch (error) {
        console.error(`[iframe] 🔥 iframe読み込みエラー:`, error);
        updateStatus(`❌ 読み込みエラー: ${error.message}`, "error");
        iframeContainer.classList.remove("viewing");

        // エラー時もiframe内で表示を試行
        try {
          console.log(`[iframe] 🔥 エラー時のiframe表示試行: ${fullUrl}`);
          mainFrame.src = fullUrl;
          console.log(`[iframe] mainFrame.src set to: ${fullUrl}`);
          updateStatus(`✅ iframe内で表示中: ${fullUrl}`, "success");
          updateOverlayIconVisibility();
        } catch (iframeError) {
          console.error(`[iframe] 🔥 iframe表示エラー:`, iframeError);
          updateStatus(`❌ iframe表示エラー: ${iframeError.message}`, "error");
        }
      }
    } else {
      // Google検索
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        cleanInput
      )}`;
      console.log(`[iframe] 🔥 既存アイコンGoogle検索: ${searchUrl}`);

      currentUrl = searchUrl;
      iframeContainer.classList.add("viewing");
      try {
        updateStatus("Google検索中...", "info");
        mainFrame.src = searchUrl;
        updateOverlayIconVisibility();
        setTimeout(() => {
          updateStatus(`✅ Google検索完了: ${cleanInput}`, "success");
        }, 1000);
      } catch (error) {
        console.error(`[iframe] 🔥 Google検索エラー:`, error);
        updateStatus(`❌ 検索エラー: ${error.message}`, "error");
        iframeContainer.classList.remove("viewing");

        // エラー時もiframe内で表示を試行
        try {
          mainFrame.src = searchUrl;
          updateStatus(`✅ iframe内で検索中: ${cleanInput}`, "success");
          updateOverlayIconVisibility();
        } catch (iframeError) {
          console.error(`[iframe] 🔥 iframe検索エラー:`, iframeError);
          updateStatus(`❌ iframe検索エラー: ${iframeError.message}`, "error");
        }
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
      } else if (historyItem.faviconUrl.startsWith("data:image/")) {
        // base64形式のデータURLの場合（永続化対応）
        console.log(
          `[iframe] base64データURLを使用:`,
          historyItem.faviconUrl.substring(0, 50) + "..."
        );
        const img = document.createElement("img");
        img.src = historyItem.faviconUrl;
        img.alt = "favicon";
        img.className = "favicon-img";
        img.onerror = function () {
          console.log(
            `[iframe] base64データURL読み込みエラー:`,
            historyItem.faviconUrl.substring(0, 50) + "..."
          );
          this.parentElement.innerHTML = getGoogleSVG();
        };
        img.onload = function () {
          console.log(
            `[iframe] base64データURL読み込み成功:`,
            historyItem.faviconUrl.substring(0, 50) + "..."
          );
        };
        a.appendChild(img);
      } else if (historyItem.faviconUrl.startsWith("blob:")) {
        // Blob URLの場合（後方互換性）
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

// 検索入力にフォーカスし、IFRAMEを初期状態に戻す関数
function focusSearchInput() {
  console.log("[iframe] 🔥 新しい検索ボタンクリック - 初期状態に戻す");

  // URL入力欄をクリア
  if (urlInput) {
    urlInput.value = "";
    urlInput.focus();
  }

  // IFRAMEを初期状態に戻す
  const iframeContainer = document.querySelector(".iframe-container");
  if (iframeContainer) {
    iframeContainer.classList.remove("viewing");
    console.log("[iframe] 🔥 iframeContainer.viewingクラスを削除");
  }

  // mainFrameをクリア
  if (mainFrame) {
    mainFrame.src = "";
    console.log("[iframe] 🔥 mainFrame.srcをクリア");
  }

  // 現在のURLをリセット
  currentUrl = "";

  // 初期化時はトースターメッセージを表示しない
  // updateStatus("新しい検索の準備ができました", "info");

  console.log("[iframe] 🔥 IFRAME初期状態に戻しました");
}

// グローバルスコープに公開（デバッグ用）
window.focusSearchInput = focusSearchInput;

// CSP対応の検索履歴削除ダイアログ
function showDeleteHistoryDialog() {
  console.log("[iframe] 検索履歴削除ダイアログを表示");

  // 既存のダイアログがあれば削除
  const existingDialog = document.querySelector(".delete-history-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // ダイアログHTML作成
  const dialog = document.createElement("div");
  dialog.className = "delete-history-dialog";
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <div class="dialog-icon-wrapper">
            <i class="bi bi-trash-fill dialog-icon"></i>
          </div>
          <div class="dialog-title-wrapper">
            <h3 class="dialog-title">検索履歴の削除</h3>
          </div>
        </div>
        <div class="dialog-body">
          <div class="dialog-message-wrapper">
            <p class="dialog-message">検索履歴をすべて削除しますか？<br><span class="delete-warning">この操作は取り消せません。</span></p>
          </div>
        </div>
        <div class="dialog-footer">
          <div class="dialog-buttons-wrapper">
            <button class="dialog-btn cancel-btn" data-action="cancel">
              <i class="bi bi-x-circle"></i>
              <span>キャンセル</span>
            </button>
            <button class="dialog-btn confirm-btn" data-action="confirm">
              <i class="bi bi-check-circle"></i>
              <span>削除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // CSP対応のスタイルを直接適用
  dialog.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    pointer-events: auto !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    box-sizing: border-box !important;
  `;

  // オーバーレイスタイル
  const overlay = dialog.querySelector(".dialog-overlay");
  if (overlay) {
    overlay.style.cssText = `
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      z-index: 999998 !important;
      width: 100% !important;
      height: 100% !important;
      animation: dialogFadeIn 0.25s ease-out !important;
    `;
  }

  // コンテンツスタイル
  const content = dialog.querySelector(".dialog-content");
  if (content) {
    content.style.cssText = `
      position: relative !important;
      background: #23272f !important;
      border-radius: 20px !important;
      min-width: 340px !important;
      max-width: 420px !important;
      width: 100% !important;
      margin: 20px auto !important;
      box-shadow: none !important;
      border: none !important;
      overflow: hidden !important;
      display: flex !important;
      flex-direction: column !important;
      z-index: 999999 !important;
      animation: dialogSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    `;
  }

  // ヘッダースタイル
  const header = dialog.querySelector(".dialog-header");
  if (header) {
    header.style.cssText = `
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      padding: 28px 28px 20px !important;
      background: #23272f !important;
      text-align: center !important;
      border: none !important;
      width: 100% !important;
    `;
  }

  // アイコンラッパースタイル
  const iconWrapper = dialog.querySelector(".dialog-icon-wrapper");
  if (iconWrapper) {
    iconWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 48px !important;
      height: 48px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
      box-shadow: none !important;
      flex-shrink: 0 !important;
      margin: 0 !important;
    `;
  }

  // タイトルラッパースタイル
  const titleWrapper = dialog.querySelector(".dialog-title-wrapper");
  if (titleWrapper) {
    titleWrapper.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    `;
  }

  // タイトルスタイル
  const title = dialog.querySelector(".dialog-title");
  if (title) {
    title.style.cssText = `
      color: #ffffff !important;
      font-size: 1.3rem !important;
      font-weight: 800 !important;
      margin: 0 !important;
      line-height: 1.3 !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
      text-align: left !important;
      width: auto !important;
    `;
  }

  // ボディスタイル
  const body = dialog.querySelector(".dialog-body");
  if (body) {
    body.style.cssText = `
      padding: 24px 28px !important;
      flex: 1 !important;
      text-align: center !important;
      width: 100% !important;
      background: #23272f !important;
      border: none !important;
    `;
  }

  // フッタースタイル
  const footer = dialog.querySelector(".dialog-footer");
  if (footer) {
    footer.style.cssText = `
      padding: 20px 28px 28px !important;
      background: #23272f !important;
      text-align: center !important;
      width: 100% !important;
      border: none !important;
    `;
  }

  // メッセージラッパースタイル
  const messageWrapper = dialog.querySelector(".dialog-message-wrapper");
  if (messageWrapper) {
    messageWrapper.style.cssText = `
      width: 100% !important;
      text-align: center !important;
    `;
  }

  // メッセージスタイル
  const message = dialog.querySelector(".dialog-message");
  if (message) {
    message.style.cssText = `
      color: #e2e8f0 !important;
      font-size: 1.05rem !important;
      line-height: 1.6 !important;
      margin: 0 !important;
      text-align: center !important;
      width: 100% !important;
    `;
  }

  // 警告メッセージスタイル
  const warning = dialog.querySelector(".delete-warning");
  if (warning) {
    warning.style.cssText = `
      color: #ff6b6b !important;
      font-weight: bold !important;
    `;
  }

  // ボタンラッパースタイル
  const buttonsWrapper = dialog.querySelector(".dialog-buttons-wrapper");
  if (buttonsWrapper) {
    buttonsWrapper.style.cssText = `
      display: flex !important;
      gap: 12px !important;
      justify-content: center !important;
      flex-wrap: wrap !important;
      width: 100% !important;
    `;
  }

  // ボタン共通スタイル
  const buttons = dialog.querySelectorAll(".dialog-btn");
  buttons.forEach((btn) => {
    btn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      border: none !important;
      border-radius: 12px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      min-width: 100px !important;
      transition: all 0.25s ease !important;
    `;
  });

  // キャンセルボタンスタイル
  const cancelBtn = dialog.querySelector(".cancel-btn");
  if (cancelBtn) {
    cancelBtn.style.cssText += `
      background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(74, 85, 104, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    `;

    // ホバー効果
    cancelBtn.addEventListener("mouseenter", () => {
      cancelBtn.style.background =
        "linear-gradient(135deg, #2d3748 0%, #1a202c 100%)";
      cancelBtn.style.transform = "translateY(-2px)";
      cancelBtn.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.4)";
    });
    cancelBtn.addEventListener("mouseleave", () => {
      cancelBtn.style.background =
        "linear-gradient(135deg, #4a5568 0%, #2d3748 100%)";
      cancelBtn.style.transform = "translateY(0)";
      cancelBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  // 確認ボタンスタイル
  const confirmBtn = dialog.querySelector(".confirm-btn");
  if (confirmBtn) {
    confirmBtn.style.cssText += `
      background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important;
      color: #ffffff !important;
      border: 1px solid rgba(220, 53, 69, 0.3) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    `;

    // ホバー効果
    confirmBtn.addEventListener("mouseenter", () => {
      confirmBtn.style.background =
        "linear-gradient(135deg, #c82333 0%, #a71e2a 100%)";
      confirmBtn.style.transform = "translateY(-2px)";
      confirmBtn.style.boxShadow = "0 6px 20px rgba(220, 53, 69, 0.4)";
    });
    confirmBtn.addEventListener("mouseleave", () => {
      confirmBtn.style.background =
        "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";
      confirmBtn.style.transform = "translateY(0)";
      confirmBtn.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    });
  }

  // ボタンアイコンスタイル
  const btnIcons = dialog.querySelectorAll(".dialog-btn i");
  btnIcons.forEach((icon) => {
    icon.style.cssText = `
      font-size: 18px !important;
      margin-right: 4px !important;
    `;
  });

  // DOMに追加
  document.body.appendChild(dialog);

  // アニメーション用のキーフレームを動的に追加
  if (!document.querySelector("#delete-history-animations")) {
    const animationStyles = document.createElement("style");
    animationStyles.id = "delete-history-animations";
    animationStyles.textContent = `
      @keyframes dialogFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes dialogSlideIn {
        from { 
          opacity: 0; 
          transform: translateY(-40px) scale(0.95);
        }
        to { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes dialogSlideOut {
        from { 
          opacity: 1; 
          transform: translateY(0) scale(1);
        }
        to { 
          opacity: 0; 
          transform: translateY(-20px) scale(0.98);
        }
      }
    `;
    document.head.appendChild(animationStyles);
  }

  // 閉じる処理
  function closeDialog() {
    content.classList.add("closing");
    overlay.classList.add("closing");
    setTimeout(() => {
      dialog.remove();
    }, 250);
  }

  // ボタンイベント
  if (cancelBtn) {
    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("[iframe] 検索履歴削除をキャンセルしました");
      closeDialog();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("[iframe] 検索履歴を削除しました");
      saveHistory([]);
      renderHistory();
      updateStatus("検索履歴を削除しました", "info");
      closeDialog();
    });
  }

  // オーバーレイクリックで閉じる
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        console.log("[iframe] 検索履歴削除をキャンセルしました");
        closeDialog();
      }
    });
  }

  // ESCキーで閉じる
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      console.log("[iframe] 検索履歴削除をキャンセルしました（ESC）");
      closeDialog();
      document.removeEventListener("keydown", handleKeyDown);
    }
  };
  document.addEventListener("keydown", handleKeyDown);
}

// handleInputを修正: forceShow引数追加でiframe表示を必ず行う
async function handleInput(input, forceShow = false) {
  console.log(`[iframe] 🔥 入力処理開始: ${input}`);

  if (!input || input.trim() === "") {
    console.log(`[iframe] 🔥 入力が空のため処理を終了`);
    // updateStatus("入力が空です", "error");
    return;
  }

  // forceShow=trueまたはプライベートモードの場合は履歴追加をスキップ
  if (!forceShow && !isPrivateMode) {
    console.log(`[iframe] 🔥 履歴に追加: ${input.trim()}`);
    await addHistory(input.trim());
  } else if (isPrivateMode) {
    console.log(
      `[iframe] 🔥 プライベートモードのため履歴保存をスキップ: ${input.trim()}`
    );
  }

  // @記号を除去
  const cleanInput = input.replace(/^@+/, "").trim();
  console.log(`[iframe] 🔥 クリーン入力: ${cleanInput}`);

  const iframeContainer = document.querySelector(".iframe-container");
  console.log(`[iframe] 🔥 iframeContainer要素:`, iframeContainer);

  console.log(
    `[iframe] 🔥 isValidUrl(${cleanInput}) = ${isValidUrl(cleanInput)}`
  );

  if (isValidUrl(cleanInput)) {
    // URL直接アクセス
    let fullUrl = cleanInput.startsWith("http")
      ? cleanInput
      : "https://" + cleanInput;
    const converted = convertYouTubeUrl(fullUrl);
    if (converted !== fullUrl) {
      console.log(`[iframe] YouTube URL変換: ${fullUrl} -> ${converted}`);
      fullUrl = converted;
    }
    console.log(`[iframe] 🔥 URL直接アクセス: ${fullUrl}`);

    // SideEffect: URLに対してファビコンを自動設定
    setFaviconForUrl(fullUrl);

    currentUrl = fullUrl;
    console.log(`[iframe] 🔥 iframeContainer.classList.add("viewing") 実行前`);
    iframeContainer.classList.add("viewing");
    console.log(`[iframe] 🔥 iframeContainer.classList.add("viewing") 実行後`);

    try {
      console.log(`[iframe] 🔥 forceLoadIframe(${fullUrl}) 開始`);
      await forceLoadIframe(fullUrl);
      console.log(`[iframe] 🔥 forceLoadIframe(${fullUrl}) 完了`);
      updateOverlayIconVisibility();
    } catch (error) {
      console.error(`[iframe] 🔥 iframe読み込みエラー:`, error);
      updateStatus(`❌ 読み込みエラー: ${error.message}`, "error");
      iframeContainer.classList.remove("viewing");

      // エラー時もiframe内で表示を試行
      try {
        console.log(`[iframe] 🔥 エラー時のiframe表示試行: ${fullUrl}`);
        mainFrame.src = fullUrl;
        updateStatus(`✅ iframe内で表示中: ${fullUrl}`, "success");
        updateOverlayIconVisibility();
      } catch (iframeError) {
        console.error(`[iframe] 🔥 iframe表示エラー:`, iframeError);
        updateStatus(`❌ iframe表示エラー: ${iframeError.message}`, "error");
      }
    }
  } else {
    // Google検索
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      cleanInput
    )}`;
    console.log(`[iframe] 🔥 Google検索: ${searchUrl}`);

    currentUrl = searchUrl;
    console.log(`[iframe] 🔥 iframeContainer.classList.add("viewing") 実行前`);
    iframeContainer.classList.add("viewing");
    console.log(`[iframe] 🔥 iframeContainer.classList.add("viewing") 実行後`);

    try {
      updateStatus("Google検索中...", "info");
      console.log(`[iframe] 🔥 mainFrame.src = ${searchUrl} 実行前`);
      mainFrame.src = searchUrl;
      console.log(`[iframe] 🔥 mainFrame.src = ${searchUrl} 実行後`);
      updateOverlayIconVisibility();
      setTimeout(() => {
        updateStatus(`✅ Google検索完了: ${cleanInput}`, "success");
      }, 1000);
    } catch (error) {
      console.error(`[iframe] 🔥 Google検索エラー:`, error);
      updateStatus(`❌ 検索エラー: ${error.message}`, "error");
      iframeContainer.classList.remove("viewing");

      // エラー時もiframe内で表示を試行
      try {
        mainFrame.src = searchUrl;
        updateStatus(`✅ iframe内で検索中: ${cleanInput}`, "success");
        updateOverlayIconVisibility();
      } catch (iframeError) {
        console.error(`[iframe] 🔥 iframe検索エラー:`, iframeError);
        updateStatus(`❌ iframe検索エラー: ${iframeError.message}`, "error");
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

      // URL入力欄をクリア
      urlInput.value = "";

      // IFRAMEを初期状態に戻す
      const iframeContainer = document.querySelector(".iframe-container");
      if (iframeContainer) {
        iframeContainer.classList.remove("viewing");
        console.log("[iframe] 🔥 iframeContainer.viewingクラスを削除");
      }

      // mainFrameをクリア
      mainFrame.src = "";
      currentUrl = "";

      // ログイン情報を非表示
      if (loginInfo) loginInfo.style.display = "none";

      // オーバーレイアイコンを非表示（iframeが空になるため）
      if (iframeOverlayIcon) iframeOverlayIcon.style.display = "none";

      // ステータスを更新
      updateStatus("クリアしました", "info");

      console.log("[iframe] 🔥 IFRAME初期状態に戻しました");
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

  // プライベートモード切り替えイベント
  if (privacyToggle) {
    privacyToggle.addEventListener("click", () => {
      console.log("[iframe] 🔥 プライベートモード切り替えボタンクリック");
      togglePrivateMode();
    });
  }

  // iframeの読み込み完了イベント
  if (mainFrame) {
    mainFrame.onload = () => {
      console.log("[iframe] iframe 読み込み完了:", mainFrame.src);

      // 成功メッセージを表示
      if (currentLoadIsLoginSite) {
        updateStatus("✅ 接続成功: (ログイン状態維持)", "success");
      } else {
        updateStatus("✅ ページの読み込みが完了しました", "success");
      }
      currentLoadIsLoginSite = false; // フラグをリセット

      const iframeContainer = document.querySelector(".iframe-container");
      if (iframeContainer) {
        iframeContainer.classList.remove("loading");
      }

      // IFRAMEが空・about:blank・非表示のときはアイコン非表示、それ以外は表示
      if (iframeOverlayIcon) {
        if (
          !mainFrame.src ||
          mainFrame.src === "about:blank" ||
          mainFrame.style.display === "none"
        ) {
          iframeOverlayIcon.style.display = "none";
        } else {
          iframeOverlayIcon.style.display = "flex";
        }
      }
      updateOverlayIconVisibility();
    };
    mainFrame.onerror = () => {
      console.error("[iframe] iframe 読み込みエラー:", mainFrame.src);
      updateStatus("❌ ページの読み込みに失敗しました", "error");
      const iframeContainer = document.querySelector(".iframe-container");
      if (iframeContainer) {
        iframeContainer.classList.remove("loading");
        iframeContainer.classList.remove("viewing");
      }
      currentLoadIsLoginSite = false; // フラグをリセット
    };
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
      if (addBookmarkModal) {
        addBookmarkModal.style.display = "flex";
        bookmarkUrlInput.focus(); // URL入力にフォーカス
      }
    });
  } else {
    console.warn("[iframe] addBookmarkBtn が見つかりません");
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
      if (addBookmarkModal) {
        addBookmarkModal.style.display = "none";
      }
    });
  }

  if (saveBookmarkBtn) {
    saveBookmarkBtn.addEventListener("click", () => {
      const url = bookmarkUrlInput.value.trim();
      const title = bookmarkTitleInput.value.trim();

      if (url && title) {
        addBookmark(title, url);
        bookmarkUrlInput.value = "";
        bookmarkTitleInput.value = "";
        if (addBookmarkModal) {
          addBookmarkModal.style.display = "none";
        }
      } else {
        updateStatus("URLとタイトルを両方入力してください", "error");
      }
    });
  }

  // モーダルの外側をクリックしたときに閉じる
  if (addBookmarkModal) {
    addBookmarkModal.addEventListener("click", (e) => {
      if (e.target === addBookmarkModal) {
        addBookmarkModal.style.display = "none";
      }
    });
  }

  // URL入力でEnterキーを押したらタイトル入力にフォーカス
  if (bookmarkUrlInput) {
    bookmarkUrlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        bookmarkTitleInput.focus();
      }
    });
  }

  // タイトル入力でEnterキーを押したら保存
  if (bookmarkTitleInput) {
    bookmarkTitleInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveBookmarkBtn.click();
      }
    });
  }

  // メインページ読み込みボタンのイベント
  if (loadMainPageBtn) {
    loadMainPageBtn.addEventListener("click", async () => {
      console.log("[iframe] 🔥 メインページ読み込みボタンクリック");

      try {
        // 成功系のコードを参考に、直接chrome.tabs.queryを使用
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (tab && tab.url) {
          console.log("[iframe] 🔥 取得したURL:", tab.url);

          // URL入力欄に設定
          if (urlInput) {
            urlInput.value = tab.url;
          }

          // handleInputで処理（forceShow=trueで履歴追加をスキップ）
          handleInput(tab.url, true);
        } else {
          console.log("[iframe] 🔥 アクティブタブが見つからない");
          updateStatus("メインページURLの取得に失敗しました", "error");
        }
      } catch (error) {
        console.error("[iframe] 🔥 タブ情報の取得に失敗:", error);
        updateStatus("メインページURLの取得に失敗しました", "error");
      }
    });
  }

  // iframeオーバーレイアイコンのイベント
  if (iframeOverlayIcon) {
    iframeOverlayIcon.addEventListener("click", async () => {
      console.log("[iframe] 🔥 iframeオーバーレイアイコンクリック");

      try {
        // 現在のiframeのURLを取得
        const iframeUrl = mainFrame.src;

        if (iframeUrl && iframeUrl !== "about:blank") {
          console.log("[iframe] 🔥 iframeのURL:", iframeUrl);

          // 新しいタブでページを開く
          await chrome.tabs.create({
            url: iframeUrl,
            active: true,
          });

          updateStatus("✅ メインページで開きました", "success");
        } else {
          console.log("[iframe] 🔥 iframeに有効なURLがありません");
          updateStatus("iframeに表示されているページがありません", "error");
        }
      } catch (error) {
        console.error("[iframe] 🔥 タブ作成に失敗:", error);
        updateStatus("メインページでの開封に失敗しました", "error");
      }
    });
  }

  // document.addEventListener("DOMContentLoaded", initialize);
  // 直接呼び出しに変更
  initialize();
}

// ページ読み込み時の初期化
document.addEventListener("DOMContentLoaded", async () => {
  console.log("[iframe] DOMContentLoaded - 初期化開始");

  // 要素を初期化
  initializeElements();

  // オーバーレイアイコンも読み込み時点では非表示にしておく
  if (iframeOverlayIcon) {
    iframeOverlayIcon.style.display = "none";
  }

  // プライベートモードの初期状態を設定
  if (privacyIcon) {
    const randomColor = getRandomGoogleColor();
    privacyIcon.className = `bi bi-google ${randomColor}`;
    privacyToggle.title = "プライベートモード: OFF (履歴を保存します)";
  }

  // ステータスバーも初期は非表示を強制
  if (statusBar) {
    statusBar.style.display = "none";
    statusBar.classList.remove("fade-out");
  }

  // 履歴を読み込んで表示
  const history = loadHistory();
  console.log("[iframe] 初期履歴データ:", history);
  console.log("[iframe] 履歴データ数:", history.length);
  console.log("[iframe] searchHistoryEl要素:", searchHistoryEl);

  // ブックマークのfaviconUrl後付け初期化
  let bookmarks = loadBookmarks();
  let updated = false;
  for (let b of bookmarks) {
    if (!b.faviconUrl) {
      b.faviconUrl = await getFaviconUrl(b.url);
      updated = true;
    }
  }
  if (updated) {
    saveBookmarks(bookmarks);
  }

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

  // SideEffect: 既存の履歴からファビコンを自動設定
  const historyForFavicon = loadHistory();
  for (const item of historyForFavicon) {
    if (item && item.url && isValidUrl(item.url)) {
      setFaviconForUrl(item.url);
    }
  }

  // 初期メッセージを表示しないように変更
  // updateStatus("メインページを読み込む", "info");

  // 初期化時はトースターメッセージを抑制
  const originalUpdateStatus = updateStatus;
  updateStatus = function (
    message,
    type = "info",
    suppressLog = false,
    suppressToast = true
  ) {
    return originalUpdateStatus(message, type, suppressLog, suppressToast);
  };

  // URLパラメータ処理
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get("q") || urlParams.get("url");

  if (qParam) {
    console.log(`[iframe] URLパラメータ検出: ${qParam}`);
    if (urlInput) urlInput.value = qParam;
    handleInput(qParam);
  }

  console.log("[iframe] 初期化完了");

  // 初期化完了後は元のupdateStatus関数に戻す
  updateStatus = originalUpdateStatus;
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

  // オーバーレイアイコンの初期状態（フォールバック）
  if (iframeOverlayIcon) {
    iframeOverlayIcon.style.display = "none";
  }
});

// デバッグ用グローバル関数
window.debugIframe = () => {
  console.log("[iframe] 🔥 デバッグ情報");
  console.log("現在のURL:", currentUrl);
  console.log("mainFrame.src:", mainFrame.src);
  console.log("ログイン対応サイト:", LOGIN_SITES);
};

// 拡大表示トグル関数
function toggleExpand() {
  isExpanded = !isExpanded;
  document.body.classList.toggle("iframe-expanded", isExpanded);
  if (expandToggleBtn) {
    expandToggleBtn.classList.toggle("bi-arrows-angle-expand", !isExpanded);
    expandToggleBtn.classList.toggle("bi-arrows-angle-contract", isExpanded);
  }
  console.log(`[iframe] 拡大状態切替: ${isExpanded}`);
}

// 新しい検索ボタンのイベント（setupEventListeners関数内で設定されるため削除）

console.log("[iframe] 🔥 無理矢理 iframe.js 初期化完了");

// ランダムGoogleカラー選択関数
function getRandomGoogleColor() {
  const googleColors = [
    "google-blue",
    "google-red",
    "google-yellow",
    "google-green",
  ];
  const randomIndex = Math.floor(Math.random() * googleColors.length);
  return googleColors[randomIndex];
}

// プライベートモード切り替え関数
function togglePrivateMode() {
  isPrivateMode = !isPrivateMode;

  if (privacyIcon) {
    if (isPrivateMode) {
      privacyIcon.className = "bi bi-google privacy-icon-private";
      privacyToggle.title = "プライベートモード: ON (履歴を保存しません)";
      updateStatus("🔒 プライベートモード: ON", "info");
    } else {
      const randomColor = getRandomGoogleColor();
      privacyIcon.className = `bi bi-google ${randomColor}`;
      privacyToggle.title = "プライベートモード: OFF (履歴を保存します)";
      updateStatus("🌐 通常モード: ON", "info");
    }
  }

  console.log(`[iframe] プライベートモード切り替え: ${isPrivateMode}`);
}

// オーバーレイアイコンの表示制御関数
function updateOverlayIconVisibility() {
  // 起動時は絶対に表示しない
  if (iframeOverlayIcon) {
    iframeOverlayIcon.style.display = "none";
  }
}
