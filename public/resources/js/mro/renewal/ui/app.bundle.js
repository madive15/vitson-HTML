/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 3:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./src/assets/scripts/core/utils.js
var utils = __webpack_require__(918);
// EXTERNAL MODULE: ./src/assets/scripts/ui/toggle.js
var toggle = __webpack_require__(344);
// EXTERNAL MODULE: ./node_modules/.pnpm/swiper@11.2.8/node_modules/swiper/swiper-bundle.mjs + 32 modules
var swiper_bundle = __webpack_require__(111);
;// ./src/assets/scripts/ui/swiper.js
/* s: 메인 썸네일(큰 이미지)에서 좌우 화살표 사용 안 할 떄, 아래 삭제
  - <button ... data-main-prev></button>
  - <button ... data-main-next></button>
  - var mainPrev = root.querySelector("[data-main-prev]");
  - var mainNext = root.querySelector("[data-main-next]");
  - mainPrev.addEventListener("click", ...);
  - mainNext.addEventListener("click", ...);
  - mainPrev.classList.add("swiper-button-disabled");
  - mainNext.classList.add("swiper-button-disabled");
  - mainPrev.classList.remove("swiper-button-disabled");
  - mainNext.classList.remove("swiper-button-disabled");
  - if (currentIndex <= 0) mainPrev... else ...
  - if (currentIndex >= last) mainNext... else ...
*/


(function () {
  'use strict';

  if (typeof swiper_bundle/* default */.A === 'undefined') return;
  var root = document.querySelector('[data-test-gallery]');
  if (!root) return;
  var mainEl = root.querySelector('[data-main-swiper]');
  var thumbsEl = root.querySelector('[data-thumbs-swiper]');
  var mainWrapper = root.querySelector('[data-main-wrapper]');
  var thumbsWrapper = root.querySelector('[data-thumbs-wrapper]');
  if (!mainEl || !thumbsEl || !mainWrapper || !thumbsWrapper) return;
  var mainPrev = root.querySelector('[data-main-prev]');
  var mainNext = root.querySelector('[data-main-next]');
  var thumbsPrev = root.querySelector('[data-thumbs-prev]');
  var thumbsNext = root.querySelector('[data-thumbs-next]');
  if (!mainPrev || !mainNext || !thumbsPrev || !thumbsNext) return;
  var zoomBox = root.querySelector('[data-zoom]');
  var zoomImg = root.querySelector('[data-zoom-img]');
  var ZOOM_RATIO = 3;

  // 이미지 데이터는 EJS 템플릿에서 렌더링되므로, DOM에서 이미지 정보를 가져옴
  var mainImgs = Array.prototype.slice.call(mainWrapper.querySelectorAll('[data-main-img]'));
  var items = mainImgs.map(function (img) {
    return {
      src: img.src,
      alt: img.alt || ''
    };
  });
  var thumbBtns = Array.prototype.slice.call(root.querySelectorAll('[data-thumb]'));
  var thumbsSwiper = new swiper_bundle/* default */.A(thumbsEl, {
    loop: false,
    slidesPerView: 'auto',
    spaceBetween: 7,
    centeredSlides: false,
    centeredSlidesBounds: false,
    centerInsufficientSlides: false,
    watchSlidesProgress: true,
    allowTouchMove: false
  });
  var mainSwiper = new swiper_bundle/* default */.A(mainEl, {
    loop: false,
    slidesPerView: 1,
    allowTouchMove: false
  });
  var currentIndex = 0;
  function clampIndex(i) {
    var last = items.length - 1;
    if (i < 0) return 0;
    if (i > last) return last;
    return i;
  }
  function setIndex(nextIndex) {
    currentIndex = clampIndex(nextIndex);
    mainSwiper.slideTo(currentIndex);
    thumbsSwiper.slideTo(currentIndex);
    thumbBtns.forEach(function (btn, i) {
      if (i === currentIndex) btn.classList.add('is-active');else btn.classList.remove('is-active');
    });
    var last = items.length - 1;
    if (items.length <= 1) {
      thumbsPrev.classList.add('is-hidden');
      thumbsNext.classList.add('is-hidden');
    } else {
      thumbsPrev.classList.remove('is-hidden');
      thumbsNext.classList.remove('is-hidden');
    }
    if (currentIndex <= 0) thumbsPrev.classList.add('is-disabled');else thumbsPrev.classList.remove('is-disabled');
    if (currentIndex >= last) thumbsNext.classList.add('is-disabled');else thumbsNext.classList.remove('is-disabled');
    if (currentIndex <= 0) mainPrev.classList.add('swiper-button-disabled');else mainPrev.classList.remove('swiper-button-disabled');
    if (currentIndex >= last) mainNext.classList.add('swiper-button-disabled');else mainNext.classList.remove('swiper-button-disabled');
    if (zoomImg) zoomImg.src = items[currentIndex].src;
  }
  mainPrev.addEventListener('click', function () {
    setIndex(currentIndex - 1);
  });
  mainNext.addEventListener('click', function () {
    setIndex(currentIndex + 1);
  });
  thumbsPrev.addEventListener('click', function () {
    setIndex(currentIndex - 1);
  });
  thumbsNext.addEventListener('click', function () {
    setIndex(currentIndex + 1);
  });
  thumbBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      setIndex(idx);
    });
  });
  function hideZoom() {
    if (!zoomBox) return;
    zoomBox.classList.remove('is-on');
    zoomBox.setAttribute('aria-hidden', 'true');
  }
  function showZoom() {
    if (!zoomBox) return;
    zoomBox.classList.add('is-on');
    zoomBox.setAttribute('aria-hidden', 'false');
  }
  function ensureNatural(img, cb) {
    if (!img) return;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      cb(img.naturalWidth, img.naturalHeight);
      return;
    }
    img.addEventListener('load', function onLoad() {
      img.removeEventListener('load', onLoad);
      cb(img.naturalWidth, img.naturalHeight);
    });
  }
  function getContainRect(containerW, containerH, naturalW, naturalH) {
    var scale = Math.min(containerW / naturalW, containerH / naturalH);
    var drawW = naturalW * scale;
    var drawH = naturalH * scale;
    var offsetX = (containerW - drawW) / 2;
    var offsetY = (containerH - drawH) / 2;
    return {
      x: offsetX,
      y: offsetY,
      w: drawW,
      h: drawH
    };
  }
  function getActiveImgEl() {
    return mainEl.querySelector('.swiper-slide-active [data-main-img]');
  }
  if (zoomBox && zoomImg) {
    mainEl.addEventListener('mouseenter', function () {
      showZoom();
    });
    mainEl.addEventListener('mouseleave', function () {
      hideZoom();
    });
    mainEl.addEventListener('mousemove', function (e) {
      if (!zoomBox.classList.contains('is-on')) return;
      var img = getActiveImgEl();
      if (!img) return;
      var contRect = mainEl.getBoundingClientRect();
      var cx = e.clientX - contRect.left;
      var cy = e.clientY - contRect.top;
      ensureNatural(img, function (nw, nh) {
        var cr = getContainRect(contRect.width, contRect.height, nw, nh);
        if (cx < cr.x || cy < cr.y || cx > cr.x + cr.w || cy > cr.y + cr.h) {
          hideZoom();
          return;
        } else {
          showZoom();
        }
        var rx = (cx - cr.x) / cr.w;
        var ry = (cy - cr.y) / cr.h;
        var baseRatio = Math.max(nw / cr.w, nh / cr.h);
        var ratio = baseRatio * ZOOM_RATIO;
        var zoomW = nw * ratio;
        var zoomH = nh * ratio;
        zoomImg.style.width = zoomW + 'px';
        zoomImg.style.height = zoomH + 'px';
        var zw = zoomBox.clientWidth;
        var zh = zoomBox.clientHeight;
        var left = -(rx * (zoomW - zw));
        var top = -(ry * (zoomH - zh));
        if (left > 0) left = 0;
        if (top > 0) top = 0;
        if (left < -(zoomW - zw)) left = -(zoomW - zw);
        if (top < -(zoomH - zh)) top = -(zoomH - zh);
        zoomImg.style.left = left + 'px';
        zoomImg.style.top = top + 'px';
      });
    });
  }
  setIndex(0);
})();

/**
 * Swiper 타입별 기본 옵션 정의
 * - 여기만 수정하면 전체 Swiper에 반영됨
 */
(function () {
  'use strict';

  if (typeof swiper_bundle/* default */.A === 'undefined') return;
  const DEFAULT_OFFSET = {
    before: 0,
    after: 0
  };
  const SWIPER_PRESETS = {
    test: {
      spaceBetween: 32.5,
      speed: 400,
      breakpoints: {
        1024: {
          slidesPerView: 2
        },
        1280: {
          slidesPerView: 2
        }
      }
    },
    card: {
      slidesPerView: 5,
      spaceBetween: 27.5,
      speed: 400,
      breakpoints: {
        1024: {
          slidesPerView: 4
        },
        1280: {
          slidesPerView: 5
        }
      }
    },
    list: {
      spaceBetween: 19.6,
      speed: 400,
      breakpoints: {
        1024: {
          slidesPerView: 4
        },
        1280: {
          slidesPerView: 6
        }
      }
    }
  };
  function initSwipers() {
    if (typeof swiper_bundle/* default */.A === 'undefined') {
      setTimeout(initSwipers, 100);
      return;
    }
    document.querySelectorAll('.js-swiper').forEach(function (el) {
      const type = el.dataset.swiperType;
      if (!SWIPER_PRESETS[type]) return;

      // 프리셋 객체를 깊은 복사하여 각 인스턴스가 독립적으로 동작하도록 함
      const preset = JSON.parse(JSON.stringify(SWIPER_PRESETS[type]));

      // offset 개별 제어
      const offsetBeforeAttr = el.getAttribute('data-offset-before');
      const offsetAfterAttr = el.getAttribute('data-offset-after');
      const offsetBefore = offsetBeforeAttr !== null ? Number(offsetBeforeAttr) : DEFAULT_OFFSET.before;
      const offsetAfter = offsetAfterAttr !== null ? Number(offsetAfterAttr) : DEFAULT_OFFSET.after;

      // desktop slidesPerView 오버라이드 (복사된 객체를 수정하므로 원본에 영향 없음)
      const desktopView = el.dataset.desktop;
      if (desktopView && preset.breakpoints && preset.breakpoints[1280]) {
        preset.breakpoints[1280].slidesPerView = Number(desktopView);
      }

      // breakpoints에도 offset 적용 (사용자가 명시적으로 설정한 경우)
      if (preset.breakpoints && (offsetBefore !== DEFAULT_OFFSET.before || offsetAfter !== DEFAULT_OFFSET.after)) {
        Object.keys(preset.breakpoints).forEach(function (breakpoint) {
          // breakpoint에 이미 offset이 설정되어 있지 않은 경우에만 적용
          if (offsetBefore !== DEFAULT_OFFSET.before && !('slidesOffsetBefore' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetBefore = offsetBefore;
          }
          if (offsetAfter !== DEFAULT_OFFSET.after && !('slidesOffsetAfter' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetAfter = offsetAfter;
          }
        });
      }

      // navigation 버튼 찾기: container 내부 또는 외부의 vits-swiper-navs에서 찾기
      var nextEl = el.querySelector('.swiper-button-next');
      var prevEl = el.querySelector('.swiper-button-prev');

      // container 내부에서 찾지 못한 경우, container 밖의 vits-swiper-navs에서 찾기
      if (!nextEl || !prevEl) {
        // container의 부모 요소에서 vits-swiper-navs 찾기
        const parent = el.parentElement;
        if (parent) {
          const navsContainer = parent.querySelector('.vits-swiper-navs');
          if (navsContainer) {
            if (!nextEl) nextEl = navsContainer.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = navsContainer.querySelector('.swiper-button-prev');
          }
        }

        // 부모에서 찾지 못한 경우, 형제 요소에서 찾기
        if ((!nextEl || !prevEl) && el.nextElementSibling) {
          const nextSibling = el.nextElementSibling;
          if (nextSibling.classList.contains('vits-swiper-navs')) {
            if (!nextEl) nextEl = nextSibling.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = nextSibling.querySelector('.swiper-button-prev');
          }
        }
      }
      new swiper_bundle/* default */.A(el, {
        slidesPerView: 1,
        spaceBetween: preset.spaceBetween,
        speed: preset.speed,
        slidesOffsetBefore: offsetBefore,
        slidesOffsetAfter: offsetAfter,
        centeredSlides: false,
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true
        },
        breakpoints: preset.breakpoints
      });
    });
  }
  function waitForDependencies() {
    if (typeof swiper_bundle/* default */.A === 'undefined') {
      setTimeout(waitForDependencies, 100);
      return;
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSwipers);
    } else {
      initSwipers();
    }
  }
  waitForDependencies();
})();

// window.UI.swiper로 등록 (선택적)
(function (window) {
  'use strict';

  window.UI = window.UI || {};
  window.UI.swiper = {
    init: function () {
      // 이미 자동 실행되므로 빈 함수로 유지
      // 필요시 여기에 추가 초기화 로직 작성
    }
  };
})(window);
// EXTERNAL MODULE: ./src/assets/scripts/ui/chip-button.js
var chip_button = __webpack_require__(755);
// EXTERNAL MODULE: ./src/assets/scripts/ui/quantity-stepper.js
var quantity_stepper = __webpack_require__(397);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/textarea.js
var form_textarea = __webpack_require__(803);
// EXTERNAL MODULE: ./src/assets/scripts/ui/kendo/kendo-dropdown.js
var kendo_dropdown = __webpack_require__(47);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-rank.js
var header_rank = __webpack_require__(596);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-search.js
var header_search = __webpack_require__(978);
// EXTERNAL MODULE: ./src/assets/scripts/ui/header/header-gnb.js
var header_gnb = __webpack_require__(105);
// EXTERNAL MODULE: ./src/assets/scripts/ui/footer.js
var footer = __webpack_require__(795);
// EXTERNAL MODULE: ./src/assets/scripts/ui/product/tab-scrollbar.js
var tab_scrollbar = __webpack_require__(986);
// EXTERNAL MODULE: ./src/assets/scripts/ui/form/select.js
var form_select = __webpack_require__(865);
// EXTERNAL MODULE: ./src/assets/scripts/ui/category/plp-titlebar-research.js
var plp_titlebar_research = __webpack_require__(809);
;// ./src/assets/scripts/core/ui.js
/**
 * scripts/core/ui.js
 * @purpose UI 기능 모음
 * @assumption
 *  - 기능별 UI는 ui/ 폴더에 분리하고 이 파일에서만 묶어 포함한다
 *  - 각 UI 모듈은 window.UI.{name}.init 형태로 초기화 함수를 제공한다
 * @maintenance
 *  - index.js를 길게 만들지 않기 위해 UI import는 여기서만 관리한다
 *  - UI.init에는 “초기화 호출”만 둔다(기능 구현/옵션/페이지 분기 로직 금지)
 *  - import 순서가 의존성에 영향을 줄 수 있으므로 임의 재정렬 금지
 */













(function (window) {
  'use strict';

  window.UI = window.UI || {};

  /**
   * 공통 UI 초기화 진입점
   * @returns {void}
   * @example
   * // scripts/core/common.js에서 DOMReady 시점에 호출
   * UI.init();
   */
  window.UI.init = function () {
    if (window.UI.toggle && window.UI.toggle.init) window.UI.toggle.init();
    if (window.UI.swiper && window.UI.swiper.init) window.UI.swiper.init();
    if (window.UI.chipButton && window.UI.chipButton.init) window.UI.chipButton.init();
    if (window.UI.textarea && window.UI.textarea.init) window.UI.textarea.init();
    if (window.UI.quantityStepper && window.UI.quantityStepper.init) window.UI.quantityStepper.init();
    if (window.VitsKendoDropdown) {
      window.VitsKendoDropdown.initAll(document);
      window.VitsKendoDropdown.autoBindStart(document.body);
    }
    if (window.UI.headerRank && window.UI.headerRank.init) window.UI.headerRank.init();
    if (window.UI.headerSearch && window.UI.headerSearch.init) window.UI.headerSearch.init();
    if (window.UI.headerGnb && window.UI.headerGnb.init) window.UI.headerGnb.init();
    if (window.UI.footerBizInfo && window.UI.footerBizInfo.init) window.UI.footerBizInfo.init();
    if (window.UI.initDealGallery && window.UI.initDealGallery.init) window.UI.initDealGallery.init();
    if (window.UI.tabScrollbar && window.UI.tabScrollbar.init) window.UI.tabScrollbar.init();
    if (window.UI.select && window.UI.select.init) window.UI.select.init();
    if (window.UI && window.UI.plpTitlebarResearch) window.UI.plpTitlebarResearch.init();
  };
  console.log('[core/ui] loaded');
})(window);
// EXTERNAL MODULE: ./src/assets/scripts/core/common.js
var common = __webpack_require__(538);
;// ./src/assets/scripts/index.js
/**
 * scripts/index.js
 * @purpose 번들 엔트리(진입점)
 * @assumption
 *  - 빌드 결과(app.bundle.js)가 페이지에 자동 주입됨
 *  - core 모듈은 utils → ui → common 순서로 포함되어야 함
 * @maintenance
 *  - index.js는 짧게 유지한다(엔트리 역할만)
 *  - 기능 추가/삭제는 core/ui.js에서만 관리한다
 *  - 페이지 전용 스크립트가 필요하면 별도 모듈로 분리하고, 공통 초기화와 섞지 않는다
 */




console.log('[index] entry 실행');
;// ./src/app.js







if (document.body?.dataset?.guide === 'true') {
  // 가이드 페이지 전용 스타일(정렬/린트 영향 최소화하려면 이 파일에만 예외 설정을 몰아넣기 좋음)
  Promise.all(/* import() */[__webpack_require__.e(237), __webpack_require__.e(395)]).then(__webpack_require__.bind(__webpack_require__, 395));
}
console.log(`%c ==== ${"app"}.${"js"} run ====`, 'color: green');
console.log('%c APP_ENV_URL :', 'color: green', "pc");
console.log('%c APP_ENV_TYPE :', 'color: green', "js");
console.log('%c ====================', 'color: green');

/***/ }),

/***/ 47:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-dropdown.js
 * @description
 * Kendo DropDownList 자동 초기화 모듈.
 * - select[data-ui="kendo-dropdown"]를 찾아 data-opt(JSON)로 초기화한다.
 * - 상위 래퍼(.vits-dropdown)의 vits- 클래스를 Kendo wrapper/popup에도 복사한다.
 * - appendTo 미지정 시 래퍼로 기본 설정해 팝업 스코프를 제한한다.
 *
 * placeholder 정책(중요)
 * - optionLabel은 사용하지 않는다(리스트 상단 고정 렌더링/스크롤 고정 이슈).
 * - placeholder는 dataSource[0]에 "빈 값 아이템"으로 주입한다.
 *   -> 리스트 아이템으로 렌더링되어 스크롤 시 함께 이동(네이티브 셀렉트와 동일 UX).
 *
 * cascader 정책(중요)
 * - 부모가 placeholder(빈 값)이면 자식은 disable + 값 '' 유지.
 * - 부모가 실제 값이면:
 *   - 자식 후보가 있으면 enable(true) + 자식은 placeholder('') 상태 유지(자동 첫번째 선택 금지)
 *   - 자식 후보가 없으면 disable(false 유지) + 값 '' 유지
 */

(function (window) {
  'use strict';

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDropDownList);
  }
  function applyVitsClassToWrapper($wrap, inst) {
    if (!$wrap || !$wrap.length || !inst) return;
    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);
    if (inst.wrapper) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) inst.wrapper.addClass(classList[i]);
      }
    }
    if (inst.popup && inst.popup.element) {
      for (var j = 0; j < classList.length; j++) {
        if (classList[j].indexOf('vits-') === 0) {
          inst.popup.element.addClass(classList[j]);
          var $ac = inst.popup.element.closest('.k-animation-container');
          if ($ac && $ac.length) $ac.addClass(classList[j]);
        }
      }
    }
  }
  function getPlaceholder($wrap, $el) {
    var ph = '';
    if ($wrap && $wrap.length) ph = ($wrap.attr('data-placeholder') || '').trim();
    if (!ph && $el && $el.length) ph = ($el.attr('data-placeholder') || '').trim();
    return ph;
  }
  function isEmptyValue(v) {
    return v === null || v === undefined || v === '';
  }
  function removeOptionLabelAlways(opts) {
    if (!opts) return;
    if (opts.optionLabel !== undefined) delete opts.optionLabel; // 상단 고정 트리거 제거
  }
  function ensureValueEmpty(opts) {
    if (!opts) return;
    if (opts.value === null || typeof opts.value === 'undefined') opts.value = '';
  }
  function injectPlaceholderItem(opts, placeholderText) {
    if (!opts || !placeholderText) return;
    if (!Array.isArray(opts.dataSource)) return;
    var textField = opts.dataTextField || 'text';
    var valueField = opts.dataValueField || 'value';
    var ds = opts.dataSource;

    // 이미 빈 값 아이템이 있으면 중복 주입 금지
    for (var i = 0; i < ds.length; i++) {
      var it = ds[i];
      if (!it) continue;
      if (String(it[valueField] ?? '') === '') return;
    }
    var phItem = {};
    phItem[textField] = placeholderText;
    phItem[valueField] = '';
    ds.unshift(phItem);
  }
  function getInstById(id) {
    if (!id) return null;
    var $el = window.jQuery('#' + id);
    if (!$el.length) return null;
    return $el.data('kendoDropDownList') || null;
  }
  function hasChildCandidates(childInst, parentVal) {
    // 목적: "부모가 선택되었어도 실제 자식이 없으면 계속 비활성화"
    // 조건: childInst.options.cascadeFromField 값이 parentVal인 항목이 1개라도 있는지(placeholder 제외)
    if (!childInst || !childInst.options) return false;
    var field = childInst.options.cascadeFromField || '';
    if (!field) return true; // 필드가 없으면 판단 불가 -> enable 로직은 부모 값 기준만 따름(기본)

    var ds = childInst.dataSource;
    if (!ds) return false;
    var view = [];
    try {
      // array dataSource면 fetch 없이도 view가 잡히는 편
      view = typeof ds.view === 'function' ? ds.view() : [];
    } catch (e) {
      console.error(e);
      view = [];
    }
    if (!view || !view.length) {
      // view가 비어있어도, 원본이 배열이면 options.dataSource로 판단
      if (Array.isArray(childInst.options.dataSource)) view = childInst.options.dataSource;
    }
    for (var i = 0; i < view.length; i++) {
      var item = view[i];
      if (!item) continue;
      // placeholder는 valueField가 ''라서 제외
      var vField = childInst.options.dataValueField || 'value';
      var v = String(item[vField] ?? '');
      if (v === '') continue;
      if (String(item[field] ?? '') === String(parentVal)) return true;
    }
    return false;
  }
  function forcePlaceholderSelected(inst) {
    // 목적: 자동으로 첫 번째 "실제 항목" 선택되는 버그 방지
    if (!inst) return;
    try {
      // placeholder는 dataSource[0]로 주입되어 있어야 함
      if (typeof inst.select === 'function') inst.select(0);
      if (typeof inst.value === 'function') inst.value('');
    } catch (e) {
      console.error(e);
    }
  }
  function syncEnableByParent(childInst) {
    // 목적: cascadeFrom 기반 enable/disable을 "부모 값 + 자식 후보 존재 여부"로 동기화
    if (!childInst || !childInst.options) return;
    var parentId = childInst.options.cascadeFrom;
    if (!parentId) return;
    var parentInst = getInstById(parentId);
    if (!parentInst) return;
    var parentVal = '';
    try {
      parentVal = parentInst.value();
    } catch (e) {
      console.error(e);
      parentVal = '';
    }

    // 1) 부모가 placeholder면: 무조건 disable
    if (isEmptyValue(parentVal)) {
      if (typeof childInst.enable === 'function') childInst.enable(false);
      forcePlaceholderSelected(childInst);
      return;
    }

    // 2) 부모가 선택되었더라도, 실제 자식 후보가 없으면 disable 유지
    if (!hasChildCandidates(childInst, parentVal)) {
      if (typeof childInst.enable === 'function') childInst.enable(false);
      forcePlaceholderSelected(childInst);
      return;
    }

    // 3) 자식 후보가 있으면 enable + 값은 placeholder 유지(자동 선택 금지)
    if (typeof childInst.enable === 'function') childInst.enable(true);
    forcePlaceholderSelected(childInst);
  }
  function syncChildrenByParent(parentInst) {
    if (!parentInst || !parentInst.element) return;
    var parentId = parentInst.element.attr('id');
    if (!parentId) return;
    window.jQuery('select[data-ui="kendo-dropdown"]').each(function () {
      var child = window.jQuery(this).data('kendoDropDownList');
      if (!child || !child.options) return;
      if (child.options.cascadeFrom === parentId) syncEnableByParent(child);
    });
  }
  function initOne(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDropDownList')) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var $wrap = $el.closest('.vits-dropdown');
    if ($wrap.length && opts.appendTo === undefined) opts.appendTo = $wrap[0];

    // optionLabel 제거(상단 고정 이슈 차단)
    removeOptionLabelAlways(opts);

    // placeholder 주입(리스트 상단 고정 없이, 스크롤과 함께 이동)
    var ph = getPlaceholder($wrap, $el);
    if (ph) injectPlaceholderItem(opts, ph);

    // value는 ''로 통일(placeholder 선택 상태)
    ensureValueEmpty(opts);

    // array dataSource면 autoBind:false로 두면 초기 표시가 비는 케이스가 있어 강제로 true로 맞춤(표시 안정화)
    // - placeholder 아이템이 0번이라 자동선택이 일어나도 "placeholder"가 선택되므로 문제 없음
    if (Array.isArray(opts.dataSource) && opts.autoBind === false) opts.autoBind = true;
    $el.kendoDropDownList(opts);
    var inst = $el.data('kendoDropDownList');
    if (inst && inst.bind) {
      inst.bind('open', function () {
        applyVitsClassToWrapper($wrap, inst);
      });
      inst.bind('dataBound', function () {
        // 항상 placeholder 고정(자동 첫 항목 선택 방지) + enable 동기화
        forcePlaceholderSelected(inst);
        syncEnableByParent(inst);
      });
      inst.bind('change', function () {
        window.setTimeout(function () {
          // 본인 값이 placeholder인지 여부에 따라 자식 enable 동기화
          syncChildrenByParent(inst);

          // 본인이 자식이면, 부모 상태에 따라 enable 재동기화(안전망)
          syncEnableByParent(inst);
        }, 0);
      });
    }
    applyVitsClassToWrapper($wrap, inst);

    // 초기 상태 확정
    forcePlaceholderSelected(inst);
    syncEnableByParent(inst);
    syncChildrenByParent(inst);
  }
  function initAll(root) {
    if (!ensureKendoAvailable()) return;
    var $root = root ? window.jQuery(root) : window.jQuery(document);
    $root.find('select[data-ui="kendo-dropdown"]').each(function () {
      initOne(this);
    });
  }
  function autoBindStart(container) {
    if (!window.MutationObserver) return null;
    var target = container || document.body;
    initAll(target);
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (!node || node.nodeType !== 1) continue;
          initAll(node);
        }
      }
    });
    obs.observe(target, {
      childList: true,
      subtree: true
    });
    return obs;
  }
  window.VitsKendoDropdown = {
    initAll: initAll,
    autoBindStart: autoBindStart
  };
})(window);

/***/ }),

/***/ 105:
/***/ (function() {

/**
 * @file scripts/ui/header/header-gnb.js
 * @purpose GNB 프로모션(가변) 클리핑 + more 노출 + more 패널 리스트 채우기
 * @assumption
 *  - 클리핑 대상: .gnb-item-promo-list .gnb-promo-list > a.gnb-link
 *  - more 버튼/패널 open/close는 toggle.js가 담당(여긴 리스트/노출 동기화만)
 *  - 패널은 같은 data-toggle-scope 안에 존재: [data-toggle-box="gnb-more"]
 * @markup-control
 *  - [data-toggle-box="gnb-more"][data-gnb-more-mode="all"] : 패널에 전체 메뉴 노출
 *  - (default) data-gnb-more-mode 미지정                : 패널에 접힌 메뉴만 노출
 * @state
 *  - root.is-more-visible : more(+) 버튼 노출
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var ROOT_SEL = '[data-header-gnb]';
  var CLS_MORE_VISIBLE = 'is-more-visible';

  // root 내부 주요 엘리먼트 캐시
  function getEls($root) {
    var $navList = $root.find('[data-gnb-nav-list]').first();
    var $promoItem = $navList.find('.gnb-item-promo-list').first();
    var $promoList = $promoItem.find('.gnb-promo-list').first();
    var $morePanel = $root.find('[data-toggle-box="gnb-more"]').first();
    return {
      $root: $root,
      $navList: $navList,
      $promoItem: $promoItem,
      $promoList: $promoList,
      // 핵심: 직계 자식 a만 확실히 잡기(환경 차이 방지)
      $promoLinks: $promoList.children('a.gnb-link'),
      $moreBtn: $promoItem.find('[data-gnb-more]').first(),
      $moreBox: $promoItem.find('.gnb-more-box').first(),
      $morePanel: $morePanel,
      $moreList: $morePanel.find('[data-gnb-more-list]').first()
    };
  }

  // more 노출 상태(root 클래스) 토글
  function setMoreVisible($root, on) {
    $root.toggleClass(CLS_MORE_VISIBLE, !!on);
  }

  // 프로모션 링크 숨김 상태 초기화
  function resetPromoHidden(els) {
    els.$promoLinks.removeClass('is-hidden');
  }

  // promoList: 가로폭이 부족하면(겹침/오버플로우) 뒤쪽부터 is-hidden 처리
  function applyPromoClip(els) {
    if (!els.$promoList.length) return;

    // promoItem이 남는 폭을 먹지 않게(우측 고정 메뉴와 여백 방지)
    if (els.$promoItem.length) els.$promoItem[0].style.flex = '0 1 auto';

    // 측정 전 초기화
    resetPromoHidden(els);
    var promoEl = els.$promoList[0];
    if (!promoEl) return;

    // 오버플로우가 해소될 때까지 "마지막 보이는 링크"부터 숨김
    // (clientWidth = 실제 보이는 폭, scrollWidth = 콘텐츠 전체 폭)
    var safety = 0;
    while (promoEl.scrollWidth > promoEl.clientWidth + 1) {
      var $lastVisible = els.$promoLinks.not('.is-hidden').last();
      if (!$lastVisible.length) break;
      $lastVisible.addClass('is-hidden');
      safety += 1;
      if (safety > els.$promoLinks.length) break; // 무한루프 방지
    }
  }

  // more 패널 모드 읽기(markup)
  function getMoreMode(els) {
    if (!els.$morePanel.length) return 'hidden';
    var mode = (els.$morePanel.attr('data-gnb-more-mode') || '').toLowerCase();
    return mode === 'all' ? 'all' : 'hidden';
  }

  // 패널 리스트 비우기
  function clearMoreList(els) {
    if (els.$moreList.length) els.$moreList.empty();
  }

  // 링크 1개를 패널용 li로 복제(2줄 케이스 유지: innerHTML 복사)
  function appendMoreItem(els, $a) {
    var href = $a.attr('href') || '#';
    var $li = $('<li/>');
    var $copy = $('<a class="gnb-link" />', {
      href: href
    });
    $copy.html($a.html());
    $li.append($copy);
    els.$moreList.append($li);
  }

  // 패널 리스트 채우기(mode=all|hidden)
  function fillMoreList(els, mode) {
    if (!els.$moreList.length) return;
    clearMoreList(els);
    els.$promoLinks.each(function () {
      var $a = $(this);

      // all: 전체 메뉴 그대로
      if (mode === 'all') {
        appendMoreItem(els, $a);
        return;
      }

      // hidden: 접힌 메뉴만
      if ($a.hasClass('is-hidden')) appendMoreItem(els, $a);
    });
  }

  // more 필요 여부: 현재 폭에서 오버플로우가 발생하면 true
  function getNeedMore(els) {
    if (!els.$promoList.length) return false;
    var promoEl = els.$promoList[0];
    return (promoEl.scrollWidth || 0) > (promoEl.clientWidth || 0) + 1; // 1px 오차 보정
  }

  // 클리핑 + more 노출 + 패널 리스트 동기화
  function updatePromoMore(els) {
    if (!els.$promoList.length || !els.$moreBtn.length) return;

    // 측정 왜곡 방지: 먼저 숨김 원복
    resetPromoHidden(els);

    // 패널 모드(마크업 제어)
    var mode = getMoreMode(els);

    // more 노출 여부(접힌 메뉴가 생길 때만)
    var needMore = getNeedMore(els);

    // more 버튼/영역은 needMore일 때만 보임(영역 잡힘 방지)
    setMoreVisible(els.$root, needMore);
    if (els.$moreBox.length) els.$moreBox.toggleClass('is-active', needMore);

    // 접힘 계산은 needMore일 때만 수행
    if (needMore) applyPromoClip(els);else resetPromoHidden(els);

    // 패널 리스트 채우기
    // - mode=all  : 접힘 유무와 관계없이 전체 노출(요구사항 케이스)
    // - mode=hidden: 접힌 메뉴가 없으면 비움
    if (mode === 'all') {
      fillMoreList(els, 'all');
      return;
    }
    if (!needMore) {
      clearMoreList(els);
      return;
    }
    fillMoreList(els, 'hidden');
  }

  // 리사이즈 시 동기화(디바운스)
  function bindResize(els) {
    var t = null;
    $(window).on('resize.headerGnb', function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(function () {
        updatePromoMore(els);
      }, 80);
    });
  }

  // 초기 렌더/폰트 지연 대비 재측정
  function scheduleInitialMeasure(els) {
    var delays = [0, 120, 300];
    for (var i = 0; i < delays.length; i += 1) {
      (function (d) {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, d);
      })(delays[i]);
    }
  }

  // root 1개 초기화
  function initRoot($root) {
    var els = getEls($root);
    if (els.$promoList.length && els.$moreBtn.length) {
      scheduleInitialMeasure(els);
      bindResize(els);

      // more 클릭 전후로 레이아웃이 바뀌면 재측정
      $root.on('click', '[data-gnb-more]', function () {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, 0);
      });
    }
  }
  window.UI.headerGnb = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 344:
/***/ (function() {

/**
 * @file scripts/ui/toggle.js
 * @purpose data-속성 기반 토글/아코디언 공통
 * @description
 *  - 스코프: [data-toggle-scope] 내부에서만 동작
 *  - 매핑: [data-toggle-btn][data-toggle-target] ↔ [data-toggle-box="target"]
 *  - 상태: is-open 클래스 + aria-expanded 값으로만 제어
 * @option
 *  - data-toggle-group="true"   : 스코프 내 1개만 오픈(아코디언)
 *  - data-toggle-outside="true" : 스코프 외 클릭 시 closeAll 실행(document 이벤트)
 * @a11y
 *  - aria-expanded만 제어(aria-controls는 마크업 선택)
 *  - (선택) data-aria-label-base가 있으면 aria-label을 "... 열기/닫기"로 동기화
 * @maintenance
 *  - 페이지별 분기 금지(동작 동일, 표현/스타일은 CSS에서만 처리)
 *  - closeAll은 스코프 내부만 정리(외부 클릭/그룹 전환에 공용)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[toggle] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var ACTIVE = 'is-open';
  var GROUP_EXCEPT_KEY = 'toggleGroupExceptActive';
  var OUTSIDE_ACTIVE_KEY = 'toggleOutsideActive';

  // syncAriaLabel: aria-expanded(true/false)에 맞춰 aria-label("... 열기/닫기") 동기화(옵션)
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;
    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }

  // open: 패널 오픈 + 버튼 aria-expanded(true) 갱신
  function open($btn, $box) {
    var shouldCloseOnOutside = $btn.data('toggleOutside') === true;
    var isGroupExcept = $btn.data('toggleGroupExcept') === true;
    $box.addClass(ACTIVE);
    $box.data(OUTSIDE_ACTIVE_KEY, shouldCloseOnOutside);
    $box.data(GROUP_EXCEPT_KEY, isGroupExcept);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);
  }

  // close: 패널 닫기 + 버튼 aria-expanded(false) 갱신
  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $box.removeData(OUTSIDE_ACTIVE_KEY);
    $box.removeData(GROUP_EXCEPT_KEY);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);
  }

  // closeAll: 스코프 내 열린 패널/버튼을 일괄 닫기(그룹/외부클릭)
  function closeAll($scope) {
    // 패널: 예외로 표시된 패널은 닫지 않음
    $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
      var $box = $(this);
      if ($box.data(GROUP_EXCEPT_KEY) === true) return; // 그룹 제외 패널 유지

      $box.removeClass(ACTIVE);
      $box.removeData(OUTSIDE_ACTIVE_KEY);
      $box.removeData(GROUP_EXCEPT_KEY);
    });

    // 버튼: 열린 버튼 중 "유지되는 패널(예외)"에 연결된 버튼은 aria-expanded를 false로 내리지 않음
    var $openBtns = $scope.find('[data-toggle-btn][aria-expanded="true"]');
    $openBtns.each(function () {
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;
      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if ($box.length && $box.hasClass(ACTIVE) && $box.data(GROUP_EXCEPT_KEY) === true) {
        return; // 예외 패널이 유지 중이면 버튼도 열린 상태 유지
      }
      $btn.attr('aria-expanded', 'false');
      syncAriaLabel($btn);
    });
  }

  // bindOutsideClose: 스코프 밖 클릭 시, outside=true로 열린 패널만 닫기
  function bindOutsideClose($scope) {
    // 같은 스코프에 중복 바인딩 방지
    if ($scope.data('toggleOutsideBound') === true) return;
    $scope.data('toggleOutsideBound', true);
    $(document).on('click.uiToggleOutside', function (e) {
      // 스코프 내부 클릭은 무시(패널 유지)
      if ($scope.has(e.target).length) return;

      // outside=true 버튼으로 열린 패널만 닫기
      $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
        var $box = $(this);
        if ($box.data(OUTSIDE_ACTIVE_KEY) !== true) return;
        var target = $box.attr('data-toggle-box');
        var $btn = $scope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
        if (!$btn.length) return;
        close($btn, $box);
      });
    });
  }

  // bindScope: 스코프 내부에서 버튼 클릭 위임 처리(그룹이면 closeAll 후 open)
  function bindScope($scope) {
    $scope.on('click', '[data-toggle-btn]', function (e) {
      e.preventDefault();
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;
      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if (!$box.length) return;
      var isOpen = $box.hasClass(ACTIVE);
      var isGroup = $scope.data('toggleGroup') === true;
      var isGroupExcept = $btn.data('toggleGroupExcept') === true;
      if (isOpen) {
        close($btn, $box);
        return;
      }
      if (isGroup && !isGroupExcept) closeAll($scope);
      open($btn, $box);
    });

    // data-toggle-outside="true"가 있는 버튼이 이 스코프에 존재하면 바인딩
    if ($scope.find('[data-toggle-btn][data-toggle-outside="true"]').length) {
      bindOutsideClose($scope);
    }
  }
  window.UI.toggle = {
    // init: [data-toggle-scope]별로 이벤트 위임 바인딩
    init: function () {
      $('[data-toggle-scope]').each(function () {
        bindScope($(this));
      });
      console.log('[toggle] init');
    }
  };
  console.log('[toggle] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 397:
/***/ (function() {

/**
 * @file scripts/ui/quantity-stepper.js
 * @purpose
 * @description
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[quantity-stepper] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var EVENT_NS = '.uiQuantityStepper';
  var ROOT_SEL = '.quantity-control';
  var INPUT_SEL = '.quantity-input';
  var MEASURE_SEL = '.quantity-input-measure';
  var BTN_MINUS_SEL = '.btn-step.vits-minus-icon';
  var BTN_PLUS_SEL = '.btn-step.vits-plus-icon';
  var INIT_KEY = 'uiQuantityStepperInit';
  function toNumber(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  function onlyDigits(str) {
    return String(str || '').replace(/\D+/g, '');
  }
  function clamp(n, min, max) {
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }
  function getOptions($input) {
    return {
      step: toNumber($input.data('step'), 1),
      min: toNumber($input.data('min'), 1),
      max: toNumber($input.data('max'), Infinity),
      minW: 40
    };
  }
  function syncMeasureFont($input, $measure) {
    if (!$measure || !$measure.length) return;
    var font = $input.css('font');
    $measure.css({
      font: font,
      letterSpacing: $input.css('letter-spacing')
    });
  }
  function resizeInput($input, $measure, minW) {
    if (!$measure || !$measure.length) return;
    var v = $input.val();
    var text = v && String(v).length ? String(v) : '0';
    $measure.text(text);

    // 커서 여유
    var extra = 16;
    var w = $measure[0].offsetWidth + extra;
    if (w < minW) w = minW;
    $input.css('width', w + 'px');
  }
  function getValue($input, min, max) {
    var digits = onlyDigits($input.val());
    if ($input.val() !== digits) $input.val(digits);
    var n = digits === '' ? 0 : toNumber(digits, 0);
    return clamp(n, min, max);
  }
  function setValue($input, n, min, max) {
    $input.val(String(clamp(n, min, max)));
  }
  function syncDisabled($root, v, step, min, max, isDisabled) {
    var disabled = !!isDisabled;
    $root.find(BTN_MINUS_SEL).prop('disabled', disabled || v - step < min);
    $root.find(BTN_PLUS_SEL).prop('disabled', disabled || v + step > max);
  }
  function refresh($root) {
    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;
    var opts = getOptions($input);
    var v = getValue($input, opts.min, opts.max);
    setValue($input, v, opts.min, opts.max);
    resizeInput($input, $measure, opts.minW);
    syncDisabled($root, v, opts.step, opts.min, opts.max, $input.prop('disabled'));
  }
  function bindRoot($root) {
    if ($root.data(INIT_KEY)) return;
    $root.data(INIT_KEY, true);
    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;
    syncMeasureFont($input, $measure);
    $root.off('click' + EVENT_NS, BTN_MINUS_SEL);
    $root.off('click' + EVENT_NS, BTN_PLUS_SEL);
    $root.off('input' + EVENT_NS, INPUT_SEL);
    $root.on('click' + EVENT_NS, BTN_MINUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v - opts.step, opts.min, opts.max);
      refresh($root);
    });
    $root.on('click' + EVENT_NS, BTN_PLUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v + opts.step, opts.min, opts.max);
      refresh($root);
    });
    $root.on('input' + EVENT_NS, INPUT_SEL, function () {
      refresh($root);
    });
    refresh($root);
  }
  function bindResize() {
    $(window).off('resize' + EVENT_NS);
    $(window).on('resize' + EVENT_NS, function () {
      $(ROOT_SEL).each(function () {
        var $root = $(this);
        if (!$root.data(INIT_KEY)) return;
        var $input = $root.find(INPUT_SEL);
        var $measure = $root.find(MEASURE_SEL);
        if (!$input.length) return;
        syncMeasureFont($input, $measure);
        resizeInput($input, $measure, getOptions($input).minW);
      });
    });
  }
  window.UI.quantityStepper = {
    init: function (root) {
      var $scope = root ? $(root) : $(document);
      $scope.find(ROOT_SEL).each(function () {
        bindRoot($(this));
      });
      bindResize();
      console.log('[quantity-stepper] init');
    }
  };
  console.log('[quantity-stepper] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 538:
/***/ (function() {

/**
 * scripts/core/common.js
 * @purpose 공통 초기화/바인딩(실행 트리거)
 * @assumption
 *  - jQuery는 전역(window.jQuery 또는 window.$)에 존재해야 한다
 *  - UI.init은 core/ui.js에서 정의되어 있어야 한다
 * @maintenance
 *  - 페이지 의미 분기(gnb/main/detail 등) 로직 금지
 *  - 공통 실행(초기화 트리거)만 담당하고, 기능 구현은 ui/*로 분리한다
 *  - DOMReady에서 UI.init은 1회만 호출한다(중복 호출 금지)
 */
(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[common] jQuery not found (window.jQuery/window.$ undefined)');
    return;
  }
  $(function () {
    console.log('[common] DOM ready');
    if (window.UI && window.UI.init) window.UI.init();
  });
})(window.jQuery || window.$, window);

/***/ }),

/***/ 596:
/***/ (function() {

/**
 * @file scripts/ui/header-rank.js
 * @purpose 헤더 실시간 검색어 2줄 롤링(표시 전용)
 * @description
 *  - open/close는 toggle.js 담당(이 파일은 롤링/변동표시만)
 *  - 스코프: .header-main-search-rank[data-header-rank]
 *  - 데이터: [data-rank-item]의 data-prev-rank/data-curr-rank/data-word
 * @requires jQuery
 * @note data-rank-interval(ms)/data-rank-duration(ms)은 CSS transition 시간과 일치 권장
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[header-rank] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var SCOPE_SEL = '.header-main-search-rank[data-header-rank]';

  // toInt: 문자열→정수 변환(실패 시 null)
  function toInt(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  // calcMove: 순위 변동 계산(up/down/same/new + delta)
  function calcMove(prev, curr) {
    if (prev === null || typeof prev === 'undefined') return {
      move: 'new',
      delta: null
    };
    if (curr === null || typeof curr === 'undefined') return {
      move: 'same',
      delta: null
    };
    if (prev > curr) return {
      move: 'up',
      delta: prev - curr
    };
    if (prev < curr) return {
      move: 'down',
      delta: curr - prev
    };
    return {
      move: 'same',
      delta: 0
    };
  }

  // getInterval: 롤링 간격(ms) 읽기(비정상이면 기본값)
  function getInterval($scope) {
    var v = parseInt($scope.attr('data-rank-interval'), 10);
    if (isNaN(v) || v < 300) v = 2500;
    return v;
  }

  // getDuration: 롤링 애니메이션(ms) 읽기(비정상이면 기본값)
  function getDuration($scope) {
    var v = parseInt($scope.attr('data-rank-duration'), 10);
    if (isNaN(v) || v < 80) v = 600;
    return v;
  }

  // readList: DOM에서 랭킹 목록 수집(빈 word 제외)
  function readList($scope) {
    var items = [];
    $scope.find('[data-rank-list] [data-rank-item]').each(function () {
      var $it = $(this);
      var prev = toInt($it.attr('data-prev-rank'));
      var curr = toInt($it.attr('data-curr-rank'));
      var word = ($it.attr('data-word') || '').trim();
      if (!word) return;
      var mv = calcMove(prev, curr);
      items.push({
        currRank: curr,
        prevRank: prev,
        word: word,
        move: mv.move,
        delta: mv.delta
      });
    });
    return items;
  }

  // renderListMoves: 패널 리스트의 변동 표시만 갱신(텍스트/링크는 유지)
  function renderListMoves($scope, items) {
    var $rows = $scope.find('[data-rank-list] [data-rank-item]');
    $rows.each(function (i) {
      var it = items[i];
      if (!it) return;
      var $move = $(this).find('[data-rank-item-move]').first();
      if (!$move.length) return;
      $move.removeClass('rank-move-up rank-move-down rank-move-same rank-move-new');
      $move.addClass('rank-move-' + (it.move || 'same'));
      if (it.delta === null) $move.removeAttr('data-delta');else $move.attr('data-delta', String(it.delta));
    });
  }

  // buildRow: 롤링 표시 1줄 DOM 생성(현재 표시용)
  function buildRow(it) {
    var $row = $('<span class="header-rank-row"></span>');
    $row.append('<span class="header-rank-num">' + (it.currRank !== null ? it.currRank : '') + '</span>');
    $row.append('<span class="header-rank-word">' + (it.word || '') + '</span>');
    var moveClass = 'rank-move-' + (it.move || 'same');
    var deltaAttr = it.delta === null ? '' : ' data-delta="' + it.delta + '"';
    $row.append('<span class="header-rank-move  ' + moveClass + '"' + deltaAttr + ' aria-hidden="true"></span>');
    return $row;
  }

  // ensureRollingDom: 롤링 DOM이 없으면 생성 후 주입([data-rank-current] 내용 교체)
  function ensureRollingDom($scope, items) {
    var $link = $scope.find('[data-rank-current]').first();
    if (!$link.length) return null;
    var $existingView = $link.find('.header-rank-view').first();
    if ($existingView.length) {
      return {
        $view: $existingView,
        $track: $existingView.find('.header-rank-track').first(),
        $rowA: $existingView.find('.header-rank-row').eq(0),
        $rowB: $existingView.find('.header-rank-row').eq(1)
      };
    }
    var $view = $('<span class="header-rank-view"></span>');
    var $track = $('<span class="header-rank-track"></span>');
    var $rowA = buildRow(items[0]);
    var $rowB = buildRow(items[1] || items[0]);
    $track.append($rowA).append($rowB);
    $view.append($track);

    // [data-rank-current]는 롤링 뷰로 교체됨(기존 텍스트 제거)
    $link.empty().append($view);
    return {
      $view: $view,
      $track: $track,
      $rowA: $rowA,
      $rowB: $rowB
    };
  }

  // copyRow: 롤링 row 내용/상태 덮어쓰기(번호/키워드/변동)
  function copyRow($toRow, it) {
    $toRow.find('.header-rank-num').text(it.currRank !== null ? it.currRank : '');
    $toRow.find('.header-rank-word').text(it.word || '');
    var $mv = $toRow.find('.header-rank-move');
    $mv.removeClass('rank-move-up rank-move-down rank-move-same rank-move-new');
    $mv.addClass('rank-move-' + (it.move || 'same'));
    if (it.delta === null) $mv.removeAttr('data-delta');else $mv.attr('data-delta', String(it.delta));
  }

  // bindRolling: 롤링 타이머 시작(중복 타이머 방지)
  function bindRolling($scope, items, dom) {
    var interval = getInterval($scope);
    var duration = getDuration($scope);
    var timer = null;
    var animating = false;
    var idx = 0;

    // stop: 기존 타이머 정리
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // resetTrackWithoutBounce: transition 끄고 원위치 복귀(깜빡임/튐 방지)
    function resetTrackWithoutBounce() {
      dom.$track.css('transition', 'none');
      dom.$view.removeClass('is-rolling');
      dom.$track[0].getBoundingClientRect();
      dom.$track.css('transition', '');
    }

    // tick: rowB에 다음 데이터 주입 → 롤링 → rowA 동기화 후 리셋
    function tick() {
      if (animating) return;
      if (!items.length) return;
      animating = true;
      var nextIdx = (idx + 1) % items.length;
      var nextItem = items[nextIdx];
      copyRow(dom.$rowB, nextItem);
      dom.$view.addClass('is-rolling');
      window.setTimeout(function () {
        copyRow(dom.$rowA, nextItem);
        resetTrackWithoutBounce();
        idx = nextIdx;
        animating = false;
      }, duration);
    }
    stop();
    timer = setInterval(tick, interval);
  }

  // initScope: 스코프 1개 초기화(최소 2개 이상일 때만 롤링)
  function initScope($scope) {
    var items = readList($scope);
    if (items.length < 2) return;
    renderListMoves($scope, items);
    var dom = ensureRollingDom($scope, items);
    if (!dom) return;
    bindRolling($scope, items, dom);
  }
  window.UI.headerRank = {
    // init: 스코프별로 롤링 바인딩
    init: function () {
      $(SCOPE_SEL).each(function () {
        initScope($(this));
      });
      console.log('[header-rank] init');
    }
  };
  console.log('[header-rank] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 755:
/***/ (function() {

/**
 * @file scripts/ui/chip-button.js
 * @purpose 칩 버튼 제거(삭제) 공통: data-속성 기반
 * @description
 *  - 트리거: [data-chip-action="remove"] 클릭 시 해당 칩(.vits-chip-button) DOM 제거
 *  - 대상 식별: data-chip-value(옵션) 값은 후속 연동(필터 상태 동기화 등)에 사용 가능
 * @a11y
 *  - X 버튼은 aria-label로 "… 삭제" 제공(마크업에서 처리)
 * @maintenance
 *  - 동작은 공통(삭제만), 표현/상태(활성 등)는 CSS에서 처리
 *  - 이벤트는 위임 방식으로 1회 바인딩(동적 렌더에도 대응)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[chip-button] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var EVENT_NS = '.uiChipButton';
  var GROUP_SEL = '.vits-chip-button-group';
  var REMOVE_SEL = '[data-chip-action="remove"]';
  var CHIP_SEL = '.vits-chip-button';

  // 칩 엘리먼트 찾기: 클릭 지점 기준으로 가장 가까운 칩 컨테이너
  function getChipEl($target) {
    return $target.closest(CHIP_SEL);
  }

  // 삭제 값 읽기: 연동 필요 시 외부에서 활용(없어도 삭제 동작은 수행)
  function getChipValue($chip) {
    return $chip.attr('data-chip-value') || '';
  }

  // 칩 제거: DOM에서 제거만 수행(부가 연동은 이벤트로 넘김)
  function removeChip($chip) {
    if (!$chip || !$chip.length) return;
    var value = getChipValue($chip);
    $chip.remove();

    // 외부 연동용 커스텀 이벤트(필요 시 상위에서 수신)
    $(document).trigger('ui:chip-remove', {
      value: value
    });
  }

  // 클릭 핸들러: remove 트리거 클릭 시 해당 칩 제거
  function onClickRemove(e) {
    var $t = $(e.target);

    // 아이콘(svg 등) 클릭도 버튼 클릭으로 처리
    if (!$t.is(REMOVE_SEL)) $t = $t.closest(REMOVE_SEL);
    if (!$t.length) return;
    e.preventDefault();
    var $chip = getChipEl($t);
    removeChip($chip);
  }

  // 이벤트 위임 바인딩: 그룹 내부에서만 remove 트리거 처리
  function bind() {
    $(document).off('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL);
    $(document).on('click' + EVENT_NS, GROUP_SEL + ' ' + REMOVE_SEL, onClickRemove);
  }
  window.UI.chipButton = {
    // init: 문서 전체에 1회 위임 바인딩
    init: function () {
      bind();
      console.log('[chip-button] init');
    }
  };
  console.log('[chip-button] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 795:
/***/ (function() {

/**
 * @file scripts/ui/footer/footer-biz-info.js
 * @purpose 푸터 '사업자정보조회' 레이어 팝업에 통신판매사업자 등록현황(OpenAPI) 결과를 테이블로 주입
 * @assumption
 *  - 트리거: [data-toggle-btn="biz-info"] + data-biz-brno="사업자등록번호(숫자)"
 *  - 레이어: [data-toggle-box="biz-info"] (open/close는 toggle.js가 담당, 여기서는 데이터 조회/주입만)
 *  - 상태/영역: [data-biz-status], [data-biz-table], [data-biz-field="..."]
 * @ops -note
 *  - 현재 인증키는 개인 계정 기준(개발/테스트용)이며,
 *    운영 서버 반영 시 회사 계정/회사 정보 기준으로 인증키 및 관련 정보 수정/교체 요청 필요
 * @note
 *  - resultType=json 사용
 *  - OP_PATH는 사업자등록번호별 조회(/getMllBsBiznoInfo_2) 기준
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var ROOT_SEL = '[data-footer-biz]'; // 푸터 스코프(없으면 document 기준으로도 동작)
  var LAYER_SEL = '[data-toggle-box="modal-company"]';
  var TRIGGER_SEL = '.company-btn-lookup';
  var END_POINT = 'https://apis.data.go.kr/1130000/MllBs_2Service';
  var OP_PATH = '/getMllBsBiznoInfo_2';

  // 실제 키로 교체(Encoding 키 권장)
  var SERVICE_KEY = '06d4351e0dfaaa207724b9c64e8fcc9814fce520ff565409cd7b70715706f34b';

  // 레이어 내부 셀렉터(주입 대상)
  var STATUS_SEL = '[data-biz-status]';
  var TABLE_SEL = '[data-biz-table]';
  var FIELD_SEL = '[data-biz-field]';

  // 전역 1건 캐시(회사 고정 1개 기준: 최초 조회 후 재사용)
  var cache = {
    brno: null,
    item: null,
    pending: null
  };

  // root 내부 주요 엘리먼트 캐시
  function getEls($root) {
    var $scope = $root && $root.length ? $root : $(document);
    var $layer = $scope.find(LAYER_SEL).first();
    return {
      $root: $root && $root.length ? $root : $scope,
      $layer: $layer,
      $status: $layer.find(STATUS_SEL).first(),
      $table: $layer.find(TABLE_SEL).first(),
      $fields: $layer.find(FIELD_SEL)
    };
  }

  // 테이블 셀에 텍스트 주입(없으면 '-' 처리)
  function setFieldText(els, key, value) {
    var $cell = els.$layer.find('[data-biz-field="' + key + '"]').first();
    $cell.text(value == null || value === '' ? '-' : String(value));
  }

  // 사업자등록번호 표시용 포맷(000-00-00000)
  function formatBrno(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 10) return n.slice(0, 3) + '-' + n.slice(3, 5) + '-' + n.slice(5);
    return n || '-';
  }

  // YYYYMMDD → YYYY.MM.DD 표시
  function formatYmd(v) {
    var n = String(v || '').replace(/\D/g, '');
    if (n.length === 8) return n.slice(0, 4) + '.' + n.slice(4, 6) + '.' + n.slice(6);
    return n || '-';
  }

  // API 호출 URL 조립(사업자등록번호별 조회)
  function buildUrl(brno) {
    return END_POINT + OP_PATH + '?serviceKey=' + encodeURIComponent(SERVICE_KEY) + '&pageNo=1' + '&numOfRows=10' + '&resultType=json' + '&brno=' + encodeURIComponent(brno);
  }
  function pickFirstItem(json) {
    // OpenAPI 표준 래퍼가 있으면 body부터, 아니면 json 자체부터 탐색
    var body = json && json.response && json.response.body;
    var root = body || json;

    // 1) 가장 흔한 패턴들 먼저 시도
    var v;

    // body.items.item
    v = root && root.items && root.items.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.item
    v = root && root.item;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // body.items
    v = root && root.items;
    if (Array.isArray(v)) return v[0] || null;
    if (v && typeof v === 'object') return v;

    // 2) 그래도 못 찾으면: root 안에서 "데이터처럼 보이는 객체"를 DFS로 1개 찾아서 반환
    function findFirstObject(node, depth) {
      if (!node || depth > 8) return null;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i += 1) {
          var r1 = findFirstObject(node[i], depth + 1);
          if (r1) return r1;
        }
        return null;
      }
      if (typeof node === 'object') {
        var keys = Object.keys(node);

        // 원시값(문자/숫자/불리언) 필드가 3개 이상이면 “데이터 객체”로 간주
        var primitiveCount = 0;
        for (var k = 0; k < keys.length; k += 1) {
          var val = node[keys[k]];
          var t = typeof val;
          if (val == null) continue;
          if (t === 'string' || t === 'number' || t === 'boolean') primitiveCount += 1;
        }
        if (primitiveCount >= 3) return node;

        // 자식 탐색
        for (var j = 0; j < keys.length; j += 1) {
          var r2 = findFirstObject(node[keys[j]], depth + 1);
          if (r2) return r2;
        }
      }
      return null;
    }
    return findFirstObject(root, 0);
  }

  // 레이어 상태(로딩/에러/성공) UI만 담당
  function setUiLoading(els) {
    if (els.$status.length) els.$status.text('조회 중입니다…');
    if (els.$table.length) els.$table.prop('hidden', true);
  }
  function setUiError(els, msg) {
    if (els.$status.length) els.$status.text(msg || '조회에 실패했습니다.');
    if (els.$table.length) els.$table.prop('hidden', true);
  }
  function setUiSuccess(els) {
    if (els.$status.length) els.$status.text(''); // 성공 시 문구 비움
    if (els.$table.length) els.$table.prop('hidden', false);
  }

  // 테이블에 필요한 "일반적인" 필드만 매핑(요구사항 최소셋)
  function renderBizInfo(els, brno, item) {
    // API 스펙 변경 시 여기 매핑만 업데이트하면 됨
    setFieldText(els, 'bzmnNm', item.bzmnNm); // 상호
    setFieldText(els, 'brno', formatBrno(item.brno || brno)); // 사업자등록번호
    setFieldText(els, 'operSttusCdNm', item.operSttusCdNm); // 운영상태
    setFieldText(els, 'ctpvNm', item.ctpvNm); // 시/도
    setFieldText(els, 'dclrInsttNm', item.dclrInsttNm); // 신고기관
    setFieldText(els, 'fromYmd', formatYmd(item.fromYmd)); // 조회기간/신고일(스펙에 맞게 조정)
    setFieldText(els, 'prmmiMnno', item.prmmiMnno); // 인허가(등록)번호
  }

  // 동일 사업자번호는 1회만 조회하고 재사용(중복 호출 방지)
  function fetchBizInfoOnce(brno) {
    if (cache.item && cache.brno === brno) return $.Deferred().resolve(cache.item).promise();
    if (cache.pending && cache.brno === brno) return cache.pending;
    cache.brno = brno;
    cache.pending = $.ajax({
      url: buildUrl(brno),
      method: 'GET',
      dataType: 'text',
      timeout: 8000
    }).then(function (text) {
      var json = typeof text === 'string' ? JSON.parse(text) : text;

      // 지금 단계에서 이 로그가 “정답”
      console.log('[biz] json=', json);
      var item = pickFirstItem(json);
      console.log('[biz] item=', item);
      console.log('[biz] keys=', item ? Object.keys(item) : null);
      if (!item) return $.Deferred().reject('EMPTY').promise();
      cache.item = item;
      return item;
    }).always(function () {
      cache.pending = null;
    });
    return cache.pending;
  }

  // 트리거에서 사업자번호 읽기(숫자만)
  function readBrno($btn) {
    return String($btn.attr('data-biz-brno') || '').replace(/\D/g, '');
  }
  function bindTrigger(els) {
    $(document).on('click.footerBizInfo', TRIGGER_SEL, function () {
      var brno = readBrno($(this));
      if (!els.$layer.length) return;
      if (!brno) {
        setUiError(els, '사업자등록번호가 없습니다.');
        return;
      }

      // 캐시가 없을 때만 로딩 표시(선조회 했으면 안 뜸)
      if (!(cache.item && cache.brno === brno)) setUiLoading(els);
      fetchBizInfoOnce(brno).then(function (item) {
        setUiSuccess(els);

        // 디버그(화면에 “데이터 들어옴”을 강제로 표시)
        // if (els.$status.length) els.$status.text(JSON.stringify(item).slice(0, 200));

        renderBizInfo(els, brno, item);
      }).fail(function (err) {
        setUiError(els, err === 'EMPTY' ? '조회 결과가 없습니다.' : '조회에 실패했습니다.');
      }).always(function () {
        if (els.$status.length && els.$status.text() === '조회 중입니다…') {
          setUiError(els, '조회에 실패했습니다.');
        }
      });
    });
  }

  // root 1개 초기화
  function initRoot($root) {
    var els = getEls($root);
    if (!els.$layer.length) return;

    // 클릭 바인딩은 그대로
    bindTrigger(els);

    // --- S: 페이지 진입 시 1회 선조회(prefetch) ---
    // 버튼에 박아둔 사업자번호를 1개만 가져와서 캐시에 저장
    var $btn = $(TRIGGER_SEL).first();
    var brno = readBrno($btn);
    if (!brno) return;

    // 선조회는 사용자에게 로딩 문구를 강제로 보여줄 필요 없음(팝업 열기 전이니까)
    fetchBizInfoOnce(brno).then(function (item) {
      // 팝업을 열지 않아도, 미리 테이블에 값만 채워둠(열면 즉시 보임)
      renderBizInfo(els, brno, item);
    });
    // --- E: 페이지 진입 시 1회 선조회(prefetch) ---
  }
  window.UI.footerBizInfo = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      var $roots = $(ROOT_SEL);

      // data-footer-biz 스코프가 없으면 문서 기준으로 1회만 초기화
      if (!$roots.length) {
        initRoot($(document));
        return;
      }
      $roots.each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 803:
/***/ (function() {

/**
 * @file scripts/ui/form/textarea.js
 * @purpose textarea 공통: 글자수 카운트/제한(그래핌 기준) + IME(조합) 대응 + 스크롤 상태 클래스 토글
 * @scope .vits-textarea 컴포넌트 내부 textarea만 적용(전역 영향 없음)
 *
 * @rule
 *  - 높이/줄수/리사이즈는 CSS에서만 관리(JS는 height에 관여하지 않음)
 *  - 스크롤 발생 시에만 root에 .is-scroll
 *
 * @state
 *  - root.is-scroll: textarea 실제 overflow 발생 시 토글
 *
 * @option (root) data-textarea-count="true|false"
 * @option (textarea) data-max-length="500" // 입력 제한(선택, 그래핌 기준)
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[textarea] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  window.UI.textarea = window.UI.textarea || {};
  var ROOT = '.vits-textarea';
  var TA = ROOT + ' textarea';
  var NS = '.uiTextarea';
  var MODE = {
    SINGLE_FIXED: 'single-fixed',
    SINGLE_AUTO: 'single-auto',
    SINGLE_LOCK: 'single-lock',
    MULTI_FIXED: 'multi-fixed'
  };

  // func: 숫자 data-속성 파싱(없으면 0)
  function intAttr($el, name) {
    var v = parseInt($el.attr(name), 10);
    return Number.isFinite(v) ? v : 0;
  }

  // func: root 옵션 조회(문자열)
  function rootOpt($root, name) {
    return $root.attr(name) || '';
  }

  // func: root 옵션 조회(숫자)
  function rootOptInt($root, name) {
    return intAttr($root, name);
  }

  // func: 그래핌(사용자 체감 글자) 단위 카운트
  function graphemeCount(str) {
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var c = 0;
        for (var it = seg.segment(str)[Symbol.iterator](), s = it.next(); !s.done; s = it.next()) c++;
        return c;
      }
    } catch (err) {
      console.error(err);
    }
    return Array.from(str).length;
  }

  // func: 최대 글자수 기준 자르기(그래핌 우선)
  function sliceToMax(str, max) {
    if (!max) return str;
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var out = '';
        var i = 0;
        for (var it = seg.segment(str)[Symbol.iterator](), s = it.next(); !s.done; s = it.next()) {
          if (i >= max) break;
          out += s.value.segment;
          i++;
        }
        return out;
      }
    } catch (err) {
      console.error(err);
    }
    return Array.from(str).slice(0, max).join('');
  }

  // func: 입력 제한 적용(조합 중엔 미적용)
  function enforceMaxLength($ta, isComposing) {
    var maxLen = intAttr($ta, 'data-max-length');
    if (!maxLen || isComposing) return;
    var v = $ta.val() || '';
    var next = sliceToMax(v, maxLen);
    if (next !== v) $ta.val(next);
  }

  // func: css 값(px) 파싱
  function pxNum(v) {
    var n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  // func: textarea 스타일 기반 line/extra 계산
  function metrics($ta) {
    var cs = window.getComputedStyle($ta[0]);
    var lh = pxNum(cs.lineHeight);
    if (!lh) lh = pxNum(cs.fontSize) * 1.5;
    var pt = pxNum(cs.paddingTop);
    var pb = pxNum(cs.paddingBottom);
    var bt = pxNum(cs.borderTopWidth);
    var bb = pxNum(cs.borderBottomWidth);
    return {
      line: lh,
      extra: pt + pb + bt + bb
    };
  }

  // func: rows 기준 높이(px) 계산
  function heightByRows($ta, rows) {
    var m = metrics($ta);
    var r = Math.max(1, rows || 1);
    return m.line * r + m.extra;
  }

  // func: textarea 높이(px) 주입
  function setHeightPx($ta, px) {
    $ta[0].style.height = Math.max(0, px) + 'px';
  }

  // func: inline height 제거(CSS min-height/height 규칙으로 복귀)
  function clearHeightPx($ta) {
    $ta[0].style.height = '';
    $ta.removeClass('is-clamped is-locked');
  }

  // func: scrollHeight 기반 자동 높이 계산(clamp)
  function calcAutoHeightPx($ta, minPx, maxPx) {
    $ta[0].style.height = 'auto';
    var h = $ta[0].scrollHeight || 0;
    if (minPx) h = Math.max(h, minPx);
    if (maxPx) h = Math.min(h, maxPx);
    return h;
  }

  // func: 카운트 UI 갱신(옵션 true일 때만)
  function updateCountUI($root, $ta) {
    if (rootOpt($root, 'data-textarea-count') !== 'true') return;
    var $count = $root.find('[data-ui-textarea-count]');
    if (!$count.length) return;
    var v = $ta.val() || '';
    $count.text(String(graphemeCount(v)));
    var maxLen = intAttr($ta, 'data-max-length');
    var $max = $root.find('[data-ui-textarea-max]');
    if (maxLen && $max.length) $max.text(String(maxLen));
  }

  // func: 스크롤 발생 여부 감지(스크롤바 표시 시점 기준)
  function syncScrollState($root, $ta) {
    var el = $ta[0];
    if (!el) return;

    // 스크롤이 가능한 overflow 상태만 대상(visible/hidden이면 스크롤바가 안 뜸)
    var oy = window.getComputedStyle(el).overflowY;
    var canScroll = oy === 'auto' || oy === 'scroll';
    if (!canScroll) {
      $root.removeClass('is-scroll');
      $ta.removeClass('vits-scrollbar');
      return;
    }

    // 실제 overflow 판단(1px 버퍼로 오차 방지)
    var isOverflow = el.scrollHeight - el.clientHeight > 1;
    $root.toggleClass('is-scroll', isOverflow);
    $ta.toggleClass('vits-scrollbar', isOverflow); // 내부 스크롤 스킨: 정책대로 직접 부여
  }

  // func: fixed 모드 처리(높이는 CSS가 담당)
  function syncFixedByCss($root, $ta) {
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
    clearHeightPx($ta);
  }

  // func: single-auto 높이 동기화(1줄 → max-lines까지 확장)
  function syncSingleAuto($root, $ta) {
    var baseRows = intAttr($ta, 'rows') || 1;
    var maxLines = rootOptInt($root, 'data-textarea-max-lines') || baseRows;
    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, maxLines);
    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);
    $ta.toggleClass('is-clamped', next >= maxPx);
    $ta.removeClass('is-locked');
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
  }

  // func: single-lock 높이 동기화(지정 줄수 도달 시 고정 전환)
  function syncSingleLock($root, $ta) {
    var locked = rootOpt($root, 'data-textarea-locked') === 'true';
    var lockLines = rootOptInt($root, 'data-textarea-lock-lines') || 1;
    var baseRows = intAttr($ta, 'rows') || 1;
    if (locked) {
      var lockPx = rootOptInt($root, 'data-textarea-locked-px');
      if (lockPx) setHeightPx($ta, lockPx);
      $ta.addClass('is-locked');
      return;
    }
    var minPx = heightByRows($ta, baseRows);
    var maxPx = heightByRows($ta, lockLines);
    var next = calcAutoHeightPx($ta, minPx, maxPx);
    setHeightPx($ta, next);
    var v = ($ta.val() || '').replace(/\r\n/g, '\n');
    var lines = v.length ? v.split('\n').length : 1;
    if (lines >= lockLines) {
      $root.attr('data-textarea-locked', 'true');
      $root.attr('data-textarea-locked-px', String(next));
      $ta.addClass('is-locked');
    }
    $ta.toggleClass('is-clamped', next >= maxPx);
  }

  // func: 모드별 적용(제한 → 높이 → 카운트)
  function apply($root, $ta, opts) {
    var isComposing = !!(opts && opts.isComposing);
    var mode = rootOpt($root, 'data-textarea-mode');
    enforceMaxLength($ta, isComposing);
    if (mode === MODE.SINGLE_FIXED || mode === MODE.MULTI_FIXED) syncFixedByCss($root, $ta);
    if (mode === MODE.SINGLE_AUTO) syncSingleAuto($root, $ta);
    if (mode === MODE.SINGLE_LOCK) syncSingleLock($root, $ta);
    updateCountUI($root, $ta);

    // 스크롤바 표시 시점에만 상태 클래스 토글
    syncScrollState($root, $ta);
  }

  // func: 단일 인스턴스 초기화
  function initOne($ta) {
    var $root = $ta.closest(ROOT);
    if (!$root.length) return;
    apply($root, $ta, {
      isComposing: false
    });
  }

  // func: 이벤트 바인딩(위임 1회)
  function bind() {
    $(document).on('compositionstart' + NS, TA, function () {
      $(this).data('isComposing', true);
    }).on('compositionend' + NS, TA, function () {
      var $ta = $(this);
      $ta.data('isComposing', false);
      initOne($ta);
    });
    $(document).on('input' + NS, TA, function () {
      var $ta = $(this);
      var $root = $ta.closest(ROOT);
      if (!$root.length) return;
      apply($root, $ta, {
        isComposing: !!$ta.data('isComposing')
      });
    });
  }

  // func: root 범위 초기화(부분 렌더 지원)
  function init(root) {
    var $root = root ? $(root) : $(document);
    $root.find(TA).each(function () {
      initOne($(this));
    });
  }
  window.UI.textarea.init = function (root) {
    if (!window.UI.textarea.__bound) {
      bind();
      window.UI.textarea.__bound = true;
    }
    init(root);
  };
})(window.jQuery, window, document);

/***/ }),

/***/ 809:
/***/ (function() {

/**
 * @file scripts/ui/category/plp-titlebar-research.js
 * @purpose PLP 결과 내 재검색: submit 시 칩 생성 + 삭제(기존 UI.chipButton) + 좌/우(한 칩씩) + 연관검색어 노출
 * @assumption
 *  - root: .vits-plp-titlebar
 *  - search form: [data-search-form], input: [data-search-input]
 *  - chip ui: [data-chip-ui] 내부
 *    - scroller: [data-chip-scroller] (가로 스크롤 컨테이너)
 *    - group: .vits-chip-button-group (칩 컨테이너, UI.chipButton의 위임 대상)
 *    - nav: [data-chip-prev], [data-chip-next] (있으면 한 칩씩 이동)
 *  - related ui: [data-related-ui], list: [data-related-list]
 *  - remove: [data-chip-action="remove"] → UI.chipButton가 DOM 제거 + ui:chip-remove 트리거
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var ROOT_SEL = '.vits-plp-titlebar';
  var CLS_HIDDEN = 'is-hidden';
  function getEls($root) {
    var $form = $root.find('[data-search-form]').first();
    var $input = $root.find('[data-search-input]').first();
    var $chipUI = $root.find('[data-chip-ui]').first();
    var $relatedUI = $root.find('[data-related-ui]').first();

    // 칩 컨테이너(삭제 위임 대상)
    var $chipGroup = $chipUI.find('.vits-chip-button-group').first();

    // 스크롤 컨테이너(없으면 group을 스크롤 컨테이너로 사용)
    var $scroller = $chipUI.find('[data-chip-scroller]').first();
    if (!$scroller.length) $scroller = $chipGroup;
    var $btnPrev = $chipUI.find('[data-chip-prev]').first();
    var $btnNext = $chipUI.find('[data-chip-next]').first();
    var $relatedList = $relatedUI.find('[data-related-list]').first();
    return {
      $root: $root,
      $form: $form,
      $input: $input,
      $chipUI: $chipUI,
      $chipGroup: $chipGroup,
      $scroller: $scroller,
      $btnPrev: $btnPrev,
      $btnNext: $btnNext,
      $relatedUI: $relatedUI,
      $relatedList: $relatedList
    };
  }
  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }
  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }
  function setVisible($el, on) {
    if (!$el || !$el.length) return;
    $el.toggleClass(CLS_HIDDEN, !on);
  }
  function hasAnyChip(els) {
    return els.$chipGroup && els.$chipGroup.length && els.$chipGroup.find('.vits-chip-button').length > 0;
  }
  function hasChipValue(els, value) {
    if (!els.$chipGroup || !els.$chipGroup.length) return false;
    return els.$chipGroup.find('.vits-chip-button[data-chip-value="' + value + '"]').length > 0;
  }

  // 칩 DOM 추가(삭제는 UI.chipButton이 처리)
  function appendChip(els, text) {
    var v = trimText(text);
    if (!v) return false;

    // 중복 방지
    if (hasChipValue(els, v)) return false;

    // chip-button.ejs action='x' 형태에 맞춤(아이콘은 CSS로 처리 권장)
    var html = '' + '<div class="vits-chip-button type-outline" data-chip-value="' + v + '">' + '  <span class="text">' + v + '</span>' + '  <button type="button" class="remove" data-chip-action="remove" aria-label="' + v + ' 삭제">' + '    <span class="ic ic-x" aria-hidden="true"></span>' + '  </button>' + '</div>';
    els.$chipGroup.append(html);
    return true;
  }
  function getMaxScrollLeft(scrollerEl) {
    return Math.max(0, (scrollerEl.scrollWidth || 0) - (scrollerEl.clientWidth || 0));
  }
  function updateNav(els) {
    // 버튼이 없으면(마크업 미추가) 네비 기능 자체를 생략
    if (!els.$btnPrev.length || !els.$btnNext.length) return;
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;
    var max = getMaxScrollLeft(scrollerEl);
    var x = scrollerEl.scrollLeft || 0;

    // 1px 오차 보정(모바일 관성 스크롤)
    els.$btnPrev.prop('disabled', x <= 1);
    els.$btnNext.prop('disabled', x >= max - 1);
  }
  function getChipItems(els) {
    if (!els.$chipGroup.length) return [];
    return els.$chipGroup[0].querySelectorAll('.vits-chip-button');
  }

  // 한 칩씩 이동(다음)
  function goNextChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;
    var items = getChipItems(els);
    if (!items || !items.length) return;
    var x = scrollerEl.scrollLeft || 0;
    for (var i = 0; i < items.length; i += 1) {
      var left = items[i].offsetLeft || 0;
      if (left > x + 1) {
        scrollerEl.scrollTo({
          left: left,
          behavior: 'smooth'
        });
        return;
      }
    }
    scrollerEl.scrollTo({
      left: getMaxScrollLeft(scrollerEl),
      behavior: 'smooth'
    });
  }

  // 한 칩씩 이동(이전)
  function goPrevChip(els) {
    var scrollerEl = els.$scroller[0];
    if (!scrollerEl) return;
    var items = getChipItems(els);
    if (!items || !items.length) return;
    var x = scrollerEl.scrollLeft || 0;
    for (var i = items.length - 1; i >= 0; i -= 1) {
      var left = items[i].offsetLeft || 0;
      if (left < x - 1) {
        scrollerEl.scrollTo({
          left: left,
          behavior: 'smooth'
        });
        return;
      }
    }
    scrollerEl.scrollTo({
      left: 0,
      behavior: 'smooth'
    });
  }
  function syncVisibility(els) {
    var show = hasAnyChip(els);
    setVisible(els.$chipUI, show);
    setVisible(els.$relatedUI, show);
    window.requestAnimationFrame(function () {
      updateNav(els);
    });
  }
  function bindEvents(els) {
    // 검색 submit: 페이지 이동 막고 칩 생성
    els.$form.on('submit.plpResearch', function (e) {
      e.preventDefault();
      var q = normalizeSpaces(els.$input.val());
      if (!q) return;
      var tokens = q.split(' ');
      var changed = false;
      for (var i = 0; i < tokens.length; i += 1) {
        if (appendChip(els, tokens[i])) changed = true;
      }
      if (!changed) return;
      syncVisibility(els);

      // 추가 성공 시 입력창 비우고 포커스 유지
      els.$input.val('');
      window.requestAnimationFrame(function () {
        els.$input.trigger('focus');
      });
    });

    // 좌/우 버튼(있을 때만)
    if (els.$btnNext.length && els.$btnPrev.length) {
      els.$btnNext.on('click.plpResearch', function () {
        goNextChip(els);
        window.setTimeout(function () {
          updateNav(els);
        }, 0);
      });
      els.$btnPrev.on('click.plpResearch', function () {
        goPrevChip(els);
        window.setTimeout(function () {
          updateNav(els);
        }, 0);
      });
    }

    // 스크롤/리사이즈 시 버튼 상태 갱신
    els.$scroller.on('scroll.plpResearch', function () {
      updateNav(els);
    });
    $(window).on('resize.plpResearch', function () {
      updateNav(els);
    });

    // 연관검색어 클릭 → 칩 추가(원치 않으면 제거)
    if (els.$relatedList.length) {
      els.$relatedList.on('click.plpResearch', '[data-related-item]', function (e) {
        e.preventDefault();
        var kw = trimText($(this).text());
        if (!kw) return;
        if (appendChip(els, kw)) syncVisibility(els);
      });
    }

    // chip-button.js 삭제 후 커스텀 이벤트 수신 → 노출/네비 동기화
    $(document).on('ui:chip-remove.plpResearch', function () {
      window.requestAnimationFrame(function () {
        syncVisibility(els);
      });
    });
  }
  function initRoot($root) {
    var els = getEls($root);

    // 필수
    if (!els.$form.length || !els.$input.length) return;
    if (!els.$chipUI.length || !els.$relatedUI.length) return;
    if (!els.$chipGroup.length) return; // 현재 구조에서 가장 중요

    // 초기 숨김
    setVisible(els.$chipUI, false);
    setVisible(els.$relatedUI, false);
    syncVisibility(els);
    bindEvents(els);
  }
  window.UI.plpTitlebarResearch = {
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 865:
/***/ (function() {

/**
 * @file scripts/ui/form/select.js
 * @purpose select 공통: 단독/브레드크럼(1~3뎁스) 셀렉트 UI + 옵션 렌더링 + placeholder/선택값 표시 + 연동 활성화 규칙
 * @scope [data-vits-select] 컴포넌트만 적용(전역 영향 없음)
 *
 * @rule
 *  - 브레드크럼:
 *    - 1뎁스 선택 → 2뎁스 옵션 주입/활성(옵션 없으면 disabled 유지 + is-no-option)
 *    - 2뎁스 선택 → 3뎁스 옵션 주입/활성(옵션 없으면 disabled 유지 + is-no-option)
 *    - placeholder(선택값 '')면 다음뎁스 비활성
 *  - 옵션 데이터는 window.__mockData.category.tree 기준(categoryCode/categoryNm/categoryList)
 *
 * @state
 *  - root.vits-select-open: 옵션 리스트 오픈 상태
 *  - root.vits-select-disabled: 비활성 상태(클릭 차단)
 *  - root.is-no-option: 하위 옵션 없음 상태(스타일링용)
 *  - option.vits-select-selected: 선택 옵션 표시
 *
 * @option (root) data-root="groupId" // 브레드크럼 그룹 식별자(같은 값끼리 연동)
 * @option (root) data-depth="1|2|3"  // 브레드크럼 뎁스(단독이면 생략 가능)
 * @hook  (list) data-vits-select-list // 옵션 컨테이너(ul)
 * @hook  (hidden) data-vits-select-hidden // 선택값 저장
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.log('[select] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var NS = '.uiSelect';
  function getTree() {
    var md = window.__mockData;
    return md && md.category && Array.isArray(md.category.tree) ? md.category.tree : [];
  }
  function getGroup($root) {
    return $root.attr('data-root') || '';
  }
  function getDepth($root) {
    return parseInt($root.attr('data-depth'), 10) || 0;
  }
  function getGroupRoots(group) {
    return $(ROOT).filter(function () {
      return ($(this).attr('data-root') || '') === group;
    });
  }
  function findDepth($roots, depth) {
    var $found = $();
    $roots.each(function () {
      var $r = $(this);
      if (getDepth($r) === depth) $found = $found.add($r);
    });
    return $found;
  }
  function closeAll() {
    $(ROOT).removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');
  }
  function openOne($root) {
    closeAll();
    $root.addClass('vits-select-open');
    $root.find(TRIGGER).attr('aria-expanded', 'true');
  }
  function setDisabled($root, disabled) {
    $root.toggleClass('vits-select-disabled', !!disabled);
    $root.find(TRIGGER).prop('disabled', !!disabled);
    if (disabled) {
      $root.removeClass('vits-select-open').find(TRIGGER).attr('aria-expanded', 'false');
    }
  }
  function setNoOption($root, on) {
    $root.toggleClass('is-no-option', !!on);
  }
  function resetToPlaceholder($root, clearOptions) {
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');
    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) $hidden.val('');
    $root.find(OPT).removeClass('vits-select-selected').attr('aria-selected', 'false');
    if (clearOptions) $root.find(LIST).empty();
  }
  function setSelectedByValue($root, value) {
    var v = String(value || '');
    if (!v) return false;

    // // hidden 값 기준으로 옵션 선택 복원
    var $match = $root.find(OPT + '[data-value="' + v.replace(/"/g, '\\"') + '"]');
    if (!$match.length) return false;
    setSelected($root, $match.eq(0));
    return true;
  }
  function setSelected($root, $opt) {
    // // 선택 옵션 1개만 유지
    $root.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass('vits-select-selected', sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });

    // // 표시 텍스트 갱신
    $root.find(VALUE).text($opt.text());

    // // hidden 값 갱신(연동 기준)
    var $hidden = $root.find(HIDDEN);
    if ($hidden.length) {
      $hidden.val($opt.attr('data-value') || $opt.text());
      $hidden.trigger('change');
    }
  }
  function renderOptions($root, items) {
    var $list = $root.find(LIST);
    if (!$list.length) return;

    // // 옵션 DOM 생성(최소 마크업)
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.value) continue;
      html += '<li class="vits-select-option" role="option" tabindex="-1" data-value="' + String(it.value) + '" aria-selected="false">' + String(it.text || '') + '</li>';
    }
    $list.html(html);
  }
  function findNodeByCode(list, code) {
    if (!code) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i] && String(list[i].categoryCode) === String(code)) return list[i];
    }
    return null;
  }

  // // categoryList가 null이어도 안전 처리
  function mapChildren(node) {
    var out = [];
    var children = node && Array.isArray(node.categoryList) ? node.categoryList : [];
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (!c || !c.categoryCode) continue;
      out.push({
        value: c.categoryCode,
        text: c.categoryNm || ''
      });
    }
    return out;
  }
  function disableAsNoOption($root) {
    // // 하위 옵션 없음: 비활성 + 스타일용 클래스
    resetToPlaceholder($root, true);
    setDisabled($root, true);
    setNoOption($root, true);
  }
  function enableWithOptions($root, items) {
    // // 옵션 주입 + 활성
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }
  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? String($hidden.val() || '') : '';
  }

  /**
   * 그룹(cat) 기준 연동 갱신
   * @param {$} $changedRoot - 변경된 root(클릭한 셀렉트 root)
   * @param {number} reasonDepth - 0: 초기, 1: 1뎁스 변경, 2: 2뎁스 변경
   */
  function applyBreadcrumb($changedRoot, reasonDepth) {
    var group = getGroup($changedRoot);
    if (!group) return;
    var $groupRoots = getGroupRoots(group);
    if (!$groupRoots.length) return;
    var $d1 = findDepth($groupRoots, 1);
    var $d2 = findDepth($groupRoots, 2);
    var $d3 = findDepth($groupRoots, 3);
    if (!$d2.length && !$d3.length) return;
    var tree = getTree();

    // // 1뎁스 선택값 기준으로 2뎁스 옵션 구성
    var d1Val = $d1.length ? getHiddenVal($d1) : '';
    var d1Node = d1Val ? findNodeByCode(tree, d1Val) : null;

    // // 1뎁스 미선택: 2/3 비활성(옵션/상태 정리)
    if (!d1Node) {
      if ($d2.length) {
        resetToPlaceholder($d2, true);
        setDisabled($d2, true);
        setNoOption($d2, false);
      }
      if ($d3.length) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
      }
      return;
    }

    // ----- 2뎁스 -----
    if ($d2.length) {
      var d2Items = mapChildren(d1Node);
      if (!d2Items.length) {
        disableAsNoOption($d2);

        // // 2뎁스가 없으면 3뎁스도 의미 없음
        if ($d3.length) {
          resetToPlaceholder($d3, true);
          setDisabled($d3, true);
          setNoOption($d3, false);
        }
        return;
      }

      // // 1뎁스가 바뀌면 2뎁스는 “선택 초기화”가 기본
      if (reasonDepth === 1) {
        resetToPlaceholder($d2, true);
      }

      // // 옵션 주입
      enableWithOptions($d2, d2Items);

      // // 초기/유지 케이스면 hidden 값으로 선택 복원
      if (reasonDepth === 0) {
        setSelectedByValue($d2, getHiddenVal($d2));
      } else if (reasonDepth !== 1) {
        // // 2뎁스 변경(reasonDepth=2)에서는 선택이 이미 반영됨(유지)
        setSelectedByValue($d2, getHiddenVal($d2));
      }

      // // 선택 복원이 안 됐으면 placeholder 유지(UX 안정)
      if (!getHiddenVal($d2)) {
        // // 2뎁스 미선택이면 3뎁스는 비활성로 유지
        if ($d3.length) {
          resetToPlaceholder($d3, true);
          setDisabled($d3, true);
          setNoOption($d3, false);
        }
      }
    }

    // ----- 3뎁스 -----
    if ($d3.length) {
      var d2Val = $d2.length ? getHiddenVal($d2) : '';

      // // 2뎁스 미선택: 3뎁스 비활성
      if (!d2Val) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
        return;
      }
      var d2ListSafe = Array.isArray(d1Node.categoryList) ? d1Node.categoryList : [];
      var d2Node = findNodeByCode(d2ListSafe, d2Val);
      if (!d2Node) {
        resetToPlaceholder($d3, true);
        setDisabled($d3, true);
        setNoOption($d3, false);
        return;
      }
      var d3Items = mapChildren(d2Node);
      if (!d3Items.length) {
        disableAsNoOption($d3);
        return;
      }

      // // 2뎁스가 바뀌면 3뎁스는 “선택 초기화”가 기본
      if (reasonDepth === 2) {
        resetToPlaceholder($d3, true);
      }

      // // 옵션 주입
      enableWithOptions($d3, d3Items);

      // // 초기/유지 케이스면 hidden 값으로 선택 복원
      if (reasonDepth === 0) {
        setSelectedByValue($d3, getHiddenVal($d3));
      } else if (reasonDepth !== 2) {
        setSelectedByValue($d3, getHiddenVal($d3));
      }
    }
  }

  /**
   * 현재 선택된 브레드크럼 기준으로 PLP 상단 카테고리 타이틀 갱신
   * - depth3 → depth2 → depth1 우선
   */
  function updateCategoryTitle() {
    var $title = $('[data-plp-category-title]');
    if (!$title.length) return;

    // // 선택된 옵션이 없으면 placeholder 텍스트로 유지(원하면 여기서 비우기 처리 가능)
    var $d3 = $('[data-vits-select][data-depth="3"] ' + OPT + '.vits-select-selected').last();
    var $d2 = $('[data-vits-select][data-depth="2"] ' + OPT + '.vits-select-selected').last();
    var $d1 = $('[data-vits-select][data-depth="1"] ' + OPT + '.vits-select-selected').last();
    var $pick = $d3.length ? $d3 : $d2.length ? $d2 : $d1;
    if ($pick && $pick.length) {
      $title.text($pick.text());
    }
  }
  function bind() {
    // // 외부 클릭 시 전체 닫기
    $(document).on('mousedown' + NS, function (e) {
      if (!$(e.target).closest(ROOT).length) closeAll();
    });

    // // 트리거 클릭(비활성이면 무시)
    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();
      var $root = $(this).closest(ROOT);
      if ($root.hasClass('vits-select-disabled')) return;
      if ($root.hasClass('vits-select-open')) closeAll();else openOne($root);
    });

    // // 옵션 클릭(선택 + 연동 갱신)
    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();
      var $opt = $(this);
      if ($opt.hasClass('vits-select-option-disabled')) return;
      var $root = $opt.closest(ROOT);
      var depth = getDepth($root);
      var group = getGroup($root);

      // // 선택 반영(여기서 VALUE/hidden이 확정됨)
      setSelected($root, $opt);
      closeAll();

      // // 하위뎁스는 선택 변경 시 초기화(옵션은 applyBreadcrumb에서 재결정)
      if (group) {
        var $groupRoots = getGroupRoots(group);
        var $d2 = findDepth($groupRoots, 2);
        var $d3 = findDepth($groupRoots, 3);
        if (depth === 1) {
          if ($d2.length) {
            resetToPlaceholder($d2, true);
            setDisabled($d2, true);
            setNoOption($d2, false);
          }
          if ($d3.length) {
            resetToPlaceholder($d3, true);
            setDisabled($d3, true);
            setNoOption($d3, false);
          }
        }
        if (depth === 2) {
          if ($d3.length) {
            resetToPlaceholder($d3, true);
            setDisabled($d3, true);
            setNoOption($d3, false);
          }
        }
      }

      // // 클릭한 depth를 reasonDepth로 넘겨서 “리셋 규칙”을 정확히 적용
      applyBreadcrumb($root, depth);

      // // 현재 카테고리 타이틀 갱신
      updateCategoryTitle();
    });
  }
  function init(root) {
    var $roots = root ? $(root).find(ROOT) : $(ROOT);

    // // aria 초기화
    $roots.find(TRIGGER).attr('aria-expanded', 'false');

    // // 마크업 disabled 동기화
    $roots.each(function () {
      var $r = $(this);
      if ($r.hasClass('vits-select-disabled')) setDisabled($r, true);
    });

    // // 초기 진입: 그룹별로 1회만 “옵션 주입 + 선택 복원” 실행
    var groups = {};
    $roots.each(function () {
      var g = getGroup($(this));
      if (g) groups[g] = true;
    });
    Object.keys(groups).forEach(function (g) {
      var $groupRoots = getGroupRoots(g);
      var $d1 = findDepth($groupRoots, 1);
      if ($d1.length) {
        applyBreadcrumb($d1.eq(0), 0); // // reasonDepth=0(초기) → 2/3뎁스 선택 복원까지 수행
      }
    });
    updateCategoryTitle();
  }
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };
})(window.jQuery, window, document);

/***/ }),

/***/ 918:
/***/ (function() {

/**
 * scripts/core/utils.js
 * @purpose 공통 유틸 모음(항상 로드)
 * @assumption
 *  - 전역 오염 최소화(필요 시 window.Utils 네임스페이스로만 제공)
 *  - UI 기능이 아닌 “범용/반복 로직”만 둔다
 * @maintenance
 *  - 실행 트리거(DOMReady/이벤트 바인딩) 금지
 *  - 특정 페이지/컴포넌트 전용 로직 금지
 *  - 프로젝트 공통으로 쓰이는 유틸만, 실제 반복이 확인될 때만 추가한다
 */

(function (window, document) {
  'use strict';

  /**
   * @purpose 모바일 환경 100vh 보정용 --vh CSS 변수 계산
   * @returns {void}
   * @example
   * // SCSS: min-height: calc(var(--vh, 1vh) * 100);
   */
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVh();
  window.addEventListener('resize', setVh);
})(window, document);

/***/ }),

/***/ 978:
/***/ (function() {

/**
 * @file scripts/ui/header/header-search.js
 * @purpose 헤더 검색 패널 UI(참고용)
 * @description
 *  - 입력 발생 시에만 패널 오픈(기본 정책)
 *  - 값이 남아있는 상태로 재포커스되면 조건 만족 시 패널 재오픈(운영 UX)
 *  - 최근검색어 삭제/이동, 연관검색어 hover 상품패널 전환/클릭 이동
 *  - 하이라이트: 연관검색어 text만(카테고리 label 제외), 초성 1글자(ㄱ~ㅎ) 입력 지원
 * @requires jQuery
 * @note toggle.js의 is-open 토글과 연동(패널 open/close는 click 트리거)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[header-search] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  var SCOPE_SEL = '[data-header-search]';
  var ACTIVE = 'is-active';
  var OPEN = 'is-open';
  var PANEL_TARGET = 'search-panel';

  // escHtml: innerHTML 출력 안전 처리
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // 초성 하이라이트(ㄱ~ㅎ 1글자) 지원
  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  // isChoJamo1: 초성 1글자인지 판별
  function isChoJamo1(k) {
    return typeof k === 'string' && k.length === 1 && CHO.indexOf(k) >= 0;
  }

  // getChoseongOfSyllable: 한글 완성형 음절의 초성 추출
  function getChoseongOfSyllable(ch) {
    var code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    var sIndex = code - 0xac00;
    var choIndex = Math.floor(sIndex / 588);
    return CHO[choIndex] || null;
  }

  // applyHighlight: text에 keyword 하이라이트 적용(<em> 감싸기)
  function applyHighlight(text, keyword) {
    var t = String(text || '');
    var k = String(keyword || '').trim();
    if (!t) return '';
    if (!k) return escHtml(t);

    // 초성 1글자 입력: 해당 초성 음절(예: 조/자/지)을 통째로 하이라이트
    if (isChoJamo1(k)) {
      var out1 = '';
      for (var i = 0; i < t.length; i++) {
        var ch = t.charAt(i);
        var cho = getChoseongOfSyllable(ch);
        if (cho === k) out1 += '<em>' + escHtml(ch) + '</em>';else out1 += escHtml(ch);
      }
      return out1;
    }

    // 일반 문자열 하이라이트
    var safeK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(safeK, 'g');
    var parts = t.split(re);
    if (parts.length === 1) return escHtml(t);
    var matches = t.match(re) || [];
    var out = '';
    for (var j = 0; j < parts.length; j++) {
      out += escHtml(parts[j]);
      if (j < matches.length) out += '<em>' + escHtml(matches[j]) + '</em>';
    }
    return out;
  }

  // bindPreventAutoToggleOpen: focus/click이 toggle.js로 전달되어 패널이 "자동 오픈"되는 케이스 차단
  function bindPreventAutoToggleOpen($scope) {
    var $input = $scope.find('.header-search-input input[type="search"]').first();
    if (!$input.length) return;
    var el = $input[0];
    el.addEventListener('focusin', function (e) {
      e.stopPropagation();
    }, true);
    el.addEventListener('click', function (e) {
      e.stopPropagation();
    }, true);
  }

  // bindRecentActions: 최근검색어 전체삭제/개별삭제/이동
  function bindRecentActions($scope) {
    $scope.on('click', '[data-recent-clear]', function (e) {
      e.preventDefault();
      $scope.find('[data-recent-list]').empty();
    });
    $scope.on('click', '[data-recent-del]', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).closest('[data-recent-item]').remove();
    });
    $scope.on('click', '[data-recent-item]', function () {
      var href = ($(this).attr('data-href') || '').trim();
      if (!href) return;
      window.location.href = href;
    });
  }

  // updateRelatedHighlightTextOnly: 연관검색어 "text만" 하이라이트(카테고리 label 제외)
  function updateRelatedHighlightTextOnly($scope, keyword) {
    $scope.find('.search-related-item').each(function () {
      var $it = $(this);
      var $text = $it.find('.search-related-text').first();
      if (!$text.length) return; // text 없으면(카테고리만) 아무 처리 안 함

      var rawText = $text.attr('data-raw') || $text.text();
      $text.attr('data-raw', rawText);
      if (!String(rawText || '').trim().length) {
        $text.text(rawText);
        return;
      }
      $text.html(applyHighlight(rawText, keyword));
    });
  }

  // createPanelController: toggle.js(버튼 click) 기반으로 패널 open/close를 제어하는 래퍼
  function createPanelController($scope) {
    var $input = $scope.find('.header-search-input input[type="search"]').first();
    var $panel = $scope.find('[data-toggle-box="' + PANEL_TARGET + '"]').first();

    // toggle.js 단일화: 패널 제어는 클래스 직접 제어 대신 click 트리거로 위임
    var $toggleBtn = $scope.find('.btn-search[data-toggle-btn][data-toggle-target="' + PANEL_TARGET + '"]').first();
    if (!$toggleBtn.length) $toggleBtn = $input;
    function isOpen() {
      return $panel.length && $panel.hasClass(OPEN);
    }
    function openPanel() {
      if (isOpen()) return;
      $toggleBtn.trigger('click');
    }
    function closePanel() {
      if (!isOpen()) return;
      $toggleBtn.trigger('click');
    }
    return {
      $input: $input,
      $panel: $panel,
      isOpen: isOpen,
      open: openPanel,
      close: closePanel
    };
  }

  // data-search-test-key가 있으면 테스트 모드(해당 글자 입력 시에만 오픈)
  // isAllowedToOpen: (테스트키 등) 현재 입력값이 패널 오픈 조건을 만족하는지
  function isAllowedToOpen($scope, value) {
    var testKey = String($scope.attr('data-search-test-key') || '').trim();
    var vt = String(value || '').trim();
    if (!vt.length) return false;
    if (!testKey) return true; // 운영 모드: 한 글자라도 있으면 OK
    return vt === testKey; // 테스트 모드: 지정 글자와 정확히 일치할 때만 OK
  }

  // syncPanelByValue: 현재 input 값 기준으로 패널/하이라이트를 동기화(입력/재포커스 공용)
  function syncPanelByValue($scope, panelCtrl) {
    var v = panelCtrl.$input.val();
    var vt = String(v || '').trim();
    if (!isAllowedToOpen($scope, vt)) {
      panelCtrl.close();
      updateRelatedHighlightTextOnly($scope, '');
      return;
    }
    panelCtrl.open();
    updateRelatedHighlightTextOnly($scope, vt);
  }

  // bindInputOpenPolicy: input 시에만 오픈(기본) + 값 유지된 재포커스 시 재오픈(요구사항)
  function bindInputOpenPolicy($scope, panelCtrl) {
    // 입력 발생 시 동기화
    $scope.on('input', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });

    // 재포커스 시(값이 남아있으면) 동일하게 동기화
    $scope.on('focusin', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });

    // 클릭으로 다시 커서 찍는 케이스도 동일 처리
    $scope.on('click', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });
  }

  // bindRelatedProducts: 연관검색어 hover -> 우측 상품목록 전환 / 클릭 이동 / 패널 닫힐 때만 초기화
  function bindRelatedProducts($scope, panelCtrl) {
    var ITEM_SEL = '.search-related-item[data-related-item]';
    var $rightCol = $scope.find('.search-panel-right').first();
    function resetProducts() {
      if ($rightCol.length) $rightCol.removeClass(ACTIVE);
      $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
    }
    function showProducts(key) {
      if (!key) return;
      if (!panelCtrl.isOpen()) return;
      if ($rightCol.length) $rightCol.addClass(ACTIVE);
      $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
      var $p = $scope.find('.related-products-panel[data-related-products="' + key + '"]');
      if (!$p.length) return;
      $p.addClass(ACTIVE);
    }
    $scope.on('mouseenter', ITEM_SEL, function () {
      showProducts($(this).attr('data-related-item'));
    });
    $scope.on('click', ITEM_SEL, function () {
      var href = ($(this).attr('data-related-href') || '').trim();
      if (!href) return;
      window.location.href = href;
    });

    // toggle.js가 class만 토글하므로, 닫힘 시점 감지는 class 변경 관찰로 처리
    // 패널이 닫힐 때만 우측 초기화(요구사항: 패널 열린 동안은 마지막 hover 유지)
    if (panelCtrl.$panel.length && window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if (!panelCtrl.$panel.hasClass(OPEN)) {
          resetProducts();
        }
      });
      obs.observe(panelCtrl.$panel[0], {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }
  function initScope($scope) {
    var panelCtrl = createPanelController($scope);
    bindPreventAutoToggleOpen($scope);
    bindRecentActions($scope);
    bindInputOpenPolicy($scope, panelCtrl);
    bindRelatedProducts($scope, panelCtrl);

    // 초기 상태: 우측 상품목록 숨김 + 하이라이트 제거
    $scope.find('.search-panel-right').removeClass(ACTIVE);
    $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
    updateRelatedHighlightTextOnly($scope, '');
  }
  window.UI.headerSearch = {
    init: function () {
      $(SCOPE_SEL).each(function () {
        initScope($(this));
      });
      console.log('[header-search] init');
    }
  };
  console.log('[header-search] module loaded');
})(window.jQuery || window.$, window);

/***/ }),

/***/ 986:
/***/ (function() {

/**
 * @file scripts/ui/product/tab-scrollbar.js
 * @purpose 탭 고정(top 100) + 클릭이동(가려짐 없음) + active 동기화
 * @description
 *  - 클릭 시 섹션 타이틀이 탭 바로 아래로 오도록 이동
 *  - 스크롤 시 baseline(탭 바로 아래) 기준으로 active 동기화
 * @requires jQuery
 * @markup-control
 *  - #tabNav: 탭 네비게이션
 *  - #tabBar: 활성 탭 인디케이터
 *  - .tabBtn[data-target]: 탭 버튼 (data-target에 섹션 id)
 *  - .section[id]: 섹션 요소
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[tab-scrollbar] jQuery not found');
    return;
  }
  window.UI = window.UI || {};
  function initTabScrollbar() {
    var $tabWrap = $('.tab-wrap');
    var $tabShowPrice = $tabWrap.find('.tab-show-price');
    var $tabNav = $('#tab-nav');
    var $tabBar = $('#tab-Bar');
    var $tabBtns = $tabNav.find('.tab-btn[data-target]');
    var $sections = $('.tab-section[id]');
    if (!$tabWrap.length || !$tabNav.length || !$tabBtns.length || !$sections.length) {
      return;
    }
    function getScrollTop() {
      return $(window).scrollTop();
    }
    function getViewportHeight() {
      return window.innerHeight;
    }
    function getScrollHeight() {
      return document.documentElement.scrollHeight;
    }
    function getTabWrapHeight() {
      return $tabWrap.outerHeight();
    }
    function getElementTop($el) {
      return $el.offset().top;
    }
    function isTabWrapAtTop() {
      var wrapRect = $tabWrap[0].getBoundingClientRect();
      return wrapRect.top <= 0.5;
    }
    function updateShowPrice() {
      var shouldOpen = isTabWrapAtTop();
      $tabShowPrice.toggleClass('is-open', shouldOpen);
    }
    function updateTabBar($activeBtn) {
      if (!$tabBar.length || !$activeBtn || !$activeBtn.length) {
        return;
      }
      var left = $activeBtn.position().left;
      $tabBar.css({
        width: $activeBtn.outerWidth(),
        transform: 'translateX(' + left + 'px)'
      });
    }
    function setActiveById(targetId) {
      if (!targetId) {
        return;
      }
      var $targetBtn = $tabBtns.filter('[data-target="' + targetId + '"]');
      if (!$targetBtn.length) {
        return;
      }
      $tabBtns.removeClass('is-active');
      $targetBtn.addClass('is-active');
      updateTabBar($targetBtn);
    }
    function getCurrentSectionId() {
      var baseline = getScrollTop() + getTabWrapHeight();
      var currentId = $sections.first().attr('id');
      $sections.each(function () {
        var $section = $(this);
        if (getElementTop($section) <= baseline + 1) {
          currentId = $section.attr('id');
        }
      });
      return currentId;
    }
    function isAtBottom() {
      return getScrollTop() + getViewportHeight() >= getScrollHeight() - 2;
    }
    function updateActiveOnScroll() {
      var targetId = isAtBottom() ? $sections.last().attr('id') : getCurrentSectionId();
      setActiveById(targetId);
    }
    function scrollToSection($target) {
      var targetTop = getElementTop($target) - getTabWrapHeight();
      if (targetTop < 0) {
        targetTop = 0;
      }
      var scrollDuration = 0; // 애니메이션 필요 시 250 등으로 조정
      $('html, body').stop().animate({
        scrollTop: targetTop
      }, scrollDuration);
    }
    var ticking = false;
    function onScroll() {
      if (ticking) {
        return;
      }
      ticking = true;
      window.requestAnimationFrame(function () {
        updateShowPrice();
        updateActiveOnScroll();
        ticking = false;
      });
    }
    $tabBtns.on('click', function (event) {
      event.preventDefault();
      var targetId = $(this).data('target');
      var $target = $('#' + targetId);
      if (!$target.length) {
        return;
      }
      setActiveById(targetId);
      scrollToSection($target);
    });
    $('.vits-more-view > button').on('click', function (event) {
      event.preventDefault();
      var $button = $(this);
      var $detailWrap = $('.vits-img-detail');
      if (!$detailWrap.length) {
        return;
      }
      var isOpen = $detailWrap.toggleClass('is-open').hasClass('is-open');
      var $text = $button.find('.text');
      if ($text.length) {
        $text.text(isOpen ? '상품 정보 접기' : '상품 정보 더보기');
      }
      var $icon = $button.find('i');
      if ($icon.length) {
        $icon.toggleClass('ic-arrow-up', isOpen).toggleClass('ic-arrow-down', !isOpen);
      }
    });
    $(window).on('scroll', onScroll);
    $(window).on('resize', function () {
      updateShowPrice();
      updateActiveOnScroll();
      updateTabBar($tabBtns.filter('.is-active'));
    });
    updateShowPrice();
    updateActiveOnScroll();
    updateTabBar($tabBtns.filter('.is-active'));
  }
  $(initTabScrollbar);
  console.log('[tab-scrollbar] module loaded');
})(window.jQuery || window.$, window);

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
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	!function() {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = function(chunkId) {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce(function(promises, key) {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return "public/resources/js/mro/renewal/ui/" + chunkId + ".chunk.js";
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	!function() {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.miniCssF = function(chunkId) {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	!function() {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "root:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = function(url, done, key, chunkId) {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = function(prev, event) {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach(function(fn) { return fn(event); });
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl + "../../../../../../";
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
/******/ 			524: 0,
/******/ 			96: 0,
/******/ 			152: 0,
/******/ 			133: 0,
/******/ 			237: 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = function(chunkId, promises) {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(/^(395|524|979)$/.test(chunkId)) {
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise(function(resolve, reject) { installedChunkData = installedChunks[chunkId] = [resolve, reject]; });
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = function(event) {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						} else installedChunks[chunkId] = 0;
/******/ 					}
/******/ 				}
/******/ 		};
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,152,133,237,979], function() { return __webpack_require__(3); })
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;