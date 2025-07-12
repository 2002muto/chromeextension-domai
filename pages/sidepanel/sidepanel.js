document.addEventListener('DOMContentLoaded', () => {
  const openButton = document.getElementById('openButton');
  const iframe = document.getElementById('iframe');

  openButton.addEventListener('click', async () => {
    console.log('[sidepanel] openButton clicked');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('[sidepanel] active tab info:', tab);
      if (tab && tab.url) {
        iframe.src = tab.url;
        openButton.textContent = '読み込み中...';
        iframe.onload = () => {
          console.log('[sidepanel] iframe loaded:', iframe.src);
          openButton.textContent = 'メインページと同じサイトを開く';
        };
        iframe.onerror = () => {
          console.error('[sidepanel] iframe load error:', iframe.src);
          openButton.textContent = 'エラーが発生しました';
        };
      }
    } catch (e) {
      console.error('[sidepanel] failed to get active tab:', e);
      openButton.textContent = 'エラーが発生しました';
    }
  });
});
