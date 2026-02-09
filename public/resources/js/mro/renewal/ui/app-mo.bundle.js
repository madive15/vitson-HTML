/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 905:
/***/ (function() {

/**
 * @file scripts-mo/ui/product/product-inline-banner.js
 * @description 상품 목록 내 인라인 배너 위치 자동 조정 (썸네일: 2줄, 리스트: 3줄 후 삽입)
 * @scope [data-ui="product-items"]
 * @events resize, productViewChange
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiInlineBanner';
  var LIST = '[data-ui="product-items"]';
  var BANNER = '[data-ui="product-inline-banner"]';
  var ITEM = '[data-ui="product-item"]';
  var ROWS_THUMB = 2;
  var ROWS_LIST = 3;
  var DEBOUNCE_DELAY = 150;
  var _bound = false;
  var _timer = null;

  // 배너를 현재 컬럼 수 × rows 위치로 이동
  function reposition() {
    var $list = $(LIST);
    if (!$list.length) return;
    $list.each(function () {
      var $ul = $(this);
      var $banner = $ul.children(BANNER);
      if (!$banner.length) return;

      // 배너를 맨 뒤로 빼서 레이아웃 계산에 영향 없게
      $ul.append($banner);
      var $items = $ul.children(ITEM);
      if (!$items.length) return;

      // 뷰 타입에 따라 줄 수 분기
      var isList = $ul.hasClass('view-list');
      var rows = isList ? ROWS_LIST : ROWS_THUMB;

      // 첫 번째 행의 top 값으로 실제 컬럼 수 계산
      var firstTop = $items.first().offset().top;
      var cols = 0;
      $items.each(function () {
        if ($(this).offset().top === firstTop) {
          cols++;
        } else {
          return false;
        }
      });
      cols = cols || 1;
      var targetIndex = cols * rows;

      // 상품 부족해도 줄 수 유지 — 빈 슬롯은 그리드가 처리
      if (targetIndex > $items.length) targetIndex = $items.length;
      $items.eq(targetIndex - 1).after($banner);
    });
  }
  function debouncedReposition() {
    clearTimeout(_timer);
    _timer = setTimeout(reposition, DEBOUNCE_DELAY);
  }
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    $(window).on('resize' + NS, debouncedReposition);

    // 뷰 전환 시 리플로우 후 재계산
    $(document).on('productViewChange' + NS, function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(reposition);
      });
    });
  }
  window.UI.productInlineBanner = {
    init: function () {
      reposition();
      bindEvents();
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 1781:
/***/ (function() {

/**
 * @file scripts-mo/core/utils.js
 * @description 모바일 공통 유틸
 * @note IIFE — 외부 init 호출 없이 로드 시 즉시 실행
 */
(function (window, document) {
  'use strict';

  /**
   * @description PC 기기 판별 클래스 부착 (UA + touchPoints 기반)
   * @note html.is-pc 기준으로 PC 전용 스타일 분기
   *       iPadOS 13+는 UA에 iPad 미포함 → maxTouchPoints로 보완
   */
  function setDeviceClass() {
    var ua = window.navigator.userAgent;
    var isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    var isTouchDevice = navigator.maxTouchPoints > 1;
    if (!isMobileUA && !isTouchDevice) {
      document.documentElement.classList.add('is-pc');
    }
  }

  /**
   * @description 뷰포트 높이 보정 (iOS/Android 주소창 변화 대응)
   * @note CSS: min-height: calc(var(--vh, 1vh) * 100)
   */
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }

  /**
   * @description 수평 스크롤 요소를 끝(오른쪽)으로 이동
   * @scope [data-scroll-end]
   * @note 초기 실행 + 자식 변경 시 자동 재실행 (동적 렌더링 대응)
   */
  function initScrollEnd() {
    var targets = document.querySelectorAll('[data-scroll-end]');
    function scrollToEnd(el) {
      requestAnimationFrame(function () {
        el.scrollLeft = el.scrollWidth;
      });
    }
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        scrollToEnd(m.target);
      });
    });
    targets.forEach(function (el) {
      scrollToEnd(el);
      observer.observe(el, {
        childList: true
      });
    });
  }
  setDeviceClass();
  setVh();
  var rafId = null;
  (window.visualViewport || window).addEventListener('resize', function () {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      setVh();
      rafId = null;
    });
  });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollEnd);
  } else {
    initScrollEnd();
  }
})(window, document);

/***/ }),

/***/ 2014:
/***/ (function() {

/**
 * @file scripts-mo/ui/filter/filter-product.js
 * @description 상품 필터 — 인라인/팝업 체크박스 양방향 연동 + 칩 관리
 * @scope [data-filter-product]
 *
 * @mapping
 *  [data-filter-product]  → 필터 최상위 스코프
 *  [data-filter-popup]    → 팝업 내부 스코프
 *  [data-filter-chips]    → 칩 렌더 영역 (JS 동적 생성)
 *
 * @state .is-filtered — 1개 이상 필터 적용 시 스코프에 부여
 * @state .is-hidden   — 브랜드 더보기 접힌 항목
 * @state .is-expanded — 브랜드 더보기 펼침
 *
 * @events
 *  filter:apply (document) — 필터 적용 시 발행 { applied }
 *  category:change (document) — 수신: 필터 초기화 + 속성 그룹 교체
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  // 상수
  var NS = '.uiFilterProduct';
  var SCOPE = '[data-filter-product]';
  var POPUP_ID = 'filterSheet';
  var CHIP_ORDER = ['ck-brand', 'ck-common', 'ck-attr'];
  var CHIP_SCROLL_GAP = 4;
  var SLIDE_DURATION = 200;
  var CLS = {
    filtered: 'is-filtered',
    hidden: 'is-hidden',
    expanded: 'is-expanded'
  };
  var SEL = {
    inlineCheckbox: '.filter-product-group input[type="checkbox"]',
    popup: '[data-filter-popup]',
    chips: '[data-filter-chips]',
    filterBtn: '[data-filter-state]',
    applyBtn: '[data-filter-apply]',
    closeBtn: '[data-filter-close]',
    toggleBtn: '[data-filter-toggle]',
    brandMore: '[data-filter-more]'
  };

  // 내부 상태
  var _applied = {};
  var _bound = false;
  var _lastAdded = null;
  var _categoryChanged = false;

  // 유틸
  function getAppliedCount() {
    var count = 0;
    Object.keys(_applied).forEach(function (key) {
      count += _applied[key].length;
    });
    return count;
  }
  function isChecked(name, value) {
    return _applied[name] && _applied[name].indexOf(value) > -1;
  }
  function addFilter(name, value) {
    if (!_applied[name]) _applied[name] = [];
    if (_applied[name].indexOf(value) === -1) {
      _applied[name].push(value);
      _lastAdded = {
        name: name,
        value: value
      };
    }
  }
  function removeFilter(name, value) {
    if (!_applied[name]) return;
    var idx = _applied[name].indexOf(value);
    if (idx > -1) _applied[name].splice(idx, 1);
    if (!_applied[name].length) delete _applied[name];
  }
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 체크박스 라벨 텍스트 조회
  function findLabel(name, value) {
    var $cb = $('input[type="checkbox"]').filter(function () {
      return this.name === name && this.value === value;
    }).first();
    if (!$cb.length) return value;
    var $label = $cb.closest('label').find('.label');
    if (!$label.length) $label = $cb.closest('label').find('.label-name');
    return $label.length ? $label.text().replace(/\s*\(\d+\)$/, '').trim() : value;
  }

  // 모든 체크박스 동기화 (인라인 + 팝업)
  function syncAllCheckboxes() {
    $('input[type="checkbox"]').each(function () {
      if (this.name) {
        $(this).prop('checked', isChecked(this.name, this.value));
      }
    });
  }

  // 팝업 체크박스에서 _applied 읽기
  function readPopupState() {
    _applied = {};
    $(SEL.popup).find('input[type="checkbox"]:checked').each(function () {
      addFilter(this.name, this.value);
    });
  }

  // 인라인 필터 스크롤 초기화
  function resetInlineScroll() {
    var el = $(SCOPE).find('.vm-filter-product-inner')[0];
    if (el) el.scrollLeft = 0;
  }

  // 칩 렌더
  function renderChips() {
    var $bar = $(SCOPE).find('.filter-product-bar');
    var $chips = $bar.find(SEL.chips);
    if (!getAppliedCount()) {
      $chips.remove();
      _lastAdded = null;
      return;
    }
    if (!$chips.length) {
      $chips = $('<div class="filter-product-selected" data-filter-chips>');
      $bar.append($chips);
    }
    var html = ['<div class="vits-chip-button-group">'];
    CHIP_ORDER.forEach(function (name) {
      if (!_applied[name]) return;
      _applied[name].forEach(function (value) {
        var label = findLabel(name, value);
        html.push('<button type="button" class="vits-chip-button type-outline size-s"' + ' data-chip-action="remove"' + ' data-chip-name="' + esc(name) + '"' + ' data-chip-value="' + esc(value) + '">' + '<span class="text">' + esc(label) + '</span>' + '<span class="icon" aria-hidden="true"><i class="ic ic-x"></i></span>' + '</button>');
      });
    });
    html.push('</div>');
    $chips.html(html.join(''));

    // 마지막 추가된 칩으로 스크롤
    var $group = $chips.find('.vits-chip-button-group');
    if ($group.length && _lastAdded) {
      var $target = $group.find('[data-chip-name="' + _lastAdded.name + '"][data-chip-value="' + _lastAdded.value + '"]');
      if ($target.length) {
        var groupEl = $group[0];
        groupEl.scrollLeft = Math.max(0, $target[0].offsetLeft - groupEl.offsetLeft - CHIP_SCROLL_GAP);
      }
      _lastAdded = null;
    }
  }

  // UI 상태 갱신
  function updateUI() {
    var $scope = $(SCOPE);
    var count = getAppliedCount();
    var hasFilter = count > 0;
    $scope.toggleClass(CLS.filtered, hasFilter);

    // 스코프 안 filter-btn: 텍스트 변경 + is-selected
    var $innerState = $scope.find(SEL.filterBtn);
    $innerState.toggleClass('is-selected', hasFilter);
    var $innerText = $innerState.find('button .text');
    if ($innerText.length) {
      $innerText.text(hasFilter ? '필터' : '필터 더보기');
    }

    // 스코프 밖 filter-btn (toolbar 등): is-selected만
    var $outerState = $(SEL.filterBtn).not($innerState);
    $outerState.toggleClass('is-selected', hasFilter);
    renderChips();
  }
  function emitApply() {
    $(document).trigger('filter:apply', [{
      applied: $.extend(true, {}, _applied)
    }]);
  }

  // 팝업 열기
  function openPopup() {
    if (!window.VmKendoWindow) return;
    window.VmKendoWindow.open(POPUP_ID);

    // 팝업 열린 후 체크박스 동기화
    requestAnimationFrame(function () {
      syncAllCheckboxes();
      if (_categoryChanged) {
        _categoryChanged = false;
        var el = $(SEL.popup).closest('.vm-modal-content')[0];
        if (el) el.scrollTop = 0;
      }
    });
  }

  // 적용하기
  function applyAndClose() {
    readPopupState();
    _lastAdded = null;
    syncAllCheckboxes();
    updateUI();
    emitApply();
    if (window.VmKendoWindow) window.VmKendoWindow.close(POPUP_ID);

    // 팝업 적용 후 칩 스크롤 처음으로
    var $group = $(SCOPE).find('.vits-chip-button-group');
    if ($group.length) {
      $group[0].scrollLeft = 0;
    }
  }

  // 속성 체크박스 HTML 생성 — 인라인용
  function buildInlineAttrCheckboxes(items) {
    var html = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html.push('<label class="vm-ckbox-text">' + '<input type="checkbox" name="ck-attr" value="' + esc(item.categoryCode) + '">' + '<span class="label">' + esc(item.categoryNm) + '</span>' + '</label>');
    }
    return html.join('');
  }

  // 속성 체크박스 HTML 생성 — 팝업용 (input-checkbox.ejs 구조)
  function buildPopupAttrCheckboxes(items) {
    var html = ['<div class="checkbox-wrapper type-basic size-m">' + '<ul class="checkbox-item-area list-column-gap16">'];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      html.push('<li class="checkbox-item-box">' + '<label class="checkbox-item">' + '<input type="checkbox" name="ck-attr" value="' + esc(item.categoryCode) + '">' + '<span class="checkbox-icon" aria-hidden="true"></span>' + '<span class="label-name">' + esc(item.categoryNm) + '</span>' + '</label>' + '</li>');
    }
    html.push('</ul></div>');
    return html.join('');
  }

  // 브랜드 더보기 초기화
  function resetBrandMore() {
    var $brandSection = $(SEL.popup).find('[data-filter-group="ck-brand"]');
    var $hidden = $brandSection.find('.filter-popup-hidden');
    if ($hidden.length && !$hidden.hasClass(CLS.hidden)) {
      $hidden.addClass(CLS.hidden);
      $brandSection.removeClass(CLS.expanded);
      if (!$brandSection.find('[data-filter-more]').length) {
        var count = $hidden.find('input[type="checkbox"]').length;
        $brandSection.find('.filter-popup-body').append('<button type="button" class="vits-btn-sm vits-btn-outline-tertiary icon-left" data-filter-more>' + '<span class="icon"><i class="ic ic-plus" aria-hidden="true"></i></span>' + '<span class="text">더보기 (' + count + '개)</span>' + '</button>');
      }
    }
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 인라인 체크박스 → 즉시 적용
    $doc.on('change' + NS, SCOPE + ' ' + SEL.inlineCheckbox, function () {
      if (this.checked) {
        addFilter(this.name, this.value);
      } else {
        removeFilter(this.name, this.value);
      }
      syncAllCheckboxes();
      updateUI();
      emitApply();
    });

    // 팝업 열기 — 스코프 안
    $doc.on('click' + NS, SCOPE + ' ' + SEL.filterBtn, openPopup);

    // 팝업 열기 — 스코프 밖 (toolbar 등)
    $doc.on('click' + NS, '.toolbar-filter ' + SEL.filterBtn, openPopup);

    // 팝업: 적용하기
    $doc.on('click' + NS, SEL.applyBtn, applyAndClose);

    // 팝업: 닫기
    $doc.on('click' + NS, SEL.closeBtn, function () {
      if (window.VmKendoWindow) window.VmKendoWindow.close(POPUP_ID);
    });

    // 팝업: 섹션 토글
    $doc.on('click' + NS, SEL.popup + ' ' + SEL.toggleBtn, function () {
      var $btn = $(this);
      var $body = $btn.closest('.filter-popup-section').find('.filter-popup-body');
      var isOpen = $btn.attr('aria-expanded') === 'true';
      $btn.attr('aria-expanded', String(!isOpen));
      $body.slideToggle(SLIDE_DURATION);
    });

    // 팝업: 브랜드 더보기
    $doc.on('click' + NS, '[data-filter-more]', function () {
      var $btn = $(this);
      var $section = $btn.closest('[data-filter-group]');
      $section.find('.' + CLS.hidden).removeClass(CLS.hidden);
      $section.addClass(CLS.expanded);
      $btn.remove();
    });

    // 칩 삭제
    $doc.on('click' + NS, SEL.chips + ' [data-chip-action="remove"]', function () {
      var $chip = $(this);
      var name = $chip.attr('data-chip-name');
      var value = $chip.attr('data-chip-value');
      if (name && value) {
        removeFilter(name, value);
        syncAllCheckboxes();
        updateUI();
        emitApply();
      }
    });

    // 카테고리 변경 → 필터 초기화 + 속성 그룹 교체
    $doc.on('category:change' + NS, function (e, data) {
      var d4 = data && data.depth4 || [];
      var $inlineAttr = $(SCOPE).find('[data-filter-group="ck-attr"]');
      var $inlineLabel = $inlineAttr.prev('.filter-product-label');
      var $popupAttr = $(SEL.popup).find('[data-filter-group="ck-attr"]');

      // 전체 필터 초기화
      _applied = {};
      $('input[type="checkbox"]').each(function () {
        if (this.name) $(this).prop('checked', false);
      });

      // 브랜드 더보기 초기화
      resetBrandMore();
      _categoryChanged = true;
      if (!d4.length) {
        $inlineAttr.hide();
        $inlineLabel.hide();
        $popupAttr.closest('.filter-popup-section').hide();
        updateUI();
        resetInlineScroll();
        return;
      }
      $inlineAttr.show();
      $inlineLabel.show();
      $popupAttr.closest('.filter-popup-section').show();
      $inlineAttr.html(buildInlineAttrCheckboxes(d4));
      $popupAttr.find('.filter-popup-body').html(buildPopupAttrCheckboxes(d4));
      updateUI();
      resetInlineScroll();
    });
  }

  // 공개 API
  function init() {
    if (!$(SCOPE).length) return;
    _applied = {};
    _lastAdded = null;
    _categoryChanged = false;
    bindEvents();
    updateUI();
  }
  function destroy() {
    $(document).off(NS);
    _applied = {};
    _lastAdded = null;
    _categoryChanged = false;
    _bound = false;
  }
  window.FilterProduct = {
    init: init,
    destroy: destroy,
    getApplied: function () {
      return $.extend(true, {}, _applied);
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 2066:
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

/***/ 4387:
/***/ (function() {

/**
 * @file scripts-mo/ui/kendo/kendo-window.js
 * @description 모바일 Kendo Window 초기화 모듈
 * @variant 'bottomsheet' — 하단에서 슬라이드 업 (CSS 애니메이션)
 * @variant 'slide-right' — 오른쪽에서 슬라이드 인 (풀스크린)
 *
 * VmKendoWindow.open('myWindow');
 * VmKendoWindow.close('myWindow');
 * VmKendoWindow.refresh('myWindow');
 * VmKendoWindow.initAll();
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  var NS = '.uiKendoWindow';
  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var DEBOUNCE_DELAY = 80;
  var ANIMATION_TIMEOUT = 500;
  var scrollY = 0;
  var openedWindows = [];
  var contentObservers = {};
  var debounceTimers = {};
  function lockBody() {
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;
    scrollY = window.pageYOffset || 0;
    $('body').addClass(BODY_LOCK_CLASS).css({
      position: 'fixed',
      top: -scrollY + 'px',
      left: 0,
      right: 0,
      overflow: 'hidden'
    });
  }
  function unlockBody() {
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;
    $('body').removeClass(BODY_LOCK_CLASS).css({
      position: '',
      top: '',
      left: '',
      right: '',
      overflow: ''
    });
    window.scrollTo(0, scrollY);
  }
  function checkScroll(id) {
    var $el = $('#' + id);
    $el.find('[data-scroll-check]').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }
  function refresh(id) {
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;
      checkScroll(id);
      var $kw = $el.closest('.k-window');
      if (!$kw.hasClass('is-bottomsheet') && !$kw.hasClass('is-slideright')) {
        inst.center();
      }
    }, DEBOUNCE_DELAY);
  }
  function observeContent(id) {
    if (!window.MutationObserver) return;
    if (contentObservers[id]) return;
    var $el = $('#' + id);
    var $content = $el.find('.vm-modal-content');
    if (!$content.length) return;
    var obs = new MutationObserver(function () {
      refresh(id);
    });
    obs.observe($content[0], {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });
    contentObservers[id] = obs;
  }
  function disconnectContent(id) {
    if (contentObservers[id]) {
      contentObservers[id].disconnect();
      delete contentObservers[id];
    }
    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  // 슬라이드 닫힘 애니메이션 + 안전장치
  function closeWithAnimation($kw, inst) {
    $kw.addClass('is-closing');
    var closed = false;
    function done() {
      if (closed) return;
      closed = true;
      $kw.removeClass('is-closing');
      inst.close();
    }
    $kw.one('animationend', done);
    setTimeout(done, ANIMATION_TIMEOUT);
  }
  function initOne(el) {
    var $el = $(el);
    if ($el.data('kendoWindow')) return;
    var id = $el.attr('id');
    var variant = $el.attr('data-variant');
    var isBottom = variant === 'bottomsheet';
    var isSlide = variant === 'slide-right';
    var noAnimation = isBottom || isSlide;
    var opts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      animation: noAnimation ? false : undefined,
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
      },
      close: function () {
        disconnectContent(id);
        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }
      }
    };
    $el.kendoWindow(opts);
    var $kw = $el.closest('.k-window');
    if (isBottom) {
      $kw.addClass('is-bottomsheet');
    }
    if (isSlide) {
      $kw.addClass('is-slideright');
    }
  }
  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }
  function open(id) {
    var $el = $('#' + id);
    if (!$el.length) return;
    var inst = $el.data('kendoWindow');
    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }
    if (inst) {
      var $kw = $el.closest('.k-window');
      var isBottom = $kw.hasClass('is-bottomsheet');
      var isSlide = $kw.hasClass('is-slideright');
      if (!isBottom && !isSlide) inst.center();
      inst.open();

      // 바텀시트: 하단 고정 + 슬라이드 업
      if (isBottom) {
        $kw.css({
          top: 'auto',
          left: '0',
          bottom: '0',
          width: '100%',
          position: 'fixed'
        });
        $kw.addClass('is-opening');
        $kw.one('animationend', function () {
          $kw.removeClass('is-opening');
        });
      }

      // 슬라이드 라이트: 풀스크린 + 오른쪽에서 인
      if (isSlide) {
        $kw.css({
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100%',
          height: '100%',
          position: 'fixed'
        });
        $kw.addClass('is-opening');
        $kw.one('animationend', function () {
          $kw.removeClass('is-opening');
        });
      }

      // 렌더 후 스크롤 체크 (다음 프레임)
      setTimeout(function () {
        checkScroll(id);
      }, 0);
    }
  }
  function close(id) {
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');
    if (inst) {
      var $kw = $el.closest('.k-window');
      var isSlide = $kw.hasClass('is-slideright');
      $el.find('.vm-modal-content').removeClass('has-scroll');

      // 슬라이드 라이트만 애니메이션 후 close
      if (isSlide) {
        closeWithAnimation($kw, inst);
        return;
      }
      inst.close();
    }
  }

  // 딤 클릭 시 닫기
  $(document).on('click' + NS, '.k-overlay', function () {
    var ids = openedWindows.slice();
    ids.forEach(function (winId) {
      close(winId);
    });
  });
  window.VmKendoWindow = {
    initAll: initAll,
    open: open,
    close: close,
    refresh: refresh
  };
})(window.jQuery, window);

/***/ }),

/***/ 5487:
/***/ (function() {

/**
 * @file scripts-mo/ui/product/product-view-toggle.js
 * @description 상품 목록 뷰 전환 (thumb ↔ list)
 * @scope [data-ui="product-list"]
 * @a11y aria-pressed(true → 리스트형 활성), aria-label 동적 전환
 * @events click → [data-ui="product-view-toggle"], productViewChange (발행)
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiProductViewToggle';
  var SCOPE = '[data-ui="product-list"]';
  var BTN = '[data-ui="product-view-toggle"]';
  var ITEMS = '[data-ui="product-items"]';
  var VIEW = {
    THUMB: 'view-thumb',
    LIST: 'view-list'
  };
  var LABEL = {
    THUMB: '썸네일형 전환',
    LIST: '리스트형 전환'
  };
  var _bound = false;
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    $(document).on('click' + NS, BTN, function () {
      var $btn = $(this);
      var $list = $btn.closest(SCOPE).find(ITEMS);
      var toList = $btn.hasClass(VIEW.THUMB);
      $btn.toggleClass(VIEW.THUMB, !toList).toggleClass(VIEW.LIST, toList).attr({
        'aria-label': toList ? LABEL.THUMB : LABEL.LIST,
        'aria-pressed': String(toList)
      });
      $list.toggleClass(VIEW.THUMB, !toList).toggleClass(VIEW.LIST, toList);

      // 뷰 변경 알림 (배너 위치 재계산 등)
      $(document).trigger('productViewChange');
    });
  }
  window.UI.productViewToggle = {
    init: function () {
      bindEvents();
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 5672:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./src/assets/scripts-mo/core/utils.js
var utils = __webpack_require__(1781);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/scroll-lock.js
var scroll_lock = __webpack_require__(2066);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/kendo/kendo-window.js
var kendo_window = __webpack_require__(4387);
;// ./src/assets/scripts-mo/ui/kendo/index.js
/**
 * @file scripts-mo/ui/kendo/index.js
 * @description Kendo UI 관련 모듈 통합 관리
 */

(function (window) {
  'use strict';

  window.UI = window.UI || {};
  var modules = ['VmKendoWindow'];
  window.UI.kendo = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.initAll === 'function') mod.initAll();
      });
    }
  };
})(window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/tooltip.js
var tooltip = __webpack_require__(9592);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/sticky-observer.js
var sticky_observer = __webpack_require__(5723);
;// ./src/assets/scripts-mo/ui/common/index.js
/**
 * @file scripts-mo/ui/common/index.js
 * @description 공통 UI 모듈 통합
 */



(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['tooltip', 'stickyObserver'];
  window.UI.common = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/form/select.js
var form_select = __webpack_require__(8550);
;// ./src/assets/scripts-mo/ui/form/index.js
/**
 * @file scripts-mo/ui/form/index.js
 * @description 폼 관련 UI 모듈 통합
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['select'];
  window.UI.form = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/product/product-view-toggle.js
var product_view_toggle = __webpack_require__(5487);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/product/product-inline-banner.js
var product_inline_banner = __webpack_require__(905);
;// ./src/assets/scripts-mo/ui/product/index.js
/**
 * @file scripts-mo/ui/product/index.js
 * @description 상품 관련 UI 모듈 통합
 */


(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['productViewToggle', 'productInlineBanner'];
  window.UI.product = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/category/category-sheet.js
var category_sheet = __webpack_require__(6410);
;// ./src/assets/scripts-mo/ui/category/index.js
/**
 * @file scripts-mo/ui/category/index.js
 * @description 카테고리 UI 관련 모듈 통합 관리
 */

(function (window) {
  'use strict';

  window.UI = window.UI || {};
  var modules = ['CategorySheet'];
  window.UI.category = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/filter/filter-product.js
var filter_product = __webpack_require__(2014);
;// ./src/assets/scripts-mo/ui/filter/index.js
/**
 * @file scripts-mo/ui/filter/index.js
 * @description 필터 UI 모듈 통합
 */


(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['FilterProduct'];
  window.UI.filter = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
;// ./src/assets/scripts-mo/core/ui.js
/**
 * @file scripts-mo/core/ui.js
 * @description 모바일 UI 모듈 진입점
 * @note import 순서가 의존성에 영향 — 임의 재정렬 금지
 */








(function ($, window) {
  'use strict';

  window.UI = window.UI || {};
  var modules = ['scrollLock', 'kendo', 'common', 'form', 'product', 'category', 'filter'];
  window.UI.init = function () {
    modules.forEach(function (name) {
      var mod = window.UI[name];
      if (mod && typeof mod.init === 'function') mod.init();
    });
  };

  // DOM 준비 후 자동 초기화
  $(document).ready(function () {
    window.UI.init();
  });
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/core/common.js
var common = __webpack_require__(6023);
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





/***/ }),

/***/ 5723:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/sticky-observer.js
 * @description data-ui="sticky" 요소의 스티키 상태 감지 → is-sticky 클래스 토글
 * @scope [data-ui="sticky"]
 * @state is-sticky: 요소가 스티키 상태일 때 추가
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var STICKY = '[data-ui="sticky"]';
  var ACTIVE = 'is-sticky';

  // 개별 요소에 sentinel 삽입 + observer 등록
  function observe($el) {
    if ($el.data('sticky-bound')) return;
    $el.data('sticky-bound', true);
    var sentinel = $('<div>').css({
      height: 0,
      margin: 0,
      padding: 0
    });
    sentinel.insertBefore($el);

    // sticky top 값만큼 rootMargin 보정
    var topOffset = parseInt($el.css('top'), 10) || 0;
    var observer = new IntersectionObserver(function (entries) {
      $el.toggleClass(ACTIVE, !entries[0].isIntersecting);
    }, {
      threshold: 0,
      rootMargin: '-' + topOffset + 'px 0px 0px 0px'
    });
    observer.observe(sentinel[0]);
  }
  window.UI.stickyObserver = {
    init: function () {
      $(STICKY).each(function () {
        observe($(this));
      });
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 6023:
/***/ (function() {

/**
 * @file scripts-mo/core/common.js
 * @description 공통 초기화 — DOMContentLoaded 시 UI 모듈 일괄 init
 */
(function ($, window) {
  'use strict';

  var initialized = false;
  $(function () {
    if (initialized || !window.UI) return;
    initialized = true;
    Object.keys(window.UI).forEach(function (key) {
      var mod = window.UI[key];
      if (mod && typeof mod.init === 'function') mod.init();
    });
  });
})(window.jQuery, window);

/***/ }),

/***/ 6410:
/***/ (function() {

/**
 * @file scripts-mo/ui/category/category-sheet.js
 * @description 카테고리 바텀시트 — depth1/2/3 렌더 + 선택 → 브레드크럼 갱신
 * @scope [data-category-sheet]
 *
 * @mapping
 *  [data-depth1-list]  → 좌측 depth1 목록
 *  [data-sub-list]     → 우측 전체보기 + depth2/3 목록
 *  [data-depth2-item]  → div.depth2-header([data-depth2-select] + [data-toggle-btn]) + ul[data-depth3-list]
 *
 * @state .is-active     — 확정된 선택 항목 (commitSelection 이후)
 * @state .is-current    — 탐색 중인 depth1 (좌측 패널 클릭 시)
 * @state .is-open       — depth2 아코디언 펼침
 * @state .has-children  — depth2 하위(depth3) 존재
 *
 * @events
 *  category:change (document) — 선택 확정 시 발행 { path, names, depth4 }
 *
 * @a11y role="option", aria-selected, aria-expanded, Enter/Space 키보드 지원
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  // 상수

  var NS = '.uiCategorySheet';
  var SCOPE = '[data-category-sheet]';
  var POPUP_ID = 'categorySheet';
  var SLIDE_DURATION = 200;
  var CLS = {
    active: 'is-active',
    current: 'is-current',
    open: 'is-open',
    hasChildren: 'has-children'
  };
  var SEL = {
    depth1List: '[data-depth1-list]',
    depth1Panel: '[data-depth1-panel]',
    depth1Item: '[data-depth1-item]',
    subList: '[data-sub-list]',
    subPanel: '[data-sub-panel]',
    depth2Item: '[data-depth2-item]',
    depth2Select: '[data-depth2-select]',
    depth3List: '[data-depth3-list]',
    depth3Item: '[data-depth3-item]',
    toggleBtn: '[data-toggle-btn]',
    viewAll: '[data-view-all]',
    breadcrumb: '[data-ui="breadcrumb"]',
    breadcrumbBtn: '[data-ui="breadcrumb"] button.vm-breadcrumb-btn',
    breadcrumbItems: '[data-ui="breadcrumb"] .vm-breadcrumb-items'
  };
  var ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  // 내부 상태

  var _tree = [];
  var _path = {
    depth1Id: '',
    depth2Id: '',
    depth3Id: ''
  }; // 확정된 선택
  var _browseD1 = ''; // 탐색 중인 depth1
  var _bound = false;

  // 유틸

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (ch) {
      return ESC_MAP[ch];
    });
  }
  function findNode(list, code) {
    if (!code || !list) return null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].categoryCode === code) return list[i];
    }
    return null;
  }

  // null 제거한 유효 자식 목록
  function validChildren(node) {
    if (!node || !Array.isArray(node.categoryList)) return [];
    return node.categoryList.filter(function (c) {
      return c && c.categoryCode;
    });
  }

  // 확정 경로 기준 d1→d2→d3 노드 조회
  function resolvePath() {
    var d1 = findNode(_tree, _path.depth1Id);
    if (!d1) return {
      d1: null,
      d2: null,
      d3: null
    };
    var d2 = findNode(validChildren(d1), _path.depth2Id);
    var d3 = d2 ? findNode(validChildren(d2), _path.depth3Id) : null;
    return {
      d1: d1,
      d2: d2,
      d3: d3
    };
  }
  function pathNames() {
    var p = resolvePath();
    if (!p.d1) return [];
    var names = [p.d1.categoryNm];
    if (p.d2) names.push(p.d2.categoryNm);
    if (p.d3) names.push(p.d3.categoryNm);
    return names;
  }
  function depth4Items() {
    var p = resolvePath();
    return p.d3 ? validChildren(p.d3) : [];
  }
  function scrollToCenter(panel, item) {
    if (!panel || !item) return;
    var h = panel.clientHeight;
    panel.scrollTop = Math.max(0, item.offsetTop - (h - item.offsetHeight) / 2);
  }

  // 브레드크럼

  function updateBreadcrumb(names) {
    if (!names || !names.length) return;
    var $list = $(SEL.breadcrumbItems);
    if (!$list.length) return;
    var $home = $list.children().first();
    $list.children().not($home).remove();
    for (var i = 0; i < names.length; i++) {
      var isCurrent = i === names.length - 1;
      var $btn = $('<button>', {
        type: 'button',
        class: 'vm-breadcrumb-btn' + (isCurrent ? ' is-current' : '')
      }).append($('<span>', {
        class: 'text',
        text: names[i]
      }));
      $list.append($('<li>').append($btn));
    }
    var el = $list[0];
    if (el) el.scrollLeft = el.scrollWidth;
  }

  // 선택 확정 → 브레드크럼 갱신 → 이벤트 발행 → 팝업 닫기

  function commitSelection() {
    _path.depth1Id = _browseD1;
    var names = pathNames();
    var d4 = depth4Items();
    updateBreadcrumb(names);

    // 헤더 타이틀 갱신 — 마지막 뎁스 이름
    $('[data-header-title]').text(names[names.length - 1] || '');
    $(document).trigger('category:change', [{
      path: $.extend({}, _path),
      names: names,
      depth4: d4
    }]);
    if (window.VmKendoWindow) {
      window.VmKendoWindow.close(POPUP_ID);
    }
  }

  // 렌더: depth1 (좌측 패널)

  function renderDepth1() {
    var $scope = $(SCOPE);
    var $list = $scope.find(SEL.depth1List);
    if (!$list.length || !_tree.length) return;

    // 팝업 열 때 탐색 위치를 확정 위치로 초기화
    _browseD1 = _path.depth1Id;
    var html = [];
    for (var i = 0; i < _tree.length; i++) {
      var node = _tree[i];
      if (!node || !node.categoryCode) continue;
      var code = node.categoryCode;
      var isActive = code === _path.depth1Id;
      var isCurrent = code === _browseD1;
      html.push('<li class="depth1-item' + (isActive ? ' ' + CLS.active : '') + (isCurrent ? ' ' + CLS.current : '') + '"' + ' data-depth1-item role="option" tabindex="0"' + ' aria-selected="' + isActive + '"' + ' data-code="' + esc(code) + '">' + esc(node.categoryNm) + '</li>');
    }
    $list.html(html.join(''));
    if (_browseD1) {
      renderSub(_browseD1);
    }
  }

  // 렌더: 우측 패널 (전체보기 + depth2/3)

  function renderSub(d1Code) {
    var $scope = $(SCOPE);
    var $list = $scope.find(SEL.subList);
    if (!$list.length) return;
    var d1 = findNode(_tree, d1Code);
    if (!d1) {
      $list.empty();
      return;
    }

    // 확정된 depth1을 보고 있을 때만 active 표시
    var isConfirmed = d1Code === _path.depth1Id;
    var isViewAllActive = isConfirmed && !_path.depth2Id;
    var d2List = validChildren(d1);
    var html = ['<li class="view-all' + (isViewAllActive ? ' ' + CLS.active : '') + '" data-view-all>' + '<button type="button" class="text">전체보기</button>' + '</li>'];
    for (var i = 0; i < d2List.length; i++) {
      html.push(buildDepth2Html(d2List[i], isConfirmed));
    }
    $list.html(html.join(''));
  }
  function buildDepth2Html(d2, isConfirmed) {
    var children = validChildren(d2);
    var hasChild = children.length > 0;
    var code = esc(d2.categoryCode);
    var name = esc(d2.categoryNm);
    var d3Id = 'depth3-' + code;

    // 확정 depth1을 보고 있을 때만 active/open 판정
    var hasActiveD3 = false;
    var isOpen = false;
    var isD2Active = false;
    if (isConfirmed) {
      hasActiveD3 = hasChild && _path.depth3Id && children.some(function (c) {
        return c.categoryCode === _path.depth3Id;
      });
      isOpen = hasActiveD3;
      isD2Active = hasActiveD3 || !_path.depth3Id && d2.categoryCode === _path.depth2Id;
    }
    var p = [];

    // depth2 래퍼
    p.push('<li class="depth2-item' + (hasChild ? ' ' + CLS.hasChildren : '') + (isOpen ? ' ' + CLS.open : '') + (isD2Active ? ' ' + CLS.active : '') + '" data-depth2-item data-code="' + code + '">');

    // 헤더: 타이틀 + 토글
    p.push('<div class="depth2-header">');
    p.push('<button type="button" class="text" data-depth2-select>' + name + '</button>');
    if (hasChild) {
      p.push('<button type="button" class="toggle-btn" data-toggle-btn' + ' aria-expanded="' + !!isOpen + '"' + ' aria-controls="' + d3Id + '"' + ' aria-label="' + name + ' 하위 카테고리 펼치기">' + '<i class="ic ic-arrow-right"></i>' + '</button>');
    }
    p.push('</div>');

    // depth3 목록
    if (hasChild) {
      p.push('<ul class="depth3-list" data-depth3-list' + ' id="' + d3Id + '" role="listbox"' + (isOpen ? '' : ' style="display:none"') + '>');
      for (var j = 0; j < children.length; j++) {
        var d3 = children[j];
        var isD3Active = isConfirmed && d3.categoryCode === _path.depth3Id;
        p.push('<li class="depth3-item' + (isD3Active ? ' ' + CLS.active : '') + '"' + ' data-depth3-item role="option" tabindex="0"' + ' data-code="' + esc(d3.categoryCode) + '"' + ' data-depth2="' + code + '">' + esc(d3.categoryNm) + '</li>');
      }
      p.push('</ul>');
    }
    p.push('</li>');
    return p.join('');
  }

  // 스크롤: 활성 항목 중앙 정렬

  function scrollToActive() {
    var $scope = $(SCOPE);
    requestAnimationFrame(function () {
      // 좌측: 확정 depth1 or 탐색 depth1
      var d1Panel = $scope.find(SEL.depth1Panel)[0];
      var d1Target = d1Panel && (d1Panel.querySelector(SEL.depth1Item + '.' + CLS.active) || d1Panel.querySelector(SEL.depth1Item + '.' + CLS.current));
      scrollToCenter(d1Panel, d1Target);

      // 우측: depth3 > depth2 > 전체보기 순으로 탐색
      var subPanel = $scope.find(SEL.subPanel)[0];
      var subTarget = subPanel && (subPanel.querySelector(SEL.depth3Item + '.' + CLS.active) || subPanel.querySelector(SEL.depth2Item + '.' + CLS.active) || subPanel.querySelector(SEL.viewAll + '.' + CLS.active));
      scrollToCenter(subPanel, subTarget);
    });
  }

  // 이벤트 바인딩

  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // depth1 클릭 → 탐색만 (확정 안 함)
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth1Item, function () {
      var $item = $(this);
      var code = $item.attr('data-code');

      // is-current만 이동, is-active는 유지
      $item.addClass(CLS.current).siblings().removeClass(CLS.current);
      _browseD1 = code;
      _path.depth2Id = '';
      _path.depth3Id = '';
      renderSub(code);
    });

    // 전체보기 → 탐색 중인 depth1로 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.viewAll, function () {
      _path.depth2Id = '';
      _path.depth3Id = '';
      commitSelection();
    });

    // depth2 타이틀 → 해당 depth2 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth2Select, function () {
      var $d2 = $(this).closest(SEL.depth2Item);
      _path.depth2Id = $d2.attr('data-code');
      _path.depth3Id = '';
      commitSelection();
    });

    // depth2 토글 → depth3 아코디언
    $doc.on('click' + NS, SCOPE + ' ' + SEL.toggleBtn, function (e) {
      e.stopPropagation();
      var $btn = $(this);
      var $d2 = $btn.closest(SEL.depth2Item);
      var $list = $d2.find(SEL.depth3List);
      var isOpen = $d2.hasClass(CLS.open);
      $d2.toggleClass(CLS.open);
      $btn.attr('aria-expanded', String(!isOpen));
      $list.slideToggle(SLIDE_DURATION);
    });

    // depth3 선택 → 확정
    $doc.on('click' + NS, SCOPE + ' ' + SEL.depth3Item, function () {
      var $item = $(this);
      _path.depth2Id = $item.attr('data-depth2');
      _path.depth3Id = $item.attr('data-code');
      commitSelection();
    });

    // 키보드: Enter/Space → click
    $doc.on('keydown' + NS, SCOPE + ' ' + SEL.depth1Item + ',' + SCOPE + ' ' + SEL.depth3Item, function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(e.target).trigger('click');
      }
    });

    // 브레드크럼 클릭 → 팝업 오픈
    $doc.on('click' + NS, SEL.breadcrumbBtn, function () {
      if (!window.VmKendoWindow) return;
      renderDepth1();
      scrollToActive(); // 팝업 열기 전 즉시 스크롤 (안 보이는 상태)
      window.VmKendoWindow.open(POPUP_ID);
    });
  }

  /**
   * @param {object} [config]
   * @param {string} config.treeUrl  — category JSON 경로
   * @param {object} config.path     — { depth1Id, depth2Id, depth3Id }
   */
  function init(config) {
    // data-attribute 폴백
    if (!config) {
      var $scope = $(SCOPE);
      if (!$scope.length) return;
      config = {
        treeUrl: $scope.data('treeUrl'),
        path: {
          depth1Id: $scope.data('depth1') || '',
          depth2Id: $scope.data('depth2') || '',
          depth3Id: $scope.data('depth3') || ''
        }
      };
    }
    if (!config || !config.path) return;
    _path = $.extend({
      depth1Id: '',
      depth2Id: '',
      depth3Id: ''
    }, config.path);
    _browseD1 = _path.depth1Id;
    bindEvents();
    $.getJSON(config.treeUrl).done(function (data) {
      _tree = Array.isArray(data) ? data : data.tree || [];
      renderDepth1();
      updateBreadcrumb(pathNames());
    }).fail(function () {
      console.warn('[CategorySheet] tree 로드 실패:', config.treeUrl);
    });
  }
  function destroy() {
    $(document).off(NS);
    _tree = [];
    _path = {
      depth1Id: '',
      depth2Id: '',
      depth3Id: ''
    };
    _browseD1 = '';
    _bound = false;
  }
  window.CategorySheet = {
    init: init,
    destroy: destroy,
    scrollToActive: scrollToActive
  };
})(window.jQuery, window);

/***/ }),

/***/ 8550:
/***/ (function() {

/**
 * @file scripts-mo/ui/form/select.js
 * @description 커스텀 셀렉트 (모바일) — 단일 셀렉트 UI + 동적 데이터 바인딩
 * @scope init(root) 컨테이너 범위 내에서 이벤트는 closest(ROOT) 기반으로 동작
 * @maintenance
 *  - 초기화: core/ui.js에서 UI.form.init() → UI.select.init(document) 1회 호출
 *  - 부분 렌더링: UI.select.destroy(root) 후 UI.select.init(root)로 재초기화
 *
 * @api 동적 셀렉트
 *  - UI.select.setOptions($root, items)  — 옵션 동적 주입 (빈 배열 시 자동 disabled)
 *  - UI.select.setValue($root, value)    — 값 세팅
 *  - UI.select.getValue($root)           — 값 조회
 *  - UI.select.setDisabled($root, bool)  — 활성/비활성 토글
 *  - $root 지정: $('[data-select-id="아이디"]')
 *  - items 형식: [{ value: string, text: string }]
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.select = window.UI.select || {};

  // 셀렉터
  var ROOT = '[data-vits-select]';
  var TRIGGER = '[data-vits-select-trigger]';
  var LIST = '[data-vits-select-list]';
  var VALUE = '[data-vits-select-value]';
  var HIDDEN = '[data-vits-select-hidden]';
  var OPT = '.vits-select-option';
  var PORTAL = '[data-vits-select-portal]';

  // 클래스
  var CLS_OPEN = 'vits-select-open';
  var CLS_DROPUP = 'vits-select-dropup';
  var CLS_DISABLED = 'vits-select-disabled';
  var CLS_NO_OPTION = 'is-no-option';
  var CLS_SELECTED = 'vits-select-selected';
  var CLS_OPT_DISABLED = 'vits-select-option-disabled';
  var CLS_PORTAL_LIST = 'vits-select-list-portal';
  var NS = '.uiSelect';
  var GUTTER = 8;
  var MIN_H = 120;
  var PORTAL_GAP = 4;
  var Z_INDEX_PORTAL = 99999;
  var DATA_CONTAINER_KEY = 'uiSelectContainerKey';
  var DATA_ROOT_KEY = 'uiSelectRootKey';
  var DATA_PORTAL_ORIGIN = 'uiSelectPortalOrigin';

  // 스코프 저장소
  var scopes = {};
  var scopeSeq = 0;
  function toStr(v) {
    return String(v == null ? '' : v);
  }
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function isPortal($root) {
    return $root.is(PORTAL);
  }
  function getRootScopeKey($root) {
    var v = $root && $root.length ? $root.data(DATA_ROOT_KEY) : null;
    return v != null ? v : 0;
  }
  function getContainerScopeKey($container) {
    var v = $container && $container.length ? $container.data(DATA_CONTAINER_KEY) : null;
    return v != null ? v : null;
  }
  function getScope(scopeKey) {
    return scopes[scopeKey] || null;
  }

  // portal list 필터 공통
  function findPortalList($root) {
    return $('body').children(LIST).filter(function () {
      var $origin = $(this).data(DATA_PORTAL_ORIGIN);
      return $origin && $origin.is($root);
    });
  }

  // root에 연결된 list 찾기 (portal 대응)
  function findList($root) {
    var $list = $root.find(LIST);
    if ($list.length) return $list;
    return findPortalList($root);
  }

  // portal list 닫기
  function closePortal($root) {
    var $list = findPortalList($root);
    if (!$list.length) return;
    $list.removeData(DATA_PORTAL_ORIGIN).removeClass(CLS_PORTAL_LIST).css({
      position: '',
      top: '',
      left: '',
      minWidth: '',
      maxHeight: '',
      zIndex: ''
    }).appendTo($root);
  }

  // 특정 루트 닫기
  function closeOne($root) {
    if (!$root || !$root.length) return;
    $root.removeClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'false');
    if (isPortal($root)) {
      closePortal($root);
    } else {
      $root.find(LIST).each(function () {
        this.style.maxHeight = '0px';
      });
    }
  }

  // 스코프 단위 닫기
  function closeOpenedInScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope || !scope.openRoot || !scope.openRoot.length) return;
    closeOne(scope.openRoot);
    scope.openRoot = null;
  }

  // 전체 닫기
  function closeAllOpened() {
    Object.keys(scopes).forEach(function (k) {
      closeOpenedInScope(parseInt(k, 10));
    });
  }

  // 스크롤 컨테이너 탐색
  function getScrollParent(el) {
    var p = el && el.parentElement;
    while (p && p !== document.body && p !== document.documentElement) {
      var st = window.getComputedStyle(p);
      var oy = st.overflowY;
      if (oy === 'auto' || oy === 'scroll') return p;
      p = p.parentElement;
    }
    return window;
  }

  // dropup/최대높이 계산 (일반 모드)
  function applyDropDirection($root) {
    if (!$root || !$root.length) return;
    $root.removeClass(CLS_DROPUP);
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;
    var triggerEl = $trigger.get(0);
    var listEl = $list.get(0);
    if (!triggerEl || !listEl) return;
    var scroller = getScrollParent(triggerEl);
    var cRect = scroller === window ? {
      top: 0,
      bottom: window.innerHeight
    } : scroller.getBoundingClientRect();
    var tRect = triggerEl.getBoundingClientRect();
    var spaceBelow = cRect.bottom - tRect.bottom;
    var spaceAbove = tRect.top - cRect.top;
    var prevMaxH = listEl.style.maxHeight;
    listEl.style.maxHeight = 'none';
    var listH = listEl.scrollHeight;
    listEl.style.maxHeight = prevMaxH;
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    $root.toggleClass(CLS_DROPUP, shouldDropUp);
    var calcMaxH = (shouldDropUp ? spaceAbove : spaceBelow) - GUTTER;
    if (calcMaxH < MIN_H) calcMaxH = MIN_H;
    var customMaxH = $root.attr('data-max-height');
    if (customMaxH && /^\d+$/.test(customMaxH)) customMaxH = customMaxH + 'px';
    var maxH = customMaxH || calcMaxH + 'px';
    listEl.style.maxHeight = maxH;
    listEl.style.overflowY = 'auto';
  }

  // portal 모드 열기
  function openPortal($root) {
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;
    var rect = $trigger[0].getBoundingClientRect();
    var customMaxH = $root.attr('data-max-height');
    if (customMaxH && /^\d+$/.test(customMaxH)) {
      customMaxH = customMaxH + 'px';
    }
    $list.data(DATA_PORTAL_ORIGIN, $root).addClass(CLS_PORTAL_LIST).css({
      position: 'fixed',
      left: rect.left + 'px',
      minWidth: rect.width + 'px',
      zIndex: Z_INDEX_PORTAL
    }).appendTo('body');
    var listH = $list.outerHeight();
    var spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    var spaceAbove = rect.top - GUTTER;
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    var calcMaxH;
    var maxH;
    if (shouldDropUp) {
      calcMaxH = Math.max(spaceAbove, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: '',
        bottom: window.innerHeight - rect.top + PORTAL_GAP + 'px',
        maxHeight: maxH
      });
      $root.addClass(CLS_DROPUP);
    } else {
      calcMaxH = Math.max(spaceBelow, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: rect.bottom + PORTAL_GAP + 'px',
        bottom: '',
        maxHeight: maxH
      });
      $root.removeClass(CLS_DROPUP);
    }
  }

  // 특정 루트 오픈
  function openOne($root) {
    var scopeKey = getRootScopeKey($root);
    closeOpenedInScope(scopeKey);
    if (isPortal($root)) {
      openPortal($root);
    } else {
      applyDropDirection($root);
    }
    $root.addClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'true');
    var scope = getScope(scopeKey);
    if (scope) scope.openRoot = $root;
  }

  // disabled 동기화
  function setDisabled($root, disabled) {
    var on = !!disabled;
    $root.toggleClass(CLS_DISABLED, on);
    $root.find(TRIGGER).prop('disabled', on);
    if (on) {
      closeOne($root);
      var scope = getScope(getRootScopeKey($root));
      if (scope && scope.openRoot && scope.openRoot.is($root)) scope.openRoot = null;
    }
  }
  function setNoOption($root, on) {
    $root.toggleClass(CLS_NO_OPTION, !!on);
  }

  // hidden 값 세팅 + change 트리거
  function setHiddenVal($root, v) {
    var $hidden = $root.find(HIDDEN);
    if (!$hidden.length) return;
    $hidden.val(toStr(v));
    $hidden.trigger('change');
  }
  function getHiddenVal($root) {
    var $hidden = $root.find(HIDDEN);
    return $hidden.length ? toStr($hidden.val()) : '';
  }

  // placeholder 초기화
  function resetToPlaceholder($root, clearOptions) {
    $root.removeClass('is-selected');
    var $value = $root.find(VALUE);
    if ($value.length) $value.text($value.attr('data-placeholder') || '');
    setHiddenVal($root, '');
    var $list = findList($root);
    $list.find(OPT).removeClass(CLS_SELECTED).attr('aria-selected', 'false');
    if (clearOptions) $list.empty();
  }
  function disableAsNoOption($root) {
    resetToPlaceholder($root, true);
    setNoOption($root, true);
    setDisabled($root, true);
  }

  // 옵션 렌더링
  function renderOptions($root, items) {
    var $list = findList($root);
    if (!$list.length) return;
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.value) continue;
      html += '<li class="vits-select-option" role="option" tabindex="-1" data-value="' + escHtml(toStr(it.value)) + '" aria-selected="false">' + escHtml(toStr(it.text || '')) + '</li>';
    }
    $list.html(html);
  }
  function enableWithOptions($root, items) {
    setNoOption($root, false);
    renderOptions($root, items);
    setDisabled($root, false);
  }

  // 옵션 선택 처리
  function setSelected($root, $opt) {
    var $list = findList($root);
    $list.find(OPT).each(function () {
      var $el = $(this);
      var sel = $el.is($opt);
      $el.toggleClass(CLS_SELECTED, sel);
      $el.attr('aria-selected', sel ? 'true' : 'false');
    });
    $root.addClass('is-selected');
    $root.find(VALUE).text($opt.text());
    setHiddenVal($root, $opt.attr('data-value') || '');
  }
  function setSelectedByValue($root, value) {
    var v = toStr(value);
    if (!v) return false;
    var $list = findList($root);
    var $match = $list.find(OPT).filter(function () {
      return $(this).attr('data-value') === v;
    });
    if (!$match.length) return false;
    setSelected($root, $match.eq(0));
    return true;
  }

  // 옵션 클릭 공통 핸들러
  function handleOptionClick($opt) {
    if ($opt.hasClass(CLS_OPT_DISABLED)) return;
    var $list = $opt.closest(LIST);
    var $root = $list.data(DATA_PORTAL_ORIGIN) || $opt.closest(ROOT);
    var scopeKey = getRootScopeKey($root);
    setSelected($root, $opt);
    closeOpenedInScope(scopeKey);
    var url = toStr($opt.attr('data-url')).trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  // portal 위치 갱신
  function updatePortalPosition($root) {
    if (!$root || !$root.length) return;
    var $trigger = $root.find(TRIGGER);
    var $list = findPortalList($root);
    if (!$trigger.length || !$list.length) return;
    var rect = $trigger[0].getBoundingClientRect();
    var isDropUp = $root.hasClass(CLS_DROPUP);
    if (isDropUp) {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: '',
        bottom: window.innerHeight - rect.top + PORTAL_GAP + 'px'
      });
    } else {
      $list.css({
        left: rect.left + 'px',
        minWidth: rect.width + 'px',
        top: rect.bottom + PORTAL_GAP + 'px',
        bottom: ''
      });
    }
  }

  // 스코프 캐시 구축
  function buildScopeCache(scopeKey, $container) {
    $container.find(ROOT).each(function () {
      $(this).data(DATA_ROOT_KEY, scopeKey);
    });
    scopes[scopeKey] = {
      $container: $container,
      openRoot: null
    };
  }

  // 스코프 캐시 제거
  function destroyScope(scopeKey) {
    var scope = getScope(scopeKey);
    if (!scope) return;
    closeOpenedInScope(scopeKey);
    if (scope.$container && scope.$container.length) {
      scope.$container.removeData(DATA_CONTAINER_KEY);
      scope.$container.find(ROOT).each(function () {
        $(this).removeData(DATA_ROOT_KEY);
      });
    }
    delete scopes[scopeKey];
  }
  function destroy(root) {
    if (!root) return;
    var $container = $(root);
    var scopeKey = getContainerScopeKey($container);
    if (scopeKey == null) return;
    destroyScope(scopeKey);
  }
  function destroyAll() {
    Object.keys(scopes).forEach(function (k) {
      destroyScope(parseInt(k, 10));
    });
  }

  // 이벤트 바인딩 (1회)
  function bind() {
    // 외부 탭/클릭 시 닫기
    $(document).on('mousedown' + NS + ' touchstart' + NS, function (e) {
      var $target = $(e.target);
      if (!$target.closest(ROOT).length && !$target.closest('.' + CLS_PORTAL_LIST).length) {
        closeAllOpened();
      }
    });

    // 트리거 클릭
    $(document).on('click' + NS, ROOT + ' ' + TRIGGER, function (e) {
      e.preventDefault();
      var $root = $(this).closest(ROOT);
      if ($root.hasClass(CLS_DISABLED)) return;
      var scopeKey = getRootScopeKey($root);
      if ($root.hasClass(CLS_OPEN)) {
        closeOpenedInScope(scopeKey);
        return;
      }
      openOne($root);
    });

    // 옵션 클릭 (일반 모드)
    $(document).on('click' + NS, ROOT + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 옵션 클릭 (portal 모드)
    $(document).on('click' + NS, '.' + CLS_PORTAL_LIST + ' ' + OPT, function (e) {
      e.preventDefault();
      handleOptionClick($(this));
    });

    // 스크롤 감지 (capture phase)
    document.addEventListener('scroll', function (e) {
      var $scrolled = $(e.target);
      if ($scrolled.closest(LIST).length || $scrolled.hasClass(CLS_PORTAL_LIST)) return;
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          if (scope.openRoot.closest('.k-window').length) {
            closeOpenedInScope(k);
          } else {
            updatePortalPosition(scope.openRoot);
          }
        }
      });
    }, true);

    // 리사이즈
    $(window).on('resize' + NS, function () {
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          updatePortalPosition(scope.openRoot);
        }
      });
    });
  }

  // 스코프 초기화
  function init(root) {
    if (!root) root = document;
    destroy(root);
    var scopeKey = ++scopeSeq;
    var $container = $(root);
    $container.data(DATA_CONTAINER_KEY, scopeKey);
    buildScopeCache(scopeKey, $container);
    $container.find(ROOT).find(TRIGGER).attr('aria-expanded', 'false');
    $container.find(ROOT).each(function () {
      var $r = $(this);
      if ($r.hasClass(CLS_DISABLED)) setDisabled($r, true);
    });
  }

  // Public API
  window.UI.select.init = function (root) {
    if (!window.UI.select.__bound) {
      bind();
      window.UI.select.__bound = true;
    }
    init(root);
  };
  window.UI.select.destroy = function (root) {
    destroy(root);
  };
  window.UI.select.destroyAll = function () {
    destroyAll();
  };

  // 동적 옵션 주입
  window.UI.select.setOptions = function ($root, items) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return;
    if (!items || !items.length) {
      disableAsNoOption($root);
      return;
    }
    resetToPlaceholder($root, true);
    enableWithOptions($root, items);
  };

  // 선택 초기화
  window.UI.select.reset = function ($root) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return;
    resetToPlaceholder($root, true);
  };

  // 값 세팅
  window.UI.select.setValue = function ($root, value) {
    $root = $($root).closest(ROOT);
    if (!$root.length) return false;
    return setSelectedByValue($root, value);
  };

  // 값 조회
  window.UI.select.getValue = function ($root) {
    $root = $($root).closest(ROOT);
    return $root.length ? getHiddenVal($root) : '';
  };

  // disabled 토글
  window.UI.select.setDisabled = function ($root, disabled) {
    $root = $($root).closest(ROOT);
    if ($root.length) setDisabled($root, disabled);
  };
})(window.jQuery, window, document);

/***/ }),

/***/ 9592:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/tooltip.js
 * @description data-tooltip 기반 툴팁 공통 (모바일)
 * @option data-tooltip="right|left|top|bottom" : 툴팁 위치 (CSS에서 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiTooltip';
  var ACTIVE = 'is-open';

  // 툴팁 열기
  function openTooltip($trigger, $content) {
    $content.addClass(ACTIVE).attr('aria-hidden', 'false');
    $trigger.attr('aria-expanded', 'true');
  }

  // 툴팁 닫기
  function closeTooltip($trigger, $content) {
    $content.removeClass(ACTIVE).attr('aria-hidden', 'true');
    $trigger.attr('aria-expanded', 'false');
  }

  // 모든 열린 툴팁 닫기
  function closeAllTooltips() {
    $('.vits-tooltip-content.' + ACTIVE).each(function () {
      var $content = $(this);
      var $tooltip = $content.closest('[data-tooltip]');
      var $trigger = $tooltip.find('.vits-tooltip-trigger');
      closeTooltip($trigger, $content);
    });
  }

  // 개별 툴팁 이벤트 바인딩
  function bindTooltip($tooltip) {
    if ($tooltip.data('tooltip-bound')) return;
    $tooltip.data('tooltip-bound', true);
    var $trigger = $tooltip.find('.vits-tooltip-trigger');
    var $content = $tooltip.find('.vits-tooltip-content');
    var $closeBtn = $content.find('.vits-tooltip-heading .button');
    if (!$trigger.length || !$content.length) return;

    // 초기 접근성 상태 보장
    $trigger.attr('aria-expanded', 'false');
    $trigger.on('click' + NS, function (e) {
      e.preventDefault();
      e.stopPropagation();
      var isOpen = $content.hasClass(ACTIVE);
      closeAllTooltips();
      if (!isOpen) {
        openTooltip($trigger, $content);
      }
    });
    if ($closeBtn.length) {
      $closeBtn.on('click' + NS, function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeTooltip($trigger, $content);
        $trigger.focus();
      });
    }

    // 툴팁 내부 클릭 시 전파 방지
    $content.on('click' + NS, function (e) {
      e.stopPropagation();
    });
  }

  // 전역 이벤트 바인딩 (외부 클릭, ESC)
  function bind() {
    // 외부 탭/클릭 시 닫기
    $(document).on('click' + NS + ' touchstart' + NS, function (e) {
      if (!$(e.target).closest('[data-tooltip]').length) {
        closeAllTooltips();
      }
    });

    // ESC 키로 닫기
    $(document).on('keydown' + NS, function (e) {
      if (e.key === 'Escape') {
        var $openContent = $('.vits-tooltip-content.' + ACTIVE);
        if ($openContent.length) {
          var $tooltip = $openContent.closest('[data-tooltip]');
          var $trigger = $tooltip.find('.vits-tooltip-trigger');
          closeTooltip($trigger, $openContent);
          $trigger.focus();
        }
      }
    });
  }
  window.UI.tooltip = {
    init: function () {
      // 전역 이벤트 1회 바인딩
      if (!window.UI.tooltip._initialized) {
        bind();
        window.UI.tooltip._initialized = true;
      }
      $('[data-tooltip]').each(function () {
        bindTooltip($(this));
      });
    }
  };
})(window.jQuery, window);

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
/******/ 			133: 0,
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,817,152,486,133,766], function() { return __webpack_require__(5672); })
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;