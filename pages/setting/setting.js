// File: pages/setting/setting.js

// 設定ページをデフォルト状態に戻す関数
function renderSettingMain() {
  console.log("renderSettingMain: 設定ページをデフォルト状態に戻す");

  const content = document.querySelector(".memo-content");

  // すべての設定ボタンの active を削除
  document
    .querySelectorAll(".setting-btn")
    .forEach((b) => b.classList.remove("active"));

  // デフォルトのdetail-panelを表示（設定ページには常に1つのパネルがある）
  const defaultPanel = document.querySelector(".detail-panel");
  if (defaultPanel) {
    // すべてのパネルからshowを削除してから、デフォルトパネルにshowを追加
    document
      .querySelectorAll(".detail-panel")
      .forEach((p) => p.classList.remove("show"));
    defaultPanel.classList.add("show");
  }

  // 最初の設定ボタンを active にする（存在する場合）
  const firstBtn = document.querySelector(".setting-btn");
  if (firstBtn) {
    firstBtn.classList.add("active");
  }

  // MEMO・PROMPTと同じアニメーション
  if (content) {
    content.classList.remove("show", "animate");
    void content.offsetWidth;
    content.classList.add("animate", "show");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("SETTINGページ DOMContentLoaded fired");

  // 現在のページがSETTINGページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/setting/")) {
    console.log("現在のページはSETTINGページではありません:", currentPage);
    return; // SETTINGページでない場合は初期化をスキップ
  }

  // Add event listener to SETTING button
  const settingButton = document.getElementById("btn-setting");
  if (settingButton) {
    settingButton.addEventListener("click", () => {
      console.log("SETTING page button clicked");
      // ヘッダーをクリックした時はメイン画面をリフレッシュ
      renderSettingMain();
    });
  }

  // ページ状態を保存
  if (window.PageStateManager) {
    window.PageStateManager.savePageState("setting", {
      mode: "main",
    });
    window.PageStateManager.setActivePage("setting");
  }

  const content = document.querySelector(".memo-content");

  // ─── 初回ロード時にMEMO・PROMPTと同じアニメーション ───
  if (content) {
    content.classList.remove("show", "animate");
    // 強制リフロー
    void content.offsetWidth;
    content.classList.add("animate");

    // 少し遅延してからshowクラスを追加（フェードイン効果）
    setTimeout(() => {
      content.classList.add("show");
    }, 100);
  }

  // ─── 以下、既存のメニュー切替＋詳細パネル表示 ───
  document.querySelectorAll(".setting-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // ボタンの active 切替
      document
        .querySelectorAll(".setting-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 全 detail-panel を一旦 hidden
      document
        .querySelectorAll(".detail-panel")
        .forEach((p) => p.classList.remove("show"));

      // クリックしたボタンに対応するパネルを show
      const targetId = btn.dataset.target;
      const targetPanel = document.querySelector(targetId);
      if (targetPanel) {
        targetPanel.classList.add("show");
      } else {
        // データターゲットが設定されていない場合はデフォルトパネルを表示
        const defaultPanel = document.querySelector(".detail-panel");
        if (defaultPanel) {
          defaultPanel.classList.add("show");
        }
      }
    });
  });

  // ─── フッターボタンのイベント処理 ───
  const contactBtn = document.querySelector(".setting-contact-btn");
  const shareBtn = document.querySelector(".setting-share-btn");

  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      console.log("お問合せボタンがクリックされました");
      // お問合せ機能の実装
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      console.log("共有ボタンがクリックされました");
      // 共有機能の実装
    });
  }

  // ─── カスタム設定機能の初期化 ───
  initializeCustomSettings();

  // カスタムボタンのクリックでカスタムパネルのみアニメーション表示（show→次フレームでanimate）
  const customBtn = document.getElementById("btn-custom");
  if (customBtn) {
    customBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // すべての.detail-panelからshow/animateを外す
      document.querySelectorAll(".detail-panel").forEach((panel) => {
        panel.classList.remove("show", "animate");
      });
      // #custom-panelだけにshowを付与
      const customPanel = document.getElementById("custom-panel");
      if (customPanel) {
        customPanel.classList.add("show");
        // 次フレームでanimateを付与（アニメーション発火保証）
        requestAnimationFrame(() => {
          customPanel.classList.add("animate");
        });
      }
    });
  }
});

// カスタム設定機能の初期化
function initializeCustomSettings() {
  console.log("カスタム設定機能を初期化中...");

  // 設定の読み込み
  loadCustomSettings();

  // イベントリスナーの設定
  setupCustomSettingListeners();
}

// カスタム設定の読み込み
function loadCustomSettings() {
  // Chrome Storageから設定を読み込み
  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings || getDefaultCustomSettings();

    // アイコン選択状態を反映
    updateIconSelection(
      settings.selectedIcons || getDefaultCustomSettings().selectedIcons
    );

    console.log("カスタム設定を読み込みました:", settings);

    // 初期表示時にヘッダーを更新（保存された設定を反映）
    if (settings && settings.selectedIcons) {
      applyIconVisibility(settings.selectedIcons);
    }

    // 少し遅延してから比較を実行
    setTimeout(() => {
      compareIconSelectionWithHeader();
    }, 500);
  });
}

// デフォルト設定の取得
function getDefaultCustomSettings() {
  return {
    selectedIcons: [
      "memo",
      "clipboard",
      "prompt",
      "iframe",
      "status",
      "setting",
    ], // AIを除外、settingは常に選択状態
  };
}

// カスタム設定のイベントリスナー設定
function setupCustomSettingListeners() {
  // リセットボタン
  const resetBtn = document.getElementById("btn-reset-custom");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      console.log("カスタム設定をリセット");
      resetCustomSettings();
    });
  }

  // 保存ボタン
  const saveBtn = document.getElementById("btn-save-custom");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      console.log("カスタム設定を保存");
      saveCustomSettings();
    });
  }

  // 比較ボタン
  const compareBtn = document.getElementById("btn-compare-custom");
  if (compareBtn) {
    compareBtn.addEventListener("click", () => {
      console.log("アイコン選択状態とヘッダー表示状態を比較");
      compareIconSelectionWithHeader();
    });
  }

  // アイコン選択のイベントリスナー
  setupIconSelectionListeners();

  // AIドロップダウンのイベントリスナー
  setupAIDropdownListeners();
}

// カスタム設定のリセット
function resetCustomSettings() {
  const defaultSettings = getDefaultCustomSettings();

  // アイコン選択をリセット
  updateIconSelection(defaultSettings.selectedIcons);

  // 設定を適用（プレビューのみ）
  applyCustomSettingsPreview();

  // 成功メッセージを表示
  showCustomSettingMessage("設定をデフォルトに戻しました");
}

// カスタム設定の保存
function saveCustomSettings() {
  const settings = getCurrentCustomSettings();

  // 保存ボタンを一時的に無効化
  const saveBtn = document.getElementById("btn-save-custom");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="bi bi-check-lg"></i>保存中...';
  }

  chrome.storage.local.set(
    {
      customSettings: settings,
    },
    () => {
      console.log("カスタム設定を保存しました:", settings);
      showCustomSettingMessage("設定を保存しました");

      // 設定保存時にヘッダーを更新
      applyIconVisibility(settings.selectedIcons);

      // 少し遅延してから再度ヘッダーを更新（確実性のため）
      setTimeout(() => {
        applyIconVisibility(settings.selectedIcons);
        console.log("ヘッダー更新を再実行しました");

        // 保存ボタンを元に戻す
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="bi bi-check-lg"></i>設定を保存';
        }
      }, 100);
    }
  );
}

// 現在のカスタム設定を取得
function getCurrentCustomSettings() {
  return {
    selectedIcons: getSelectedIcons(),
  };
}

// カスタム設定の適用
function applyCustomSettings() {
  const settings = getCurrentCustomSettings();

  // アイコン表示の適用
  applyIconVisibility(settings.selectedIcons);

  console.log("カスタム設定を適用しました:", settings);
}

// 設定ページでのみ使用する関数（ヘッダー更新なし）
function applyCustomSettingsPreview() {
  const settings = getCurrentCustomSettings();
  console.log("設定プレビュー:", settings);
}

// カスタム設定メッセージの表示
function showCustomSettingMessage(message) {
  // 既存のメッセージがあれば削除
  const existingMessage = document.querySelector(".custom-setting-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageElement = document.createElement("div");
  messageElement.className = "custom-setting-message";
  messageElement.textContent = message;

  // カスタム設定パネルに追加
  const customPanel = document.getElementById("custom-panel");
  if (customPanel) {
    customPanel.appendChild(messageElement);

    // 3秒後に自動削除
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 3000);
  }
}

// アイコン選択のイベントリスナー設定
function setupIconSelectionListeners() {
  const iconOptions = document.querySelectorAll(".icon-option");

  iconOptions.forEach((option) => {
    option.addEventListener("click", () => {
      // Coming Soonアイコンは無効化
      if (option.classList.contains("coming-soon")) {
        console.log("Coming Soonアイコンは選択できません");
        return;
      }

      const iconType = option.dataset.icon;
      const isSelected = option.classList.contains("selected");

      if (isSelected) {
        // 設定アイコンは常に選択状態を保つ
        if (iconType === "setting") {
          showCustomSettingMessage("設定アイコンは常に表示されます");
          return;
        }

        // 選択解除（最低1つは選択状態を保つ）
        const selectedCount = document.querySelectorAll(
          ".icon-option.selected:not(.coming-soon)"
        ).length;
        if (selectedCount > 1) {
          option.classList.remove("selected");
          console.log(`アイコン選択解除: ${iconType}`);
        } else {
          showCustomSettingMessage("最低1つのアイコンは選択してください");
          return;
        }
      } else {
        // 選択
        option.classList.add("selected");
        console.log(`アイコン選択: ${iconType}`);
      }

      // リアルタイム更新を無効化（設定保存ボタンでのみ適用）
      // applyCustomSettings();
    });
  });
}

// アイコン選択状態を更新
function updateIconSelection(selectedIcons) {
  const iconOptions = document.querySelectorAll(".icon-option");

  iconOptions.forEach((option) => {
    const iconType = option.dataset.icon;
    if (selectedIcons.includes(iconType)) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }

    // 設定アイコンは常に選択状態にする
    if (iconType === "setting") {
      option.classList.add("selected");
    }
  });
}

// 選択されているアイコンを取得
function getSelectedIcons() {
  const selectedOptions = document.querySelectorAll(
    ".icon-option.selected:not(.coming-soon)"
  );
  const selectedIcons = Array.from(selectedOptions).map(
    (option) => option.dataset.icon
  );

  // 設定アイコンが含まれていない場合は追加
  if (!selectedIcons.includes("setting")) {
    selectedIcons.push("setting");
  }

  console.log("選択されたアイコン:", selectedIcons);
  return selectedIcons;
}

// アイコン表示の適用
function applyIconVisibility(selectedIcons) {
  const header = document.querySelector("header");
  if (!header) {
    console.log("ヘッダーが見つかりません");
    return;
  }

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(`ヘッダー内のボタン数: ${navButtons.length}`);

  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    // 設定アイコンは常に表示
    if (iconType === "setting") {
      button.style.display = "flex";
      console.log(`${buttonId} (${iconType}): 表示 (設定アイコン)`);
    } else if (selectedIcons.includes(iconType)) {
      button.style.display = "flex";
      console.log(`${buttonId} (${iconType}): 表示 (選択済み)`);
    } else {
      button.style.display = "none";
      console.log(`${buttonId} (${iconType}): 非表示 (未選択)`);
    }
  });

  console.log("ヘッダー更新完了 - 表示アイコン:", selectedIcons);
}

// ボタンIDからアイコンタイプを取得
function getIconTypeFromId(buttonId) {
  const iconMap = {
    "btn-memo-list": "memo",
    "btn-clipboard": "clipboard",
    "btn-prompt": "prompt",
    "btn-iframe": "iframe",
    "btn-ai": "ai",
    "btn-status": "status",
    "btn-setting": "setting",
  };

  return iconMap[buttonId] || buttonId;
}

// AIドロップダウンのイベントリスナー設定
function setupAIDropdownListeners() {
  const aiDropdownTrigger = document.querySelector(
    ".icon-option.coming-soon.dropdown-trigger"
  );

  if (aiDropdownTrigger) {
    // クリックイベントでドロップダウンを表示/非表示
    aiDropdownTrigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = aiDropdownTrigger.querySelector(".coming-soon-dropdown");
      const isVisible = dropdown.style.display === "block";

      // 他のドロップダウンを閉じる
      document.querySelectorAll(".coming-soon-dropdown").forEach((d) => {
        d.style.display = "none";
      });

      // このドロップダウンの表示/非表示を切り替え
      dropdown.style.display = isVisible ? "none" : "block";
    });

    // ドロップダウンアイテムのクリックイベント
    const dropdownItems = aiDropdownTrigger.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const itemText = item.querySelector("span").textContent;
        console.log(`AI機能選択: ${itemText}`);

        // ドロップダウンを閉じる
        const dropdown = aiDropdownTrigger.querySelector(
          ".coming-soon-dropdown"
        );
        dropdown.style.display = "none";

        // 選択された機能のメッセージを表示
        showCustomSettingMessage(`${itemText}は今後実装予定です`);
      });
    });

    // ドキュメント全体のクリックでドロップダウンを閉じる
    document.addEventListener("click", (e) => {
      if (!aiDropdownTrigger.contains(e.target)) {
        const dropdown = aiDropdownTrigger.querySelector(
          ".coming-soon-dropdown"
        );
        dropdown.style.display = "none";
      }
    });
  }
}

// アイコン選択状態とヘッダー表示状態を比較する関数
function compareIconSelectionWithHeader() {
  console.log("=== アイコン選択状態とヘッダー表示状態の比較 ===");

  // 1. 設定ページでの選択状態を取得
  const selectedOptions = document.querySelectorAll(
    ".icon-option.selected:not(.coming-soon)"
  );
  const selectedIcons = Array.from(selectedOptions).map(
    (option) => option.dataset.icon
  );

  // 設定アイコンが含まれていない場合は追加
  if (!selectedIcons.includes("setting")) {
    selectedIcons.push("setting");
  }

  console.log("設定ページで選択されているアイコン:", selectedIcons);

  // 2. 現在のヘッダー表示状態を取得
  const header = document.querySelector("header");
  if (!header) {
    console.log("ヘッダーが見つかりません");
    return;
  }

  const navButtons = header.querySelectorAll(".nav-btn");
  const visibleIcons = [];
  const hiddenIcons = [];

  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);
    const isVisible = button.style.display !== "none";

    if (isVisible) {
      visibleIcons.push(iconType);
    } else {
      hiddenIcons.push(iconType);
    }
  });

  console.log("ヘッダーで表示されているアイコン:", visibleIcons);
  console.log("ヘッダーで非表示のアイコン:", hiddenIcons);

  // 3. 比較
  const shouldBeVisible = selectedIcons;
  const actuallyVisible = visibleIcons;

  const missingIcons = shouldBeVisible.filter(
    (icon) => !actuallyVisible.includes(icon)
  );
  const extraIcons = actuallyVisible.filter(
    (icon) => !shouldBeVisible.includes(icon)
  );

  if (missingIcons.length === 0 && extraIcons.length === 0) {
    console.log("✅ アイコン選択状態とヘッダー表示状態は一致しています");
    showCustomSettingMessage(
      "アイコン選択状態とヘッダー表示状態は一致しています"
    );
  } else {
    console.log("❌ アイコン選択状態とヘッダー表示状態が一致していません");
    if (missingIcons.length > 0) {
      console.log("表示されるべきだが非表示のアイコン:", missingIcons);
    }
    if (extraIcons.length > 0) {
      console.log("非表示になるべきだが表示されているアイコン:", extraIcons);
    }
    showCustomSettingMessage(
      "アイコン選択状態とヘッダー表示状態が一致していません"
    );
  }

  console.log("=== 比較完了 ===");
}

// グローバルに公開してヘッダーナビから呼び出せるようにする
window.renderSettingMain = renderSettingMain;
window.compareIconSelectionWithHeader = compareIconSelectionWithHeader;
