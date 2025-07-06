// File: pages/setting/setting.js

// 設定項目の定義
const SETTING_ITEMS = [
  {
    id: "description",
    title: "説明",
    description: "domai Extension についての詳細情報を確認できます",
    icon: "bi-info-circle",
    panelId: "#description-panel",
    comingSoon: false,
  },
  {
    id: "backup-install",
    title: "バックアップのインストール",
    description:
      "エクスポートしたバックアップファイルを選択してデータを復元できます",
    icon: "bi-upload",
    panelId: "#backup-install-panel",
    comingSoon: false,
  },
  {
    id: "backup-create",
    title: "全体のバックアップを作成",
    description: "現在のデータをバックアップファイルとしてエクスポートできます",
    icon: "bi-download",
    panelId: "#backup-create-panel",
    comingSoon: true,
  },
  {
    id: "api-key",
    title: "APIキーの設定",
    description: "外部APIとの連携機能（現在開発中）",
    icon: "bi-key-fill",
    panelId: "#api-key-panel",
    comingSoon: true,
  },
  {
    id: "custom",
    title: "カスタム",
    description: "アイコン選択・並び替えなどのカスタム設定",
    icon: "bi-gear-fill",
    panelId: "#custom-panel",
    comingSoon: false,
  },
];

// 設定ページをデフォルト状態に戻す関数
function renderSettingMain() {
  console.log("renderSettingMain: 設定ページをデフォルト状態に戻す");

  const content = document.querySelector(".memo-content");
  const settingList = document.querySelector("#setting-list");
  const settingDetail = document.querySelector("#setting-detail");

  // 設定リストを表示、詳細パネルを非表示
  if (settingList) {
    settingList.style.display = "block";
  }
  if (settingDetail) {
    settingDetail.style.display = "none";
  }

  // 設定項目リストをレンダリング
  renderSettingList();

  // MEMO・PROMPTと同じアニメーション
  if (content) {
    content.classList.remove("show", "animate");
    void content.offsetWidth;
    content.classList.add("animate", "show");
  }

  // フッターを設定リストモードに変更
  setFooter("list");
}

// 設定項目リストをレンダリング
function renderSettingList() {
  const settingList = document.querySelector("#setting-list");
  if (!settingList) return;

  settingList.innerHTML = SETTING_ITEMS.map(
    (item) => `
    <div class="setting-item ${
      item.comingSoon ? "coming-soon" : ""
    }" data-item-id="${item.id}">
      <div class="setting-item-header">
        <div class="setting-item-icon">
          <i class="${item.icon}"></i>
        </div>
        <div class="setting-item-content">
          <div class="setting-item-title">${item.title}</div>
          <div class="setting-item-description">${item.description}</div>
        </div>
        <div class="setting-item-arrow">
          <i class="bi bi-chevron-right"></i>
        </div>
      </div>
    </div>
  `
  ).join("");

  // 設定項目のクリックイベントを設定
  setupSettingItemListeners();
}

// 設定項目のクリックイベントを設定
function setupSettingItemListeners() {
  document.querySelectorAll(".setting-item").forEach((item) => {
    item.addEventListener("click", () => {
      const itemId = item.dataset.itemId;
      const settingItem = SETTING_ITEMS.find((si) => si.id === itemId);

      if (settingItem) {
        console.log("設定項目がクリックされました:", itemId);
        showSettingDetail(settingItem);
      }
    });
  });
}

// 設定詳細を表示
function showSettingDetail(settingItem) {
  console.log("設定詳細を表示:", settingItem);

  const content = document.querySelector(".memo-content");
  const settingList = document.querySelector("#setting-list");
  const settingDetail = document.querySelector("#setting-detail");

  // 設定リストを非表示、詳細パネルを表示
  if (settingList) {
    settingList.style.display = "none";
  }
  if (settingDetail) {
    settingDetail.style.display = "block";
  }

      // すべてのパネルからshowとanimateを削除
      document.querySelectorAll(".detail-panel").forEach((p) => {
        p.classList.remove("show", "animate");
  });

  // 対象パネルを表示
  const targetPanel = document.querySelector(settingItem.panelId);
      if (targetPanel) {
        targetPanel.classList.add("show");
    console.log("パネルにshowクラスを追加:", settingItem.panelId);

        // アニメーション効果を追加
        requestAnimationFrame(() => {
          targetPanel.classList.add("animate");
      console.log("パネルにanimateクラスを追加:", settingItem.panelId);
    });

    // Coming Soon項目の場合、オーバーレイを表示
    if (settingItem.comingSoon) {
      setTimeout(() => {
        const overlay = targetPanel.querySelector(".coming-soon-overlay");
        if (overlay) {
          overlay.classList.add("show");
          console.log("COMING SOON オーバーレイを表示:", settingItem.id);
        }
      }, 300); // パネルのアニメーション後に表示
    }
  }

  // MEMO・PROMPTと同じアニメーション
  if (content) {
    content.classList.remove("show", "animate");
    void content.offsetWidth;
    content.classList.add("animate", "show");
  }

  // フッターを詳細モードに変更
  setFooter("detail");
}

// フッターの設定
function setFooter(mode) {
  const foot = document.querySelector(".memo-footer");
  if (!foot) return;

  foot.style.display = "flex";

  if (mode === "list") {
    foot.innerHTML = `
      <button class="nav-btn setting-contact-btn">
        <i class="bi bi-envelope"></i>
      </button>
      <button class="nav-btn setting-share-btn">
        <i class="bi bi-share-fill"></i>
      </button>
    `;
  } else if (mode === "detail") {
    foot.innerHTML = `
      <button class="nav-btn back-btn" id="btn-back-to-list">
        <i class="bi bi-arrow-left-circle"></i>
        <span class="nav-text">戻る</span>
      </button>
    `;
  }

  // フッターボタンのイベントを設定
  setupFooterListeners();
}

// フッターボタンのイベントリスナーを設定
function setupFooterListeners() {
  // 戻るボタン
  const backBtn = document.querySelector("#btn-back-to-list");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      console.log("戻るボタンがクリックされました");
      renderSettingMain();
    });
  }

  // お問合せボタン
  const contactBtn = document.querySelector(".setting-contact-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", () => {
      console.log("お問合せボタンがクリックされました");
      const email = "support@domai-extension.com";
      const subject = "domai Extension お問合せ";
      const body = "お問合せ内容をここに記載してください。\n\n---\n\n";
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
    });
  }

  // 共有ボタン
  const shareBtn = document.querySelector(".setting-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      console.log("共有ボタンがクリックされました");
      if (navigator.share) {
        navigator.share({
          title: "domai Extension",
          text: "効率的なブラウザ拡張機能です。",
          url: "https://github.com/your-repo/domai-extension",
        });
      } else {
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
}

// 設定ページの初期化フラグ
let settingPageInitialized = false;

window.addEventListener("DOMContentLoaded", () => {
  console.log("SETTINGページ DOMContentLoaded fired");

  // 重複初期化を防ぐ
  if (settingPageInitialized) {
    console.log("SETTINGページは既に初期化済みです");
    return;
  }

  // 現在のページがSETTINGページかどうかを確認
  const currentPage = window.location.pathname;
  if (!currentPage.includes("/setting/")) {
    console.log("現在のページはSETTINGページではありません:", currentPage);
    return; // SETTINGページでない場合は初期化をスキップ
  }

  settingPageInitialized = true;
  console.log("SETTINGページ初期化フラグを設定");

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

  // ─── カスタム設定機能の初期化 ───
  initializeCustomSettings();

  // 初期化完了後にメイン画面を表示
  setTimeout(() => {
    console.log("初期化完了後のメイン画面表示");
    renderSettingMain();
  }, 200);
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
  console.log("=== カスタム設定読み込み開始 ===");

  // Chrome Storageから設定を読み込み
  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings || getDefaultCustomSettings();

    console.log("読み込まれた設定:", settings);
    console.log("デフォルト設定:", getDefaultCustomSettings());

    // アイコン選択状態を反映
    const selectedIcons =
      settings.selectedIcons || getDefaultCustomSettings().selectedIcons;
    updateIconSelection(selectedIcons);

    console.log("カスタム設定を読み込みました:", settings);
    console.log("適用するアイコン:", selectedIcons);

    // 初期表示時にヘッダーを更新（保存された設定を反映）
    if (selectedIcons && selectedIcons.length > 0) {
      console.log("初期表示時のヘッダー更新を実行");
      forceApplyIconVisibility(selectedIcons);

      // 確実性のため少し遅延してもう一度実行
      setTimeout(() => {
        console.log("初期表示時のヘッダー更新を再実行");
        forceApplyIconVisibility(selectedIcons);
      }, 200);

      // さらに遅延して最終確認
      setTimeout(() => {
        console.log("初期表示時のヘッダー更新を最終実行");
        forceApplyIconVisibility(selectedIcons);
      }, 500);
    }

    // 少し遅延してから比較を実行
    setTimeout(() => {
      compareIconSelectionWithHeader();

      // 最終的なヘッダー更新を実行
      console.log("最終的なヘッダー更新を実行");
      forceApplyIconVisibility(selectedIcons);
    }, 800);
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
    ], // 指定された順序: MEMO・CLIPBOARD・PROMPT・IFRAME・STATUS・SETTING
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

  // "今後実装予定" ドロップダウンのイベントリスナー
  setupComingSoonDropdownListeners();
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

  console.log("=== 設定保存処理開始 ===");
  console.log("保存する設定:", settings);

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
      console.log("ヘッダー更新を実行:", settings.selectedIcons);
      forceApplyIconVisibility(settings.selectedIcons);

      // 保存ボタンを元に戻す
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="bi bi-check-lg"></i>設定を保存';
      }

      // 最終確認
      setTimeout(() => {
        compareIconSelectionWithHeader();
      }, 200);
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

  // 既存のイベントリスナーを削除してから再設定
  iconOptions.forEach((option) => {
    // 既存のイベントリスナーをクローンで削除
    const newOption = option.cloneNode(true);
    option.parentNode.replaceChild(newOption, option);
  });

  // 更新されたオプションを再取得
  const updatedOptions = document.querySelectorAll(".icon-option");

  updatedOptions.forEach((option) => {
    // クリックイベント（選択/解除）
    option.addEventListener("click", (e) => {
      // Coming Soonアイコンは無効化
      if (option.classList.contains("coming-soon")) {
        console.log("Coming Soonアイコンは選択できません");
        return;
      }

      const iconType = option.dataset.icon;
      console.log("アイコンがクリックされました:", iconType);
      const isSelected = option.classList.contains("selected");

      if (isSelected) {
        // MEMOとSETTINGアイコンは常に選択状態を保つ
        if (iconType === "setting" || iconType === "memo") {
          showCustomSettingMessage("MEMOとSETTINGアイコンは常に表示されます");
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

      // アイコン選択完了
      console.log("アイコン選択が完了しました");
    });
  });
}

// アイコン選択状態を更新（順序機能を削除）
function updateIconSelection(selectedIcons) {
  console.log("アイコン選択状態を更新:", selectedIcons);

  const iconOptions = document.querySelectorAll(".icon-option");
  if (!iconOptions.length) {
    console.error("内緒だよ");
    return;
  }

  // 選択状態を更新
  iconOptions.forEach((option) => {
    const iconType = option.dataset.icon;
    if (selectedIcons.includes(iconType)) {
      option.classList.add("selected");
    } else {
      option.classList.remove("selected");
    }

    // MEMOとSETTINGアイコンは常に選択状態にする
    if (iconType === "setting" || iconType === "memo") {
      option.classList.add("selected");
    }
  });

  console.log("アイコン選択状態の更新完了");

  // イベントリスナーを再設定
  setupIconSelectionListeners();
}

// 選択されているアイコンを取得（順序機能を削除）
function getSelectedIcons() {
  const selectedOptions = document.querySelectorAll(
    ".icon-option.selected:not(.coming-soon)"
  );
  const selectedIcons = [];

  selectedOptions.forEach((option) => {
    const iconType = option.dataset.icon;

    // 今後実装予定のアイコン（AI、TodoList、QRCode）を除外
    if (iconType === "ai" || iconType === "todolist" || iconType === "qrcode") {
      return;
    }

    selectedIcons.push(iconType);
  });

  // デフォルト順序でソート
  const defaultOrder = [
    "memo",
    "clipboard",
    "prompt",
    "iframe",
    "status",
    "setting",
  ];
  selectedIcons.sort((a, b) => {
    const indexA = defaultOrder.indexOf(a);
    const indexB = defaultOrder.indexOf(b);
    return indexA - indexB;
  });

  // MEMOとSETTINGアイコンが含まれていない場合は追加
  if (!selectedIcons.includes("memo")) {
    selectedIcons.unshift("memo");
  }
  if (!selectedIcons.includes("setting")) {
    selectedIcons.push("setting");
  }

  console.log("選択されたアイコン:", selectedIcons);
  return selectedIcons;
}

// アイコン表示の適用（表示/非表示のみ、順序は固定）
function applyIconVisibility(selectedIcons) {
  // ドラッグ&ドロップ進行中は適用しない
  if (window.isDragDropInProgress) {
    console.log(
      "SETTING: ドラッグ&ドロップ進行中のため、アイコン表示設定をスキップ"
    );
    return;
  }

  console.log(
    "SETTING: applyIconVisibility 呼び出し - 選択アイコン:",
    selectedIcons
  );
  console.log("SETTING: 呼び出し元のスタックトレース:", new Error().stack);

  // 設定ページ以外からの呼び出しは無視
  const isSettingPage = window.location.pathname.includes("/setting/");
  if (!isSettingPage) {
    console.log(
      "SETTING: 設定ページ以外からの呼び出しのため、アイコン表示制御をスキップ"
    );
    return;
  }

  const header = document.querySelector("header");
  if (!header) {
    console.log("SETTING: ヘッダーが見つかりません");
    return;
  }

  // 非表示アイコン更新時のチラつきを抑えるためヘッダーを一旦隠す
  header.classList.add("updating");
  console.log("SETTING: ヘッダー更新モード開始");

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(`SETTING: ヘッダー内のボタン数: ${navButtons.length}`);
  console.log(`SETTING: 適用する選択アイコン:`, selectedIcons);

  // 各ボタンの表示/非表示を制御（DOM順序は変更しない）
  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    let shouldHide = false;

    if (iconType === "ai" || iconType === "todolist" || iconType === "qrcode") {
      shouldHide = true;
      console.log(`SETTING: ${buttonId} (${iconType}): 非表示 (今後実装予定)`);
    } else if (iconType === "setting" || iconType === "memo") {
      // 常に表示
      console.log(
        `SETTING: ${buttonId} (${iconType}): 表示 (MEMO/SETTINGアイコン)`
      );
    } else if (!selectedIcons.includes(iconType)) {
      shouldHide = true;
      console.log(`SETTING: ${buttonId} (${iconType}): 非表示 (未選択)`);
    } else {
      console.log(`SETTING: ${buttonId} (${iconType}): 表示 (選択済み)`);
    }

    if (shouldHide) {
      button.classList.add("hidden-icon");
    } else {
      button.classList.remove("hidden-icon");
    }
  });

  console.log("SETTING: ヘッダー更新完了 - 表示アイコン:", selectedIcons);

  // 現在のページに対応するアイコンのactive状態を復元
  if (window.restoreActiveIconState) {
    window.restoreActiveIconState();
  }

  // ヘッダー更新モード終了を次のフレームで実行
  requestAnimationFrame(() => {
    header.classList.remove("updating");
    console.log("SETTING: ヘッダー更新モード終了");
  });
}

// 強制的にアイコン表示を適用する関数（表示/非表示のみ、順序は固定）
function forceApplyIconVisibility(selectedIcons) {
  console.log(
    "FORCE: forceApplyIconVisibility 呼び出し - 選択アイコン:",
    selectedIcons
  );
  console.log(
    "FORCE: ドラッグ&ドロップフラグ状態:",
    window.isDragDropInProgress
  );

  // ドラッグ&ドロップ進行中は適用しない
  if (window.isDragDropInProgress) {
    console.log(
      "FORCE: ドラッグ&ドロップ進行中のため、強制アイコン表示設定をスキップ"
    );
    return;
  }

  // 設定ページ以外からの呼び出しでも処理を続行（全ページで設定を適用）
  const isSettingPage = window.location.pathname.includes("/setting/");
  console.log(
    `FORCE: ${isSettingPage ? "設定ページ" : "その他のページ"}からの呼び出し`
  );

  console.log("=== 強制的なアイコン表示適用開始 ===");
  console.log("適用するアイコン:", selectedIcons);

  const header = document.querySelector("header");
  if (!header) {
    console.error("内緒だよ");
    return;
  }

  // 更新中のチラつきを防ぐためヘッダーを一時的に非表示
  header.classList.add("updating");
  console.log("FORCE: ヘッダー更新モード開始");

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(`FORCE: ヘッダー内のボタン数: ${navButtons.length}`);

  // 各ボタンの表示/非表示を制御（DOM順序は変更しない）
  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    let shouldHide = false;

    if (iconType === "ai" || iconType === "todolist" || iconType === "qrcode") {
      shouldHide = true;
      console.log(`FORCE: ${buttonId} (${iconType}): 非表示 (今後実装予定)`);
    } else if (iconType === "setting" || iconType === "memo") {
      console.log(
        `FORCE: ${buttonId} (${iconType}): 表示 (MEMO/SETTINGアイコン)`
      );
    } else if (!selectedIcons.includes(iconType)) {
      shouldHide = true;
      console.log(`FORCE: ${buttonId} (${iconType}): 非表示 (未選択)`);
    } else {
      console.log(`FORCE: ${buttonId} (${iconType}): 表示 (選択済み)`);
    }

    if (shouldHide) {
      button.classList.add("hidden-icon");
    } else {
      button.classList.remove("hidden-icon");
    }
  });

  console.log("FORCE: アイコン表示/非表示制御完了");

  // 現在のページに対応するアイコンのactive状態を復元
  if (window.restoreActiveIconState) {
    window.restoreActiveIconState();
  }

  // ヘッダー更新モード終了を次のフレームで実行
  requestAnimationFrame(() => {
    header.classList.remove("updating");
    console.log("FORCE: ヘッダー更新モード終了");
  });

  // 適用後の状態を確認
  setTimeout(() => {
    console.log("=== 適用後の状態確認 ===");
    const updatedButtons = header.querySelectorAll(".nav-btn");
    updatedButtons.forEach((button, index) => {
      const buttonId = button.id;
      const iconType = getIconTypeFromId(buttonId);
      const isHidden = button.classList.contains("hidden-icon");
      console.log(
        `FORCE: ${buttonId} (${iconType}) - 表示状態: ${
          isHidden ? "非表示" : "表示"
        }`
      );
    });
  }, 50);

  console.log(
    "FORCE: 強制的なアイコン表示適用完了 - 表示アイコン:",
    selectedIcons
  );
}

// ボタンIDからアイコンタイプを取得
function getIconTypeFromId(buttonId) {
  const iconMap = {
    "btn-memo-list": "memo",
    "btn-clipboard": "clipboard",
    "btn-prompt": "prompt",
    "btn-iframe": "iframe",
    "btn-ai": "ai",
    "btn-todolist": "todolist",
    "btn-qrcode": "qrcode",
    "btn-status": "status",
    "btn-setting": "setting",
  };

  return iconMap[buttonId] || buttonId;
}

// "今後実装予定" ドロップダウンのイベントリスナーを設定
function setupComingSoonDropdownListeners() {
  // 対象となるすべてのトリガー要素を取得
  const triggers = document.querySelectorAll(
    ".icon-option.coming-soon.dropdown-trigger"
  );

  triggers.forEach((trigger) => {
    // クリックでドロップダウンを表示/非表示
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const dropdown = trigger.querySelector(".coming-soon-dropdown");
      const isVisible = dropdown.style.display === "block";

      // 他のドロップダウンを閉じる
      document.querySelectorAll(".coming-soon-dropdown").forEach((d) => {
        d.style.display = "none";
      });

      // 表示状態を切り替え
      dropdown.style.display = isVisible ? "none" : "block";
      console.log(
        `COMING SOON ドロップダウン toggled: ${trigger.dataset.icon}, visible=${!isVisible}`
      );
    });

    // ドロップダウンアイテムクリック
    const dropdownItems = trigger.querySelectorAll(".dropdown-item");
    dropdownItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const itemText = item.querySelector("span").textContent;
        console.log(`COMING SOON 選択: ${itemText}`);

        const dropdown = trigger.querySelector(".coming-soon-dropdown");
        dropdown.style.display = "none";

        showCustomSettingMessage(`${itemText}は今後実装予定です`);
      });
    });

    // ドキュメントクリックで閉じる
    document.addEventListener("click", (e) => {
      if (!trigger.contains(e.target)) {
        const dropdown = trigger.querySelector(".coming-soon-dropdown");
        dropdown.style.display = "none";
      }
    });
  });
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

// バックアップ作成機能の初期化
function initializeBackupCreate() {
  console.log("バックアップ作成機能を初期化");

  // バックアップ情報を表示
  updateBackupInfo();

  // エクスポートボタンのイベントリスナーを設定
  const exportBtn = document.querySelector("#btn-export");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleBackupExport);
  }
}

// バックアップ情報を更新
async function updateBackupInfo() {
  console.log("バックアップ情報を更新");

  const backupDetails = document.querySelector("#backup-details");
  if (!backupDetails) return;

  try {
    // 各データの件数を取得
    const memos = (await loadStorage("memos")) || [];
    const clips = (await loadStorage("clips")) || [];
    const prompts = (await loadStorage("prompts")) || [];

    const memoCount = memos.length;
    const clipCount = clips.length;
    const promptCount = prompts.length;
    const totalCount = memoCount + clipCount + promptCount;

    // 現在の日時を取得
    const now = new Date();
    const formattedDate = now.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    backupDetails.innerHTML = `
      <div class="backup-detail-item">
        <span class="backup-detail-label">MEMO</span>
        <span class="backup-detail-value">${memoCount}件</span>
      </div>
      <div class="backup-detail-item">
        <span class="backup-detail-label">CLIPBOARD</span>
        <span class="backup-detail-value">${clipCount}件</span>
      </div>
      <div class="backup-detail-item">
        <span class="backup-detail-label">PROMPT</span>
        <span class="backup-detail-value">${promptCount}件</span>
      </div>
      <div class="backup-detail-item">
        <span class="backup-detail-label">合計</span>
        <span class="backup-detail-value">${totalCount}件</span>
      </div>
      <div class="backup-detail-item">
        <span class="backup-detail-label">最終更新</span>
        <span class="backup-detail-value">${formattedDate}</span>
      </div>
    `;

    console.log("バックアップ情報を更新しました:", {
      memoCount,
      clipCount,
      promptCount,
      totalCount,
    });
  } catch (error) {
    console.error("バックアップ情報の更新に失敗しました:", error);
    backupDetails.innerHTML = `
      <div class="backup-detail-item">
        <span class="backup-detail-label">エラー</span>
        <span class="backup-detail-value">情報を取得できませんでした</span>
    </div>
    `;
  }
}

// バックアップエクスポート処理
async function handleBackupExport() {
  console.log("バックアップエクスポートを開始");

  const exportBtn = document.querySelector("#btn-export");
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<i class="bi bi-hourglass-split"></i>作成中...';
  }

  try {
    // 各データを取得
    const memos = (await loadStorage("memos")) || [];
    const clips = (await loadStorage("clips")) || [];
    const prompts = (await loadStorage("prompts")) || [];

    // バックアップデータを構築
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      data: {
        memos: memos,
        clips: clips,
        prompts: prompts,
      },
    };

    // セキュリティハッシュを生成
    const dataString = JSON.stringify(backupData.data);
    const securityHash = await generateSecurityHash(dataString);
    backupData.securityHash = securityHash;

    // ファイル名を生成
    const now = new Date();
    const fileName = `domai-backup-${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}-${now
      .getHours()
      .toString()
      .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}.json`;

    // ファイルをダウンロード
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 成功メッセージを表示
    showBackupSuccessMessage(fileName);

    console.log("バックアップエクスポートが完了しました:", fileName);
  } catch (error) {
    console.error("バックアップエクスポートに失敗しました:", error);
    showBackupErrorMessage();
  } finally {
    // ボタンを元に戻す
    if (exportBtn) {
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<i class="bi bi-download"></i>バックアップを作成';
    }
  }
}

// バックアップ成功メッセージを表示
function showBackupSuccessMessage(fileName) {
  const message = `
    <div class="backup-success-message">
      <i class="bi bi-check-circle-fill"></i>
      <div class="message-content">
        <div class="message-title">バックアップが作成されました</div>
        <div class="message-text">ファイル名: ${fileName}</div>
      </div>
    </div>
  `;

  showCustomSettingMessage(message, "success");
}

// バックアップエラーメッセージを表示
function showBackupErrorMessage() {
  const message = `
    <div class="backup-error-message">
      <i class="bi bi-exclamation-triangle-fill"></i>
      <div class="message-content">
        <div class="message-title">バックアップの作成に失敗しました</div>
        <div class="message-text">もう一度お試しください</div>
      </div>
    </div>
  `;

  showCustomSettingMessage(message, "error");
}

// デバッグ用の関数をグローバルに公開
window.debugCustomSettings = () => {
  console.log("=== カスタム設定デバッグ情報 ===");

  // 1. 現在の選択状態
  const selectedOptions = document.querySelectorAll(
    ".icon-option.selected:not(.coming-soon)"
  );
  const selectedIcons = Array.from(selectedOptions).map(
    (option) => option.dataset.icon
  );
  console.log("設定ページでの選択アイコン:", selectedIcons);

  // 2. ストレージの設定
  chrome.storage.local.get(["customSettings"], (result) => {
    console.log("ストレージの設定:", result.customSettings);
  });

  // 3. ヘッダーの表示状態
  const header = document.querySelector("header");
  if (header) {
    const navButtons = header.querySelectorAll(".nav-btn");
    navButtons.forEach((button) => {
      const buttonId = button.id;
      const iconType = getIconTypeFromId(buttonId);
      const display = window.getComputedStyle(button).display;
      const visibility = window.getComputedStyle(button).visibility;
      console.log(
        `ヘッダー ${buttonId} (${iconType}): display=${display}, visibility=${visibility}`
      );
    });
  }

  // 4. 強制適用テスト
  console.log("強制適用テストを実行...");
  forceApplyIconVisibility(selectedIcons);
};

window.testIconSave = () => {
  console.log("=== アイコン保存テスト ===");
  const selectedIcons = getSelectedIcons();
  console.log("現在選択されているアイコン:", selectedIcons);
  forceApplyIconVisibility(selectedIcons);
};

console.log("[SETTING] setting.js が読み込まれました");
console.log("[SETTING] デバッグ関数: debugCustomSettings(), testIconSave()");
