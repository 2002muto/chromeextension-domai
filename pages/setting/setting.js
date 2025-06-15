// File: pages/setting/setting.js

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".setting-card").classList.add("show");
  // カード自体をフェードイン
  const card = document.querySelector(".setting-card");
  card.classList.add("show");

  // 既存のメニュー切り替え処理
  document.querySelectorAll(".setting-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".setting-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
});
