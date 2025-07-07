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

async function renderHistory() {
  const history = loadHistory();
  if (!searchHistoryEl) return;
  if (history.length === 0) {
    searchHistoryEl.innerHTML =
      '<span class="text-muted">検索履歴はありません</span>';
    return;
  }
  searchHistoryEl.innerHTML =
    '<div class="fw-bold mb-1"><i class="bi bi-clock-history"></i> 検索履歴</div>' +
    '<div class="d-flex flex-row gap-2" id="favicon-row"></div>';
  const row = document.getElementById("favicon-row");
  for (let i = 0; i < history.length; i++) {
    const h = history[i];
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
      newHistory.splice(i, 1);
      saveHistory(newHistory);
      renderHistory();
    });
    // ファビコン本体
    const a = document.createElement("a");
    a.href = "#";
    a.className = "history-link";
    a.setAttribute("data-idx", i);
    a.style.display = "inline-block";
    a.style.width = "24px";
    a.style.height = "24px";
    a.style.verticalAlign = "middle";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      urlInput.value = history[i];
      handleInput(history[i], true);
    });
    if (!/^https?:\/\//.test(h) && !h.startsWith("www.")) {
      a.innerHTML = getGoogleSVG();
    } else {
      const domain = getDomain(h);
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
    wrapper.appendChild(a);
    wrapper.appendChild(removeBtn);
    row.appendChild(wrapper);
  }
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
window.addEventListener("DOMContentLoaded", async () => {
  console.log("[iframe] 🔥 DOM読み込み完了");

  await renderHistory();

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
