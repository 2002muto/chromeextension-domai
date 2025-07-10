// File: pages/common.js
// ナビゲーションボタンのクリック時展開機能

// ページ状態管理のためのユーティリティ関数
const PageStateManager = {
  // ページ状態を保存
  savePageState: (pageName, state) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      pageStates[pageName] = {
        ...state,
        timestamp: Date.now(),
      };
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を保存:`, state);
    } catch (error) {
      console.error("[PageState] 状態保存エラー:", error);
    }
  },

  // ページ状態を取得
  getPageState: (pageName) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      return pageStates[pageName] || null;
    } catch (error) {
      console.error("[PageState] 状態取得エラー:", error);
      return null;
    }
  },

  // ページ状態を更新
  updatePageState: (pageName, updates) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      pageStates[pageName] = {
        ...pageStates[pageName],
        ...updates,
        timestamp: Date.now(),
      };
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を更新:`, updates);
    } catch (error) {
      console.error("[PageState] 状態更新エラー:", error);
    }
  },

  // ページ状態を削除
  clearPageState: (pageName) => {
    try {
      const pageStates = JSON.parse(localStorage.getItem("pageStates") || "{}");
      delete pageStates[pageName];
      localStorage.setItem("pageStates", JSON.stringify(pageStates));
      console.log(`[PageState] ${pageName}の状態を削除`);
    } catch (error) {
      console.error("[PageState] 状態削除エラー:", error);
    }
  },

  // 現在アクティブなページを保存
  setActivePage: (pageName) => {
    try {
      localStorage.setItem("activePage", pageName);
      console.log(`[PageState] アクティブページを設定: ${pageName}`);
    } catch (error) {
      console.error("[PageState] アクティブページ保存エラー:", error);
    }
  },

  // 現在アクティブなページを取得
  getActivePage: () => {
    try {
      return localStorage.getItem("activePage") || null;
    } catch (error) {
      console.error("[PageState] アクティブページ取得エラー:", error);
      return null;
    }
  },
};

// グローバルに公開
window.PageStateManager = PageStateManager;
window.restoreMemoPageState = restoreMemoPageState;
window.restorePromptPageState = restorePromptPageState;
window.restoreClipboardPageState = restoreClipboardPageState;
window.restoreAIPageState = restoreAIPageState;
window.restoreSettingPageState = restoreSettingPageState;

// 各ページの状態復元関数
function restoreMemoPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] MEMOページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderListView === "function") {
          window.renderListView();
        } else if (typeof renderListView === "function") {
          renderListView();
        }
        break;
      case "edit":
        if (savedState.memoId && typeof window.renderInputForm === "function") {
          window.renderInputForm(savedState.memoId);
        } else if (savedState.memoId && typeof renderInputForm === "function") {
          renderInputForm(savedState.memoId);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveNav === "function") {
          window.renderArchiveNav("memo");
        } else if (typeof renderArchiveNav === "function") {
          renderArchiveNav("memo");
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderListView === "function") {
            window.renderListView();
          } else if (typeof renderListView === "function") {
            renderListView();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderListView === "function") {
          window.renderListView();
        } else if (typeof renderListView === "function") {
          renderListView();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderListView === "function") {
      window.renderListView();
    } else if (typeof renderListView === "function") {
      renderListView();
    }
  }
}

function restorePromptPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] PROMPTページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderList === "function") {
          window.renderList();
        } else if (typeof renderList === "function") {
          renderList();
        }
        break;
      case "edit":
        if (
          savedState.promptIndex !== undefined &&
          typeof window.renderEdit === "function"
        ) {
          window.renderEdit(savedState.promptIndex, savedState.isNew);
        } else if (
          savedState.promptIndex !== undefined &&
          typeof renderEdit === "function"
        ) {
          renderEdit(savedState.promptIndex, savedState.isNew);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      case "run":
        if (
          savedState.promptIndex !== undefined &&
          typeof window.renderRun === "function"
        ) {
          window.renderRun(savedState.promptIndex);
        } else if (
          savedState.promptIndex !== undefined &&
          typeof renderRun === "function"
        ) {
          renderRun(savedState.promptIndex);
        } else {
          // 実行画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveView === "function") {
          window.renderArchiveView();
        } else if (typeof renderArchiveView === "function") {
          renderArchiveView();
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderList === "function") {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderList === "function") {
          window.renderList();
        } else if (typeof renderList === "function") {
          renderList();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderList === "function") {
      window.renderList();
    } else if (typeof renderList === "function") {
      renderList();
    }
  }
}

function restoreClipboardPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] CLIPBOARDページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "list":
        if (typeof window.renderClipboardView === "function") {
          window.renderClipboardView();
        } else if (typeof renderClipboardView === "function") {
          renderClipboardView();
        }
        break;
      case "edit":
        if (
          savedState.clipIndex !== undefined &&
          typeof window.renderClipboardEdit === "function"
        ) {
          window.renderClipboardEdit(savedState.clipIndex);
        } else if (
          savedState.clipIndex !== undefined &&
          typeof renderClipboardEdit === "function"
        ) {
          renderClipboardEdit(savedState.clipIndex);
        } else {
          // 編集画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderClipboardView === "function") {
            window.renderClipboardView();
          } else if (typeof renderClipboardView === "function") {
            renderClipboardView();
          }
        }
        break;
      case "archive":
        if (typeof window.renderArchiveNav === "function") {
          window.renderArchiveNav("clip");
        } else if (typeof renderArchiveNav === "function") {
          renderArchiveNav("clip");
        } else {
          // アーカイブ画面の復元に失敗した場合は一覧画面に戻る
          if (typeof window.renderClipboardView === "function") {
            window.renderClipboardView();
          } else if (typeof renderClipboardView === "function") {
            renderClipboardView();
          }
        }
        break;
      default:
        // デフォルトは一覧画面
        if (typeof window.renderClipboardView === "function") {
          window.renderClipboardView();
        } else if (typeof renderClipboardView === "function") {
          renderClipboardView();
        }
    }
  } else {
    // 保存された状態がない場合は一覧画面
    if (typeof window.renderClipboardView === "function") {
      window.renderClipboardView();
    } else if (typeof renderClipboardView === "function") {
      renderClipboardView();
    }
  }
}

function restoreAIPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] AIページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "main":
        if (typeof window.renderAIMain === "function") {
          window.renderAIMain();
        } else if (typeof renderAIMain === "function") {
          renderAIMain();
        }
        break;
      default:
        // デフォルトはメイン画面
        if (typeof window.renderAIMain === "function") {
          window.renderAIMain();
        } else if (typeof renderAIMain === "function") {
          renderAIMain();
        }
    }
  } else {
    // 保存された状態がない場合はメイン画面
    if (typeof window.renderAIMain === "function") {
      window.renderAIMain();
    } else if (typeof renderAIMain === "function") {
      renderAIMain();
    }
  }
}

function restoreSettingPageState(savedState) {
  if (savedState && savedState.mode) {
    console.log("[PageState] 設定ページの状態を復元:", savedState);

    switch (savedState.mode) {
      case "main":
        if (typeof window.renderSettingMain === "function") {
          window.renderSettingMain();
        } else if (typeof renderSettingMain === "function") {
          renderSettingMain();
        }
        break;
      default:
        // デフォルトはメイン画面
        if (typeof window.renderSettingMain === "function") {
          window.renderSettingMain();
        } else if (typeof renderSettingMain === "function") {
          renderSettingMain();
        }
    }
  } else {
    // 保存された状態がない場合はメイン画面
    if (typeof window.renderSettingMain === "function") {
      window.renderSettingMain();
    } else if (typeof renderSettingMain === "function") {
      renderSettingMain();
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("[PageState] DOMContentLoaded - ページ状態管理システム初期化");

  // 現在のページを確認
  const currentPage = window.location.pathname;
  let currentPageName = null;

  if (currentPage.includes("/memo/")) {
    currentPageName = "memo";
  } else if (currentPage.includes("/prompt/")) {
    currentPageName = "prompt";
  } else if (currentPage.includes("/clipboard/")) {
    currentPageName = "clipboard";
  } else if (currentPage.includes("/ai/")) {
    currentPageName = "ai";
  } else if (currentPage.includes("/setting/")) {
    currentPageName = "setting";
  }

  console.log(
    "[PageState] 現在のページ:",
    currentPageName,
    "パス:",
    currentPage
  );

  // アクティブページを確認
  const activePage = PageStateManager.getActivePage();
  console.log("[PageState] 保存されたアクティブページ:", activePage);

  // 現在のページとアクティブページが一致しない場合の処理
  if (activePage !== currentPageName) {
    console.log(
      "[PageState] アクティブページを現在のページに更新:",
      activePage,
      "→",
      currentPageName
    );
    PageStateManager.setActivePage(currentPageName);
  }

  // 現在のページの状態を復元
  if (currentPageName) {
    const savedState = PageStateManager.getPageState(currentPageName);
    console.log("[PageState] 保存された状態:", savedState);

    // 各ページの状態復元関数を呼び出し
    switch (currentPageName) {
      case "memo":
        if (typeof window.restoreMemoPageState === "function") {
          window.restoreMemoPageState(savedState);
        }
        break;
      case "prompt":
        if (typeof window.restorePromptPageState === "function") {
          window.restorePromptPageState(savedState);
        }
        break;
      case "clipboard":
        if (typeof window.restoreClipboardPageState === "function") {
          window.restoreClipboardPageState(savedState);
        }
        break;
      case "ai":
        if (typeof window.restoreAIPageState === "function") {
          window.restoreAIPageState(savedState);
        }
        break;
      case "setting":
        if (typeof window.restoreSettingPageState === "function") {
          window.restoreSettingPageState(savedState);
        }
        break;
    }
  }

  // ヘッダー要素を取得（動的に生成されたボタンにも対応するため）
  const header = document.querySelector("header");

  // Debug: hoverでテキスト表示アニメーションを制御
  if (header) {
    const activeBtn = header.querySelector(".nav-btn.active");
    if (activeBtn) {
      console.log("[NAV DEBUG] active button at load:", activeBtn.id);
    }

    header.querySelectorAll(".nav-btn").forEach((btn) => {
      const textSpan = btn.querySelector(".nav-text");
      if (!textSpan) return;

      btn.addEventListener("mouseenter", () => {
        const state = btn.classList.contains("active") ? "active" : "inactive";
        const textWidth = textSpan.scrollWidth;
        btn.style.setProperty("--nav-text-max", `${textWidth}px`);
        btn.classList.add("show-text");
        console.log("[NAV DEBUG] hover start:", btn.id, state, {
          btnWidth: btn.offsetWidth,
          textWidth,
        });
      });

      btn.addEventListener("mouseleave", () => {
        btn.classList.remove("show-text");
        btn.style.removeProperty("--nav-text-max");
        console.log("[NAV DEBUG] hover end:", btn.id, {
          btnWidth: btn.offsetWidth,
        });
      });

      textSpan.addEventListener("transitionend", (e) => {
        if (e.propertyName === "max-width") {
          console.log("[NAV DEBUG] text shown:", btn.id, {
            finalWidth: textSpan.offsetWidth,
          });
        }
      });
    });
  }

  // PROMPT編集画面から他ページへ遷移する際の未保存チェック
  function confirmPromptNavigation(e, button) {
    const editContent = document.querySelector(".memo-content.edit-mode");
    const promptHeader = document.querySelector(".form-header");
    const inPromptEdit = !!(editContent || promptHeader);

    console.log("[NAV DEBUG] confirmPromptNavigation start", {
      editContent: !!editContent,
      promptHeader: !!promptHeader,
      inPromptEdit,
    });

    // 編集画面でなければ何もしない
    if (!inPromptEdit) {
      return false;
    }

    // 直接現在の編集内容を比較して未保存かどうか判定
    let hasChanges = false;
    try {
      const idx =
        typeof window.getCurrentPromptIndex === "function"
          ? window.getCurrentPromptIndex()
          : -1;
      const prompts = window.prompts || [];
      const base = window.editingOriginalPrompt || prompts[idx] || null;
      const isNew =
        !window.editingOriginalPrompt && (idx === -1 || idx >= prompts.length);
      if (typeof window.checkForUnsavedChanges === "function") {
        hasChanges = window.checkForUnsavedChanges(base, isNew);
      }
      console.log("[NAV DEBUG] unsaved check", {
        idx,
        isNew,
        hasChanges,
      });
    } catch (err) {
      console.error("[NAV DEBUG] failed to check unsaved", err);
    }

    if (!hasChanges) return false; // 変更がなければ処理しない

    e.preventDefault();
    e.stopPropagation();

    const dest = button.getAttribute("href");

    if (window.AppUtils && window.AppUtils.showSaveConfirmDialog) {
      window.AppUtils.showSaveConfirmDialog({
        title: "変更を保存しますか？",
        message:
          "編集内容に変更があります。<br>保存せずに移動すると変更が失われます。",
        onSave: async () => {
          if (window.saveAndGoBack) {
            await window.saveAndGoBack();
          }
          window.location.href = dest;
        },
        onDiscard: () => {
          window.discardAndGoBack && window.discardAndGoBack();
          window.location.href = dest;
        },
      });
    } else {
      const ok = confirm("編集内容に変更があります。保存せずに移動しますか？");
      if (ok) {
        window.discardAndGoBack && window.discardAndGoBack();
        window.location.href = dest;
      }
    }

    return true;
  }

  if (header) {
    // ヘッダー全体でクリックを監視し、ボタンを判定する
    header.addEventListener("click", function (e) {
      const button = e.target.closest(".nav-btn");
      if (!button) return;

      console.log("[NAV CLICK]", button.id, "clicked");
      // PROMPT編集中の場合は未保存チェック
      if (confirmPromptNavigation(e, button)) return;

      // すでにアクティブなページなら何もしない
      if (button.classList.contains("active")) return;

      // ドラッグ中の場合はクリックイベントを無効化
      if (window.isDraggingNavigation) {
        console.log("[Navigation] ドラッグ中のためクリックイベントを無効化");
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // 現在のページへのリンクの場合はページ遷移を防ぐ
      if (button.classList.contains("active")) {
        e.preventDefault();

        // アクティブなボタンがクリックされた場合、一覧画面に戻る
        const currentPage = window.location.pathname;

        if (currentPage.includes("/memo/") && button.id === "btn-memo") {
          // MEMOページでMEMOボタンがクリックされた場合
          // 保存された状態を取得
          const savedState = PageStateManager.getPageState("memo");

          // 編集画面からの遷移時は保存確認を行う
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (
            isEditMode &&
            typeof window.checkForUnsavedMemoChanges === "function"
          ) {
            // 編集中のメモデータを取得
            const memoId = window.getCurrentEditingMemoId
              ? window.getCurrentEditingMemoId()
              : null;

            if (window.memos && memoId !== null) {
              const originalMemo =
                memoId !== undefined
                  ? window.memos.find((m) => m.id === memoId)
                  : null;
              const hasChanges = window.checkForUnsavedMemoChanges(
                originalMemo,
                memoId === undefined
              );

              if (hasChanges) {
                // 変更がある場合は保存確認ダイアログを表示
                if (
                  typeof window.AppUtils?.showSaveConfirmDialog === "function"
                ) {
                  window.AppUtils.showSaveConfirmDialog({
                    title: "変更を保存しますか？",
                    message:
                      "メモ内容に変更があります。<br>保存せずに戻ると変更が失われます。",
                    onSave: async () => {
                      // 保存してから保存された状態に戻る
                      const titleInput = document.querySelector(".title-input");
                      const textInput = document.querySelector(".text-input");
                      const starInput = document.querySelector(".star-input");

                      if (titleInput && textInput && starInput) {
                        const title = titleInput.value.trim() || "無題";
                        const body = textInput.value.trim();
                        const starred = starInput.dataset.starred === "true";

                        if (memoId !== undefined && memoId !== null) {
                          // update existing
                          const idx = window.memos.findIndex(
                            (m) => m.id === memoId
                          );
                          if (idx !== -1) {
                            window.memos[idx] = {
                              id: memoId,
                              title,
                              content: body,
                              starred,
                            };
                            console.log(
                              "[MEMO NAV] 変更を保存して状態を復元しました"
                            );
                          }
                        } else {
                          // add new
                          const newM = {
                            id: Date.now(),
                            title,
                            content: body,
                            starred,
                            archived: false,
                          };
                          window.memos.push(newM);
                          console.log(
                            "[MEMO NAV] 新規メモを保存して状態を復元しました"
                          );
                        }

                        // 保存してから保存された状態に遷移
                        if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "memos",
                            window.memos
                          );
                        } else if (typeof window.saveStorage === "function") {
                          await window.saveStorage("memos", window.memos);
                        }

                        // 保存された状態に遷移
                        restoreMemoPageState(savedState);
                      } else {
                        // 保存された状態に遷移
                        restoreMemoPageState(savedState);
                      }
                    },
                    onDiscard: () => {
                      // 破棄して保存された状態に戻る
                      console.log(
                        "[MEMO NAV] 変更を破棄して状態を復元しました"
                      );
                      restoreMemoPageState(savedState);
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }

          // 変更がない場合は保存された状態に戻る
          restoreMemoPageState(savedState);
        } else if (
          currentPage.includes("/prompt/") &&
          button.id === "btn-prompt"
        ) {
          // PROMPTページでPROMPTボタンがクリックされた場合
          console.log("PROMPTヘッダーアイコンがクリックされました");

          // 編集画面での未保存変更をチェック
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (isEditMode) {
            console.log("[PROMPT] 編集画面での未保存変更をチェック");

            // 現在編集中のプロンプト情報を取得
            const currentIndex = window.getCurrentPromptIndex
              ? window.getCurrentPromptIndex()
              : -1;
            const originalObj =
              currentIndex !== -1 && window.prompts
                ? window.prompts[currentIndex]
                : null;
            const isNew = currentIndex === -1;

            // 未保存変更があるかチェック
            const hasChanges = window.checkForUnsavedChanges
              ? window.checkForUnsavedChanges(originalObj, isNew)
              : false;

            console.log("[PROMPT] 保存確認チェック:", {
              isNew: isNew,
              originalObj: originalObj,
              hasUnsavedChanges: hasChanges,
              AppUtils: !!window.AppUtils,
              showSaveConfirmDialog: !!(
                window.AppUtils && window.AppUtils.showSaveConfirmDialog
              ),
            });

            if (hasChanges) {
              console.log(
                "未保存の変更があります。保存確認ダイアログを表示します。"
              );
              // AppUtilsの保存確認ダイアログを使用
              if (window.AppUtils && window.AppUtils.showSaveConfirmDialog) {
                window.AppUtils.showSaveConfirmDialog({
                  title: "変更を保存しますか？",
                  message:
                    "プロンプト内容に変更があります。<br>保存せずに戻ると変更が失われます。",
                  onSave: async () => {
                    // 保存して戻る
                    console.log("[PROMPT] 変更を保存して一覧画面に遷移");
                    if (window.saveAndGoBack) {
                      await window.saveAndGoBack();
                    } else if (typeof saveAndGoBack === "function") {
                      await saveAndGoBack();
                    }
                  },
                  onDiscard: () => {
                    // 破棄して戻る
                    console.log("[PROMPT] 変更を破棄して一覧画面に遷移");
                    if (window.discardAndGoBack) {
                      window.discardAndGoBack();
                    } else if (typeof discardAndGoBack === "function") {
                      discardAndGoBack();
                    }
                  },
                });
              } else {
                // AppUtilsが利用できない場合は何もせず中断
                return;
              }
              return;
            }
          }

          console.log("現在のページ状態:", {
            currentMode: document
              .querySelector(".memo-content")
              .classList.contains("archive")
              ? "archive"
              : "main",
          });

          // 一覧画面に遷移（MEMO・CLIPBOARDと同じ処理）
          if (window.renderList) {
            window.renderList();
          } else if (typeof renderList === "function") {
            renderList();
          }
        } else if (
          currentPage.includes("/clipboard/") &&
          button.id === "btn-clipboard"
        ) {
          // CLIPBOARDページでCLIPBOARDボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("clipboard");
          restoreClipboardPageState(savedState);
        } else if (currentPage.includes("/ai/") && button.id === "btn-ai") {
          // AIページでAIボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("ai");
          restoreAIPageState(savedState);
        } else if (
          currentPage.includes("/setting/") &&
          button.id === "btn-setting"
        ) {
          // 設定ページで設定ボタンがクリックされた場合
          const savedState = PageStateManager.getPageState("setting");
          restoreSettingPageState(savedState);
        }
      } else {
        // 他のページへの遷移の場合、編集画面からの遷移時は保存確認
        const currentPage = window.location.pathname;

        // PROMPTページの編集画面からの遷移
        if (currentPage.includes("/prompt/")) {
          // PROMPTページの編集画面かチェック（より確実な判定）
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          const hasFormHeader = document.querySelector(".form-header");
          const hasTitleInput = document.querySelector(".title-input");
          const hasFieldWrap = document.querySelector("#field-wrap");

          console.log("[DEBUG] PROMPT編集画面判定:", {
            isEditMode: !!isEditMode,
            hasFormHeader: !!hasFormHeader,
            hasTitleInput: !!hasTitleInput,
            hasFieldWrap: !!hasFieldWrap,
            checkForUnsavedChanges:
              typeof window.checkForUnsavedChanges === "function",
            windowPrompts: !!window.prompts,
            windowPromptsLength: window.prompts ? window.prompts.length : 0,
          });

          // 編集画面の判定条件（edit-modeクラスまたはform-headerの存在で判定）
          if (
            (isEditMode || hasFormHeader) &&
            hasTitleInput &&
            hasFieldWrap &&
            typeof window.checkForUnsavedChanges === "function"
          ) {
            // 編集中のプロンプトデータを取得
            const promptIndex = window.getCurrentPromptIndex
              ? window.getCurrentPromptIndex()
              : -1;

            console.log("[DEBUG] promptIndex:", promptIndex);
            console.log("[DEBUG] window.prompts:", window.prompts);

            // 新規作成または既存編集の判定
            let originalObj = null;
            let isNew = true;

            if (
              promptIndex >= 0 &&
              window.prompts &&
              window.prompts[promptIndex]
            ) {
              // 既存編集の場合
              originalObj = window.prompts[promptIndex];
              isNew = false;
              console.log("[DEBUG] 既存編集モード:", originalObj);
            } else {
              // 新規作成の場合
              console.log("[DEBUG] 新規作成モード");
            }

            const hasChanges = window.checkForUnsavedChanges(
              originalObj,
              isNew
            );

            console.log("[DEBUG] hasChanges:", hasChanges);

            if (hasChanges) {
              e.preventDefault(); // ページ遷移を一時停止
              console.log("[DEBUG] 保存確認ダイアログを表示します");

              // 保存確認ダイアログを表示
              if (
                typeof window.AppUtils?.showSaveConfirmDialog === "function"
              ) {
                window.AppUtils.showSaveConfirmDialog({
                  title: "変更を保存しますか？",
                  message:
                    "プロンプト内容に変更があります。<br>保存せずに移動すると変更が失われます。",
                  onSave: async () => {
                    try {
                      console.log("[NAV] 保存処理を開始します");

                      // プロンプト配列の初期化確認
                      if (!window.prompts) {
                        window.prompts = [];
                      }

                      const titleInput = document.querySelector(".title-input");
                      const wrap = document.querySelector("#field-wrap");

                      if (titleInput && wrap) {
                        let obj;

                        if (isNew) {
                          // 新規作成の場合は新しいオブジェクトを作成
                          obj = {
                            id: Date.now(),
                            title: titleInput.value.trim() || "(無題)",
                            fields: [],
                            archived: false,
                          };
                          window.prompts.push(obj);
                          console.log("[NAV] 新規プロンプトを作成:", obj);
                        } else {
                          // 既存編集の場合
                          obj = window.prompts[promptIndex];
                          if (!obj) {
                            console.error(
                              "[NAV] 既存プロンプトが見つかりません"
                            );
                            window.location.href = button.getAttribute("href");
                            return;
                          }
                          obj.title = titleInput.value.trim() || "(無題)";
                          console.log("[NAV] 既存プロンプトを更新:", obj);
                        }

                        // フィールドデータを更新
                        obj.fields = [...wrap.children].map((w) => ({
                          text:
                            w.querySelector(".prompt-field-textarea")?.value ||
                            "",
                          on:
                            w.querySelector(".field-toggle")?.checked || false,
                        }));

                        // 保存してからページ遷移
                        if (typeof window.save === "function") {
                          await window.save("prompts", window.prompts);
                          console.log("[NAV] window.saveで保存成功");
                        } else if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "prompts",
                            window.prompts
                          );
                          console.log("[NAV] AppUtils.saveStorageで保存成功");
                        } else {
                          // Fallback保存
                          chrome.storage.local.set(
                            { prompts: window.prompts },
                            () => {
                              if (chrome.runtime.lastError) {
                                console.error(
                                  "[NAV] Fallback保存に失敗:",
                                  chrome.runtime.lastError
                                );
                              } else {
                                console.log("[NAV] Fallback保存成功");
                              }
                            }
                          );
                        }

                        console.log("[NAV] 変更を保存してページ遷移しました");
                      } else {
                        console.error("[NAV] 必要な要素が見つかりません");
                      }

                      // フォームヘッダーを削除
                      document.querySelector(".form-header")?.remove();
                      // ページ遷移を実行
                      window.location.href = button.getAttribute("href");
                    } catch (error) {
                      console.error("[NAV] 保存中にエラーが発生:", error);
                      // エラーが発生してもページ遷移は実行
                      document.querySelector(".form-header")?.remove();
                      window.location.href = button.getAttribute("href");
                    }
                  },
                  onDiscard: () => {
                    // 破棄してページ遷移
                    console.log("[NAV] 変更を破棄してページ遷移しました");
                    // フォームヘッダーを削除
                    document.querySelector(".form-header")?.remove();
                    // ページ遷移を実行
                    window.location.href = button.getAttribute("href");
                  },
                });
                return; // ここで処理を終了
              } else {
                // AppUtilsが利用できない場合のFallback処理
                const confirmResult = confirm(
                  "プロンプト内容に変更があります。保存せずに移動しますか？"
                );
                if (confirmResult) {
                  console.log("[NAV] Fallback: 変更を破棄してページ遷移");
                  document.querySelector(".form-header")?.remove();
                  window.location.href = button.getAttribute("href");
                } else {
                  console.log(
                    "[NAV] Fallback: ユーザーがページ遷移をキャンセル"
                  );
                }
                return;
              }
            }
          }
        }

        // MEMOページの編集画面からの遷移
        if (currentPage.includes("/memo/")) {
          const isEditMode = document.querySelector(".memo-content.edit-mode");
          if (
            isEditMode &&
            typeof window.checkForUnsavedMemoChanges === "function"
          ) {
            // 編集中のメモデータを取得
            const memoId = window.getCurrentEditingMemoId
              ? window.getCurrentEditingMemoId()
              : null;

            if (window.memos && memoId !== null) {
              const originalMemo =
                memoId !== undefined
                  ? window.memos.find((m) => m.id === memoId)
                  : null;
              const hasChanges = window.checkForUnsavedMemoChanges(
                originalMemo,
                memoId === undefined
              );

              if (hasChanges) {
                e.preventDefault(); // ページ遷移を一時停止

                // 変更がある場合は保存確認ダイアログを表示
                if (
                  typeof window.AppUtils?.showSaveConfirmDialog === "function"
                ) {
                  window.AppUtils.showSaveConfirmDialog({
                    title: "変更を保存しますか？",
                    message:
                      "メモ内容に変更があります。<br>保存せずに移動すると変更が失われます。",
                    onSave: async () => {
                      // 保存してからページ遷移
                      const titleInput = document.querySelector(".title-input");
                      const textInput = document.querySelector(".text-input");
                      const starInput = document.querySelector(".star-input");

                      if (titleInput && textInput && starInput) {
                        const title = titleInput.value.trim() || "無題";
                        const body = textInput.value.trim();
                        const starred = starInput.dataset.starred === "true";

                        if (memoId !== undefined && memoId !== null) {
                          // update existing
                          const idx = window.memos.findIndex(
                            (m) => m.id === memoId
                          );
                          if (idx !== -1) {
                            window.memos[idx] = {
                              id: memoId,
                              title,
                              content: body,
                              starred,
                            };
                            console.log(
                              "[MEMO NAV] 変更を保存してページ遷移しました"
                            );
                          }
                        } else {
                          // add new
                          const newM = {
                            id: Date.now(),
                            title,
                            content: body,
                            starred,
                            archived: false,
                          };
                          window.memos.push(newM);
                          console.log(
                            "[MEMO NAV] 新規メモを保存してページ遷移しました"
                          );
                        }

                        // 保存してからページ遷移
                        if (
                          typeof window.AppUtils?.saveStorage === "function"
                        ) {
                          await window.AppUtils.saveStorage(
                            "memos",
                            window.memos
                          );
                        } else if (typeof window.saveStorage === "function") {
                          await window.saveStorage("memos", window.memos);
                        }

                        // ページ遷移を実行
                        window.location.href = button.getAttribute("href");
                      } else {
                        // ページ遷移を実行
                        window.location.href = button.getAttribute("href");
                      }
                    },
                    onDiscard: () => {
                      // 破棄してページ遷移
                      console.log(
                        "[MEMO NAV] 変更を破棄してページ遷移しました"
                      );
                      // ページ遷移を実行
                      window.location.href = button.getAttribute("href");
                    },
                  });
                  return; // ここで処理を終了
                }
              }
            }
          }
        }
      }

      // 展開状態のクラスを追加
      button.classList.add("expanded");

      // data-click-tooltip属性がある場合（AI専用メッセージ）
      if (button.hasAttribute("data-click-tooltip")) {
        button.classList.add("clicked");
      }

      // 2秒後にクラスを削除
      setTimeout(() => {
        button.classList.remove("expanded");
        button.classList.remove("clicked");
      }, 2000);
    });
  }
});

// ━━━━━━━━━━ ヘッダーナビゲーションのドラッグ＆ドロップ機能 ━━━━━━━━━━

// ドラッグ状態を追跡するグローバル変数
window.isDraggingNavigation = false;
window.isDragDropInProgress = false; // ドラッグ&ドロップ進行中フラグ

// ナビゲーション順序の管理
const NavigationOrderManager = {
  // デフォルト順序
  defaultOrder: [
    "btn-memo-list",
    "btn-clipboard",
    "btn-prompt",
    "btn-iframe",
    "btn-status",
    "btn-setting",
  ],

  // 保存された順序を取得
  getSavedOrder: () => {
    try {
      const saved = localStorage.getItem("navOrder");
      return saved ? JSON.parse(saved) : NavigationOrderManager.defaultOrder;
    } catch (error) {
      console.error("[NavigationOrder] 順序取得エラー:", error);
      return NavigationOrderManager.defaultOrder;
    }
  },

  // 順序を保存
  saveOrder: (order) => {
    try {
      localStorage.setItem("navOrder", JSON.stringify(order));
      console.log("[NavigationOrder] 順序を保存:", order);
    } catch (error) {
      console.error("[NavigationOrder] 順序保存エラー:", error);
    }
  },

  // ヘッダーを再構築
  rebuildHeader: () => {
    const header = document.querySelector("header");
    if (!header) {
      console.log("[NavigationOrder] ヘッダー要素が見つかりません");
      return;
    }

    const savedOrder = NavigationOrderManager.getSavedOrder();
    const currentButtons = Array.from(header.children);

    console.log("[NavigationOrder] 保存された順序:", savedOrder);
    console.log(
      "[NavigationOrder] 現在のボタン:",
      currentButtons.map((btn) => btn.id)
    );

    // 保存された順序で並び替え
    savedOrder.forEach((btnId) => {
      const button = currentButtons.find((btn) => btn.id === btnId);
      if (button) {
        header.appendChild(button);
      }
    });

    // CSSのorderプロパティを完全に無効化してDOM順序のみで制御
    savedOrder.forEach((btnId, index) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.style.order = "";
      }
    });

    console.log("[NavigationOrder] ヘッダー再構築完了");
  },
};

// ドラッグ＆ドロップ機能の初期化 - 無効化されています
function initializeHeaderDragAndDrop() {
  console.log("[DragDrop] ヘッダーのドラッグ&ドロップ機能は無効化されています");
  return; // 機能を無効化

  const header = document.querySelector("header");
  if (!header) {
    console.log("[DragDrop] ヘッダー要素が見つかりません");
    return;
  }

  console.log("[DragDrop] ヘッダードラッグ＆ドロップ機能を初期化中...");

  // 各ナビゲーションボタンにドラッグ機能を追加
  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(
    "[DragDrop] 見つかったナビゲーションボタン数:",
    navButtons.length
  );

  navButtons.forEach((button, index) => {
    console.log(`[DragDrop] ボタン${index + 1}:`, button.id, button);

    // 長押し検出用の変数
    let holdTimer = null;
    let isHolding = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;

    // 初期状態ではドラッグ不可
    button.draggable = false;
    button.dataset.index = index;

    // デバッグ用のクラスを追加
    button.classList.add("drag-enabled");

    // マウスダウン（長押し開始）
    button.addEventListener("mousedown", (e) => {
      console.log(
        "[DragDrop] mousedown イベント発火:",
        button.id,
        "button:",
        e.button
      );

      if (e.button === 0) {
        // 左クリックのみ
        console.log("[DragDrop] 左クリック検出:", button.id);

        // ❌ボタンがクリックされた場合の処理（無効化）
        if (isCloseButtonClick(e, button)) {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            "[RemoveIcon] ❌ボタンがクリックされましたが、機能は無効化されています:",
            button.id
          );
          return;
        }

        startX = e.clientX;
        startY = e.clientY;
        hasMoved = false;

        // 長押しタイマー開始（200ms）
        holdTimer = setTimeout(() => {
          console.log("[DragDrop] 長押し検出:", button.id);
          isHolding = true;
          button.draggable = true;
          button.classList.add("holding");

          // 視覚的フィードバック
          button.style.transform = "scale(0.95)";
          button.style.opacity = "0.8";

          console.log(
            "[DragDrop] ドラッグ可能状態に変更:",
            button.id,
            "draggable:",
            button.draggable
          );
        }, 200);
      }
    });

    // マウス移動（ドラッグ開始判定）
    button.addEventListener("mousemove", (e) => {
      if (holdTimer && !isHolding) {
        const moveX = Math.abs(e.clientX - startX);
        const moveY = Math.abs(e.clientY - startY);

        // 3px以上移動したら長押しをキャンセル
        if (moveX > 3 || moveY > 3) {
          console.log("[DragDrop] 移動検出、長押しキャンセル:", button.id);
          clearTimeout(holdTimer);
          holdTimer = null;
          hasMoved = true;
        }
      }
    });

    // マウスアップ（長押し終了）
    button.addEventListener("mouseup", (e) => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      if (isHolding) {
        console.log("[DragDrop] 長押し終了:", button.id);
        isHolding = false;
        button.draggable = false;
        button.classList.remove("holding");

        // 視覚的フィードバックをリセット
        button.style.transform = "";
        button.style.opacity = "";
      }
    });

    // マウスリーブ（長押しキャンセル）
    button.addEventListener("mouseleave", () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      if (isHolding) {
        isHolding = false;
        button.draggable = false;
        button.classList.remove("holding");
        button.style.transform = "";
        button.style.opacity = "";
      }
    });

    // クリックイベントとの競合を避ける（A要素以外）
    if (button.tagName !== "A") {
      button.addEventListener("click", (e) => {
        if (isHolding || hasMoved) {
          e.preventDefault();
          e.stopPropagation();
          console.log("[DragDrop] 長押し中のクリックを無効化:", button.id);
          return false;
        }
      });
    }

    // リンク要素のデフォルト動作を制御
    if (button.tagName === "A") {
      // リンクのデフォルトドラッグ動作を無効化
      button.addEventListener("dragstart", (e) => {
        if (!button.draggable) {
          e.preventDefault();
          console.log(
            "[DragDrop] リンクのデフォルトドラッグを無効化:",
            button.id
          );
        } else {
          console.log("[DragDrop] カスタムドラッグを許可:", button.id);
        }
      });

      // リンクのクリック動作を条件付きで無効化
      button.addEventListener("click", (e) => {
        if (isHolding || hasMoved) {
          e.preventDefault();
          e.stopPropagation();
          console.log(
            "[DragDrop] ドラッグ操作中のクリックを無効化:",
            button.id
          );
          return false;
        }
      });
    }

    // ドラッグ開始
    button.addEventListener("dragstart", (e) => {
      console.log("[DragDrop] dragstart イベント発火:", button.id);
      console.log("[DragDrop] draggable状態:", button.draggable);
      console.log("[DragDrop] isHolding:", isHolding);

      if (!button.draggable) {
        console.log(
          "[DragDrop] ドラッグ不可状態のため処理をスキップ:",
          button.id
        );
        e.preventDefault();
        return;
      }

      // ドラッグ&ドロップ進行中フラグを設定
      window.isDragDropInProgress = true;
      console.log("[DragDrop] ドラッグ&ドロップ進行中フラグを設定");

      e.dataTransfer.setData("text/plain", button.id);
      e.dataTransfer.effectAllowed = "move";
      button.classList.add("dragging");
      button.classList.remove("holding");

      console.log("[DragDrop] ドラッグ開始処理完了:", button.id);
    });

    // ドラッグ終了
    button.addEventListener("dragend", () => {
      console.log("[DragDrop] dragend:", button.id);
      button.classList.remove("dragging");
      button.draggable = false; // ドラッグを無効化

      // 視覚的フィードバックをリセット
      button.style.transform = "";
      button.style.opacity = "";

      // すべてのボタンのドラッグ関連状態をクリア（activeは除く）
      const allButtons = document.querySelectorAll("header .nav-btn");
      allButtons.forEach((btn) => {
        btn.classList.remove(
          "drag-over",
          "drop-indicator",
          "drop-above",
          "drop-below"
        );
        // 間隔をリセット
        btn.style.marginLeft = "0";
        btn.style.marginRight = "0";
        btn.style.marginTop = "0";
        btn.style.marginBottom = "0";
      });

      // ドラッグ&ドロップ進行中フラグをリセット
      window.isDragDropInProgress = false;
      console.log("[DragDrop] ドラッグ&ドロップ進行中フラグをリセット");

      // アクティブ状態を復元
      restoreActiveIconState();
    });

    // ドラッグオーバー
    button.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // ドラッグ中のボタン自身にはドロップオーバー効果を適用しない
      if (!button.classList.contains("dragging")) {
        // 他の要素のドロップインジケーターをクリア（activeは除く）
        const allButtons = document.querySelectorAll("header .nav-btn");
        allButtons.forEach((btn) => {
          btn.classList.remove(
            "drop-indicator",
            "drop-above",
            "drop-below",
            "drag-over"
          );
        });

        // マウスの位置に基づいてドロップ位置を判定
        const rect = button.getBoundingClientRect();
        const mouseY = e.clientY;
        const buttonCenter = rect.top + rect.height / 2;

        // ドロップ位置のインジケーターを表示
        button.classList.add("drop-indicator", "active", "drag-over");

        if (mouseY < buttonCenter) {
          // マウスが要素の上半分にある場合、要素の上に挿入
          button.classList.add("drop-above");
          console.log("[DragDrop] ドロップ位置: 上に挿入");

          // 前のアイコンとの間隔を調整
          const prevButton = button.previousElementSibling;
          if (prevButton && prevButton.classList.contains("nav-btn")) {
            prevButton.style.marginRight = "16px";
          }
        } else {
          // マウスが要素の下半分にある場合、要素の下に挿入
          button.classList.add("drop-below");
          console.log("[DragDrop] ドロップ位置: 下に挿入");

          // 次のアイコンとの間隔を調整
          const nextButton = button.nextElementSibling;
          if (nextButton && nextButton.classList.contains("nav-btn")) {
            nextButton.style.marginLeft = "16px";
          }
        }
      }
    });

    // ドラッグリーブ
    button.addEventListener("dragleave", (e) => {
      // 子要素にドラッグが入った場合はリーブしない
      if (e.relatedTarget && button.contains(e.relatedTarget)) {
        return;
      }
      button.classList.remove(
        "drop-indicator",
        "drop-above",
        "drop-below",
        "drag-over"
      );

      // 間隔を元に戻す
      setTimeout(() => {
        if (!button.classList.contains("drop-indicator")) {
          button.style.marginLeft = "0";
          button.style.marginRight = "0";
          button.style.marginTop = "0";
          button.style.marginBottom = "0";

          // 隣接するアイコンの間隔もリセット
          const prevButton = button.previousElementSibling;
          const nextButton = button.nextElementSibling;

          if (prevButton && prevButton.classList.contains("nav-btn")) {
            prevButton.style.marginRight = "0";
          }
          if (nextButton && nextButton.classList.contains("nav-btn")) {
            nextButton.style.marginLeft = "0";
          }
        }
      }, 300);
    });

    // ドロップ
    button.addEventListener("drop", (e) => {
      console.log("[DragDrop] drop:", button.id);
      e.preventDefault();

      // すべてのドロップインジケーターをクリア
      const allButtons = document.querySelectorAll("header .nav-btn");
      allButtons.forEach((btn) => {
        btn.classList.remove(
          "drop-indicator",
          "drop-above",
          "drop-below",
          "drag-over"
        );
        // 間隔をリセット
        btn.style.marginLeft = "0";
        btn.style.marginRight = "0";
        btn.style.marginTop = "0";
        btn.style.marginBottom = "0";
      });

      const draggedId = e.dataTransfer.getData("text/plain");
      const draggedButton = document.getElementById(draggedId);

      console.log(
        "[DragDrop] ドラッグされた要素:",
        draggedId,
        "存在:",
        !!draggedButton
      );

      if (draggedButton && draggedButton !== button) {
        // ドロップ位置を判定
        const rect = button.getBoundingClientRect();
        const mouseY = e.clientY;
        const buttonCenter = rect.top + rect.height / 2;
        const dropAbove = mouseY < buttonCenter;

        // 実際のDOM要素の位置を変更
        const header = document.querySelector("header");
        console.log(
          "[DragDrop] 移動前のヘッダー内要素:",
          Array.from(header.children).map((btn) => btn.id)
        );

        if (dropAbove) {
          // 要素の上に挿入
          draggedButton.remove();
          header.insertBefore(draggedButton, button);
          console.log("[DragDrop] 要素の上に挿入:", draggedId, "→", button.id);
        } else {
          // 要素の下に挿入
          const nextButton = button.nextElementSibling;
          draggedButton.remove();
          if (nextButton) {
            header.insertBefore(draggedButton, nextButton);
          } else {
            header.appendChild(draggedButton);
          }
          console.log("[DragDrop] 要素の下に挿入:", draggedId, "→", button.id);
        }

        console.log(
          "[DragDrop] 移動後のヘッダー内要素:",
          Array.from(header.children).map((btn) => btn.id)
        );

        // 新しい順序を取得して保存
        const newOrder = Array.from(header.children).map((btn) => btn.id);
        NavigationOrderManager.saveOrder(newOrder);

        console.log("[DragDrop] 移動後のDOM順序:", newOrder);

        // ドラッグ&ドロップ完了（トーストメッセージは不要）
        console.log("[DragDrop] 移動完了:", draggedId, "→", button.id);

        // ドラッグ&ドロップフラグをリセット
        window.isDragDropInProgress = false;
        console.log("[DragDrop] ドラッグ&ドロップフラグをリセット");

        // 現在のページに対応するアイコンのactive状態のみを復元（アイコン表示制御は行わない）
        restoreActiveIconState();
      } else {
        console.log("[DragDrop] 無効なドロップ操作:", draggedId);
        window.isDragDropInProgress = false;
      }
    });
  });

  console.log("[DragDrop] ヘッダードラッグ＆ドロップ機能の初期化完了");
}

// ❌ボタンがクリックされたかどうかを判定
function isCloseButtonClick(e, button) {
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // ❌ボタンの位置（右上角から8px内側、18x18pxの円形エリア）
  const closeButtonX = rect.width - 8;
  const closeButtonY = 8;
  const closeButtonRadius = 9; // 18px / 2

  // クリック位置が❌ボタンの範囲内かどうかを判定
  const distance = Math.sqrt(
    Math.pow(x - closeButtonX, 2) + Math.pow(y - closeButtonY, 2)
  );

  return distance <= closeButtonRadius;
}

// 現在のページに対応するアイコンのactive状態を復元（アイコン表示制御は行わない）
function restoreActiveIconState() {
  console.log("[ActiveIcon] アクティブアイコン状態を復元開始");

  // ドラッグ&ドロップ進行中は適用しない
  if (window.isDragDropInProgress) {
    console.log(
      "[ActiveIcon] ドラッグ&ドロップ進行中のため、アクティブ状態復元をスキップ"
    );
    return;
  }

  // 現在のページを確認
  const currentPage = window.location.pathname;
  let currentPageName = null;
  let activeButtonId = null;

  if (currentPage.includes("/memo/")) {
    currentPageName = "memo";
    activeButtonId = "btn-memo-list";
  } else if (currentPage.includes("/prompt/")) {
    currentPageName = "prompt";
    activeButtonId = "btn-prompt";
  } else if (currentPage.includes("/clipboard/")) {
    currentPageName = "clipboard";
    activeButtonId = "btn-clipboard";
  } else if (currentPage.includes("/iframe/")) {
    currentPageName = "iframe";
    activeButtonId = "btn-iframe";
  } else if (currentPage.includes("/ai/")) {
    currentPageName = "ai";
    activeButtonId = "btn-ai";
  } else if (currentPage.includes("/status/")) {
    currentPageName = "status";
    activeButtonId = "btn-status";
  } else if (currentPage.includes("/setting/")) {
    currentPageName = "setting";
    activeButtonId = "btn-setting";
  }

  console.log(
    "[ActiveIcon] 現在のページ:",
    currentPageName,
    "アクティブボタン:",
    activeButtonId
  );

  if (activeButtonId) {
    // すべてのアイコンからactiveクラスを削除
    const header = document.querySelector("header");
    if (header) {
      const navButtons = header.querySelectorAll(".nav-btn");
      navButtons.forEach((button) => {
        button.classList.remove("active");
      });

      // 現在のページに対応するアイコンにactiveクラスを追加
      const activeButton = document.getElementById(activeButtonId);
      if (activeButton) {
        activeButton.classList.add("active");
        console.log("[ActiveIcon] アクティブ状態を復元:", activeButtonId);
      } else {
        console.log(
          "[ActiveIcon] アクティブボタンが見つかりません:",
          activeButtonId
        );
      }
    }
  }
}

// ヘッダーからアイコンを削除
function removeIconFromHeader(buttonId) {
  console.log("[RemoveIcon] アイコンを削除:", buttonId);

  // MEMOとSETTINGアイコンは削除不可
  if (buttonId === "btn-setting" || buttonId === "btn-memo-list") {
    console.log(
      "[RemoveIcon] MEMOとSETTINGアイコンは削除できません:",
      buttonId
    );
    return;
  }

  // 現在の設定を取得
  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings || {
      selectedIcons: ["memo", "clipboard", "prompt", "iframe", "ai", "status"],
    };

    // アイコンタイプを取得
    const iconType = getIconTypeFromId(buttonId);

    // 選択されたアイコンから削除
    settings.selectedIcons = settings.selectedIcons.filter(
      (icon) => icon !== iconType
    );

    // 最低1つのアイコンは残す
    if (settings.selectedIcons.length === 0) {
      settings.selectedIcons = ["memo"]; // デフォルトでメモを残す
    }

    // 設定を保存
    chrome.storage.local.set({ customSettings: settings }, () => {
      console.log("[RemoveIcon] 設定を保存:", settings);

      // ヘッダーを更新
      applyIconVisibility(settings.selectedIcons);

      // 現在のページに対応するアイコンのactive状態を復元
      restoreActiveIconState();

      // 設定ページが開いている場合は、そちらも更新
      if (window.location.pathname.includes("/setting/")) {
        // 設定ページでアイコン選択状態を更新
        if (window.updateIconSelection) {
          window.updateIconSelection(settings.selectedIcons);
        }
      }
    });
  });
}

// 削除済み: ナビゲーションドラッグ＆ドロップ成功メッセージ
// UI/UXの改善のため、トーストメッセージを削除しました

// ボタンIDから表示名を取得
function getButtonDisplayName(buttonId) {
  const nameMap = {
    "btn-memo-list": "MEMO",
    "btn-clipboard": "CLIPBOARD",
    "btn-prompt": "PROMPT",
    "btn-iframe": "IFRAME",
    "btn-ai": "AI",
    "btn-qrcode": "QR CODE",
    "btn-status": "STATUS",
    "btn-setting": "SETTING",
  };
  return nameMap[buttonId] || buttonId;
}

// ページ読み込み時にナビゲーション機能を初期化
document.addEventListener("DOMContentLoaded", () => {
  console.log("[NavigationOrder] DOMContentLoaded - ナビゲーション機能初期化");

  // デバッグ情報を出力
  console.log("[DEBUG] DOM要素の状態:");
  console.log("- header:", document.querySelector("header"));
  console.log("- nav-btn count:", document.querySelectorAll(".nav-btn").length);
  console.log("- nav-btn elements:", document.querySelectorAll(".nav-btn"));

  // 少し遅延してから初期化（他のスクリプトの読み込みを待つ）
  setTimeout(() => {
    console.log("[DEBUG] 初期化開始");

    // 保存された順序でヘッダーを再構築 - 無効化（アイコン順序を固定）
    // NavigationOrderManager.rebuildHeader();
    console.log(
      "[DEBUG] ヘッダーの順序変更は無効化されています（アイコン順序を固定）"
    );

    // ドラッグ＆ドロップ機能を初期化 - 無効化
    // initializeHeaderDragAndDrop();
    console.log("[DEBUG] ヘッダーのドラッグ&ドロップ機能は無効化されています");

    // 初期化後の状態を確認
    console.log("[DEBUG] 初期化後の状態:");
    const buttons = document.querySelectorAll("header .nav-btn");
    buttons.forEach((btn, index) => {
      console.log(`[DEBUG] Button ${index}:`, {
        id: btn.id,
        draggable: btn.draggable,
        hasMousedownListener: btn.onmousedown !== null,
        className: btn.className,
      });
    });
  }, 100);
});

// ページ読み込み完了後にも初期化を試行
window.addEventListener("load", () => {
  console.log(
    "[NavigationOrder] load - ナビゲーション機能初期化（フォールバック）"
  );

  // まだ初期化されていない場合のみ実行
  if (!document.querySelector("header .nav-btn[draggable]")) {
    console.log("[DEBUG] フォールバック初期化実行");
    setTimeout(() => {
      // NavigationOrderManager.rebuildHeader(); // 無効化
      console.log(
        "[DEBUG] ヘッダーの順序変更は無効化されています（フォールバック）"
      );
      // initializeHeaderDragAndDrop(); // 無効化
      console.log(
        "[DEBUG] ヘッダーのドラッグ&ドロップ機能は無効化されています（フォールバック）"
      );
    }, 50);
  } else {
    console.log("[DEBUG] 既に初期化済み");
  }
});

// グローバルに公開
window.NavigationOrderManager = NavigationOrderManager;
window.initializeHeaderDragAndDrop = initializeHeaderDragAndDrop;
window.restoreActiveIconState = restoreActiveIconState;

// デバッグ用のテスト関数
window.testNavigationDragDrop = () => {
  console.log("[TEST] ナビゲーションドラッグ＆ドロップテスト開始");
  console.log("[TEST] ヘッダー要素:", document.querySelector("header"));
  console.log(
    "[TEST] ナビゲーションボタン:",
    document.querySelectorAll("header .nav-btn")
  );
  console.log(
    "[TEST] ドラッグ可能なボタン:",
    document.querySelectorAll("header .nav-btn[draggable]")
  );
  console.log("[TEST] 保存された順序:", NavigationOrderManager.getSavedOrder());

  // 各ボタンの詳細情報を表示
  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    console.log(`[TEST] ボタン${index + 1}:`, {
      id: btn.id,
      draggable: btn.draggable,
      className: btn.className,
      textContent: btn.textContent.trim(),
      href: btn.href,
      cursor: btn.style.cursor,
      isDragging: btn.classList.contains("dragging"),
      isHolding: btn.classList.contains("holding"),
    });
  });
};

// ドラッグ状態を強制的にリセットする関数
window.resetDragState = () => {
  console.log("[TEST] ドラッグ状態をリセット");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn) => {
    btn.draggable = false; // 初期状態ではドラッグ不可
    btn.classList.remove("dragging", "drag-over", "holding");
    btn.style.cursor = "";
    btn.style.transform = "";
    btn.style.opacity = "";
  });

  console.log("[TEST] ドラッグ状態リセット完了");
};

// ドラッグテスト関数
window.testDrag = () => {
  console.log("[TEST] ドラッグテスト開始");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    console.log(`[TEST] ボタン${index + 1}:`, {
      id: btn.id,
      tagName: btn.tagName,
      draggable: btn.draggable,
      href: btn.href,
      className: btn.className,
      style: {
        cursor: btn.style.cursor,
        userDrag: btn.style.webkitUserDrag || btn.style.userDrag,
      },
    });
  });

  // 最初のボタンでドラッグテスト
  if (buttons.length > 0) {
    const firstButton = buttons[0];
    console.log("[TEST] 最初のボタンでドラッグテスト:", firstButton.id);

    // 手動でドラッグ開始イベントを発火
    const dragStartEvent = new DragEvent("dragstart", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    });

    firstButton.dispatchEvent(dragStartEvent);
  }
};

// 手動でDOM操作をテストする関数
window.testDOMManipulation = () => {
  console.log("[TEST] DOM操作テスト開始");

  const header = document.querySelector("header");
  const buttons = Array.from(header.children);

  if (buttons.length >= 2) {
    const firstButton = buttons[0];
    const secondButton = buttons[1];

    console.log(
      "[TEST] 移動前:",
      buttons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 移動前のorder値:",
      buttons.map((btn) => btn.style.order)
    );

    // 最初のボタンを最後に移動
    firstButton.remove();
    header.appendChild(firstButton);

    const newButtons = Array.from(header.children);
    console.log(
      "[TEST] 移動後:",
      newButtons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 移動後のorder値:",
      newButtons.map((btn) => btn.style.order)
    );

    // 元に戻す
    firstButton.remove();
    header.insertBefore(firstButton, secondButton);

    const finalButtons = Array.from(header.children);
    console.log(
      "[TEST] 元に戻した後:",
      finalButtons.map((btn) => btn.id)
    );
    console.log(
      "[TEST] 元に戻した後のorder値:",
      finalButtons.map((btn) => btn.style.order)
    );
  }
};

// CSSのorderプロパティを確認する関数
window.checkOrderProperties = () => {
  console.log("[TEST] CSS orderプロパティ確認");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    const computedStyle = window.getComputedStyle(btn);
    console.log(`[TEST] ${btn.id}:`, {
      computedOrder: computedStyle.order,
      inlineOrder: btn.style.order,
      index: index,
      parent: btn.parentElement?.tagName,
      nextSibling: btn.nextElementSibling?.id,
      previousSibling: btn.previousElementSibling?.id,
    });
  });
};

// 強制的にorderプロパティをリセットする関数
window.resetOrderProperties = () => {
  console.log("[TEST] orderプロパティをリセット");

  const buttons = document.querySelectorAll("header .nav-btn");
  buttons.forEach((btn, index) => {
    btn.style.order = "";
    console.log(`[TEST] ${btn.id}のorderをリセット`);
  });

  // デフォルト順序で再設定
  const defaultOrder = [
    "btn-memo-list",
    "btn-clipboard",
    "btn-prompt",
    "btn-iframe",
    "btn-ai",
    "btn-status",
    "btn-setting",
  ];

  defaultOrder.forEach((btnId, index) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.style.order = index + 1;
      console.log(`[TEST] ${btnId}のorderを${index + 1}に設定`);
    }
  });
};

// 手動でドラッグ＆ドロップ機能を再初期化する関数 - 無効化
window.reinitializeDragDrop = () => {
  console.log("[TEST] ドラッグ＆ドロップ機能は無効化されています");
  // initializeHeaderDragAndDrop(); // 無効化
};

// 手動でボタンの順序を変更するテスト関数
window.testManualReorder = () => {
  console.log("[TEST] 手動でボタン順序を変更");

  const header = document.querySelector("header");
  const buttons = Array.from(header.children);

  if (buttons.length >= 2) {
    const firstButton = buttons[0];
    const lastButton = buttons[buttons.length - 1];

    console.log(
      "[TEST] 変更前:",
      buttons.map((btn) => btn.id)
    );

    // 最初のボタンを最後に移動
    firstButton.remove();
    header.appendChild(firstButton);

    // ヘッダーのdisplayを一時的に変更
    header.style.display = "block";
    setTimeout(() => {
      header.style.display = "flex";
      console.log(
        "[TEST] 変更後:",
        Array.from(header.children).map((btn) => btn.id)
      );
    }, 100);
  }
};

// 手動でテストできる関数を追加
window.testDragDropSetup = () => {
  console.log("[TEST] ドラッグ&ドロップセットアップテスト");

  const header = document.querySelector("header");
  const buttons = document.querySelectorAll("header .nav-btn");

  console.log("Header:", header);
  console.log("Buttons count:", buttons.length);

  buttons.forEach((btn, index) => {
    console.log(`Button ${index}:`, {
      id: btn.id,
      tagName: btn.tagName,
      draggable: btn.draggable,
      className: btn.className,
      href: btn.href,
      addEventListener: typeof btn.addEventListener === "function",
    });
  });

  // 手動でイベントリスナーをテスト
  if (buttons.length > 0) {
    const testBtn = buttons[0];
    console.log("Testing first button:", testBtn.id);

    // マウスダウンイベントを手動で発火
    const mouseDownEvent = new MouseEvent("mousedown", {
      button: 0,
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    });

    testBtn.dispatchEvent(mouseDownEvent);

    // 200ms後にマウスアップ
    setTimeout(() => {
      const mouseUpEvent = new MouseEvent("mouseup", {
        button: 0,
        bubbles: true,
        cancelable: true,
      });
      testBtn.dispatchEvent(mouseUpEvent);
    }, 250);
  }
};

console.log("[NavigationOrder] ナビゲーション機能が読み込まれました");
console.log("[NavigationOrder] テスト用コマンド:");
console.log("  - window.testNavigationDragDrop() - 基本情報確認");
console.log("  - window.resetDragState() - ドラッグ状態リセット");
console.log("  - window.testDrag() - ドラッグテスト");
console.log("  - window.testDOMManipulation() - DOM操作テスト");
console.log("  - window.checkOrderProperties() - CSS order確認");
console.log("  - window.resetOrderProperties() - orderプロパティリセット");
console.log("  - window.testManualReorder() - 手動順序変更テスト");
console.log("  - window.reinitializeDragDrop() - 機能再初期化");

// ページ読み込み時にアイコン表示設定を適用（初回のみ）
let iconVisibilityApplied = false;
let domContentLoadedHandled = false;

document.addEventListener("DOMContentLoaded", () => {
  if (!domContentLoadedHandled) {
    console.log("COMMON: DOMContentLoaded - アイコン表示設定を適用（初回）");
    domContentLoadedHandled = true;

    // 少し遅延してから適用（他のスクリプトの読み込みを待つ）
    setTimeout(() => {
      if (!iconVisibilityApplied) {
        console.log("COMMON: 遅延実行 - アイコン表示設定を適用");

        // すべてのページで今後実装予定のアイコンを非表示にする
        hideComingSoonIcons();

        // すべてのページで保存された設定を読み込んで適用
        loadAndApplyIconSettings();

        iconVisibilityApplied = true;
      }
    }, 100);

    // さらに遅延して確実に適用
    setTimeout(() => {
      console.log("COMMON: 追加遅延実行 - アイコン表示設定を再適用");
      loadAndApplyIconSettings();
    }, 500);
  }
});

// 保存された設定を読み込んで適用する関数
function loadAndApplyIconSettings() {
  console.log("COMMON: loadAndApplyIconSettings 開始");

  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings;
    console.log("COMMON: ストレージから取得した設定:", settings);

    if (settings && settings.selectedIcons) {
      console.log("COMMON: 保存された設定を適用:", settings.selectedIcons);
      applyIconVisibilityFromSettings(settings.selectedIcons);
    } else {
      console.log("COMMON: 設定が見つからないため、デフォルト設定を適用");
      applyDefaultIconSettings();
    }
  });
}

// 設定からアイコン表示を適用する関数
function applyIconVisibilityFromSettings(selectedIcons) {
  // ドラッグ&ドロップ進行中は適用しない
  if (window.isDragDropInProgress) {
    console.log(
      "COMMON: ドラッグ&ドロップ進行中のため、アイコン表示設定をスキップ"
    );
    return;
  }

  console.log(
    "COMMON: applyIconVisibilityFromSettings 呼び出し - 選択アイコン:",
    selectedIcons
  );

  // 設定ページ以外では、選択されたアイコンのみを表示
  const isSettingPage = window.location.pathname.includes("/setting/");
  if (!isSettingPage) {
    applyIconVisibilityToHeader(selectedIcons);
  } else {
    // 設定ページでは従来の処理
    applyIconVisibility(selectedIcons);
  }
}

// デフォルト設定を適用する関数
function applyDefaultIconSettings() {
  console.log("COMMON: デフォルト設定を適用");

  const defaultIcons = [
    "memo",
    "clipboard",
    "prompt",
    "iframe",
    "status",
    "setting",
  ];
  applyIconVisibilityFromSettings(defaultIcons);
}

// ヘッダーにアイコン表示を適用する関数（表示/非表示のみ、順序は固定）
function applyIconVisibilityToHeader(selectedIcons) {
  console.log("COMMON: ヘッダーにアイコン表示を適用:", selectedIcons);

  const header = document.querySelector("header");
  if (!header) {
    console.log("COMMON: ヘッダーが見つかりません");
    return;
  }

  // 一時的にヘッダーを非表示にしてトランジションを抑制
  header.classList.add("updating");
  console.log("COMMON: ヘッダー更新モード開始");

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log("COMMON: ヘッダー内のボタン数:", navButtons.length);

  // 各ボタンの表示/非表示を制御（DOM順序は変更しない）
  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    let shouldHide = false;

    if (iconType === "ai" || iconType === "todolist" || iconType === "qrcode") {
      shouldHide = true;
      console.log(`COMMON: ${buttonId} (${iconType}): 非表示 (今後実装予定)`);
    } else if (iconType === "setting" || iconType === "memo") {
      // 常に表示
      console.log(
        `COMMON: ${buttonId} (${iconType}): 表示 (MEMO/SETTINGアイコン)`
      );
    } else if (!selectedIcons.includes(iconType)) {
      shouldHide = true;
      console.log(`COMMON: ${buttonId} (${iconType}): 非表示 (未選択)`);
    } else {
      console.log(`COMMON: ${buttonId} (${iconType}): 表示 (選択済み)`);
    }

    if (shouldHide) {
      button.classList.add("hidden-icon");
    } else {
      button.classList.remove("hidden-icon");
    }
  });

  console.log("COMMON: アイコン表示/非表示制御完了");

  // 現在のページに対応するアイコンのactive状態を復元
  restoreActiveIconState();

  // ヘッダー更新モード終了を次のフレームで実行し、描画タイミングを調整
  requestAnimationFrame(() => {
    header.classList.remove("updating");
    console.log("COMMON: ヘッダー更新モード終了");
  });
}

// 表示されているアイコンを左寄せにする関数
function alignVisibleIconsToLeft() {
  console.log("COMMON: アイコンを左寄せにします");

  const header = document.querySelector("header");
  if (!header) {
    console.log("COMMON: ヘッダーが見つかりません");
    return;
  }

  const visibleButtons = header.querySelectorAll(".nav-btn:not(.hidden-icon)");
  console.log("COMMON: 表示されているアイコン数:", visibleButtons.length);

  // 表示されているアイコンのみを左寄せに配置
  visibleButtons.forEach((button, index) => {
    if (index === 0) {
      button.style.marginLeft = "0";
    }
  });
}

// ストレージからアイコン表示設定を適用（設定ページ専用）
function applyIconVisibilityFromStorage() {
  console.log("COMMON: applyIconVisibilityFromStorage 開始");

  // 設定ページ以外ではアイコン表示制御を行わない
  const isSettingPage = window.location.pathname.includes("/setting/");
  if (!isSettingPage) {
    console.log("COMMON: 設定ページ以外のため、アイコン表示制御をスキップ");
    return;
  }

  chrome.storage.local.get(["customSettings"], (result) => {
    const settings = result.customSettings;
    console.log("COMMON: ストレージから取得した設定:", settings);

    if (settings && settings.selectedIcons) {
      console.log("COMMON: 選択アイコンを適用:", settings.selectedIcons);
      applyIconVisibility(settings.selectedIcons);
    } else {
      console.log("COMMON: 設定が見つからないか、選択アイコンがありません");
    }
  });
}

// アイコン表示の適用（common.js版）
function applyIconVisibility(selectedIcons) {
  // ドラッグ&ドロップ進行中は適用しない
  if (window.isDragDropInProgress) {
    console.log(
      "COMMON: ドラッグ&ドロップ進行中のため、アイコン表示設定をスキップ"
    );
    return;
  }

  // 設定ページからの呼び出しかどうかを判定
  const isSettingPage = window.location.pathname.includes("/setting/");
  const prefix = isSettingPage ? "SETTING-COMMON" : "COMMON";

  console.log(
    `${prefix}: applyIconVisibility 呼び出し - 選択アイコン:`,
    selectedIcons
  );
  console.log(`${prefix}: 呼び出し元のスタックトレース:`, new Error().stack);

  // 設定ページ以外からの呼び出しは無視（アイコン表示制御は設定ページのみ）
  if (!isSettingPage) {
    console.log(
      `${prefix}: 設定ページ以外からの呼び出しのため、アイコン表示制御をスキップ`
    );
    return;
  }

  const header = document.querySelector("header");
  if (!header) {
    console.log(`${prefix}: ヘッダーが見つかりません`);
    return;
  }

  // 非表示アイコン更新時のチラつきを抑えるためヘッダーを一旦隠す
  header.classList.add("updating");
  console.log(`${prefix}: ヘッダー更新モード開始`);

  const navButtons = header.querySelectorAll(".nav-btn");
  console.log(`${prefix}: ヘッダー内のボタン数: ${navButtons.length}`);
  console.log(`${prefix}: 適用する選択アイコン:`, selectedIcons);

  navButtons.forEach((button) => {
    const buttonId = button.id;
    const iconType = getIconTypeFromId(buttonId);

    let shouldHide = false;

    if (iconType === "ai" || iconType === "todolist" || iconType === "qrcode") {
      shouldHide = true;
      console.log(
        `${prefix}: ${buttonId} (${iconType}): 非表示 (今後実装予定)`
      );
    } else if (iconType === "setting" || iconType === "memo") {
      // 常に表示
      console.log(
        `${prefix}: ${buttonId} (${iconType}): 表示 (MEMO/SETTINGアイコン)`
      );
    } else if (!selectedIcons.includes(iconType)) {
      shouldHide = true;
      console.log(`${prefix}: ${buttonId} (${iconType}): 非表示 (未選択)`);
    } else {
      console.log(`${prefix}: ${buttonId} (${iconType}): 表示 (選択済み)`);
    }

    if (shouldHide) {
      button.classList.add("hidden-icon");
    } else {
      button.classList.remove("hidden-icon");
    }
  });

  console.log(`${prefix}: ヘッダー更新完了 - 表示アイコン:`, selectedIcons);

  // 現在のページに対応するアイコンのactive状態を復元
  restoreActiveIconState();

  // ヘッダー更新モード終了を次のフレームで実行
  requestAnimationFrame(() => {
    header.classList.remove("updating");
    console.log(`${prefix}: ヘッダー更新モード終了`);
  });
}

// 今後実装予定のアイコンを非表示にする関数
function hideComingSoonIcons() {
  console.log("COMMON: 今後実装予定のアイコンを非表示にする処理を開始");

  const header = document.querySelector("header");
  if (!header) {
    console.log("COMMON: ヘッダーが見つかりません");
    return;
  }

  // AIアイコンを非表示
  const aiButton = document.getElementById("btn-ai");
  if (aiButton) {
    aiButton.classList.add("hidden-icon");
    console.log("COMMON: AIアイコンを非表示にしました");
  } else {
    console.log("COMMON: AIアイコンが見つかりません");
  }

  // TodoListアイコンを非表示
  const todoListButton = document.getElementById("btn-todolist");
  if (todoListButton) {
    todoListButton.classList.add("hidden-icon");
    console.log("COMMON: TodoListアイコンを非表示にしました");
  } else {
    console.log("COMMON: TodoListアイコンが見つかりません");
  }

  // QRコードアイコンを非表示
  const qrButton = document.getElementById("btn-qrcode");
  if (qrButton) {
    qrButton.classList.add("hidden-icon");
    console.log("COMMON: QRコードアイコンを非表示にしました");
  } else {
    console.log("COMMON: QRコードアイコンが見つかりません");
  }
}

// ボタンIDからアイコンタイプを取得（common.js版）
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

// window.onloadでも今後実装予定のアイコンを非表示にする
window.addEventListener("load", () => {
  console.log("COMMON: window.load - 今後実装予定のアイコン非表示処理");
  hideComingSoonIcons();

  // MutationObserverで今後実装予定のアイコンの追加を監視
  const header = document.querySelector("header");
  if (header) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node.id === "btn-todolist" || node.id === "btn-ai")
            ) {
              console.log(
                "COMMON: 今後実装予定のアイコンが追加されました - 非表示にします"
              );
              hideComingSoonIcons();
            }
          });
        }
      });
    });

    observer.observe(header, {
      childList: true,
      subtree: true,
    });

console.log("COMMON: 今後実装予定のアイコン監視を開始しました");
  }
});

// Debug: log icon center positions to verify alignment
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header");
  if (!header) return;

  header.querySelectorAll(".nav-btn").forEach((btn) => {
    const icon = btn.querySelector("i");
    if (!icon) return;
    const btnRect = btn.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    console.log("[NAV CHECK] icon center", btn.id, {
      btnCenter: btnRect.left + btnRect.width / 2,
      iconCenter: iconRect.left + iconRect.width / 2,
    });
  });

  // Also verify footer icon centers for troubleshooting
  const footer = document.querySelector("footer.memo-footer");
  if (footer) {
    footer.querySelectorAll(".nav-btn").forEach((btn) => {
      const icon = btn.querySelector("i");
      if (!icon) return;
      const btnRect = btn.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      console.log("[FOOTER CHECK] icon center", btn.id || btn.className, {
        btnCenter: btnRect.left + btnRect.width / 2,
        iconCenter: iconRect.left + iconRect.width / 2,
      });
    });
  }
});
