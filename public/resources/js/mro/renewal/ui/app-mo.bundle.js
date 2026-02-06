/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 66:
/***/ (function() {

/**
 * @file mobile/ui/scroll-lock.js
 * @description 스크롤 잠금/해제 (팝업, 바텀시트 등)
 * @scope .vm-wrap
 * @state is-locked
 * @note
 *  - iOS: overflow hidden만으로 스크롤 차단 불가
 *  - position fixed + top 보정 + touchmove 차단으로 완전 잠금
 *  - touch-action: none + touchmove preventDefault 이중 차단
 *  - 해제 시 원래 스크롤 위치 복원
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var $wrap = null;
  var scrollY = 0;
  var isLocked = false;
  function preventTouch(e) {
    e.preventDefault();
  }
  function lock() {
    if (isLocked) return;
    if (!$wrap || !$wrap.length) $wrap = $('.vm-wrap');
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
    $wrap.addClass('is-locked').css('top', -scrollY + 'px');
    document.addEventListener('touchmove', preventTouch, {
      passive: false
    });
    isLocked = true;
  }
  function unlock() {
    if (!isLocked) return;
    if (!$wrap || !$wrap.length) return;
    document.removeEventListener('touchmove', preventTouch);
    $wrap.removeClass('is-locked').css('top', '');
    window.scrollTo(0, scrollY);
    isLocked = false;
  }
  window.UI.scrollLock = {
    init: function () {
      $wrap = $('.vm-wrap');
    },
    destroy: function () {
      unlock();
      $wrap = null;
    },
    lock: lock,
    unlock: unlock,
    isLocked: function () {
      return isLocked;
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 781:
/***/ (function() {

/**
 * @file mobile/core/utils.js
 * @description 모바일 공통 유틸
 * @note 실행 트리거(DOMReady/이벤트 바인딩) 금지, 범용 로직만
 */
(function (window, document) {
  'use strict';

  /**
   * @description 뷰포트 높이 보정 (iOS/Android 주소창 변화 대응)
   * @note CSS: min-height: calc(var(--vh, 1vh) * 100)
   */
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh);
})(window, document);

/***/ }),

/***/ 871:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./src/assets/scripts-mo/core/utils.js
var utils = __webpack_require__(781);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/scroll-lock.js
var scroll_lock = __webpack_require__(66);
;// ./src/assets/scripts-mo/core/ui.js
/**
 * @file mobile/core/ui.js
 * @description 모바일 UI 모듈 import + 초기화 진입점
 * @note
 *  - UI 기능은 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함
 *  - UI.init에는 "초기화 호출"만 (기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */

(function (window) {
  'use strict';

  window.UI = window.UI || {};

  /**
   * 공통 UI 초기화 진입점
   * @returns {void}
   */
  window.UI.init = function () {
    if (window.UI.scrollLock && window.UI.scrollLock.init) window.UI.scrollLock.init();
  };
  console.log('[mobile/core/ui] loaded');
})(window);
;// ./src/assets/scripts-mo/index.js
/**
 * @file mobile/index.js
 * @description 모바일 번들 엔트리(진입점)
 * @note
 *  - core 모듈은 utils → ui → common 순서로 포함
 *  - index.js는 짧게 유지(엔트리 역할만)
 *  - 기능 추가/삭제는 core/ui.js에서 관리
 */



console.log('[mobile/index] entry 실행');
;// ./src/app-mo.js
// 모바일 전용


// 공통 (PC와 동일)



// 모바일 전용





/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	!function() {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = function(result, chunkIds, fn, priority) {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var chunkIds = deferred[i][0];
/******/ 				var fn = deferred[i][1];
/******/ 				var priority = deferred[i][2];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every(function(key) { return __webpack_require__.O[key](chunkIds[j]); })) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	!function() {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			605: 0,
/******/ 			96: 0,
/******/ 			817: 0,
/******/ 			152: 0,
/******/ 			486: 0,
/******/ 			766: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = function(chunkId) { return installedChunks[chunkId] === 0; };
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = function(parentChunkLoadingFunction, data) {
/******/ 			var chunkIds = data[0];
/******/ 			var moreModules = data[1];
/******/ 			var runtime = data[2];
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some(function(id) { return installedChunks[id] !== 0; })) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkroot"] = self["webpackChunkroot"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	}();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,817,152,486,766], function() { return __webpack_require__(871); })
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;