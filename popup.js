const dpr = window.devicePixelRatio || 1;
document.documentElement.style.setProperty('--dpr-scale', 1 / dpr);
console.log('DPR scale set to', 1 / dpr);
