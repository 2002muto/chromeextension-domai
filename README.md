# Chrome Extension Display Guide

This project aims to keep the popup layout identical between Ubuntu and Windows.

## Chrome Launch Command (Windows example)
Use the following option to lock the device scaling:
```cmd
chrome.exe --force-device-scale-factor=1
```

## Verification Steps
1. Open the extension popup.
2. The heading should sit 10px above the paragraph.
3. Body padding must remain exactly 15px on all sides.
4. Compare text weight and spacing with Ubuntu screenshots to confirm identical rendering.

The included `popup.js` automatically sets `--dpr-scale` using `window.devicePixelRatio`.
