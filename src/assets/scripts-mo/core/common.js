/**
 * @file scripts-mo/core/common.js
 * @description 공통 초기화
 */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.UI) return;

  Object.keys(window.UI).forEach(function (key) {
    var mod = window.UI[key];
    if (mod && typeof mod.init === 'function') mod.init();
  });
});
