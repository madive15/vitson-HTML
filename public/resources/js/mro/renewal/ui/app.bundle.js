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
/**
 * scripts/ui/swiper.js
 * @purpose Swiper 초기화 공통 UI(배너/상품 썸네일 등)
 * @assumption
 *  - Swiper는 npm 의존성(swiper@^11.x)으로 설치되어 번들에 포함된다
 *  - 마크업(data-swiper)로 선언된 영역만 초기화한다
 * @options
 *  - data-swiper-loop="true"        : loop 사용 여부
 *  - data-swiper-autoplay="3000"    : autoplay delay(ms). 값이 없으면 autoplay 비활성
 * @maintenance
 *  - 페이지 의미(main/detail 등) 분기 금지
 *  - 커스터마이징(옵션/규칙)은 이 파일에서만 관리
 */


(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};

  /**
   * 문자열 값을 boolean으로 변환
   * @param {*} v data- 값
   * @returns {boolean}
   */
  function toBool(v) {
    return String(v) === 'true';
  }

  /**
   * 문자열 값을 number로 변환
   * @param {*} v data- 값
   * @returns {(number|null)}
   */
  function toNum(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  /**
   * 단일 Swiper 초기화
   * @param {jQuery} $root data-swiper 루트
   * @returns {void}
   */
  function initOne($root) {
    var el = $root.find('.swiper')[0];
    if (!el) return;
    var loop = toBool($root.data('swiperLoop'));
    var autoplayDelay = toNum($root.data('swiperAutoplay'));
    var config = {
      loop: loop,
      pagination: {
        el: $root.find('.swiper-pagination')[0] || null,
        clickable: true
      },
      navigation: {
        nextEl: $root.find('.swiper-button-next')[0] || null,
        prevEl: $root.find('.swiper-button-prev')[0] || null
      }
    };
    if (autoplayDelay) {
      config.autoplay = {
        delay: autoplayDelay,
        disableOnInteraction: false
      };
    }
    new swiper_bundle/* default */.A(el, config);
  }
  window.UI.swiper = {
    /**
     * Swiper 초기화
     * @returns {void}
     * @example
     * // scripts/core/ui.js의 UI.init()에서 호출
     * UI.swiper.init();
     */
    init: function () {
      $('[data-swiper]').each(function () {
        initOne($(this));
      });

      /** Deal Gallery : 상품상세페이지 deal_gallery 영역
       * 기존 운영 소스 참고하여 개선하였습니다.
       */
      function initDealGallery() {
        if (typeof swiper_bundle/* default */.A === 'undefined' || typeof $ === 'undefined') return;

        /* =====================
         * Swiper
         * ===================== */
        var galleryTop = new swiper_bundle/* default */.A('.gallery-top', {
          spaceBetween: 0,
          loop: false,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          },
          thumbs: {
            swiper: galleryThumbs
          }
        });
        var galleryThumbs = new swiper_bundle/* default */.A('.gallery-thumbs', {
          spaceBetween: 7,
          slidesPerView: 8,
          centeredSlides: true,
          //중앙정렬렬
          slideToClickedSlide: true,
          //클릭시 이동
          watchSlidesProgress: true,
          watchSlidesVisibility: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
          }
        });
        // 기존 운영소스
        // galleryTop.controller.control = galleryThumbs;
        // galleryThumbs.controller.control = galleryTop;

        galleryThumbs.on('click', function () {
          var clickedIndex = galleryThumbs.clickedIndex;
          if (typeof clickedIndex === 'undefined') return;

          /* 1. 메인 Swiper 이동 */
          galleryTop.slideTo(clickedIndex);

          /* 2. 썸네일 active 처리 */
          $(galleryThumbs.slides).removeClass('swiper-slide-active').eq(clickedIndex).addClass('swiper-slide-active');

          /* 3. 메인 slide active 보정 */
          $(galleryTop.slides).removeClass('swiper-slide-active').eq(clickedIndex).addClass('swiper-slide-active');

          /* 4. 확대 상태 초기화 + 이미지 싱크 */
          resetZoomState();
          var $activeImg = $(galleryTop.slides[clickedIndex]).find('.original_image');
          $('.magnified_image').attr('src', $activeImg.attr('src'));
        });

        /* =====================
         * Zoom State
         * ===================== */
        var zoomState = {
          naturalWidth: 0,
          naturalHeight: 0,
          zoomRatio: 3
        };
        function resetZoomState() {
          zoomState.naturalWidth = 0;
          zoomState.naturalHeight = 0;
        }

        /* =====================
         * Utils
         * ===================== */
        function loadImageSize($img, cb) {
          if ($img[0].complete) {
            cb($img[0].naturalWidth, $img[0].naturalHeight);
          } else {
            $img.one('load', function () {
              cb(this.naturalWidth, this.naturalHeight);
            });
          }
        }
        function getMousePosition(e, $img) {
          var offset = $img.offset();
          return {
            x: e.pageX - offset.left,
            y: e.pageY - offset.top
          };
        }

        /* =====================
         * Zoom Logic
         * ===================== */
        function handleZoom(e) {
          var $img = $(e.target).closest('.original_image');
          if (!$img.length) return;
          var $slide = $img.closest('.swiper-slide');
          var $lens = $slide.find('.zoom_lens');
          var $container = $('.magnified_container');
          var $zoomImg = $('.magnified_image');
          if ($slide.find('iframe').length) {
            $lens.hide();
            $container.hide();
            return;
          }
          var iw = $img.outerWidth();
          var ih = $img.outerHeight();
          var mouse = getMousePosition(e, $img);
          if (mouse.x < 0 || mouse.y < 0 || mouse.x > iw || mouse.y > ih) {
            $lens.hide();
            $container.hide();
            return;
          }
          if (!zoomState.naturalWidth) {
            loadImageSize($img, function (w, h) {
              zoomState.naturalWidth = w;
              zoomState.naturalHeight = h;
            });
            return;
          }
          $lens.show();
          $container.show();

          /* 확대 비율 */
          var baseRatio = Math.max(zoomState.naturalWidth / iw, zoomState.naturalHeight / ih);
          var ratio = baseRatio * zoomState.zoomRatio;
          var zw = zoomState.naturalWidth * ratio;
          var zh = zoomState.naturalHeight * ratio;
          $zoomImg.css({
            width: zw,
            height: zh
          });

          /* lens 이동 */
          var lw = $lens.outerWidth();
          var lh = $lens.outerHeight();
          var px = Math.max(0, Math.min(mouse.x - lw / 2, iw - lw));
          var py = Math.max(0, Math.min(mouse.y - lh / 2, ih - lh));
          $lens.css({
            left: px + $img.position().left,
            top: py + $img.position().top
          });

          /* 확대 이미지 이동 */
          var cw = $container.width();
          var ch = $container.height();
          var rx = px / (iw - lw) * (zw - cw);
          var ry = py / (ih - lh) * (zh - ch);
          $zoomImg.css({
            left: -rx,
            top: -ry
          });
        }

        /* =====================
         * Events
         * ===================== */
        $('.gallery-top').on('mousemove', handleZoom).on('mouseleave', function () {
          $('.zoom_lens').hide();
          $('.magnified_container').hide();
        });
        galleryTop.on('slideChangeTransitionEnd', function () {
          resetZoomState();
          var $activeImg = $(galleryTop.slides[galleryTop.activeIndex]).find('.original_image');
          $('.magnified_image').attr('src', $activeImg.attr('src'));
        });

        /* 초기 확대 이미지 설정 */
        var $initialImg = $(galleryTop.slides[galleryTop.activeIndex]).find('.original_image');
        $('.magnified_image').attr('src', $initialImg.attr('src'));
      }
      initDealGallery();
      console.log('[swiper] init');
    }
  };
  console.log('[swiper] module loaded');
})(window.jQuery || window.$, window);
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
    if (window.VitsKendoDropdown) {
      window.VitsKendoDropdown.initAll(document);
      window.VitsKendoDropdown.autoBindStart(document.body);
    }
    if (window.UI.headerRank && window.UI.headerRank.init) window.UI.headerRank.init();
    if (window.UI.headerSearch && window.UI.headerSearch.init) window.UI.headerSearch.init();
    if (window.UI.headerGnb && window.UI.headerGnb.init) window.UI.headerGnb.init();
    if (window.UI.headerGnbPanel && window.UI.headerGnbPanel.init) window.UI.headerGnbPanel.init();
    if (window.UI.footerBizInfo && window.UI.footerBizInfo.init) window.UI.footerBizInfo.init();
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
 * - data-handler 키로 이벤트를 매핑한다(함수 직렬화 불가 이슈 회피).
 * - 상위 래퍼(.vits-dropdown)의 vits- 클래스를 Kendo wrapper에도 복사한다.
 * - 리스트 팝업도 래퍼 스코프에서 커스텀 가능하도록 appendTo를 래퍼로 기본 설정한다(옵션 미지정 시).
 */

(function (window) {
  'use strict';

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDropDownList);
  }
  function applyVitsClassToWrapper($wrap, inst) {
    // vits- 클래스만 wrapper/popup로 이관(전역 오염 방지)
    if (!$wrap || !$wrap.length || !inst) return;
    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);

    // 입력 wrapper
    if (inst.wrapper) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) inst.wrapper.addClass(classList[i]);
      }
    }

    // 팝업(옵션 리스트) - 열릴 때 생성되는 케이스 방어
    if (inst.popup && inst.popup.element) {
      for (var j = 0; j < classList.length; j++) {
        if (classList[j].indexOf('vits-') === 0) {
          inst.popup.element.addClass(classList[j]);

          // 테마에 따라 실제 배경/테두리가 animation container에 걸리는 경우가 많음
          var $ac = inst.popup.element.closest('.k-animation-container');
          if ($ac && $ac.length) $ac.addClass(classList[j]);
        }
      }
    }
  }
  var HANDLERS = {
    productSelect: function (inst) {
      // 필요할 때만 내부 구현
      inst.bind('change', function () {
        // var v = inst.value();
        // var item = inst.dataItem();
      });
    }
  };
  function applyHandler($el, inst) {
    var key = ($el.attr('data-handler') || '').trim();
    if (!key) return;
    if (!HANDLERS[key]) return;
    HANDLERS[key](inst);
  }
  function initOne(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDropDownList')) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var $wrap = $el.closest('.vits-dropdown');

    // appendTo는 DOM element로 주는 쪽이 더 안전함
    if ($wrap.length && opts.appendTo === undefined) opts.appendTo = $wrap[0];
    $el.kendoDropDownList(opts);
    var inst = $el.data('kendoDropDownList');

    // 팝업이 "열릴 때" 생기는 경우가 많아서 open 시점에 다시 클래스 이관(핵심)
    if (inst && inst.bind) {
      inst.bind('open', function () {
        applyVitsClassToWrapper($wrap, inst);
      });
    }
    applyHandler($el, inst);
    applyVitsClassToWrapper($wrap, inst);
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