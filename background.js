/****************************************************************************************
 * BG v8 – FOCUS_TAB / GET_LAST_PAGE_TAB / SIDE_PANEL_CONTROL / IFRAME SUPPORT
 ****************************************************************************************/
const WIDTH = 420;
const popups = new Map(); // baseWin.id → popup.id
let lastTab = null; // 直近入力フォーカスのページタブ

// ───────────────────────────────────────
// DeclarativeNetRequest制御
// ───────────────────────────────────────
let iframeRulesEnabled = true;

// ルールの有効/無効を切り替え
async function toggleIframeRules(enable) {
  console.log(`[BG] Toggling iframe rules: ${enable}`);

  try {
    if (enable && !iframeRulesEnabled) {
      // ルールを有効化
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: ["iframe_rules"],
      });
      iframeRulesEnabled = true;
      console.log("[BG] Iframe rules enabled");
    } else if (!enable && iframeRulesEnabled) {
      // ルールを無効化
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        disableRulesetIds: ["iframe_rules"],
      });
      iframeRulesEnabled = false;
      console.log("[BG] Iframe rules disabled");
    }
  } catch (error) {
    console.error("[BG] Failed to toggle iframe rules:", error);
  }
}

// 特定のドメインのルールを動的に追加
async function addDynamicIframeRule(domain) {
  console.log(`[BG] Adding dynamic iframe rule for: ${domain}`);

  try {
    const ruleId = Date.now(); // ユニークID生成
    const rule = {
      id: ruleId,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            header: "X-Frame-Options",
            operation: "remove",
          },
          {
            header: "Content-Security-Policy",
            operation: "remove",
          },
        ],
      },
      condition: {
        urlFilter: `||${domain}/*`,
        resourceTypes: ["sub_frame"],
        tabIds: [-1],
        initiatorDomains: ["chrome-extension://*"],
      },
    };

    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: [rule],
    });

    console.log(`[BG] Dynamic rule added for ${domain} with ID: ${ruleId}`);
    return ruleId;
  } catch (error) {
    console.error(`[BG] Failed to add dynamic rule for ${domain}:`, error);
    return null;
  }
}

// 0) 拡張機能アイコンクリック時のサイドパネル制御
chrome.action.onClicked.addListener(async (tab) => {
  console.log(`[BG] Extension icon clicked on tab ${tab.id}`);
  try {
    // サイドパネルを開く
    await chrome.sidePanel.open({ tabId: tab.id });
    console.log(`[BG] Side panel opened for tab ${tab.id}`);
  } catch (error) {
    console.error("[BG] Failed to open side panel:", error);
  }
});

// 1) タブ切り替え（アクティブタブ変更）を監視
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  console.log(`[BG] onActivated → window ${windowId}, tab ${tabId}`);
  lastTab = tabId;
});

// 2) 既存の FOCUS_TAB／GET_LAST_PAGE_TAB 処理
chrome.runtime.onMessage.addListener((msg, sender, sendRes) => {
  if (msg.type === "FOCUS_TAB" && sender.tab?.id) {
    console.log(`[BG] FOCUS_TAB received from tab ${sender.tab.id}`);
    lastTab = sender.tab.id;
    return;
  }

  if (msg.type === "GET_LAST_PAGE_TAB") {
    console.log(`[BG] GET_LAST_PAGE_TAB → returning tab ${lastTab}`);
    sendRes({ tabId: lastTab });
    return true; // 非同期レスポンスを許可
  }

  // IFRAME制御メッセージ
  if (msg.type === "TOGGLE_IFRAME_RULES") {
    console.log(`[BG] TOGGLE_IFRAME_RULES received: ${msg.enable}`);
    toggleIframeRules(msg.enable);
    sendRes({ success: true });
    return true;
  }

  if (msg.type === "ADD_DYNAMIC_IFRAME_RULE") {
    console.log(`[BG] ADD_DYNAMIC_IFRAME_RULE received for: ${msg.domain}`);
    addDynamicIframeRule(msg.domain).then((ruleId) => {
      sendRes({ success: true, ruleId });
    });
    return true;
  }

  /* edgeSensor → パネル要求 */
  if (msg.type !== "OPEN_PANEL") return;

  // chrome.windows.get(sender.tab.windowId, {}, (w) => {
  //   if (!w) return;

  //   /* すでに popup を開いていれば再利用 */
  //   const existing = popups.get(w.id);
  //   if (existing) {
  //     chrome.windows.update(existing, { focused: true });
  //     return;
  //   }

  //   /* popup 生成 */
  //   const leftPos = msg.side === "left" ? w.left : w.left + w.width - WIDTH;
  //   chrome.windows.create(
  //     {
  //       url: chrome.runtime.getURL("pages/prompt/prompt.html"),
  //       type: "popup",
  //       width: WIDTH,
  //       height: w.height,
  //       top: w.top,
  //       left: leftPos,
  //       focused: true,
  //     },
  //     (p) => {
  //       popups.set(w.id, p.id);
  //       chrome.windows.onRemoved.addListener(function cleanup(id) {
  //         if (id === p.id) {
  //           popups.delete(w.id);
  //           chrome.windows.onRemoved.removeListener(cleanup);
  //         }
  //       });
  //     }
  //   );
  // });
});

// 初期化時にルールを有効化
chrome.runtime.onStartup.addListener(() => {
  console.log("[BG] Extension startup - enabling iframe rules");
  toggleIframeRules(true);
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("[BG] Extension installed - enabling iframe rules");
  toggleIframeRules(true);
});
