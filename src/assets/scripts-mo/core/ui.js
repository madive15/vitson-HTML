/**
 * @file scripts-mo/core/ui.js
 * @description 모바일 UI 모듈 import + 초기화 진입점
 * @note
 *  - UI 기능은 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함
 *  - UI.init에는 "초기화 호출"만 (기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */

import '../ui/scroll-lock.js';
import '../ui/kendo/index.js';
import '../ui/category/index.js';

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  var modules = ['scrollLock', 'kendo', 'category'];

  window.UI.init = function () {
    modules.forEach(function (name) {
      var mod = window.UI[name];
      if (mod && typeof mod.init === 'function') mod.init();
    });
  };

  console.log('[mobile/core/ui] loaded');
})(window);
