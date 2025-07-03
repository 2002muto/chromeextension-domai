"use strict";

// STATUS ページの実装
console.log("STATUS page loading...");

// ネットワーク情報のキャッシュ
let networkInfo = {
  speed: { value: "未測定", status: "idle" },
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
      <li class="status-item" data-type="speed" id="speed-item">
        <div class="status-icon speed">
          <i class="bi bi-speedometer2"></i>
        </div>
        <div class="status-title">回線速度</div>
        <div class="status-value" id="speed-value">未測定</div>
      </li>
      
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
  const speedItem = document.getElementById("speed-item");
  const localIPItem = document.getElementById("local-ip-item");
  const globalIPItem = document.getElementById("global-ip-item");
  const refreshBtn = document.getElementById("btn-refresh-all");

  console.log("イベントリスナーをバインド中...");
  console.log("speedItem:", speedItem);
  console.log("localIPItem:", localIPItem);
  console.log("globalIPItem:", globalIPItem);
  console.log("refreshBtn:", refreshBtn);

  if (speedItem) {
    speedItem.addEventListener("click", () => {
      console.log("🚀 回線速度アイテムがクリックされました！");
      measureSpeed();
    });
  }

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

// 30秒間ダウンロードし続けて平均速度を計測する新関数
async function measureDownloadSpeedForDuration(url, durationSec = 30) {
  return new Promise(async (resolve, reject) => {
    let totalBytes = 0;
    let startTime = performance.now();
    let elapsed = 0;
    let abort = false;

    while (!abort) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          durationSec * 1000 - elapsed
        );
        const response = await fetch(url, {
          cache: "no-cache",
          mode: "cors",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.length;
          elapsed = (performance.now() - startTime) / 1000;
          if (elapsed >= durationSec) {
            abort = true;
            break;
          }
        }
      } catch (e) {
        if (e.name === "AbortError") {
          // タイムアウトによる中断は正常終了
          break;
        } else {
          // 通信エラー等は無視して次のループへ
          break;
        }
      }
      elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= durationSec) break;
    }
    const totalTime = (performance.now() - startTime) / 1000;
    const avgSpeed = totalBytes / totalTime;
    resolve(avgSpeed);
  });
}

// measureSpeedを30秒間計測方式に修正
async function measureSpeed() {
  console.log("▶▶▶ measureSpeed関数が呼び出されました ◀◀◀");
  console.log("回線速度測定を開始します");

  const speedItem = document.querySelector('[data-type="speed"]');
  const speedValue = document.getElementById("speed-value");

  console.log("speedItem:", speedItem);
  console.log("speedValue:", speedValue);

  if (!speedItem || !speedValue) {
    console.error("必要なDOM要素が見つかりません");
    return;
  }

  speedItem.classList.add("measuring");
  speedValue.innerHTML = '<span class="loading-spinner"></span>測定中...';
  speedValue.className = "status-value loading";

  try {
    const testUrls = [
      "https://httpbin.org/bytes/1048576",
      "https://via.placeholder.com/1024x1024.jpg",
    ];
    let bestSpeed = 0;
    let successCount = 0;
    for (const url of testUrls) {
      try {
        console.log(`30秒間テストURL開始: ${url}`);
        const speed = await measureDownloadSpeedForDuration(url, 30);
        console.log(`30秒間テストURL完了: ${url} -> ${speed} bytes/sec`);
        if (speed > 0) {
          bestSpeed = Math.max(bestSpeed, speed);
          successCount++;
        }
      } catch (error) {
        console.log(`テストURL ${url} でエラー:`, error);
      }
    }
    if (successCount === 0) {
      throw new Error("すべてのテストURLでエラーが発生しました");
    }
    const speedMbps = ((bestSpeed / 1024 / 1024) * 8).toFixed(2);
    speedValue.textContent = `${speedMbps} Mbps (30秒平均)`;
    speedValue.className = "status-value success";
    networkInfo.speed = {
      value: `${speedMbps} Mbps (30秒平均)`,
      status: "success",
    };
    console.log(`回線速度測定完了: ${speedMbps} Mbps (30秒平均)`);
  } catch (error) {
    console.error("回線速度測定エラー:", error);
    speedValue.textContent = "測定失敗";
    speedValue.className = "status-value error";
    networkInfo.speed = { value: "測定失敗", status: "error" };
  } finally {
    speedItem.classList.remove("measuring");
    console.log("◀◀◀ measureSpeed関数完了 ▶▶▶");
  }
}

// ローカルIP取得（WebRTC使用）
async function getLocalIP() {
  console.log("ローカルIP取得を開始します");

  const localIPValue = document.getElementById("local-ip-value");
  localIPValue.innerHTML = '<span class="loading-spinner"></span>取得中...';
  localIPValue.className = "status-value loading";

  try {
    const ip = await getLocalIPViaWebRTC();
    localIPValue.textContent = ip;
    localIPValue.className = "status-value success";
    networkInfo.localIP = { value: ip, status: "success" };
    console.log(`ローカルIP取得完了: ${ip}`);
  } catch (error) {
    console.error("ローカルIP取得エラー:", error);
    localIPValue.textContent = "取得失敗";
    localIPValue.className = "status-value error";
    networkInfo.localIP = { value: "取得失敗", status: "error" };
  }
}

// WebRTCを使用したローカルIP取得
function getLocalIPViaWebRTC() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WebRTC timeout"));
    }, 10000);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.createDataChannel("test");

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate.candidate;
        console.log("ICE candidate:", candidate);

        const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (ipMatch && ipMatch[1]) {
          const ip = ipMatch[1];
          if (isPrivateIP(ip)) {
            clearTimeout(timeout);
            pc.close();
            resolve(ip);
          }
        }
      }
    };

    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timeout);
        pc.close();
        reject(new Error("No local IP found"));
      }
    };

    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .catch((error) => {
        clearTimeout(timeout);
        pc.close();
        reject(error);
      });
  });
}

// プライベートIPアドレスかどうかをチェック
function isPrivateIP(ip) {
  const parts = ip.split(".").map(Number);

  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

// グローバルIP取得（Web API使用）
async function getGlobalIP() {
  console.log("グローバルIP取得を開始します");

  const globalIPValue = document.getElementById("global-ip-value");
  globalIPValue.innerHTML = '<span class="loading-spinner"></span>取得中...';
  globalIPValue.className = "status-value loading";

  const apis = ["https://api.ipify.org?format=json", "https://httpbin.org/ip"];

  for (const api of apis) {
    try {
      console.log(`API試行: ${api}`);
      const response = await fetch(api, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      let ip = null;

      if (data.ip) {
        ip = data.ip;
      } else if (data.origin) {
        ip = data.origin;
      }

      if (ip && isValidIP(ip)) {
        globalIPValue.textContent = ip;
        globalIPValue.className = "status-value success";
        networkInfo.globalIP = { value: ip, status: "success" };
        console.log(`グローバルIP取得完了: ${ip}`);
        return;
      }
    } catch (error) {
      console.log(`API ${api} でエラー:`, error);
    }
  }

  console.error("すべてのグローバルIP APIで失敗");
  globalIPValue.textContent = "取得失敗";
  globalIPValue.className = "status-value error";
  networkInfo.globalIP = { value: "取得失敗", status: "error" };
}

// IPアドレスの形式をチェック
function isValidIP(ip) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;

  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((part) => part >= 0 && part <= 255);
  }

  return false;
}

// 全情報を更新
async function refreshAllInfo() {
  console.log("全ネットワーク情報を更新します");

  const refreshBtn = document.querySelector(".btn-refresh-all");
  const refreshIcon = refreshBtn.querySelector("i");

  refreshBtn.disabled = true;
  refreshIcon.classList.add("spin");

  try {
    await Promise.all([getLocalIP(), getGlobalIP()]);

    console.log("全ネットワーク情報の更新完了");
  } catch (error) {
    console.error("ネットワーク情報更新エラー:", error);
  } finally {
    refreshBtn.disabled = false;
    refreshIcon.classList.remove("spin");
  }
}

// グローバル関数として公開
window.renderStatusView = renderStatusView;
window.measureSpeed = measureSpeed;
window.getLocalIP = getLocalIP;
window.getGlobalIP = getGlobalIP;
window.refreshAllInfo = refreshAllInfo;

console.log("STATUS page JavaScript loaded successfully");
