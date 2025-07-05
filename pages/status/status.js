"use strict";

// STATUS ページの実装
console.log("STATUS page loading...");

// ネットワーク情報のキャッシュ
let networkInfo = {
  localIP: { value: "取得中...", status: "loading" },
  globalIP: { value: "取得中...", status: "loading" },
};

// 初期化
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🟢 STATUS page DOMContentLoaded fired");

  const currentPage = window.location.pathname;
  console.log("現在のページ:", currentPage);

  if (!currentPage.includes("/status/")) {
    console.log("❌ 現在のページはSTATUSページではありません:", currentPage);
    return;
  }

  console.log("✅ STATUSページを確認しました。初期化を開始します...");

  try {
    // 初期画面表示
    await renderStatusView();

    console.log("✅ STATUSページの初期化完了");

    // 初期データ取得（ローカルIPとグローバルIPを自動取得）
    console.log("🔄 初期データ取得を開始...");

    // 並行して実行
    Promise.all([
      getLocalIP().catch((err) =>
        console.log("ローカルIP初期取得エラー:", err)
      ),
      getGlobalIP().catch((err) =>
        console.log("グローバルIP初期取得エラー:", err)
      ),
    ]).then(() => {
      console.log("✅ 初期データ取得完了");
    });
  } catch (error) {
    console.error("❌ STATUSページ初期化エラー:", error);
  }
});

// ステータス画面の表示
async function renderStatusView() {
  console.log("renderStatusView: start");

  const content = document.querySelector(".memo-content");

  // アニメーション設定
  content.classList.remove("edit-mode", "clipboard-mode");
  content.classList.remove("animate");
  void content.offsetWidth;
  content.classList.add("animate");

  content.innerHTML = `
    <div class="status-header">
      <h3>ネットワーク情報</h3>
      <button class="btn-refresh-all" id="btn-refresh-all">
        <i class="bi bi-arrow-clockwise"></i>
        <span>全て更新</span>
      </button>
    </div>
    <ul class="status-list">
      <li class="status-item" data-type="local-ip" id="local-ip-item">
        <div class="status-icon local-ip">
          <i class="bi bi-router"></i>
        </div>
        <div class="status-title">ローカルIP</div>
        <div class="status-value loading" id="local-ip-value">
          <span class="loading-spinner"></span>取得中...
        </div>
      </li>
      
      <li class="status-item" data-type="global-ip" id="global-ip-item">
        <div class="status-icon global-ip">
          <i class="bi bi-globe"></i>
        </div>
        <div class="status-title">グローバルIP</div>
        <div class="status-value loading" id="global-ip-value">
          <span class="loading-spinner"></span>取得中...
        </div>
      </li>
    </ul>
  `;

  // イベントリスナーをバインド
  const localIPItem = document.getElementById("local-ip-item");
  const globalIPItem = document.getElementById("global-ip-item");
  const refreshBtn = document.getElementById("btn-refresh-all");

  console.log("イベントリスナーをバインド中...");
  console.log("localIPItem:", localIPItem);
  console.log("globalIPItem:", globalIPItem);
  console.log("refreshBtn:", refreshBtn);

  if (localIPItem) {
    localIPItem.addEventListener("click", () => {
      console.log("🚀 ローカルIPアイテムがクリックされました！");
      getLocalIP();
    });
  }

  if (globalIPItem) {
    globalIPItem.addEventListener("click", () => {
      console.log("🚀 グローバルIPアイテムがクリックされました！");
      getGlobalIP();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      console.log("🚀 全て更新ボタンがクリックされました！");
      refreshAllInfo();
    });
  }

  console.log("✅ 全てのイベントリスナーのバインド完了");

  content.classList.remove("show");
  void content.offsetWidth;
  content.classList.add("show");

  console.log("renderStatusView: end");
}

// ローカルIP取得
async function getLocalIP() {
  console.log("▶▶▶ getLocalIP関数が呼び出されました ◀◀◀");

  const localIPItem = document.querySelector('[data-type="local-ip"]');
  const localIPValue = document.getElementById("local-ip-value");

  if (!localIPItem || !localIPValue) {
    console.error("必要なDOM要素が見つかりません");
    return;
  }

  localIPValue.innerHTML = '<span class="loading-spinner"></span>取得中...';
  localIPValue.className = "status-value loading";

  try {
    // WebRTCを使用してローカルIPを取得
    const ip = await getLocalIPViaWebRTC();

    if (ip) {
      localIPValue.textContent = ip;
      localIPValue.className = "status-value success";
      networkInfo.localIP = { value: ip, status: "success" };
      console.log("✅ ローカルIP取得成功:", ip);
    } else {
      throw new Error("ローカルIPの取得に失敗しました");
    }
  } catch (error) {
    console.error("❌ ローカルIP取得エラー:", error);
    localIPValue.textContent = "取得失敗";
    localIPValue.className = "status-value error";
    networkInfo.localIP = { value: "取得失敗", status: "error" };
  }
}

// WebRTCを使用してローカルIPを取得する関数
function getLocalIPViaWebRTC() {
  return new Promise((resolve, reject) => {
    try {
      const RTCPeerConnection =
        window.RTCPeerConnection ||
        window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection;

      if (!RTCPeerConnection) {
        reject(new Error("WebRTCがサポートされていません"));
        return;
      }

      const pc = new RTCPeerConnection({
        iceServers: [],
      });

      pc.createDataChannel("");
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          pc.close();
          reject(err);
        });

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          pc.close();
          return;
        }

        const candidate = event.candidate.candidate;
        const ipMatch = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/);

        if (ipMatch) {
          const ip = ipMatch[1];
          if (isPrivateIP(ip)) {
            pc.close();
            resolve(ip);
          }
        }
      };

      // タイムアウト設定
      setTimeout(() => {
        pc.close();
        reject(new Error("タイムアウト"));
      }, 5000);
    } catch (error) {
      reject(error);
    }
  });
}

// プライベートIPかどうかを判定
function isPrivateIP(ip) {
  const parts = ip.split(".");
  const first = parseInt(parts[0]);
  const second = parseInt(parts[1]);

  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

// グローバルIP取得
async function getGlobalIP() {
  console.log("▶▶▶ getGlobalIP関数が呼び出されました ◀◀◀");

  const globalIPItem = document.querySelector('[data-type="global-ip"]');
  const globalIPValue = document.getElementById("global-ip-value");

  if (!globalIPItem || !globalIPValue) {
    console.error("必要なDOM要素が見つかりません");
    return;
  }

  globalIPValue.innerHTML = '<span class="loading-spinner"></span>取得中...';
  globalIPValue.className = "status-value loading";

  try {
    // 複数のIP取得サービスを試行
    const ipServices = [
      "https://api.ipify.org?format=json",
      "https://api.myip.com",
      "https://ipapi.co/json/",
      "https://httpbin.org/ip",
    ];

    let ip = null;
    let error = null;

    for (const service of ipServices) {
      try {
        console.log(`IP取得サービスを試行中: ${service}`);
        const response = await fetch(service, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          timeout: 5000,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // サービスによってレスポンス形式が異なる
        if (data.ip) {
          ip = data.ip;
        } else if (data.origin) {
          ip = data.origin;
        } else if (data.query) {
          ip = data.query;
        }

        if (ip && isValidIP(ip)) {
          console.log(`✅ IP取得成功: ${ip} (サービス: ${service})`);
          break;
        }
      } catch (e) {
        console.log(`❌ サービス ${service} でエラー:`, e);
        error = e;
        continue;
      }
    }

    if (ip && isValidIP(ip)) {
      globalIPValue.textContent = ip;
      globalIPValue.className = "status-value success";
      networkInfo.globalIP = { value: ip, status: "success" };
      console.log("✅ グローバルIP取得成功:", ip);
    } else {
      throw error || new Error("すべてのIP取得サービスでエラーが発生しました");
    }
  } catch (error) {
    console.error("❌ グローバルIP取得エラー:", error);
    globalIPValue.textContent = "取得失敗";
    globalIPValue.className = "status-value error";
    networkInfo.globalIP = { value: "取得失敗", status: "error" };
  }
}

// IPアドレスの形式を検証
function isValidIP(ip) {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
}

// 全ての情報を更新
async function refreshAllInfo() {
  console.log("▶▶▶ refreshAllInfo関数が呼び出されました ◀◀◀");

  const refreshBtn = document.getElementById("btn-refresh-all");
  if (refreshBtn) {
    refreshBtn.disabled = true;
    const icon = refreshBtn.querySelector("i");
    if (icon) {
      icon.classList.add("spin");
    }
  }

  try {
    // 並行して実行
    await Promise.all([
      getLocalIP().catch((err) => console.log("ローカルIP更新エラー:", err)),
      getGlobalIP().catch((err) => console.log("グローバルIP更新エラー:", err)),
    ]);

    console.log("✅ 全ての情報更新完了");
  } catch (error) {
    console.error("❌ 情報更新エラー:", error);
  } finally {
    if (refreshBtn) {
      refreshBtn.disabled = false;
      const icon = refreshBtn.querySelector("i");
      if (icon) {
        icon.classList.remove("spin");
      }
    }
  }
}

// グローバル関数として公開
window.renderStatusView = renderStatusView;
window.getLocalIP = getLocalIP;
window.getGlobalIP = getGlobalIP;
window.refreshAllInfo = refreshAllInfo;

console.log("STATUS page JavaScript loaded successfully");
