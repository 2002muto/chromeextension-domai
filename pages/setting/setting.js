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
      // カスタムモードを解除（カスタムボタン以外の場合）
      if (!btn.dataset.target || btn.dataset.target !== "#custom-panel") {
        const content = document.querySelector(".memo-content");
        if (content) {
          content.classList.remove("custom-mode");
        }
      }

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
      console.log("クリックされたボタンのターゲット:", targetId);
      const targetPanel = document.querySelector(targetId);
      console.log("ターゲットパネル:", targetPanel);
      if (targetPanel) {
        targetPanel.classList.add("show");
        console.log("パネルにshowクラスを追加:", targetId);
        // アニメーション効果を追加
        requestAnimationFrame(() => {
          targetPanel.classList.add("animate");
        });
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
      const email = "support@domai-extension.com";
      const subject = "domai Extension お問合せ";
      const body = "お問合せ内容をここに記載してください。\n\n---\n\n";
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      console.log("共有ボタンがクリックされました");
      // 共有機能の実装
      if (navigator.share) {
        navigator.share({
          title: "domai Extension",
          text: "効率的なブラウザ拡張機能です。",
          url: "https://github.com/your-repo/domai-extension",
        });
      } else {
        // フォールバック: クリップボードにコピー
        const shareText =
          "domai Extension - 効率的なブラウザ拡張機能\nhttps://github.com/your-repo/domai-extension";
        navigator.clipboard.writeText(shareText).then(() => {
          showCustomSettingMessage(
            "共有リンクをクリップボードにコピーしました"
          );
        });
      }
    });
  }

  // ─── カスタム設定機能の初期化 ───
  initializeCustomSettings();

  // カスタムボタンのクリックでカスタムパネルのみアニメーション表示（show→次フレームでanimate）
  const customBtn = document.getElementById("btn-custom");
  if (customBtn) {
    customBtn.addEventListener("click", function (e) {
      e.preventDefault();
      // カスタムモードに切り替え
      const content = document.querySelector(".memo-content");
      if (content) {
        content.classList.add("custom-mode");
      }

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

// ───────────────────────────────────────
// バックアップのインストール機能
// ───────────────────────────────────────
let selectedFile = null;
let backupData = null;

// バックアップのインストール機能の初期化
function initializeBackupInstall() {
  console.log("バックアップのインストール機能を初期化中...");

  const fileUploadArea = document.getElementById("file-upload-area");
  const fileInput = document.getElementById("backup-file-input");
  const selectFileBtn = document.getElementById("btn-select-file");
  const removeFileBtn = document.getElementById("btn-remove-file");
  const importBtn = document.getElementById("btn-import");

  if (!fileUploadArea || !fileInput || !selectFileBtn) {
    console.error("バックアップのインストール機能の要素が見つかりません");
    return;
  }

  // ファイル選択ボタンのクリックイベント
  selectFileBtn.addEventListener("click", () => {
    fileInput.click();
  });

  // ファイルアップロードエリアのクリックイベント
  fileUploadArea.addEventListener("click", () => {
    fileInput.click();
  });

  // ファイル入力の変更イベント
  fileInput.addEventListener("change", handleFileSelect);

  // ドラッグ&ドロップイベント
  fileUploadArea.addEventListener("dragover", handleDragOver);
  fileUploadArea.addEventListener("dragleave", handleDragLeave);
  fileUploadArea.addEventListener("drop", handleDrop);

  // ファイル削除ボタンのイベント
  if (removeFileBtn) {
    removeFileBtn.addEventListener("click", removeSelectedFile);
  }

  // インポート実行ボタンのイベント
  if (importBtn) {
    importBtn.addEventListener("click", executeImport);
  }

  console.log("バックアップのインストール機能の初期化完了");
}

// ファイル選択処理
function handleFileSelect(event) {
  console.log("handleFileSelect called");
  const file = event.target.files[0];
  console.log("Selected file:", file);
  if (file) {
    console.log("Processing file:", file.name, file.type, file.size);
    processSelectedFile(file);
  } else {
    console.log("No file selected");
  }
}

// ドラッグ&ドロップ処理
function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  const fileUploadArea = document.getElementById("file-upload-area");
  if (fileUploadArea) {
    fileUploadArea.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  const fileUploadArea = document.getElementById("file-upload-area");
  if (fileUploadArea) {
    fileUploadArea.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();

  const fileUploadArea = document.getElementById("file-upload-area");
  if (fileUploadArea) {
    fileUploadArea.classList.remove("drag-over");
  }

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      processSelectedFile(file);
    } else {
      showImportMessage("JSONファイルを選択してください", "error");
    }
  }
}

// 選択されたファイルの処理
async function processSelectedFile(file) {
  console.log("processSelectedFile called with:", file.name);

  try {
    // ファイルの内容を読み込み
    console.log("Reading file content...");
    const content = await readFileAsText(file);
    console.log("File content length:", content.length);

    console.log("Parsing JSON...");
    const data = JSON.parse(content);
    console.log("Parsed data:", data);

    // データの検証
    console.log("Validating backup data...");
    if (!validateBackupData(data)) {
      console.log("Backup data validation failed");
      showImportMessage("無効なバックアップファイルです", "error");
      return;
    }

    console.log("Backup data validation passed");
    selectedFile = file;
    backupData = data;

    // UIを更新
    console.log("Updating UI...");
    showFileInfo(file, data);
    showImportOptions();
    showImportActions();

    showImportMessage(
      "バックアップファイルが正常に読み込まれました",
      "success"
    );
    console.log("File processing completed successfully");
  } catch (error) {
    console.error("ファイル処理エラー:", error);
    showImportMessage(
      "ファイルの読み込みに失敗しました: " + error.message,
      "error"
    );
  }
}

// ファイルをテキストとして読み込み
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

// バックアップデータの検証
function validateBackupData(data) {
  console.log("validateBackupData called with:", data);

  if (!data || typeof data !== "object") {
    console.log("Data is not an object");
    return false;
  }

  // 基本的な構造チェック（バージョンとエクスポート日時は必須ではない）
  console.log("Checking version:", data.version);
  console.log("Checking exportDate:", data.exportDate);

  // バージョンとエクスポート日時がない場合は自動的に追加
  if (!data.version) {
    data.version = "1.0.0";
    console.log("Added default version");
  }
  if (!data.exportDate) {
    data.exportDate = new Date().toISOString();
    console.log("Added default export date");
  }

  // 少なくとも1つのデータタイプが含まれているかチェック
  console.log(
    "Checking data types - memos:",
    data.memos,
    "clips:",
    data.clips,
    "prompts:",
    data.prompts
  );
  const hasValidData = data.memos || data.clips || data.prompts;
  if (!hasValidData) {
    console.log("No valid data types found");
    return false;
  }

  console.log("Backup data validation passed");
  return true;
}

// ファイル情報の表示
function showFileInfo(file, data) {
  const fileInfo = document.getElementById("file-info");
  const fileName = document.getElementById("file-name");
  const fileDetails = document.getElementById("file-details");

  if (!fileInfo || !fileName || !fileDetails) {
    return;
  }

  fileName.textContent = file.name;

  // ファイル詳細情報を生成
  const details = [];

  // エクスポート日時
  if (data.exportDate) {
    const exportDate = new Date(data.exportDate);
    details.push({
      label: "エクスポート日時",
      value: exportDate.toLocaleString("ja-JP"),
    });
  }

  // バージョン
  if (data.version) {
    details.push({
      label: "バージョン",
      value: data.version,
    });
  }

  // データ件数
  if (data.memos) {
    details.push({
      label: "メモ数",
      value: `${data.memoCount || data.memos.length}件`,
    });
  }

  if (data.clips) {
    details.push({
      label: "クリップ数",
      value: `${data.clipCount || data.clips.length}件`,
    });
  }

  if (data.prompts) {
    details.push({
      label: "プロンプト数",
      value: `${data.promptCount || data.prompts.length}件`,
    });
  }

  // 詳細情報をHTMLに変換
  fileDetails.innerHTML = details
    .map(
      (detail) => `
    <div class="detail-item">
      <span class="detail-label">${detail.label}</span>
      <span class="detail-value">${detail.value}</span>
    </div>
  `
    )
    .join("");

  fileInfo.style.display = "block";
}

// インポートオプションの表示
function showImportOptions() {
  const importOptions = document.getElementById("import-options");
  if (importOptions) {
    importOptions.style.display = "block";
  }
}

// インポート実行ボタンの表示
function showImportActions() {
  const importActions = document.getElementById("import-actions");
  if (importActions) {
    importActions.style.display = "block";
  }
}

// 選択されたファイルの削除
function removeSelectedFile() {
  console.log("removeSelectedFile called");

  const fileInput = document.getElementById("backup-file-input");
  const fileInfo = document.getElementById("file-info");
  const importOptions = document.getElementById("import-options");
  const importActions = document.getElementById("import-actions");

  if (fileInput) {
    fileInput.value = "";
    console.log("File input cleared");
  }

  if (fileInfo) {
    fileInfo.style.display = "none";
    console.log("File info hidden");
  }

  if (importOptions) {
    importOptions.style.display = "none";
    console.log("Import options hidden");
  }

  if (importActions) {
    importActions.style.display = "none";
    console.log("Import actions hidden");
  }

  selectedFile = null;
  backupData = null;
  console.log("File and data cleared");

  showImportMessage("ファイル選択をキャンセルしました", "info");
}

// UIをリセット（メッセージは表示しない）
function resetImportUI() {
  console.log("resetImportUI called");

  const fileInput = document.getElementById("backup-file-input");
  const fileInfo = document.getElementById("file-info");
  const importOptions = document.getElementById("import-options");
  const importActions = document.getElementById("import-actions");

  if (fileInput) {
    fileInput.value = "";
    console.log("File input cleared");
  }

  if (fileInfo) {
    fileInfo.style.display = "none";
    console.log("File info hidden");
  }

  if (importOptions) {
    importOptions.style.display = "none";
    console.log("Import options hidden");
  }

  if (importActions) {
    importActions.style.display = "none";
    console.log("Import actions hidden");
  }

  selectedFile = null;
  backupData = null;
  console.log("File and data cleared");
}

// インポート実行
async function executeImport() {
  if (!backupData) {
    showImportMessage("バックアップファイルが選択されていません", "error");
    return;
  }

  const importMode = document.querySelector(
    'input[name="import-mode"]:checked'
  )?.value;
  if (!importMode) {
    showImportMessage("インポートモードを選択してください", "error");
    return;
  }

  try {
    console.log("インポートを開始します...");
    console.log("インポートモード:", importMode);
    console.log("バックアップデータ:", backupData);

    // インポート処理を実行
    await performImport(backupData, importMode);

    showImportMessage("インポートが完了しました", "success");

    // 成功後はUIをリセット（メッセージは表示しない）
    resetImportUI();
  } catch (error) {
    console.error("インポートエラー:", error);
    showImportMessage("インポートに失敗しました: " + error.message, "error");
  }
}

// 実際のインポート処理
async function performImport(data, mode) {
  console.log("performImport開始:", { mode, data });

  // 各データタイプをインポート
  if (data.memos) {
    await importMemos(data.memos, mode);
  }

  if (data.clips) {
    await importClips(data.clips, mode);
  }

  if (data.prompts) {
    await importPrompts(data.prompts, mode);
  }

  console.log("performImport完了");
}

// メモのインポート
async function importMemos(memos, mode) {
  console.log("メモのインポート開始:", { mode, count: memos.length });

  if (mode === "replace") {
    // 上書きモード: 既存データを完全に置き換え
    await chrome.storage.local.set({ memos: memos });
    console.log("メモを上書きしました");
  } else {
    // 統合モード: 既存データと統合
    const existingMemos = (await loadStorage("memos")) || [];
    const mergedMemos = mergeData(existingMemos, memos, "id");
    await chrome.storage.local.set({ memos: mergedMemos });
    console.log("メモを統合しました:", {
      existing: existingMemos.length,
      imported: memos.length,
      merged: mergedMemos.length,
    });
  }
}

// クリップのインポート
async function importClips(clips, mode) {
  console.log("クリップのインポート開始:", { mode, count: clips.length });

  if (mode === "replace") {
    // 上書きモード: 既存データを完全に置き換え
    await chrome.storage.local.set({ clips: clips });
    console.log("クリップを上書きしました");
  } else {
    // 統合モード: 既存データと統合
    const existingClips = (await loadStorage("clips")) || [];
    const mergedClips = mergeData(existingClips, clips, "id");
    await chrome.storage.local.set({ clips: mergedClips });
    console.log("クリップを統合しました:", {
      existing: existingClips.length,
      imported: clips.length,
      merged: mergedClips.length,
    });
  }
}

// プロンプトのインポート
async function importPrompts(prompts, mode) {
  console.log("プロンプトのインポート開始:", { mode, count: prompts.length });

  if (mode === "replace") {
    // 上書きモード: 既存データを完全に置き換え
    await chrome.storage.local.set({ prompts: prompts });
    console.log("プロンプトを上書きしました");
  } else {
    // 統合モード: 既存データと統合
    const existingPrompts = (await loadStorage("prompts")) || [];
    const mergedPrompts = mergeData(existingPrompts, prompts, "id");
    await chrome.storage.local.set({ prompts: mergedPrompts });
    console.log("プロンプトを統合しました:", {
      existing: existingPrompts.length,
      imported: prompts.length,
      merged: mergedPrompts.length,
    });
  }
}

// データの統合（重複チェック付き）
function mergeData(existing, imported, idField) {
  const existingMap = new Map();
  existing.forEach((item) => {
    existingMap.set(item[idField], item);
  });

  const merged = [...existing];

  imported.forEach((item) => {
    if (existingMap.has(item[idField])) {
      // 重複する場合は上書き
      const index = merged.findIndex(
        (existingItem) => existingItem[idField] === item[idField]
      );
      if (index !== -1) {
        merged[index] = item;
      }
    } else {
      // 新規の場合は追加
      merged.push(item);
    }
  });

  return merged;
}

// ストレージ読み込みヘルパー
function loadStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key] || []));
  });
}

// インポートメッセージの表示
function showImportMessage(message, type = "info") {
  console.log(`[IMPORT] ${type.toUpperCase()}: ${message}`);

  // 既存のメッセージを削除
  const existingMessage = document.querySelector(".import-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // 新しいメッセージを作成
  const messageElement = document.createElement("div");
  messageElement.className = `import-message ${type}`;

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-triangle"
      : "info-circle";

  messageElement.innerHTML = `
    <i class="bi bi-${icon}"></i>
    <span>${message}</span>
  `;

  // メッセージを表示
  const backupInstallContent = document.querySelector(
    ".backup-install-content"
  );
  if (backupInstallContent) {
    backupInstallContent.insertBefore(
      messageElement,
      backupInstallContent.firstChild
    );
  }

  // アニメーション
  setTimeout(() => {
    messageElement.classList.add("show");
  }, 100);

  // 自動削除
  setTimeout(() => {
    messageElement.classList.remove("show");
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 300);
  }, 5000);
}

// 初期化時にバックアップのインストール機能を設定
document.addEventListener("DOMContentLoaded", () => {
  // 既存の初期化処理の後に追加
  setTimeout(() => {
    initializeBackupInstall();
  }, 100);
});
