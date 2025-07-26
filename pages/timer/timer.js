// File: pages/timer/timer.js

// タイマーデータ管理
let timerData = {
  countdown: [],
  stopwatch: [],
  alarm: [],
};

// 現在のタブ
let currentTab = "countdown";

// 初期化
document.addEventListener("DOMContentLoaded", function () {
  console.log("TIMER: 初期化開始");

  // データ読み込み
  loadTimerData();

  // タブ切り替えイベント
  setupTabNavigation();

  // 追加ボタンイベント
  setupAddButtons();

  // モーダルイベント
  setupModalEvents();

  // 初期表示
  renderAllTabs();

  // 実行中のタイマーを復元
  restoreRunningTimers();

  // アニメーション発火
  setTimeout(() => {
    const timerMain = document.querySelector(".timer-main");
    if (timerMain) {
      timerMain.classList.add("animate");
    }
  }, 100);

  // 自動全角変換の設定
  setupAutoFullWidth();

  console.log("TIMER: 初期化完了");
});

// タブナビゲーション設定
function setupTabNavigation() {
  const tabs = document.querySelectorAll(".timer-tab");
  const contents = document.querySelectorAll(".timer-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      // タブ切り替え
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(`${targetTab}-content`).classList.add("active");

      currentTab = targetTab;

      // タブ切り替え時に表示を更新（実行中のタイマーは再描画しない）
      updateTabDisplay(targetTab);

      console.log("TIMER: タブ切り替え:", targetTab);
    });
  });
}

// 追加ボタン設定
function setupAddButtons() {
  document.getElementById("btn-add-countdown").addEventListener("click", () => {
    showAddModal("countdown", "新しいカウントダウン");
  });

  document.getElementById("btn-add-stopwatch").addEventListener("click", () => {
    showAddModal("stopwatch", "新しいストップウォッチ");
  });

  document.getElementById("btn-add-alarm").addEventListener("click", () => {
    showAddModal("alarm", "新しいアラーム");
  });
}

// モーダルイベント設定
function setupModalEvents() {
  const modal = document.getElementById("timerModal");
  const saveBtn = document.getElementById("btnSaveTimer");

  saveBtn.addEventListener("click", () => {
    saveTimerItem();
  });

  // モーダル表示時の設定
  modal.addEventListener("show.bs.modal", function (event) {
    const button = event.relatedTarget;
    const type = button.dataset.type;

    // フォーム要素の表示/非表示を制御
    const timeInputGroup = document.getElementById("timeInputGroup");
    const alarmTimeGroup = document.getElementById("alarmTimeGroup");
    const repeatGroup = document.getElementById("repeatGroup");

    if (type === "alarm") {
      // アラームは名前とアラーム時刻のみ表示
      timeInputGroup.style.display = "none";
      alarmTimeGroup.style.display = "block";
      repeatGroup.style.display = "none";
    } else if (type === "stopwatch") {
      // ストップウォッチは名前のみ表示
      timeInputGroup.style.display = "none";
      alarmTimeGroup.style.display = "none";
      repeatGroup.style.display = "none";
    } else if (type === "countdown") {
      // カウントダウンは時間設定のみ表示（アラーム時刻は不要）
      timeInputGroup.style.display = "block";
      alarmTimeGroup.style.display = "none";
      repeatGroup.style.display = "none";
    } else {
      timeInputGroup.style.display = "block";
      alarmTimeGroup.style.display = "block";
      repeatGroup.style.display = "block";
    }
  });
}

// モーダル表示
function showAddModal(type, title) {
  const modal = new bootstrap.Modal(document.getElementById("timerModal"));
  const modalTitle = document.getElementById("modalTitle");
  const saveBtn = document.getElementById("btnSaveTimer");
  const modalContent = document.querySelector(".modal-content");

  modalTitle.textContent = title;
  saveBtn.dataset.type = type;
  modalContent.dataset.type = type;

  // フォームリセット
  document.getElementById("timerForm").reset();

  modal.show();
}

// タイマーアイテム保存
function saveTimerItem() {
  const type = document.getElementById("btnSaveTimer").dataset.type;
  let name = document.getElementById("timerName").value.trim();

  // 名前が空の場合、自動生成名を設定
  if (!name) {
    name = generateDefaultName(type);
  }

  let item = {
    id: generateId(),
    name: name,
    created: Date.now(),
  };

  if (type === "countdown") {
    const hours = parseInt(document.getElementById("hours").value) || 0;
    const minutes = parseInt(document.getElementById("minutes").value) || 0;
    const seconds = parseInt(document.getElementById("seconds").value) || 0;

    if (hours === 0 && minutes === 0 && seconds === 0) {
      alert("時間を設定してください");
      return;
    }

    item.totalSeconds = hours * 3600 + minutes * 60 + seconds;
    item.remainingSeconds = item.totalSeconds;
    item.isRunning = false;
    item.isPaused = false;
  } else if (type === "stopwatch") {
    item.elapsedSeconds = 0;
    item.isRunning = false;
    item.lapTimes = [];
    item.startTime = null;
  } else if (type === "alarm") {
    const alarmTime = document.getElementById("alarmTime").value;

    if (!alarmTime) {
      alert("アラーム時刻を設定してください");
      return;
    }

    item.alarmTime = alarmTime;
    item.repeatType = "none"; // 繰り返しなしに固定
    item.isActive = true;
    item.nextAlarm = calculateNextAlarm(alarmTime, "none");
  }

  // データに追加
  timerData[type].push(item);

  // 保存
  saveTimerData();

  // 表示更新
  renderTab(type);

  // モーダルを閉じる
  bootstrap.Modal.getInstance(document.getElementById("timerModal")).hide();

  console.log("TIMER: アイテム追加:", type, item);
}

// 次回アラーム時刻計算
function calculateNextAlarm(alarmTime, repeatType) {
  const now = new Date();
  const [hours, minutes] = alarmTime.split(":").map(Number);
  const nextAlarm = new Date();

  nextAlarm.setHours(hours, minutes, 0, 0);

  if (nextAlarm <= now) {
    nextAlarm.setDate(nextAlarm.getDate() + 1);
  }

  return nextAlarm.getTime();
}

// 全タブ表示
function renderAllTabs() {
  renderTab("countdown");
  renderTab("stopwatch");
  renderTab("alarm");
}

// タブ表示
function renderTab(type) {
  const list = document.getElementById(`${type}-list`);
  const items = timerData[type];

  list.innerHTML = "";

  if (items.length === 0) {
    return;
  }

  items.forEach((item) => {
    const itemElement = createTimerItem(type, item);
    list.appendChild(itemElement);
  });
}

// タブ表示更新（実行中のタイマーを保持）
function updateTabDisplay(type) {
  const list = document.getElementById(`${type}-list`);
  const items = timerData[type];

  if (items.length === 0) {
    list.innerHTML = "";
    return;
  }

  // 既存のアイテムを確認
  const existingItems = list.querySelectorAll(".timer-item");
  const existingIds = Array.from(existingItems).map((el) => el.dataset.id);

  // 新しいアイテムを確認
  const newItems = items.filter((item) => !existingIds.includes(item.id));
  const removedItems = existingIds.filter(
    (id) => !items.find((item) => item.id === id)
  );

  // 削除されたアイテムを削除
  removedItems.forEach((id) => {
    const element = list.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.remove();
    }
  });

  // 新しいアイテムを追加
  newItems.forEach((item) => {
    const itemElement = createTimerItem(type, item);
    list.appendChild(itemElement);
  });

  // 既存のアイテムの表示を更新（実行中は更新しない）
  items.forEach((item) => {
    const element = list.querySelector(`[data-id="${item.id}"]`);
    if (element && !item.isRunning) {
      // 実行中でない場合のみ更新
      const newElement = createTimerItem(type, item);
      element.replaceWith(newElement);
    } else if (element && item.isRunning) {
      // 実行中の場合は時間表示のみ更新
      updateRunningTimerDisplay(item);
    }
  });

  // 実行中のアイテムが存在しない場合は新しく作成
  items.forEach((item) => {
    if (item.isRunning) {
      const element = list.querySelector(`[data-id="${item.id}"]`);
      if (!element) {
        const itemElement = createTimerItem(type, item);
        list.appendChild(itemElement);
      }
    }
  });
}

// 実行中のタイマーの表示更新
function updateRunningTimerDisplay(item) {
  const element = document.querySelector(`[data-id="${item.id}"]`);
  if (!element) return;

  const timeElement = element.querySelector(".timer-time");
  if (!timeElement) return;

  if (item.totalSeconds !== undefined) {
    // カウントダウン
    timeElement.textContent = formatTime(item.remainingSeconds);
  } else if (item.elapsedSeconds !== undefined) {
    // ストップウォッチ
    timeElement.textContent = formatTime(item.elapsedSeconds);
  }
}

// アラームの表示更新
function updateAlarmDisplay(item) {
  const element = document.querySelector(`[data-id="${item.id}"]`);
  if (!element) return;

  const alarmTimeElement = element.querySelector(".alarm-time");
  if (!alarmTimeElement) return;

  const nextAlarm = new Date(item.nextAlarm);
  const timeString = nextAlarm.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  alarmTimeElement.textContent = timeString;
}

// 実行中のタイマーを復元
function restoreRunningTimers() {
  console.log("TIMER: 実行中のタイマーを復元開始");

  // カウントダウンの復元
  timerData.countdown.forEach((item) => {
    if (item.isRunning && !item.interval) {
      console.log("TIMER: カウントダウン復元:", item.name);
      startCountdown(item.id);
    }
  });

  // ストップウォッチの復元
  timerData.stopwatch.forEach((item) => {
    if (item.isRunning && !item.interval) {
      console.log("TIMER: ストップウォッチ復元:", item.name);
      startStopwatch(item.id);
    }
  });

  // アラームの復元（有効なアラームを表示）
  timerData.alarm.forEach((item) => {
    if (item.isActive) {
      console.log("TIMER: アラーム復元:", item.name);
      // アラームの表示を更新
      updateAlarmDisplay(item);
    }
  });

  console.log("TIMER: 実行中のタイマー復元完了");
}

// タイマーアイテム作成
function createTimerItem(type, item) {
  const div = document.createElement("div");
  div.className = "timer-item";
  div.dataset.id = item.id;

  let content = "";

  if (type === "countdown") {
    content = createCountdownItem(item);
  } else if (type === "stopwatch") {
    content = createStopwatchItem(item);
  } else if (type === "alarm") {
    content = createAlarmItem(item);
  }

  div.innerHTML = content;

  // イベントリスナー設定
  setupItemEvents(div, type, item);

  return div;
}

// カウントダウンアイテム作成
function createCountdownItem(item) {
  const time = formatTime(item.remainingSeconds);
  const status = item.isRunning ? "running" : "";

  return `
    <div class="timer-item-header">
      <h3 class="timer-item-name">${item.name}</h3>
      <div class="timer-item-actions">
        <button class="timer-btn delete" data-action="delete">
          <i class="bi bi-trash"></i>
          <span>削除</span>
        </button>
      </div>
    </div>
    <div class="timer-display">
      <p class="timer-time ${status}">${time}</p>
    </div>
    <div class="timer-controls">
      ${
        item.isRunning
          ? `<button class="timer-control-btn stop" data-action="pause">
          <i class="bi bi-pause"></i>
          <span>一時停止</span>
        </button>`
          : `<button class="timer-control-btn start" data-action="start">
          <i class="bi bi-play"></i>
          <span>開始</span>
        </button>`
      }
      <button class="timer-control-btn reset" data-action="reset">
        <i class="bi bi-arrow-clockwise"></i>
        <span>リセット</span>
      </button>
    </div>
  `;
}

// ストップウォッチアイテム作成
function createStopwatchItem(item) {
  const time = formatTime(item.elapsedSeconds);
  const status = item.isRunning ? "running" : "";

  let lapTimesHtml = "";
  if (item.lapTimes.length > 0) {
    lapTimesHtml = `
      <div class="lap-times">
        ${item.lapTimes
          .map(
            (lap, index) => `
          <div class="lap-time">
            <span>ラップ ${index + 1}</span>
            <span>${formatTime(lap)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  return `
    <div class="timer-item-header">
      <h3 class="timer-item-name">${item.name}</h3>
      <div class="timer-item-actions">
        <button class="timer-btn delete" data-action="delete">
          <i class="bi bi-trash"></i>
          <span>削除</span>
        </button>
      </div>
    </div>
    <div class="timer-display">
      <p class="timer-time ${status}">${time}</p>
    </div>
    <div class="timer-controls">
      ${
        item.isRunning
          ? `<button class="timer-control-btn stop" data-action="stop">
          <i class="bi bi-stop"></i>
          <span>停止</span>
        </button>
        <button class="timer-control-btn" data-action="lap">
          <i class="bi bi-flag"></i>
          <span>ラップ</span>
        </button>`
          : `<button class="timer-control-btn start" data-action="start">
          <i class="bi bi-play"></i>
          <span>開始</span>
        </button>
        <button class="timer-control-btn reset" data-action="reset">
          <i class="bi bi-arrow-clockwise"></i>
          <span>リセット</span>
        </button>`
      }
    </div>
    ${lapTimesHtml}
  `;
}

// アラームアイテム作成
function createAlarmItem(item) {
  const nextAlarm = new Date(item.nextAlarm);
  const timeString = nextAlarm.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <div class="timer-item-header">
      <h3 class="timer-item-name">${item.name}</h3>
      <div class="timer-item-actions">
        <button class="timer-btn ${item.isActive ? "active" : ""}" data-action="toggle">
          <i class="bi bi-${item.isActive ? "pause" : "play"}"></i>
          <span>${item.isActive ? "無効" : "有効"}</span>
        </button>
        <button class="timer-btn delete" data-action="delete">
          <i class="bi bi-trash"></i>
          <span>削除</span>
        </button>
      </div>
    </div>
    <div class="alarm-info">
      <span class="alarm-time">${timeString}</span>
    </div>
  `;
}

// アイテムイベント設定
function setupItemEvents(element, type, item) {
  const buttons = element.querySelectorAll("[data-action]");

  buttons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const action = button.dataset.action;

      switch (action) {
        case "start":
          if (type === "countdown") startCountdown(item.id);
          else if (type === "stopwatch") startStopwatch(item.id);
          break;
        case "pause":
          if (type === "countdown") pauseCountdown(item.id);
          break;
        case "stop":
          if (type === "stopwatch") stopStopwatch(item.id);
          break;
        case "reset":
          if (type === "countdown") resetCountdown(item.id);
          else if (type === "stopwatch") resetStopwatch(item.id);
          break;
        case "lap":
          if (type === "stopwatch") addLapTime(item.id);
          break;
        case "toggle":
          if (type === "alarm") toggleAlarm(item.id);
          break;
        case "delete":
          deleteItem(type, item.id);
          break;
      }
    });
  });
}

// カウントダウン開始
function startCountdown(id) {
  const item = timerData.countdown.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = true;
  item.isPaused = false;
  item.startTime = Date.now();

  // タイマー開始
  item.interval = setInterval(() => {
    updateCountdown(id);
  }, 1000);

  renderTab("countdown");
  saveTimerData();
}

// カウントダウン更新
function updateCountdown(id) {
  const item = timerData.countdown.find((item) => item.id === id);
  if (!item || !item.isRunning) return;

  const elapsed = Math.floor((Date.now() - item.startTime) / 1000);
  item.remainingSeconds = Math.max(0, item.totalSeconds - elapsed);

  // 表示更新
  const element = document.querySelector(`[data-id="${id}"] .timer-time`);
  if (element) {
    element.textContent = formatTime(item.remainingSeconds);
  }

  // 終了チェック
  if (item.remainingSeconds <= 0) {
    // アラート音を鳴らす
    playAlertSound();

    // カウントダウン終了時に設定時間にリセット
    item.remainingSeconds = item.totalSeconds;
    item.isRunning = false;
    item.isPaused = false;

    if (item.interval) {
      clearInterval(item.interval);
      item.interval = null;
    }

    // 表示を更新
    setTimeout(() => {
      updateTabDisplay("countdown");
    }, 100);

    showNotification(item.name, "カウントダウンが完了しました");
    saveTimerData();
  }
}

// カウントダウン一時停止
function pauseCountdown(id) {
  const item = timerData.countdown.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = false;
  item.isPaused = true;

  if (item.interval) {
    clearInterval(item.interval);
    item.interval = null;
  }

  renderTab("countdown");
  saveTimerData();
}

// カウントダウンリセット
function resetCountdown(id) {
  const item = timerData.countdown.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = false;
  item.isPaused = false;
  item.remainingSeconds = item.totalSeconds;

  if (item.interval) {
    clearInterval(item.interval);
    item.interval = null;
  }

  renderTab("countdown");
  saveTimerData();
}

// カウントダウン停止
function stopCountdown(id) {
  const item = timerData.countdown.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = false;
  item.isPaused = false;

  if (item.interval) {
    clearInterval(item.interval);
    item.interval = null;
  }

  renderTab("countdown");
  saveTimerData();
}

// ストップウォッチ開始
function startStopwatch(id) {
  const item = timerData.stopwatch.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = true;
  item.startTime = Date.now() - item.elapsedSeconds * 1000;

  // タイマー開始
  item.interval = setInterval(() => {
    updateStopwatch(id);
  }, 100);

  renderTab("stopwatch");
  saveTimerData();
}

// ストップウォッチ更新
function updateStopwatch(id) {
  const item = timerData.stopwatch.find((item) => item.id === id);
  if (!item || !item.isRunning) return;

  item.elapsedSeconds = Math.floor((Date.now() - item.startTime) / 1000);

  // 表示更新
  const element = document.querySelector(`[data-id="${id}"] .timer-time`);
  if (element) {
    element.textContent = formatTime(item.elapsedSeconds);
  }
}

// ストップウォッチ停止
function stopStopwatch(id) {
  const item = timerData.stopwatch.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = false;

  if (item.interval) {
    clearInterval(item.interval);
    item.interval = null;
  }

  renderTab("stopwatch");
  saveTimerData();
}

// ストップウォッチリセット
function resetStopwatch(id) {
  const item = timerData.stopwatch.find((item) => item.id === id);
  if (!item) return;

  item.isRunning = false;
  item.elapsedSeconds = 0;
  item.lapTimes = [];

  if (item.interval) {
    clearInterval(item.interval);
    item.interval = null;
  }

  renderTab("stopwatch");
  saveTimerData();
}

// ラップタイム追加
function addLapTime(id) {
  const item = timerData.stopwatch.find((item) => item.id === id);
  if (!item || !item.isRunning) return;

  item.lapTimes.unshift(item.elapsedSeconds);

  renderTab("stopwatch");
  saveTimerData();
}

// アラーム切り替え
function toggleAlarm(id) {
  const item = timerData.alarm.find((item) => item.id === id);
  if (!item) return;

  item.isActive = !item.isActive;

  renderTab("alarm");
  saveTimerData();
}

// アラームリセット
function resetAlarm(id) {
  const item = timerData.alarm.find((item) => item.id === id);
  if (!item) return;

  // 設定時刻に戻す
  item.nextAlarm = calculateNextAlarm(item.alarmTime, "none");
  item.isActive = false;

  renderTab("alarm");
  saveTimerData();

  console.log("TIMER: アラームリセット:", item.name);
}

// アイテム削除
function deleteItem(type, id) {
  const item = timerData[type].find((item) => item.id === id);
  if (!item) return;

  // 実行中のタイマーを停止
  if (item.interval) {
    clearInterval(item.interval);
  }

  // 配列から削除
  timerData[type] = timerData[type].filter((item) => item.id !== id);

  renderTab(type);
  saveTimerData();

  console.log("TIMER: アイテム削除:", type, id);
}

// 時間フォーマット
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
}

// ID生成
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// デフォルト名生成
function generateDefaultName(type) {
  const typeNames = {
    countdown: "カウントダウン",
    stopwatch: "ストップウォッチ",
    alarm: "アラーム",
  };

  const baseName = typeNames[type] || "タイマー";
  const existingItems = timerData[type] || [];

  // 既存の「無題」アイテムをカウント
  const untitledCount = existingItems.filter((item) =>
    item.name.startsWith("無題")
  ).length;

  if (untitledCount === 0) {
    return "無題1";
  } else {
    return `無題${untitledCount + 1}`;
  }
}

// アラート音を鳴らす
function playAlertSound() {
  try {
    // ブラウザの標準アラート音を使用
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    // 3回リピート
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = audioContext.currentTime + i * 2; // 2秒間隔で3回

      oscillator.frequency.setValueAtTime(800, startTime);
      oscillator.frequency.setValueAtTime(600, startTime + 0.1);
      oscillator.frequency.setValueAtTime(800, startTime + 0.2);

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 1.5);
    }
  } catch (error) {
    console.log("TIMER: アラート音の再生に失敗しました", error);
  }
}

// 通知表示
function showNotification(title, message) {
  // ブラウザ通知を表示（許可されている場合）
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: message });
  } else {
    alert(`${title}: ${message}`);
  }

  // ウェブページに通知を送信
  chrome.runtime
    .sendMessage({
      type: "TIMER_NOTIFICATION",
      title: title,
      message: message,
    })
    .catch((error) => {
      console.log("TIMER: ウェブページ通知送信に失敗しました", error);
    });
}

// データ読み込み
function loadTimerData() {
  chrome.storage.local.get(["timerData"], (result) => {
    if (result.timerData) {
      timerData = result.timerData;
      console.log("TIMER: データ読み込み完了");

      // データ読み込み後に表示を更新
      renderAllTabs();

      // データ読み込み後に実行中のタイマーを復元
      setTimeout(() => {
        restoreRunningTimers();
      }, 200);
    }
  });
}

// データ保存
function saveTimerData() {
  chrome.storage.local.set({ timerData: timerData }, () => {
    console.log("TIMER: データ保存完了");
  });
}

// アラームチェック（定期的に実行）
setInterval(() => {
  const now = Date.now();

  timerData.alarm.forEach((alarm) => {
    if (alarm.isActive && alarm.nextAlarm && now >= alarm.nextAlarm) {
      // アラート音を鳴らす
      playAlertSound();

      showNotification(alarm.name, "アラーム時刻です");

      // 次回アラーム時刻を計算
      if (alarm.repeatType !== "none") {
        alarm.nextAlarm = calculateNextAlarm(alarm.alarmTime, alarm.repeatType);
      } else {
        // 繰り返しなしの場合は設定時刻に戻す
        alarm.nextAlarm = calculateNextAlarm(alarm.alarmTime, "none");
        alarm.isActive = false;
      }

      // 表示を更新（即座に反映）
      setTimeout(() => {
        updateTabDisplay("alarm");
        // アラーム表示も更新
        updateAlarmDisplay(alarm);
      }, 100);

      saveTimerData();
    }
  });
}, 1000);

// 通知許可リクエスト
if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

// ページの可視性変更時にタイマーを復元
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) {
    // ページが表示された時にタイマーを復元
    setTimeout(() => {
      restoreRunningTimers();
    }, 100);
  }
});

// ページフォーカス時にタイマーを復元
window.addEventListener("focus", function () {
  setTimeout(() => {
    restoreRunningTimers();
  }, 100);
});

// 時間入力フィールドの自動半角変換設定
function setupAutoFullWidth() {
  // 時間入力フィールドの自動半角変換（時・分・秒のみ）
  const timeInputs = ["hours", "minutes", "seconds"];
  timeInputs.forEach((inputId) => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", function (e) {
        // 全角数字を半角に変換（時間入力フィールドのみ）
        let value = e.target.value;
        value = value.replace(/[０-９]/g, function (match) {
          return String.fromCharCode(match.charCodeAt(0) - 0xfee0);
        });
        e.target.value = value;
      });
    }
  });

  // 名前フィールドには変換処理を適用しないことを確認
  const timerNameInput = document.getElementById("timerName");
  if (timerNameInput) {
    console.log("TIMER: 名前フィールドの変換処理は適用されません");
  }
}
