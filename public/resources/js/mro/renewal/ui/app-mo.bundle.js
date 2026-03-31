/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 548:
/***/ (function() {

/**
 * @file scripts-mo/ui/form/checkbox-total.js
 * @description data-속성 기반 체크박스 전체선택/해제 + 선택 개수 실시간 감지
 * @scope [data-checkbox-scope]
 * @mapping data-checkbox-all: 전체선택, data-checkbox-item: 개별항목, data-checked-count: 개수 표시
 * @state is-checked - 체크 상태 시각적 반영
 * @note disabled 항목 제외
 */

(function ($, window) {
  'use strict';

  if (!$) {
    return;
  }
  window.UI = window.UI || {};
  var CHECKED = 'is-checked';
  var NS = '.checkboxTotal';
  var BOUND_FLAG = 'checkboxTotalBound';
  function getActiveItems($scope) {
    return $scope.find('[data-checkbox-item]').not(':disabled');
  }
  function syncClass($el) {
    $el.toggleClass(CHECKED, $el.is(':checked'));
  }
  function updateCheckAllState($scope) {
    var $allCheckbox = $scope.find('[data-checkbox-all]');
    if (!$allCheckbox.length) return;
    var $items = getActiveItems($scope);
    var totalCount = $items.length;
    var checkedCount = $items.filter(':checked').length;
    var isAllChecked = totalCount > 0 && totalCount === checkedCount;
    $allCheckbox.prop('checked', isAllChecked);
    syncClass($allCheckbox);
  }
  function updateCount($scope) {
    var $countTarget = $scope.find('[data-checked-count]');
    if (!$countTarget.length) return;
    var count = $scope.find('[data-checkbox-item]:checked').length;
    $countTarget.text(count);
    var callback = $scope.data('checkbox-callback');
    if (typeof callback === 'function') {
      callback(count);
    }
    $scope.trigger('checkbox-change', [count]);
  }
  function bindScope($scope) {
    if ($scope.data(BOUND_FLAG)) return;
    $scope.on('change' + NS, '[data-checkbox-all]', function () {
      var $allCheckbox = $(this);
      var isChecked = $allCheckbox.is(':checked');
      var $items = getActiveItems($scope);
      $items.prop('checked', isChecked);
      $items.each(function () {
        syncClass($(this));
      });
      syncClass($allCheckbox);
      updateCount($scope);
    });
    $scope.on('change' + NS, '[data-checkbox-item]', function () {
      syncClass($(this));
      updateCheckAllState($scope);
      updateCount($scope);
    });
    $scope.data(BOUND_FLAG, true);
  }
  function unbindScope($scope) {
    $scope.off(NS);
    $scope.removeData(BOUND_FLAG);
  }
  window.UI.checkboxTotal = {
    init: function () {
      $('[data-checkbox-scope]').each(function () {
        bindScope($(this));
      });
    },
    destroy: function () {
      $('[data-checkbox-scope]').each(function () {
        unbindScope($(this));
      });
    },
    refresh: function ($scope) {
      if (!$scope || !$scope.length) return;
      updateCheckAllState($scope);
      updateCount($scope);
    },
    setCallback: function ($scope, callback) {
      if (!$scope || !$scope.length) return;
      $scope.data('checkbox-callback', callback);
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 689:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/auth.js
 * @description 모바일 로그인/인증 페이지 UI (인증 탭, 비밀번호 표시·숨김 토글)
 * @reference scripts/ui/auth-ui.js
 * @scope .vits-auth-tabs + .vits-login-form-fields | .vm-login-form-fields
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var AUTH_TAB_FIELD_GROUPS = '.vits-login-form-fields, .vm-login-form-fields';
  function setAuthTabActive(btnList, groupList, index) {
    for (var i = 0; i < btnList.length; i++) {
      var isActive = i === index;
      btnList[i].classList.toggle('is-active', isActive);
      btnList[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
    for (var j = 0; j < groupList.length; j++) {
      var active = j === index;
      groupList[j].style.display = active ? '' : 'none';
      groupList[j].setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  /**
   * 인증 방법 탭 전환 (이메일/휴대전화 등)
   */
  function initAuthTabs(root) {
    var el = root && root.nodeType === 1 ? root : document;
    var tabWraps = el.querySelectorAll('.vits-auth-tabs');
    for (var w = 0; w < tabWraps.length; w++) {
      var tabWrap = tabWraps[w];
      var buttons = tabWrap.querySelectorAll('button');
      if (!buttons.length) continue;
      var form = tabWrap.closest('form');
      if (!form && tabWrap.parentElement) {
        var next = tabWrap.parentElement.nextElementSibling;
        if (next && next.tagName === 'FORM') form = next;
      }
      if (!form) continue;
      var fieldGroups = form.querySelectorAll(AUTH_TAB_FIELD_GROUPS);
      if (fieldGroups.length < 2) continue;
      var currentIndex = -1;
      for (var k = 0; k < buttons.length; k++) {
        if (buttons[k].classList.contains('is-active')) {
          currentIndex = k;
          break;
        }
      }
      if (currentIndex < 0) currentIndex = 0;
      setAuthTabActive(buttons, fieldGroups, currentIndex);
      for (var b = 0; b < buttons.length; b++) {
        var btn = buttons[b];
        if (btn.dataset.authTabBound === 'true') continue;
        btn.dataset.authTabBound = 'true';
        if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
        (function (idx) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            setAuthTabActive(buttons, fieldGroups, idx);
          });
        })(b);
      }
    }
  }

  /**
   * 비밀번호 표시/숨김 토글 버튼 초기화
   */
  function initPasswordToggle(root) {
    var el = root && root.nodeType === 1 ? root : document;
    var eyeButtons = el.querySelectorAll('.vits-btn-eyes button');
    for (var i = 0; i < eyeButtons.length; i++) {
      var btn = eyeButtons[i];
      if (btn.dataset.passwordToggleBound === 'true') continue;
      btn.dataset.passwordToggleBound = 'true';
      if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
      btn.addEventListener('click', function () {
        var iconSpan = this.querySelector('.ic');
        if (!iconSpan) return;
        var isOpen = this.classList.contains('is-eye-open');
        var input = this.closest('.vits-input') ? this.closest('.vits-input').querySelector('input') : null;
        if (isOpen) {
          this.classList.remove('is-eye-open');
          this.classList.add('is-eye-close');
          iconSpan.classList.remove('ic-eye-show');
          iconSpan.classList.add('ic-eye-hide');
          this.setAttribute('aria-label', '비밀번호 표시');
          if (input) input.type = 'password';
        } else {
          this.classList.remove('is-eye-close');
          this.classList.add('is-eye-open');
          iconSpan.classList.remove('ic-eye-hide');
          iconSpan.classList.add('ic-eye-show');
          this.setAttribute('aria-label', '비밀번호 숨기기');
          if (input) input.type = 'text';
        }
      });
    }
  }
  window.UI.auth = {
    init: function (root) {
      initAuthTabs(root);
      initPasswordToggle(root);
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 862:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/pull-refresh.js
 * @description 모바일 커스텀 pull-to-refresh (내부 스크롤 컨테이너용)
 * @scope .vm-content-wrap
 * @mapping .vm-wrap (상태 클래스 부여 대상)
 * @state is-pull-refreshing: 당기는 중
 * @state is-pull-triggered: 임계값 초과 (놓으면 새로고침)
 * @note
 *  - body 스크롤이 아닌 .vm-content-wrap 내부 스크롤 환경에서
 *    브라우저 기본 pull-to-refresh가 동작하지 않는 문제를 보완한다.
 *  - --pull-distance CSS 변수로 당김 거리 전달 (스피너 연동용)
 *  - init(): 멱등성 보장
 *  - destroy(): DOM 제거 전 호출 권장
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var STATE = {
    PULLING: 'is-pull-refreshing',
    TRIGGERED: 'is-pull-triggered'
  };
  var SELECTOR = {
    SCROLL_CONTAINER: '.vm-content-wrap',
    WRAP: '.vm-wrap'
  };
  var INTERNAL = {
    THRESHOLD: 80,
    MAX_PULL: 120,
    RESISTANCE: 0.4
  };
  var CSS_VAR = '--pull-distance';
  var $scrollContainer = null;
  var $wrap = null;
  var isBound = false;
  var isRefreshing = false;
  var startY = 0;
  var pullDistance = 0;
  var isTouching = false;

  // 옵션 (init 시 덮어쓰기 가능)
  var opts = {
    onRefresh: null
  };

  // 스크롤 컨테이너 캐싱
  function getScrollContainer() {
    if (!$scrollContainer || !$scrollContainer.length) {
      $scrollContainer = $(SELECTOR.SCROLL_CONTAINER).not(function () {
        return this.closest('.vm-search-overlay');
      }).first();
    }
    return $scrollContainer;
  }

  // 래퍼 캐싱
  function getWrap() {
    if (!$wrap || !$wrap.length) {
      $wrap = getScrollContainer().closest(SELECTOR.WRAP);
    }
    return $wrap;
  }

  // UI 리셋
  function resetUI() {
    pullDistance = 0;
    var wrap = getWrap();
    if (wrap.length) {
      wrap.removeClass(STATE.PULLING).removeClass(STATE.TRIGGERED);
      wrap[0].style.removeProperty(CSS_VAR);
    }
  }

  // 새로고침 트리거
  function trigger() {
    isRefreshing = true;
    if (typeof opts.onRefresh === 'function') {
      // 비동기 완료 후 done() 호출
      opts.onRefresh(function () {
        isRefreshing = false;
        resetUI();
      });
    } else {
      location.reload();
    }
  }

  // --- 터치 핸들러 ---
  function onTouchStart(e) {
    if (isRefreshing) return;
    var el = getScrollContainer()[0];
    if (!el || el.scrollTop > 0) return;
    startY = e.touches[0].clientY;
    isTouching = true;
    pullDistance = 0;
  }
  function onTouchMove(e) {
    if (!isTouching || isRefreshing) return;
    var el = getScrollContainer()[0];
    if (!el) return;
    var delta = e.touches[0].clientY - startY;

    // 위로 스와이프는 무시
    if (delta <= 0) {
      resetUI();
      return;
    }

    // 스크롤이 내려간 상태에서 시작된 터치 무시
    if (el.scrollTop > 0) {
      isTouching = false;
      return;
    }

    // 당기는 중 기본 스크롤 차단
    e.preventDefault();

    // 저항 적용
    pullDistance = Math.min(delta * INTERNAL.RESISTANCE, INTERNAL.MAX_PULL);
    var wrap = getWrap();
    wrap.addClass(STATE.PULLING);
    if (pullDistance >= INTERNAL.THRESHOLD) {
      wrap.addClass(STATE.TRIGGERED);
    } else {
      wrap.removeClass(STATE.TRIGGERED);
    }

    // CSS 변수로 당김 거리 전달
    wrap[0].style.setProperty(CSS_VAR, pullDistance + 'px');
  }
  function onTouchEnd() {
    if (!isTouching) return;
    isTouching = false;
    if (pullDistance >= INTERNAL.THRESHOLD && !isRefreshing) {
      trigger();
    } else {
      resetUI();
    }
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (isBound) return;
    var el = getScrollContainer()[0];
    if (!el) return;
    isBound = true;
    // passive: false — 당기는 중 preventDefault 필요
    el.addEventListener('touchstart', onTouchStart, {
      passive: true
    });
    el.addEventListener('touchmove', onTouchMove, {
      passive: false
    });
    el.addEventListener('touchend', onTouchEnd, {
      passive: true
    });
  }

  // 이벤트 해제
  function unbindEvents() {
    if (!isBound) return;
    isBound = false;
    var el = getScrollContainer()[0];
    if (!el) return;
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
  }
  window.UI.pullRefresh = {
    /**
     * @param {Object} [options]
     * @option {Function} [onRefresh] - 커스텀 새로고침 콜백. done()을 인자로 받음.
     *         null이면 location.reload() 실행.
     */
    init: function (options) {
      if (isBound) return;
      $.extend(opts, options);
      bindEvents();
    },
    destroy: function () {
      unbindEvents();
      resetUI();
      $scrollContainer = null;
      $wrap = null;
      isRefreshing = false;
      isTouching = false;
    }
  };
})(window.jQuery, window);

/***/ }),

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

/***/ 1014:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-datepicker-single.js
 * @description 단일 DatePicker 초기화 모듈 (모바일 최적화)
 * @scope .vits-datepicker-single [data-ui="kendo-datepicker"]
 * @mapping js-kendo-datepicker(입력), vits-datepicker-single(래퍼)
 * @state is-selected: 날짜 선택 완료
 * @option format, culture, min, max, open, disablePast, appendTo, popupAlign (data-opt JSON, data-open)
 * @a11y k-state-disabled + aria-disabled로 비활성 날짜·이전 달 네비게이션 차단
 * @note iOS Safari rAF 타이밍 이슈로 debounce 기반 스케줄링 사용
 */
(function (window) {
  'use strict';

  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var YEARVIEW_MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 모바일 브라우저 렌더링 지연 대응 상수
  var DEBOUNCE_DELAY = 16;
  var MOBILE_TIMEOUT_DELAY = 50;
  var MAX_RETRY_COUNT = 3;
  function parseJsonSafe(str) {
    if (!str) return null;
    try {
      return JSON.parse(str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
    } catch {
      return null;
    }
  }
  function parseBool(val) {
    if (val === undefined || val === null) return null;
    if (typeof val === 'boolean') return val;
    var v = String(val).toLowerCase().trim();
    if (v === 'true' || v === '1') return true;
    if (v === 'false' || v === '0') return false;
    return null;
  }
  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoDatePicker);
  }
  function debounce(func, delay) {
    var timeoutId = null;
    return function () {
      var args = arguments;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(function () {
        timeoutId = null;
        func.apply(null, args);
      }, delay);
    };
  }

  // 모바일에서 DOM 렌더 타이밍이 불안정할 때 재시도
  function retryDomOperation(operation, maxRetries) {
    maxRetries = maxRetries || MAX_RETRY_COUNT;
    var attempt = 0;
    function tryOperation() {
      if (attempt >= maxRetries) return;
      try {
        if (operation()) return;
      } catch {
        // 실패 시 재시도
      }
      attempt++;
      setTimeout(tryOperation, MOBILE_TIMEOUT_DELAY);
    }
    tryOperation();
  }
  function initDatePicker(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDatePicker')) return;
    var opts = parseJsonSafe($el.attr('data-opt') || '{}') || {};
    var $calendarWrap = null;
    var $wrapper = $el.closest('[data-ui="kendo-datepicker-single"]');

    // disablePast 활성 시 할당 — Observer 콜백에서도 참조
    var applyPastDisabledStyle = null;

    // 타임아웃·옵저버 일괄 정리용
    var cleanup = {
      timeouts: [],
      observers: []
    };
    function addTimeout(id) {
      cleanup.timeouts.push(id);
      return id;
    }
    function destroyCleanup() {
      cleanup.timeouts.forEach(function (id) {
        clearTimeout(id);
      });
      cleanup.timeouts.length = 0;
      cleanup.observers.forEach(function (observer) {
        if (observer && observer.disconnect) {
          observer.disconnect();
        }
      });
      cleanup.observers.length = 0;
    }
    function getCalendar() {
      var inst = $el.data('kendoDatePicker');
      return inst && inst.dateView && inst.dateView.calendar;
    }
    function resolveCalendarWrap() {
      if ($calendarWrap && $calendarWrap.length) return $calendarWrap;
      var cal = getCalendar();
      if (cal) $calendarWrap = cal.element;
      return $calendarWrap;
    }
    function applyCalendarClasses() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      var $outer = $el.closest('.vits-datepicker-single');
      if (!$outer.length) return;
      var classes = ($outer.attr('class') || '').split(/\s+/);
      classes.forEach(function (cls) {
        if (cls.indexOf('vits-') === 0) $wrap.addClass(cls);
      });
    }
    function pad2(num) {
      return num < 10 ? '0' + num : String(num);
    }
    function formatHeaderMonthParts(date) {
      if (!date) return null;
      return {
        year: String(date.getFullYear()),
        month: pad2(date.getMonth() + 1)
      };
    }
    function applyDayNamesImmediate() {
      return retryDomOperation(function () {
        var $wrap = resolveCalendarWrap();
        if (!$wrap) return false;
        var $headers = $wrap.find('th');
        if (!$headers.length) return false;
        $headers.each(function (i) {
          if (i >= DAY_NAMES.length) return;
          var $th = window.jQuery(this);
          var $link = $th.find('.k-link');
          var nextText = DAY_NAMES[i];
          if ($link.length) {
            if ($link.text() !== nextText) $link.text(nextText);
          } else if ($th.text() !== nextText) {
            $th.text(nextText);
          }
        });
        applyCalendarClasses();
        return true;
      });
    }
    function applyHeaderMonthImmediate() {
      return retryDomOperation(function () {
        var $wrap = resolveCalendarWrap();
        if (!$wrap) return false;
        var cal = getCalendar();
        var current = cal && typeof cal.current === 'function' ? cal.current() : null;
        var parts = formatHeaderMonthParts(current);
        if (!parts) return false;
        var nextText = parts.year + '.' + parts.month;
        var $header = $wrap.find('.k-header, .k-calendar-header').first();
        var $headerLink = $wrap.find('.k-nav-fast, .k-calendar-header .k-link, .k-header .k-link, .k-calendar-header .k-title, .k-header .k-title').first();
        if (!$headerLink.length && $header.length) $headerLink = $header;
        if (!$headerLink.length) return false;
        var $buttonText = $headerLink.find('.k-button-text').first();
        var useDot = $header.hasClass('k-hstack');
        // html()은 Date 객체 기반 숫자만 삽입하므로 XSS 안전
        var nextHtml = parts.year + '<span class="nav-dot">.</span>' + parts.month;
        if ($buttonText.length) {
          if (useDot) {
            if ($buttonText.html() !== nextHtml) $buttonText.html(nextHtml);
          } else if ($buttonText.text() !== nextText) {
            $buttonText.text(nextText);
          }
        } else if (useDot) {
          if ($headerLink.html() !== nextHtml) $headerLink.html(nextHtml);
        } else if ($headerLink.text() !== nextText) {
          $headerLink.text(nextText);
        }
        return true;
      });
    }
    function applyYearViewMonthNamesImmediate() {
      return retryDomOperation(function () {
        var $wrap = resolveCalendarWrap();
        if (!$wrap) return false;
        var $yearView = $wrap.find('.k-calendar-yearview').first();
        if (!$yearView.length) return false;
        var $monthLinks = $yearView.find('td .k-link');
        if (!$monthLinks.length) return false;
        $monthLinks.each(function (i) {
          var nextText = YEARVIEW_MONTH_NAMES[i];
          if (!nextText) return;
          var $link = window.jQuery(this);
          if ($link.text() !== nextText) $link.text(nextText);
        });
        return true;
      });
    }

    // 디바운싱된 적용 함수 — iOS Safari에서 rAF 타이밍이 불안정하여 debounce 사용
    var debouncedApplyDayNames = debounce(applyDayNamesImmediate, DEBOUNCE_DELAY);
    var debouncedApplyHeaderMonth = debounce(applyHeaderMonthImmediate, DEBOUNCE_DELAY);
    var debouncedApplyYearViewMonths = debounce(applyYearViewMonthNamesImmediate, DEBOUNCE_DELAY);
    function forceApplyDayNames() {
      debouncedApplyDayNames();
      addTimeout(setTimeout(debouncedApplyDayNames, MOBILE_TIMEOUT_DELAY));
    }
    function forceApplyHeaderMonth() {
      debouncedApplyHeaderMonth();
      addTimeout(setTimeout(debouncedApplyHeaderMonth, MOBILE_TIMEOUT_DELAY));
    }
    function forceApplyYearViewMonthNames() {
      debouncedApplyYearViewMonths();
      addTimeout(setTimeout(debouncedApplyYearViewMonths, MOBILE_TIMEOUT_DELAY));
    }
    function ensureDayNameObserver() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap || !window.MutationObserver) return;
      var target = $wrap[0];
      var isUpdatingUI = false;

      // 기존 옵저버 정리 후 재생성
      cleanup.observers.forEach(function (observer) {
        if (observer && observer.disconnect) {
          observer.disconnect();
        }
      });
      cleanup.observers.length = 0;
      var observer = new window.MutationObserver(function () {
        if (isUpdatingUI) return;
        isUpdatingUI = true;
        observer.disconnect();

        // schedule 대신 직접 호출 — 깜빡임 방지
        applyDayNamesImmediate();
        applyHeaderMonthImmediate();
        applyYearViewMonthNamesImmediate();
        // Observer DOM 재조작 후 과거 날짜 비활성 스타일 재적용
        if (applyPastDisabledStyle) applyPastDisabledStyle();
        addTimeout(setTimeout(function () {
          observer.observe(target, {
            childList: true,
            subtree: true,
            characterData: true
          });
          isUpdatingUI = false;
        }, MOBILE_TIMEOUT_DELAY));
      });
      observer.observe(target, {
        childList: true,
        subtree: true,
        characterData: true
      });
      cleanup.observers.push(observer);
    }
    function disableCalendarAnimation() {
      var cal = getCalendar();
      if (!cal) return;
      try {
        cal.setOptions({
          animation: false
        });
      } catch {
        cal.options.animation = false;
      }
    }
    function updatePrevNavState() {
      var cal = getCalendar();
      var $wrap = resolveCalendarWrap();
      if (!cal || !$wrap) return;
      var minDate = opts.min instanceof Date ? opts.min : null;
      if (!minDate) return;
      var current = typeof cal.current === 'function' ? cal.current() : null;
      if (!current) return;
      var currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
      var minMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      var isPrevBlocked = currentMonth <= minMonth;
      var $prev = $wrap.find('.k-nav-prev').first();
      if (!$prev.length) return;
      if (isPrevBlocked) {
        $prev.addClass('k-state-disabled').attr('aria-disabled', 'true');
      } else {
        $prev.removeClass('k-state-disabled').removeAttr('aria-disabled');
      }
    }
    function updateSelectedState() {
      if (!$wrapper.length) return;
      var inst = $el.data('kendoDatePicker');
      $wrapper.toggleClass('is-selected', !!(inst && inst.value()));
    }

    // 팝업 위치·너비 보정
    function adjustPopupBounds() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;
      $wrap.closest('.k-animation-container').addClass('vits-datepicker-single-container');
    }

    // 옵션 설정
    opts.format = opts.format || 'yyyy.MM.dd';
    opts.culture = opts.culture || 'ko-KR';
    opts.footer = false;
    opts.parseFormats = ['yyyy.MM.dd', 'yyyyMMdd', 'yyyy-MM-dd'];
    opts.animation = false;
    opts.calendar = opts.calendar || {};
    opts.calendar.culture = opts.calendar.culture || 'en-US';
    opts.calendar.animation = false;
    opts.calendar.navigate = function () {
      disableCalendarAnimation();
      forceApplyDayNames();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
    };
    opts.calendar.change = function () {
      forceApplyDayNames();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
    };

    // 다른 달 날짜도 표시 (빈칸 방지)
    opts.month = opts.month || {};
    if (!opts.month.empty) {
      opts.month.empty = '<span class="k-other-month">#= data.value #</span>';
    }

    // disablePast: 오늘 이전 날짜 선택 불가 + 셀은 표시
    if (opts.disablePast) {
      delete opts.disablePast;
      var todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);

      // Kendo disableDates 콜백
      opts.disableDates = function (date) {
        if (!date) return false;
        var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return d < todayMidnight;
      };

      // 비활성 셀 스타일 적용 (open, navigate, Observer 공용)
      // MOBILE_TIMEOUT_DELAY: Kendo DOM 교체 + 모바일 렌더링 지연 대기
      applyPastDisabledStyle = function () {
        addTimeout(setTimeout(function () {
          var inst = $el.data('kendoDatePicker');
          if (!inst || !inst.dateView || !inst.dateView.calendar) return;
          var $cal = inst.dateView.calendar.element;
          $cal.find('td[role="gridcell"] .k-link[data-value]').each(function () {
            var $link = window.jQuery(this);
            var parts = $link.attr('data-value').split('/');
            // data-value 형식: "YYYY/M(0-based)/D"
            var cellDate = new Date(+parts[0], +parts[1], +parts[2]);
            var $td = $link.closest('td');
            if (cellDate < todayMidnight) {
              $td.addClass('k-state-disabled');
              $link.attr('aria-disabled', 'true');
              // 중복 바인딩 방지
              $link.off('click.disablePast').on('click.disablePast', function (ev) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
              });
            } else {
              // 월 이동 시 이전에 붙은 클래스 제거
              $td.removeClass('k-state-disabled');
              $link.removeAttr('aria-disabled').off('click.disablePast');
            }
          });
        }, MOBILE_TIMEOUT_DELAY));
      };

      // open 시 적용
      var origOpen = opts.open;
      opts.open = function (e) {
        if (origOpen) origOpen.call(this, e);
        applyPastDisabledStyle();
      };

      // navigate(월 이동) 시에도 적용
      var origNavigate = opts.calendar.navigate;
      opts.calendar.navigate = function () {
        origNavigate.call(this);
        applyPastDisabledStyle();
      };
    }

    // claim-request-pickup: 스크롤 시 캘린더 닫힘 방지
    if ($el.closest('.claim-request-pickup').length) {
      var isPickupCalendarOpen = false;
      var origOptsClose = opts.close;
      opts.close = function (e) {
        if (isPickupCalendarOpen && !inst._userClose) {
          e.preventDefault();
          return;
        }
        isPickupCalendarOpen = false;
        if (origOptsClose) origOptsClose.call(this, e);
      };
      var origOptsOpenScroll = opts.open;
      opts.open = function (e) {
        // input 토글: close 직후 재open 차단
        if (inst._blockOpen) {
          e.preventDefault();
          return;
        }
        isPickupCalendarOpen = true;
        if (origOptsOpenScroll) origOptsOpenScroll.call(this, e);
      };
    }

    // appendTo 옵션 → popup.appendTo로 매핑
    var appendTo = opts.appendTo || null;
    delete opts.appendTo;
    if (appendTo) {
      opts.popup = opts.popup || {};
      opts.popup.appendTo = window.jQuery(appendTo);
    }
    $el.kendoDatePicker(opts);
    var inst = $el.data('kendoDatePicker');
    if (inst) {
      disableCalendarAnimation();
      ensureDayNameObserver();
      forceApplyHeaderMonth();
      forceApplyYearViewMonthNames();
      updatePrevNavState();
      if (inst.popup && inst.popup.setOptions) {
        try {
          inst.popup.setOptions({
            animation: false
          });
        } catch {
          // no-op
        }
      }

      // 반품신청 회수 의뢰일(.claim-request-pickup) 내부 datepicker 전용 분기
      var isInClaimPickup = $el.closest('.claim-request-pickup').length > 0;
      // 배송정보 퀵배송 패널 datepicker — 동일한 첫 open 위치 보정 필요
      var isInShippingPanel = $el.closest('.vits-shipping-panel').length > 0;
      var needsFirstOpenFix = isInClaimPickup || isInShippingPanel;

      // 첫 open 위치 깨짐 방지 — claim-request-pickup, 배송정보 패널 공용
      if (needsFirstOpenFix) {
        inst._userClose = true;
        inst.open();
        var pickupInitPopup = inst.dateView && inst.dateView.popup;
        var $pickupInitContainer = pickupInitPopup && pickupInitPopup.wrapper ? pickupInitPopup.wrapper.closest('.k-animation-container') : null;
        if ($pickupInitContainer && $pickupInitContainer.length) {
          $pickupInitContainer.addClass('vits-datepicker-single-container');
          $pickupInitContainer[0].style.setProperty('transition', 'none', 'important');
          $pickupInitContainer[0].style.removeProperty('width');
          $pickupInitContainer[0].style.removeProperty('left');
        }
        inst.close();
        inst._userClose = false;
      }
      inst.bind('open', function () {
        disableCalendarAnimation();

        // claim-request-pickup 전용: 이 datepicker의 k-animation-container만 대상
        if (isInClaimPickup) {
          // 이 datepicker의 popup wrapper → k-animation-container 참조
          var pickupPopup = inst.dateView && inst.dateView.popup;
          var $pickupContainer = pickupPopup && pickupPopup.wrapper ? pickupPopup.wrapper.closest('.k-animation-container') : null;
          if ($pickupContainer && $pickupContainer.length) {
            // 위치 보정 완료 전까지 이 datepicker 캘린더만 숨기기
            $pickupContainer[0].style.setProperty('transition', 'none', 'important');
            $pickupContainer[0].style.visibility = 'hidden';
          }

          // 동기: 즉시 처리 가능한 것 먼저
          ensureDayNameObserver();
          applyDayNamesImmediate();
          applyHeaderMonthImmediate();
          applyYearViewMonthNamesImmediate();
          updatePrevNavState();
          if (applyPastDisabledStyle) applyPastDisabledStyle();

          // 비동기: Kendo inline style 덮어쓰기 끝난 후 이 datepicker 위치 보정
          addTimeout(setTimeout(function () {
            var pickupPopup2 = inst.dateView && inst.dateView.popup;
            var $pickupContainer2 = pickupPopup2 && pickupPopup2.wrapper ? pickupPopup2.wrapper.closest('.k-animation-container') : null;
            if ($pickupContainer2 && $pickupContainer2.length) {
              // 이 datepicker 캘린더에만 클래스 부여 + Kendo inline 제거 → CSS 적용
              $pickupContainer2.addClass('vits-datepicker-single-container');
              $pickupContainer2[0].style.removeProperty('width');
              $pickupContainer2[0].style.removeProperty('left');
              // 위치 보정 완료 후 이 datepicker 캘린더만 보이기
              requestAnimationFrame(function () {
                $pickupContainer2[0].style.setProperty('transition', 'none', 'important');
                $pickupContainer2[0].style.visibility = '';
              });
            }
          }, MOBILE_TIMEOUT_DELAY));
          return;
        }

        // 기본 동작: claim-request-pickup 외 모든 datepicker (원본 그대로)
        var $wrap = resolveCalendarWrap();
        var $container = $wrap ? $wrap.closest('.k-animation-container') : null;
        if ($container && $container.length) {
          $container[0].style.setProperty('visibility', 'hidden');
        }
        addTimeout(setTimeout(function () {
          adjustPopupBounds();
          ensureDayNameObserver();
          applyDayNamesImmediate();
          applyHeaderMonthImmediate();
          applyYearViewMonthNamesImmediate();
          updatePrevNavState();
          // open 시 과거 날짜 비활성 스타일도 재적용
          if (applyPastDisabledStyle) applyPastDisabledStyle();

          // 모든 DOM 조작 완료 후 보이기
          if ($container && $container.length) {
            $container[0].style.removeProperty('visibility');
          }
        }, MOBILE_TIMEOUT_DELAY));
      });

      // 반품신청 회수 의뢰일: 스크롤 시 캘린더가 input 따라가도록 위치 업데이트
      if (isInClaimPickup) {
        var $pickupScrollParent = $el.closest('.vm-content-wrap');
        if ($pickupScrollParent.length) {
          $pickupScrollParent.on('scroll', function () {
            if (!inst.dateView || !inst.dateView.popup) return;
            var pickupPopupInst = inst.dateView.popup;
            if (pickupPopupInst.visible && pickupPopupInst.visible()) {
              pickupPopupInst.position();
            }
          });
        }
      }

      // 반품신청 회수 의뢰일: 외부 클릭 시 캘린더 닫힘 허용
      if (isInClaimPickup) {
        window.jQuery(document).on('mousedown touchstart', function (e) {
          if (!inst.dateView || !inst.dateView.popup) return;
          var popupInst = inst.dateView.popup;
          if (!popupInst.visible || !popupInst.visible()) return;
          var $target = window.jQuery(e.target);
          if ($target.closest('.k-animation-container').length) return;
          // input 영역 클릭 시 토글 — 열려있으면 닫기만
          if ($target.closest('.vits-datepicker-single').length) {
            inst._userClose = true;
            inst.close();
            inst._userClose = false;
            // close 직후 Kendo가 다시 open하는 것 방지 — 짧은 시간 open 차단
            inst._blockOpen = true;
            addTimeout(setTimeout(function () {
              inst._blockOpen = false;
            }, 200));
            return;
          }
          inst._userClose = true;
          inst.close();
          inst._userClose = false;
        });
      }
      inst.bind('change', function () {
        // claim-request-pickup: 날짜 선택 시에는 닫히도록 허용
        if (isInClaimPickup) {
          inst._userClose = true;
          inst.close();
          inst._userClose = false;
        }
        updateSelectedState();
      });
      inst.bind('destroy', function () {
        destroyCleanup();
      });
      updateSelectedState();
    }

    // 모바일에서 자동 열기 — 렌더링 안정화 후 실행
    if (parseBool($el.attr('data-open')) && inst) {
      addTimeout(setTimeout(function () {
        inst.open();
      }, MOBILE_TIMEOUT_DELAY));
    }

    // 외부 정리 접근 경로
    $el.data('vits-datepicker-cleanup', destroyCleanup);
  }
  function initAll() {
    if (!ensureKendoAvailable()) return;
    var targets = document.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]');
    for (var i = 0; i < targets.length; i++) {
      initDatePicker(targets[i]);
    }
  }

  // 페이지 이탈 시 타임아웃·옵저버 누수 방지
  window.addEventListener('beforeunload', function () {
    var targets = document.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]');
    for (var i = 0; i < targets.length; i++) {
      var cleanupFn = window.jQuery(targets[i]).data('vits-datepicker-cleanup');
      if (cleanupFn) cleanupFn();
    }
  });

  // 전역 API
  window.VmKendoDatePickerSingle = {
    initAll: initAll,
    initOne: function (el) {
      if (ensureKendoAvailable()) initDatePicker(el);
    },
    autoBindStart: function (container) {
      if (!window.MutationObserver) return null;
      var target = container || document.body;
      initAll();
      var obs = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (!node || node.nodeType !== 1) continue;
            var els = node.querySelectorAll ? node.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]') : [];
            for (var k = 0; k < els.length; k++) {
              initDatePicker(els[k]);
            }
          }
        }
      });
      obs.observe(target, {
        childList: true,
        subtree: true
      });
      return obs;
    },
    getInstance: function (selector) {
      return window.jQuery(selector).data('kendoDatePicker') || null;
    }
  };
})(window);

/***/ }),

/***/ 1151:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/survey-detail.js
 * @description 설문 상세 - 별점 입력 및 평균 총점 갱신 (모바일)
 * @scope [data-survey-detail]
 *
 * @mapping
 *  [data-survey-question]   : 개별 문항 래퍼
 *  [data-survey-star-input] : 별점 입력 컴포넌트
 *  [data-survey-avg-score]  : 상단 평균 점수 텍스트
 *  [data-survey-avg-fill]   : 상단 별점 채움 레이어 (width %)
 *
 * @state
 *  is-filled : 별점 버튼 채움 상태
 *
 * @note
 *  - 평균 = (입력된 문항 점수 합) / (점수가 등록된 문항 수)
 *  - 미입력 시 상단 총점: '-' 표시
 *  - 터치 디바이스: touchend 사용, 호버 이벤트 제외
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiSurveyDetail';
  var ROOT = '[data-survey-detail]';
  var QUESTION = '[data-survey-question]';
  var STAR_INPUT = '[data-survey-star-input]';
  var STAR_BTN = '.star-rating-input-star';
  var SCORE_TEXT = '.star-score';
  var AVG_SCORE = '[data-survey-avg-score]';
  var AVG_FILL = '[data-survey-avg-fill]';
  var CLASS_FILLED = 'is-filled';
  var MAX_STARS = 5;

  // 터치 디바이스 여부 - 이벤트 분기 기준
  var TOUCH_SUPPORTED = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var CLICK_EVENT = TOUCH_SUPPORTED ? 'touchend' : 'click';

  // 문항 현재 점수 반환
  function getScore($starInput) {
    var v = $starInput.data('starCurrent');
    var n = parseInt(v, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > MAX_STARS) return MAX_STARS;
    return n;
  }

  // 별점 채움 + 점수 텍스트 갱신
  function applyScore($starInput, score) {
    $starInput.data('starCurrent', score);
    $starInput.find(STAR_BTN).each(function (idx) {
      $(this).toggleClass(CLASS_FILLED, idx + 1 <= score);
    });

    // 모바일: 항상 노출, 미입력 시 '-'
    $starInput.find(SCORE_TEXT).text(score > 0 ? score : '-');
  }

  // 상단 평균 총점 갱신
  function updateAvg($root) {
    var total = 0;
    var count = 0;
    $root.find(QUESTION).each(function () {
      var score = getScore($(this).find(STAR_INPUT));
      if (score > 0) {
        total += score;
        count++;
      }
    });
    var $avgScore = $root.find(AVG_SCORE);
    var $avgFill = $root.find(AVG_FILL);
    if (count === 0) {
      // 미입력 상태
      $avgScore.text('-');
      $avgFill.css('width', '0%');
    } else {
      var avg = (total / count).toFixed(2);
      var fillPct = (avg / MAX_STARS * 100).toFixed(2);
      $avgScore.text(avg);
      $avgFill.css('width', fillPct + '%');
    }
  }

  // 별점 이벤트 바인딩
  function bindStarEvents($root) {
    // 클릭/터치 - 점수 선택/해제
    $root.on(CLICK_EVENT + NS, STAR_BTN, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $starInput = $btn.closest(STAR_INPUT);
      var value = parseInt($btn.attr('data-star-value'), 10);
      if (isNaN(value) || value < 1 || value > MAX_STARS) return;
      var current = getScore($starInput);
      // 같은 별 재클릭 시 해당 단계 제거, 다른 별은 해당 점수로 설정
      var next = value === current ? value - 1 : value;
      applyScore($starInput, next);
      updateAvg($root);
    });

    // 호버 미리보기 - 마우스 환경에서만 바인딩
    if (!TOUCH_SUPPORTED) {
      $root.on('mouseenter' + NS, STAR_BTN, function () {
        var value = parseInt($(this).attr('data-star-value'), 10);
        if (isNaN(value)) return;
        $(this).closest(STAR_INPUT).find(STAR_BTN).each(function (idx) {
          $(this).toggleClass('is-hover', idx + 1 <= value);
        });
      });
      $root.on('mouseleave' + NS, STAR_INPUT, function () {
        $(this).find(STAR_BTN).removeClass('is-hover');
      });
    }
  }
  function init(ctx) {
    var $root = ctx ? $(ctx).find(ROOT).addBack(ROOT) : $(ROOT);
    if (!$root.length) return;
    $root.each(function () {
      var $el = $(this);
      if ($el.data('surveyDetailBound')) return;
      $el.data('surveyDetailBound', true);
      bindStarEvents($el);

      // 초기 점수 적용
      $el.find(STAR_INPUT).each(function () {
        var defaultScore = parseInt($(this).attr('data-star-default'), 10);
        if (!isNaN(defaultScore) && defaultScore > 0) {
          applyScore($(this), defaultScore);
        }
      });

      // 초기 평균 갱신
      updateAvg($el);
    });
  }
  function destroy() {
    $(ROOT).off(NS).removeData('surveyDetailBound');
  }
  window.UI.surveyDetail = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 1234:
/***/ (function() {

/**
 * @file scripts/ui/category/mo-category-tree-search.js
 * @description 모바일 필터 팝업 내 카테고리 트리 + 더보기/접기
 * @scope .vm-filter-popup 내부
 *
 * @state is-open(패널 열림)
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var MODULE_KEY = 'CategoryTreeSearch';
  var EVENT_NS = '.' + MODULE_KEY;
  var SCOPE = '.vm-filter-popup';
  var TREE_ROOT = SCOPE + ' .vits-category-tree-list .vits-category-tree';
  var BTN = '[data-tree-toggle]';
  var ITEM = '.category-tree-item';
  var PANEL = '.category-tree-panel';
  var MORE_BTN = '[data-search-more-btn]';
  var MORE_SCOPE = '[data-search-more-scope]';
  var MORE_TOGGLE = '[data-search-more-toggle]';
  var CLS_OPEN = 'is-open';
  var TXT_MORE = '더보기';
  var TXT_LESS = '접기';
  var IC_PLUS = 'ic-plus';
  var IC_MINUS = 'ic-minus';

  // 패널 토글
  function togglePanel($btn) {
    var $item = $btn.closest(ITEM);
    var $panel = $item.children(PANEL).first();
    if (!$panel.length) return;
    var isOpen = $panel.hasClass(CLS_OPEN);
    $panel.toggleClass(CLS_OPEN, !isOpen);
    $btn.attr('aria-expanded', String(!isOpen));
  }

  // 모든 패널 접힘
  function collapseAll($tree) {
    $tree.find(PANEL).removeClass(CLS_OPEN);
    $tree.find(BTN).attr('aria-expanded', 'false');
  }

  // 더보기/접기
  function bindMoreToggle() {
    $(SCOPE).off('click' + EVENT_NS, MORE_BTN).on('click' + EVENT_NS, MORE_BTN, function () {
      var $btn = $(this);
      var $scope = $btn.closest(MORE_SCOPE);
      if (!$scope.length) return;
      var $target = $scope.find(MORE_TOGGLE);
      if (!$target.length) return;
      var isVisible = $target.is(':visible');
      $target.toggle(!isVisible);
      $btn.find('.text').contents().first().replaceWith(isVisible ? TXT_MORE + ' ' : TXT_LESS + ' ');
      $btn.find('.count').toggle(isVisible);
      $btn.find('.icon .ic').toggleClass(IC_PLUS, isVisible).toggleClass(IC_MINUS, !isVisible);
    });
  }
  function createInstance($tree) {
    function bindTree() {
      $tree.off('click' + EVENT_NS).on('click' + EVENT_NS, BTN, function (e) {
        e.preventDefault();
        togglePanel($(this));
      });
    }
    function init() {
      collapseAll($tree);
      bindTree();
    }
    function destroy() {
      $tree.off(EVENT_NS);
    }
    return {
      init: init,
      destroy: destroy
    };
  }
  window.UI.CategoryTreeSearch = {
    init: function () {
      bindMoreToggle();
      $(TREE_ROOT).each(function () {
        var $tree = $(this);
        var inst = $tree.data(MODULE_KEY);
        if (!inst) {
          inst = createInstance($tree);
          $tree.data(MODULE_KEY, inst);
        }
        inst.init();
      });
    },
    destroy: function () {
      $(SCOPE).off('click' + EVENT_NS, MORE_BTN);
      $(TREE_ROOT).each(function () {
        var inst = $(this).data(MODULE_KEY);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
      });
    }
  };
})(window.jQuery || window.$, window);

/***/ }),

/***/ 1283:
/***/ (function() {

/**
 * @file scripts-mo/ui/home/home-recommend-legend.js
 * @description 홈 레전드 추천상품 2줄 균등 분배용 CSS 변수(--legend-cols) 컬럼 수 제어
 * @contract
 * - SCSS 레이아웃은 .recommend-list 기준
 * - JS 타겟은 [data-ui='recommend-legend'] 기준
 * - [data-ui='recommend-legend'] 직계 자식 요소 개수를 기준으로 컬럼 수 계산
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  var ROOT_SELECTOR = '.vm-home-recommend.product-legend';
  var LIST_SELECTOR = "[data-ui='recommend-legend']";
  var DATA_INIT_KEY = 'homeRecommendLegendInit';
  var GRID_ROW_COUNT = 2;

  // 레전드 섹션 내 실제 리스트 요소 조회
  function getList($root) {
    return $root.find(LIST_SELECTOR).first();
  }

  // 레전드 리스트의 직계 상품 아이템 조회
  function getItems($list) {
    return $list.children();
  }

  // 상품 개수 기준으로 2줄 균등 분배용 컬럼 수 적용
  function applyCols($list, $items) {
    if (!$list.length) return;
    var cols = Math.ceil($items.length / GRID_ROW_COUNT);
    $list[0].style.setProperty('--legend-cols', cols);
  }

  // JS에서 주입한 동적 컬럼 수 제거
  function resetCols($list) {
    if (!$list.length) return;
    $list[0].style.removeProperty('--legend-cols');
  }

  // 현재 레전드 리스트 상태 기준으로 컬럼 수 갱신
  function update($root) {
    var $list = getList($root);
    if (!$list.length) return;
    var $items = getItems($list);
    if (!$items.length) {
      resetCols($list);
      return;
    }
    applyCols($list, $items);
  }

  // DOM이 이미 있으면 즉시 처리, 없으면 MutationObserver로 삽입 감지
  var observer = null;
  function initExisting() {
    var found = false;
    $(ROOT_SELECTOR).each(function (_, el) {
      var $root = $(el);
      update($root);
      if (!$root.data(DATA_INIT_KEY)) {
        $root.data(DATA_INIT_KEY, true);
      }
      found = true;
    });
    return found;
  }

  // 루트 + 자식까지 모두 준비됐는지 확인
  function isReady() {
    var ready = false;
    $(ROOT_SELECTOR).each(function (_, el) {
      var $list = getList($(el));
      if (getItems($list).length) ready = true;
    });
    return ready;
  }
  function init() {
    // DOM + 자식까지 있으면 즉시 처리
    if (initExisting() && isReady()) {
      disconnectObserver();
      return;
    }

    // body가 아직 없으면 DOMContentLoaded 후 재시도
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function handler() {
        document.removeEventListener('DOMContentLoaded', handler);
        init();
      });
      return;
    }

    // ROOT 없거나 자식 미삽입 → observer로 감지
    if (observer) return;
    observer = new MutationObserver(function () {
      if (initExisting() && isReady()) {
        disconnectObserver();
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function disconnectObserver() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  // 레전드 섹션 destroy 시 동적 컬럼 수 초기화
  function destroy() {
    // observer 정리
    disconnectObserver();
    $(ROOT_SELECTOR).each(function (_, el) {
      var $root = $(el);
      if (!$root.data(DATA_INIT_KEY)) return;
      resetCols(getList($root));
      $root.removeData(DATA_INIT_KEY);
    });
  }
  window.UI = window.UI || {};
  window.UI.homeRecommendLegend = {
    init: init,
    destroy: destroy
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
   * @description 검색 오버레이 키보드 대응
   * @note 키보드 올라오면 오버레이 bottom을 키보드 높이만큼 올려서 하단 여백 방지
   * @scope #searchOverlay
   */
  function updateSearchOverlay() {
    var overlay = document.getElementById('searchOverlay');
    if (!overlay) return;
    var diff = window.innerHeight - window.visualViewport.height;
    overlay.style.bottom = diff + 'px';
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

  /**
   * @description pre-wrap 요소의 선행 공백·줄바꿈 제거
   * @scope [data-pre-trim]
   * @note 서버 렌더링 시 태그와 텍스트 사이 줄바꿈이 그대로 노출되는 현상 보정
   */
  function trimPreContent() {
    var targets = document.querySelectorAll('[data-pre-trim]');
    targets.forEach(function (el) {
      el.textContent = el.textContent.replace(/^\s+/, '');
    });
  }
  setDeviceClass();
  setVh();
  var rafId = null;
  function onViewportChange() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      setVh();
      rafId = null;
    });
  }
  var vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);
    // 검색 오버레이 키보드 대응
    vv.addEventListener('resize', updateSearchOverlay);
  } else {
    window.addEventListener('resize', onViewportChange);
  }

  // [TODO] iPad Chrome safe-area 초기 렌더링 지연 이슈
  // 스크롤 시 즉시 정상. 실서비스 확인 후 필요시 아래 코드 활성화
  // ---
  // window.addEventListener('pageshow', function () {
  //   setTimeout(function () {
  //     window.dispatchEvent(new Event('resize'));
  //   }, 100);
  // });
  // ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScrollEnd();
      trimPreContent();
    });
  } else {
    initScrollEnd();
    trimPreContent();
  }
})(window, document);

/***/ }),

/***/ 2006:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/tab-sticky.js
 * @description 스크롤 연동 탭 active 전환 (CSS sticky, JS는 active + 클릭 스크롤만)
 * @scope [data-ui="tab-sticky"]
 * @mapping data-tab="nav" 탭 네비, data-tab="bar" 언더바, data-tab-target 탭 버튼, data-tab-section 섹션
 * @state .is-active — 현재 활성 탭 버튼
 * @a11y aria-label 탭 네비, aria-hidden 언더바
 * @events click(탭 버튼), scroll/resize/orientationchange(window)
 * @note CSS sticky 기반, baseline 판정 + 마지막 섹션 뷰포트 중간선 보정
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiTabSticky';
  var DATA_KEY = 'tabSticky';
  var ROOT = '[data-ui="tab-sticky"]';
  var NAV = '[data-tab="nav"]';
  var BAR = '[data-tab="bar"]';
  var BTN = '[data-tab-target]';
  var SECTION = '[data-tab-section]';
  var CLS = {
    active: 'is-active'
  };
  var DEFAULTS = {
    gap: 0
  };
  function getNavH(state) {
    return state.$nav.outerHeight() || 0;
  }

  // 기준선 — CSS sticky top + nav 높이
  function getBaseline(state) {
    return state.stickyTop + getNavH(state) + state.opt.gap;
  }
  function updateBar(state) {
    var $active = state.$tabs.filter('.' + CLS.active);
    if (!$active.length) {
      state.$bar.css({
        opacity: 0,
        width: 0
      });
      return;
    }
    var nav = state.$nav[0];
    var navLeft = nav.getBoundingClientRect().left;
    var aRect = $active[0].getBoundingClientRect();
    state.$bar.css({
      opacity: 1,
      width: aRect.width,
      transform: 'translateX(' + (aRect.left - navLeft + nav.scrollLeft) + 'px)'
    });
  }

  // 활성 탭이 nav 밖으로 잘릴 때 보이도록 스크롤
  function scrollActiveIntoView(state) {
    var $active = state.$tabs.filter('.' + CLS.active);
    if (!$active.length) return;
    var nav = state.$nav[0];
    var btn = $active[0];
    var btnLeft = btn.offsetLeft;
    var btnRight = btnLeft + btn.offsetWidth;
    var navScroll = nav.scrollLeft;
    var navVisible = nav.offsetWidth;
    if (btnLeft < navScroll) {
      // 왼쪽으로 잘림
      nav.scrollTo({
        left: btnLeft,
        behavior: 'smooth'
      });
    } else if (btnRight > navScroll + navVisible) {
      // 오른쪽으로 잘림
      nav.scrollTo({
        left: btnRight - navVisible,
        behavior: 'smooth'
      });
    }
  }
  function setActive(state, id) {
    state.$tabs.each(function () {
      $(this).toggleClass(CLS.active, $(this).data('tab-target') === id);
    });
    updateBar(state);
    scrollActiveIntoView(state);
  }
  function updateActiveByScroll(state) {
    // 클릭 이동 직후 보호
    if (state.clickLock) return;
    var baseline = getBaseline(state);
    var winH = $(window).height();
    var len = state.$sections.length;

    // 마지막 섹션 먼저 — 90% 이상 보이면 활성화
    var lastEl = state.$sections.last()[0];
    var lastRect = lastEl.getBoundingClientRect();
    var lastH = lastRect.height || 1;
    var lastVisTop = Math.max(lastRect.top, 0);
    var lastVisBottom = Math.min(lastRect.bottom, winH);
    var lastVisH = Math.max(lastVisBottom - lastVisTop, 0);
    if (lastVisH / lastH >= 0.9) {
      setActive(state, state.$sections.last().data('tab-section'));
      return;
    }

    // 나머지 섹션
    var activeId = state.$sections.first().data('tab-section');
    for (var i = 0; i < len - 1; i++) {
      var el = state.$sections[i];
      var rect = el.getBoundingClientRect();
      var id = $(el).data('tab-section');
      var sectionH = rect.height || 1;
      var scrolled = baseline - rect.top;
      var scrolledRatio = scrolled / sectionH;
      if (scrolledRatio < 0) break;
      if (scrolledRatio >= 0.7 && i + 1 < len) {
        // 다음 섹션이 뷰포트 상단 2/3 지점 이상 들어와야 전환
        var nextRect = state.$sections[i + 1].getBoundingClientRect();
        if (nextRect.top < winH * 0.66) {
          activeId = $(state.$sections[i + 1]).data('tab-section');
        } else {
          activeId = id;
          break;
        }
      } else {
        activeId = id;
        break;
      }
    }
    setActive(state, activeId);
  }
  function scrollToSection($root, state, targetId) {
    var $target = $root.find('[data-tab-section="' + targetId + '"]');
    if (!$target.length) return;
    var baseline = getBaseline(state);
    var scrollRoot = $root.closest('.vm-content-wrap')[0];
    var targetY = Math.max($target[0].offsetTop - baseline, 0);

    // 클릭 보호
    state.clickLock = true;
    scrollRoot.scrollTo({
      top: targetY,
      behavior: 'auto'
    });
    setActive(state, targetId);
    setTimeout(function () {
      state.clickLock = false;
    }, 200);
  }
  function bind($root, state) {
    var ticking = false;

    // nav 가로 스크롤 시 언더바 위치 보정
    state.$nav.on('scroll' + NS, function () {
      updateBar(state);
    });
    $root.on('click' + NS, BTN, function () {
      scrollToSection($root, state, $(this).data('tab-target'));
    });
    var scrollRoot = $root.closest('.vm-content-wrap');
    scrollRoot.on('scroll' + NS, function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateActiveByScroll(state);
        ticking = false;
      });
    });
    $(window).on('resize' + NS, function () {
      updateBar(state);
    });
    $(window).on('orientationchange' + NS, function () {
      setTimeout(function () {
        updateBar(state);
      }, 300);
    });
    if (window.visualViewport) {
      $(window.visualViewport).on('resize' + NS, function () {
        updateBar(state);
      });
    }
  }
  function init(scope, options) {
    var $root = $(scope || ROOT);
    if (!$root.length || $root.data(DATA_KEY)) return;
    var opt = $.extend({}, DEFAULTS, options);
    var $nav = $root.find(NAV);
    var $bar = $root.find(BAR);
    var $tabs = $root.find(BTN);
    var $sections = $root.find(SECTION);
    if (!$nav.length || !$tabs.length || !$sections.length) return;

    // CSS sticky top 값 읽기
    var rawTop = $nav.css('top');
    var stickyTop = rawTop === 'auto' ? 0 : parseInt(rawTop, 10) || 0;
    var state = {
      opt: opt,
      stickyTop: stickyTop,
      clickLock: false,
      $nav: $nav,
      $bar: $bar,
      $tabs: $tabs,
      $sections: $sections
    };
    $root.data(DATA_KEY, state);
    bind($root, state);
    updateActiveByScroll(state);
  }
  function destroy(scope) {
    var $root = $(scope || ROOT);
    var state = $root.data(DATA_KEY);
    if (!state) return;
    $root.off(NS);
    $root.closest('.vm-content-wrap').off(NS);
    $(window).off(NS);
    if (window.visualViewport) {
      $(window.visualViewport).off(NS);
    }
    state.$tabs.removeClass(CLS.active);
    $root.removeData(DATA_KEY);
  }
  window.UI.tabSticky = {
    init: init,
    destroy: destroy,
    goTo: function (scope, targetId) {
      var $root = $(scope || ROOT);
      var state = $root.data(DATA_KEY);
      if (state) scrollToSection($root, state, targetId);
    },
    getActive: function (scope) {
      var $root = $(scope || ROOT);
      var state = $root.data(DATA_KEY);
      if (!state) return null;
      var $active = state.$tabs.filter('.' + CLS.active);
      return $active.length ? $active.data('tab-target') : null;
    }
  };
})(window.jQuery, window);

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
      $bar.find('[data-filter-clear-all]').remove();
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
        html.push('<button type="button" class="vits-chip-button type-filled"' + ' data-chip-action="remove"' + ' data-chip-name="' + esc(name) + '"' + ' data-chip-value="' + esc(value) + '">' + '<span class="text">' + esc(label) + '</span>' + '<span class="icon" aria-hidden="true"><i class="ic ic-x"></i></span>' + '</button>');
      });
    });
    html.push('<button type="button" class="vm-filter-clear-all" data-filter-clear-all>전체 해제</button>');
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
      $innerText.text('필터');
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
      $body.slideToggle(SLIDE_DURATION, function () {
        // 애니메이션 완료 후 실제 가시성 기준으로 aria-expanded 보정
        $btn.attr('aria-expanded', String($body.is(':visible')));
      });
    });

    // 팝업: 브랜드 더보기
    $doc.on('click' + NS, '[data-filter-more]', function () {
      var $btn = $(this);
      var $section = $btn.closest('[data-filter-group]');
      $section.find('.' + CLS.hidden).removeClass(CLS.hidden);
      $section.addClass(CLS.expanded);
      $btn.remove();
    });
    $doc.on('click' + NS, '[data-filter-clear-all]', function () {
      _applied = {};
      syncAllCheckboxes();
      updateUI();
      emitApply();
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
  function init() {
    if (!$(SCOPE).length) return;
    _applied = {};
    _lastAdded = null;
    _categoryChanged = false;

    // aria-expanded 누락 토글 버튼 일괄 보충
    $(SEL.popup).find(SEL.toggleBtn).each(function () {
      var $btn = $(this);
      if (!$btn.attr('aria-expanded')) {
        var $body = $btn.closest('.filter-popup-section').find('.filter-popup-body');
        $btn.attr('aria-expanded', $body.is(':visible') ? 'true' : 'false');
      }
    });
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

/***/ 2624:
/***/ (function() {

/**
 * @file scripts-mo/ui/filter/filter-mypage.js
 * @description 마이페이지 필터 모듈 — 셀렉트 ↔ 데이트피커 연동
 * @scope .vm-mypage-filter
 *
 * @state .is-filter-open   — 필터 확장 (데이트피커 row + 액션 + 딤 노출)
 * @state .has-filter-value  — 기본값 외 값 변경 시 (초기화 버튼 노출)
 * @state .is-direct-input   — 직접입력 선택 시 (데이트피커 상시 노출)
 *
 * @note
 *  - 기본값: 1개월(value '0') — 변경으로 취급하지 않음
 *  - 닫기: 조회하기 / 초기화 / 딤 클릭
 *  - 직접입력: 필터 닫혀도 데이트피커 row 상시 노출 유지
 *  - 프리셋 상태에서 달력 날짜 직접 선택 시 자동으로 직접입력 전환
 *  - 인풋 포커스 시 필터 열림, 스크롤 잠금 안 함
 *  - 셀렉트 변경 시 필터 열림, 스크롤 잠금 적용
 *  - 페이지 로드 시 기본값(1개월) hidden input에 날짜 세팅
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  var UI = window.UI;
  if (!UI || !UI.select) return;

  // 상수
  var NS = '.uiFilterMypage';
  var SCOPE = '.vm-mypage-filter';
  var PICKER_INIT_DELAY = 50;
  var DATE_SEPARATOR = ' ~ ';
  var CLS = {
    open: 'is-filter-open',
    hasValue: 'has-filter-value',
    directInput: 'is-direct-input'
  };
  var SEL = {
    periodRoot: '[data-select-id="vm-order-period"]',
    statusRoot: '[data-select-id="vm-order-status"]',
    deliveryRoot: '[data-select-id="vm-order-delivery"]',
    cancelStatusRoot: '[data-select-id="vm-cancel-status"]',
    datePicker: '#vm-order-daterange',
    searchInput: '#my-orders-search-searchKeyword',
    dim: '.vm-mypage-filter-dim',
    resetBtn: '.actions-reset',
    searchBtn: '.actions-search',
    inputSearchBtn: '.input-search-btn'
  };

  // 기간 프리셋 (월 단위)
  var PRESET_MONTHS = {
    0: 1,
    1: 3,
    2: 6,
    3: 12
  };
  var DIRECT_INPUT_VALUE = '4';
  var DEFAULT_PERIOD = '0';
  var DEFAULT_SELECT = '0';

  // 내부 상태
  var _$filter = null;
  var _baseHeight = 0;
  var _savedScrollY = 0;
  var _bound = false;
  var _pickerReady = false;
  var _scrollLocked = false;
  var _programmaticChange = false;

  // 날짜 포맷
  function formatDateStr(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + d;
  }

  // 데이트피커 인스턴스 조회
  function getPickerInstance() {
    var rp = window.VmKendoRangePicker;
    if (!rp || !rp.getInstance) return null;
    return rp.getInstance(SEL.datePicker);
  }

  // 데이트피커 최초 초기화 — display 전환 후 호출
  function ensurePickerInit(callback) {
    if (_pickerReady && getPickerInstance()) {
      if (callback) callback();
      return;
    }
    var rp = window.VmKendoRangePicker;
    if (rp && rp.initAll) {
      rp.initAll(_$filter[0]);
    }
    setTimeout(function () {
      _pickerReady = !!getPickerInstance();
      if (callback) callback();
    }, PICKER_INIT_DELAY);
  }

  // 날짜 계산
  function calcPresetRange(months) {
    var end = new Date();
    var start = new Date();
    start.setMonth(start.getMonth() - months);
    return {
      start: start,
      end: end
    };
  }

  // 스크롤 잠금
  function lockScroll() {
    if (_scrollLocked) return;
    _scrollLocked = true;
    _savedScrollY = window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = -_savedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    if (!_scrollLocked) return;
    _scrollLocked = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, _savedScrollY);
  }

  // 높이 잠금 — 콘텐츠 밀림 방지
  function lockHeight() {
    _baseHeight = _$filter.outerHeight();
    _$filter.css({
      height: _baseHeight,
      overflow: 'visible'
    });
  }
  function unlockHeight() {
    _$filter.css({
      height: '',
      overflow: ''
    });
  }

  // 필터 확장
  function openFilter(callback, withScrollLock) {
    if (_$filter.hasClass(CLS.open)) {
      if (callback) callback();
      return;
    }
    lockHeight();
    _$filter.addClass(CLS.open);
    $(SEL.dim).show();
    if (withScrollLock !== false) lockScroll();
    ensurePickerInit(callback);
  }

  // 필터 축소
  function closeFilter() {
    if (!_$filter.hasClass(CLS.open)) return;
    _$filter.removeClass(CLS.open);
    $(SEL.dim).hide();
    unlockHeight();
    unlockScroll();
  }

  // hidden input 직접 세팅 — picker 미초기화 상태에서 사용
  function setHiddenDateValues(start, end) {
    var $el = $(SEL.datePicker);
    var startStr = formatDateStr(start);
    var endStr = formatDateStr(end);
    $el.find('.js-start-date').val(startStr);
    $el.find('.js-end-date').val(endStr);
    $el.find('.js-range-display').val(startStr + DATE_SEPARATOR + endStr);
  }

  // 데이트피커 값 세팅 — picker 없으면 hidden input 직접 세팅
  function setDateRange(start, end) {
    _programmaticChange = true;
    var picker = getPickerInstance();
    if (picker) {
      picker.setValue(start, end);
    } else {
      setHiddenDateValues(start, end);
    }
    _programmaticChange = false;
  }

  // 데이트피커 리셋 — picker 없으면 hidden input 직접 클리어
  function resetDateRange() {
    var picker = getPickerInstance();
    if (picker) {
      picker.reset();
      return;
    }
    var $el = $(SEL.datePicker);
    $el.find('.js-start-date').val('');
    $el.find('.js-end-date').val('');
    $el.find('.js-range-display').val('');
  }

  // 현재 프리셋 기준으로 필터 열기 + 날짜 세팅
  function openWithCurrentPreset(withScrollLock) {
    var value = UI.select.getValue($(SEL.periodRoot));
    var months = PRESET_MONTHS[value];
    openFilter(function () {
      if (months) {
        var range = calcPresetRange(months);
        setDateRange(range.start, range.end);
      }
    }, withScrollLock);
  }

  // 필터 값 유무 체크 — 기본값(1개월)은 변경으로 취급하지 않음
  function updateFilterValueState() {
    var hasValue = false;
    var periodVal = UI.select.getValue($(SEL.periodRoot));
    if (periodVal && periodVal !== DEFAULT_PERIOD) hasValue = true;
    var statusVal = UI.select.getValue($(SEL.statusRoot));
    if (statusVal && statusVal !== DEFAULT_SELECT) hasValue = true;
    var deliveryVal = UI.select.getValue($(SEL.deliveryRoot));
    if (deliveryVal && deliveryVal !== DEFAULT_SELECT) hasValue = true;
    var $cancelStatus = $(SEL.cancelStatusRoot);
    if ($cancelStatus.length) {
      var cancelVal = UI.select.getValue($cancelStatus);
      if (cancelVal && cancelVal !== DEFAULT_SELECT) hasValue = true;
    }
    var searchVal = $(SEL.searchInput).val();
    if (searchVal && searchVal.trim()) hasValue = true;
    _$filter.toggleClass(CLS.hasValue, hasValue);
  }

  // 조회기간 변경 핸들러
  function onPeriodChange() {
    if (_programmaticChange) return;
    var value = $(this).val();
    var months = PRESET_MONTHS[value];
    _$filter.toggleClass(CLS.directInput, value === DIRECT_INPUT_VALUE);
    if (months) {
      openFilter(function () {
        var range = calcPresetRange(months);
        setDateRange(range.start, range.end);
      });
    } else if (value === DIRECT_INPUT_VALUE) {
      openFilter(function () {
        resetDateRange();
      });
    }
    updateFilterValueState();
  }

  // 주문상태/배송상태 변경 핸들러
  function onSelectChange() {
    openWithCurrentPreset(true);
    updateFilterValueState();
  }

  // 데이트피커 날짜 직접 선택 → 셀렉트를 직접입력으로 변경
  function onDatePickerChange() {
    if (_programmaticChange) return;
    var periodVal = UI.select.getValue($(SEL.periodRoot));
    if (periodVal === DIRECT_INPUT_VALUE) return;
    _programmaticChange = true;
    UI.select.setValue($(SEL.periodRoot), DIRECT_INPUT_VALUE);
    _programmaticChange = false;
    _$filter.addClass(CLS.directInput);
    updateFilterValueState();
  }

  // 검색 input 포커스 → 필터 열림, 스크롤 잠금 안 함
  function onInputFocus() {
    openWithCurrentPreset(false);
  }

  // 딤 클릭 → 닫기
  function onDimClick() {
    closeFilter();
  }

  // 초기화 버튼
  function onResetClick() {
    _programmaticChange = true;
    _$filter.removeClass(CLS.directInput);
    UI.select.setValue($(SEL.periodRoot), DEFAULT_PERIOD);
    UI.select.setValue($(SEL.statusRoot), DEFAULT_SELECT);
    UI.select.setValue($(SEL.deliveryRoot), DEFAULT_SELECT);
    var $cancelStatus = $(SEL.cancelStatusRoot);
    if ($cancelStatus.length) {
      UI.select.setValue($cancelStatus, DEFAULT_SELECT);
    }
    $(SEL.searchInput).val('');
    _programmaticChange = false;
    var range = calcPresetRange(PRESET_MONTHS[DEFAULT_PERIOD]);
    setHiddenDateValues(range.start, range.end);
    resetDateRange();
    closeFilter();
    updateFilterValueState();
  }

  // 조회하기 버튼
  function onSearchClick() {
    closeFilter();
    // TODO: 조회 API 호출
  }

  // 초기 상태 — hidden input에 기본값(1개월) 날짜 세팅
  function setInitialState() {
    var value = UI.select.getValue($(SEL.periodRoot));
    var months = PRESET_MONTHS[value];
    if (!months) return;
    var range = calcPresetRange(months);
    setHiddenDateValues(range.start, range.end);
  }

  // 이벤트 바인딩
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 스코프 내 모든 셀렉트 change 위임
    $doc.on('change' + NS, SCOPE + ' [data-vits-select-hidden]', function () {
      var $root = $(this).closest('[data-vits-select]');
      var selectId = $root.attr('data-select-id');
      if (selectId === 'vm-order-period') {
        onPeriodChange.call(this);
      } else {
        onSelectChange();
      }
    });
    $doc.on('rangepicker:change' + NS, SEL.datePicker, onDatePickerChange);
    $doc.on('focusin' + NS, SEL.searchInput, onInputFocus);
    $doc.on('click' + NS, SEL.dim, onDimClick);
    $doc.on('click' + NS, SCOPE + ' ' + SEL.resetBtn, onResetClick);
    $doc.on('click' + NS, SCOPE + ' ' + SEL.searchBtn, onSearchClick);
    $doc.on('click' + NS, SCOPE + ' ' + SEL.inputSearchBtn, onSearchClick);
    $doc.on('input' + NS, SEL.searchInput, updateFilterValueState);
  }

  // 공개 API
  function init() {
    _$filter = $(SCOPE);
    if (!_$filter.length) return;
    bindEvents();
    setInitialState();
  }
  function destroy() {
    $(document).off(NS);
    closeFilter();
    _$filter = null;
    _baseHeight = 0;
    _savedScrollY = 0;
    _bound = false;
    _pickerReady = false;
    _scrollLocked = false;
    _programmaticChange = false;
  }
  window.FilterMypage = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 2638:
/***/ (function() {

/**
 * @file scroll-overflow-gradient.js
 * @description 수평 스크롤 영역 오버플로우 시 우측 그라데이션 표시
 * @scope [data-scroll-overflow-gradient]
 * @option data-scroll-target {selector} 스크롤 대상 하위 요소 (생략 시 자기 자신)
 * @state .is-overflow — 스크롤 가능하고 끝에 도달하지 않은 상태
 * @note 그라데이션은 CSS ::after로 처리, 이 모듈은 클래스 토글만 담당
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  var DATA_KEY = 'scrollOverflowGradient';
  var THRESHOLD = 2;
  var Selector = {
    SCOPE: '[data-scroll-overflow-gradient]'
  };
  var ClassName = {
    OVERFLOW: 'is-overflow'
  };
  function init(el) {
    var $scope = $(el);
    if ($scope.data(DATA_KEY)) return;

    // 스크롤 대상 결정 — data-scroll-target 있으면 하위 요소, 없으면 자기 자신
    var targetSelector = $scope.attr('data-scroll-target');
    var $scrollEl = targetSelector ? $scope.find(targetSelector) : $scope;
    var scrollEl = $scrollEl[0];
    if (!scrollEl) return;

    // 인스턴스별 네임스페이스 (jQuery UI 미의존)
    var ns = DATA_KEY + '.' + Math.random().toString(36).slice(2, 8);

    // 스크롤 가능 여부 + 끝 도달 여부로 클래스 토글
    function update() {
      var hasOverflow = scrollEl.scrollWidth > scrollEl.clientWidth;
      var atEnd = scrollEl.scrollLeft + scrollEl.clientWidth >= scrollEl.scrollWidth - THRESHOLD;
      $scope.toggleClass(ClassName.OVERFLOW, hasOverflow && !atEnd);
    }

    // scrollEl 내부 콘텐츠 크기 변화 감시 (비동기 데이터 로딩 대응)
    var ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      // scrollEl 자체 + 첫 번째 자식(콘텐츠 래퍼) 감시
      ro.observe(scrollEl);
      if (scrollEl.firstElementChild) {
        ro.observe(scrollEl.firstElementChild);
      }
    }

    // 자식 요소 동적 추가/제거 감시 (비동기 데이터 렌더링 대응)
    var mo = new MutationObserver(function () {
      update();
      // 새로 생긴 첫 번째 자식을 ResizeObserver에 등록
      if (ro && scrollEl.firstElementChild && !scrollEl.firstElementChild._roObserved) {
        ro.observe(scrollEl.firstElementChild);
        scrollEl.firstElementChild._roObserved = true;
      }
    });
    mo.observe(scrollEl, {
      childList: true
    });
    $scrollEl.on('scroll.' + ns, update);
    $(window).on('resize.' + ns, update);

    // 초기 상태 반영
    update();
    var instance = {
      update: update,
      destroy: function () {
        $scrollEl.off('scroll.' + ns);
        $(window).off('resize.' + ns);
        if (ro) {
          ro.disconnect();
          ro = null;
        }
        if (mo) {
          mo.disconnect();
          mo = null;
        }
        $scope.removeClass(ClassName.OVERFLOW);
        $scope.removeData(DATA_KEY);
      }
    };
    $scope.data(DATA_KEY, instance);
  }
  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find(Selector.SCOPE).each(function () {
      init(this);
    });
  }
  function getInstance(selector) {
    return $(selector).data(DATA_KEY) || null;
  }
  window.scrollOverflowGradient = {
    init: init,
    initAll: initAll,
    getInstance: getInstance
  };
  $(function () {
    initAll();
  });
})(window);

/***/ }),

/***/ 3012:
/***/ (function() {

/**
 * @file scripts-mo/ui/product/bottom-product-bar.js
 * @description 상품 하단 고정 바 — 옵션 확장/접힘 + 드래그 닫기
 * @scope [data-ui="product-bar"]
 *
 * @mapping
 *   [data-bar-handle]  — 드래그 핸들
 *   [data-bar-option]  — 옵션 영역 (접힘/확장 대상)
 *   [data-bar-actions] — 하단 버튼 영역
 *   [data-bar-cart]    — 장바구니 담기
 *   [data-bar-buy]     — 바로구매
 *
 * @state
 *   is-open — 옵션 영역 열림
 *   is-dragging — 드래그 중
 *
 * @events
 *   product-bar:open  — 옵션 열림
 *   product-bar:close — 옵션 닫힘
 *   product-bar:cart  — 장바구니 담기
 *   product-bar:buy   — 바로구매
 *
 * @note Kendo Window 미사용
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiProductBar';
  var DRAG_THRESHOLD = 10;
  var CLOSE_RATIO = 0.3;
  var VELOCITY_THRESHOLD = 0.5;
  var TRANSITION_HEIGHT = 'height 0.3s ease';
  var TRANSITION_DELAY = 300;
  var uid = 0;
  var instances = {};

  // CSS 전환 트리거용 리플로우
  function forceReflow(el) {
    return el.offsetHeight;
  }

  // 터치/마우스 이벤트에서 좌표 추출
  function getClientY(e) {
    if (e.touches && e.touches.length) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length) return e.changedTouches[0].clientY;
    return e.clientY;
  }
  function init(el) {
    var $root = typeof el === 'string' ? $('#' + el) : $(el);
    if (!$root.length) return;
    var id = $root.attr('id');
    if (!id) {
      id = 'product-bar-' + ++uid;
      $root.attr('id', id);
    }
    if (instances[id]) return;
    var $handle = $root.find('[data-bar-handle]');
    var $option = $root.find('[data-bar-option]');
    var $cartBtn = $root.find('[data-bar-cart]');
    var $buyBtn = $root.find('[data-bar-buy]');
    var $inner = $option.find('.bar-option-inner');
    var handleEl = $handle[0];
    var state = {
      isOpen: $root.hasClass('is-open'),
      isDragging: false,
      startY: 0,
      currentY: 0,
      startTime: 0,
      optionHeight: 0,
      timerId: null
    };

    // 진행 중 타이머 정리
    function clearPendingTimer() {
      if (state.timerId) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
    }

    // 접근성 상태 갱신
    function updateExpanded(isOpen) {
      $handle.attr({
        'aria-expanded': String(isOpen),
        'aria-label': isOpen ? '옵션 영역 닫기' : '옵션 영역 열기'
      });
    }

    // 옵션 열기
    function open() {
      if (state.isOpen) return;
      clearPendingTimer();
      $option.css('display', 'block');
      state.optionHeight = $option[0].scrollHeight;
      $option.css({
        height: 0,
        overflow: 'hidden',
        transition: TRANSITION_HEIGHT
      });
      forceReflow($option[0]);
      $option.css('height', state.optionHeight + 'px');
      state.isOpen = true;
      $root.addClass('is-open');
      updateExpanded(true);
      $root.trigger('product-bar:open');
      state.timerId = setTimeout(function () {
        $option.css({
          height: '',
          overflow: '',
          transition: ''
        });
        state.timerId = null;
      }, TRANSITION_DELAY);
    }

    // 옵션 닫기
    function close() {
      if (!state.isOpen) return;
      clearPendingTimer();

      // 상태 즉시 갱신
      state.isOpen = false;
      $inner.css('height', $inner[0].scrollHeight + 'px');
      state.optionHeight = $option[0].scrollHeight;
      $option.css({
        height: state.optionHeight + 'px',
        overflow: 'hidden',
        transition: TRANSITION_HEIGHT
      });
      forceReflow($option[0]);
      $option.css('height', 0);
      state.timerId = setTimeout(function () {
        $root.removeClass('is-open');
        updateExpanded(false);
        $inner.css('height', '');
        $option.css({
          height: '',
          overflow: '',
          display: '',
          transition: ''
        });
        $root.trigger('product-bar:close');
        state.timerId = null;
      }, TRANSITION_DELAY);
    }

    // 액션 버튼
    function onActionClick(e) {
      var $btn = $(e.currentTarget);
      if ($btn.hasClass('is-disabled')) return;
      var eventName = $btn.is('[data-bar-cart]') ? 'product-bar:cart' : 'product-bar:buy';
      $root.trigger(eventName);
    }

    // 드래그 시작 (터치 + 마우스 공용)
    function onDragStart(e) {
      state.startY = getClientY(e);
      state.currentY = state.startY;
      state.startTime = Date.now();
      state.isDragging = false;
      if (state.isOpen) {
        state.optionHeight = $option.outerHeight();
      } else {
        // 드래그 열기 준비 — 높이 측정
        $option.css('display', 'block');
        state.optionHeight = $option[0].scrollHeight;
        $option.css({
          height: 0,
          overflow: 'hidden'
        });
      }
      if (e.type === 'mousedown') {
        $(document).on('mousemove' + NS, onDragMove).on('mouseup' + NS, onDragEnd);
      }
    }

    // 드래그 이동
    function onDragMove(e) {
      var clientY = getClientY(e);
      var deltaY = clientY - state.startY;
      state.currentY = clientY;
      if (!state.isDragging) {
        if (Math.abs(deltaY) < DRAG_THRESHOLD) return;
        state.isDragging = true;
        $root.addClass('is-dragging');
        if (state.isOpen) {
          $inner.css('height', $inner[0].scrollHeight + 'px');
          $option.css({
            height: state.optionHeight + 'px',
            overflow: 'hidden',
            transition: 'none'
          });
        } else {
          $option.css({
            transition: 'none'
          });
        }
      }
      if (state.isOpen) {
        // 열린 상태 — 아래로 드래그해서 닫기
        if (deltaY < 0) return;
        $option.css('height', Math.max(0, state.optionHeight - deltaY) + 'px');
      } else {
        // 닫힌 상태 — 위로 드래그해서 열기
        if (deltaY > 0) return;
        $option.css('height', Math.min(state.optionHeight, Math.abs(deltaY)) + 'px');
      }
      if (e.cancelable) e.preventDefault();
    }

    // 드래그 종료
    function onDragEnd() {
      $(document).off('mousemove' + NS + ' mouseup' + NS);
      if (!state.isDragging) {
        // 드래그 안 했는데 닫힌 상태로 준비만 했으면 원복
        if (!state.isOpen) {
          $option.css({
            height: '',
            overflow: '',
            display: ''
          });
        }
        return;
      }
      var deltaY = state.currentY - state.startY;
      var elapsed = Date.now() - state.startTime;
      var velocity = Math.abs(deltaY) / (elapsed || 1);
      $root.removeClass('is-dragging');
      if (state.isOpen) {
        // 열린 상태 → 닫기 판정
        if (deltaY > 0) {
          var shouldClose = velocity > VELOCITY_THRESHOLD || deltaY > state.optionHeight * CLOSE_RATIO;
          if (shouldClose) {
            state.isOpen = false;
            $option.css('transition', TRANSITION_HEIGHT);
            forceReflow($option[0]);
            $option.css('height', 0);
            state.timerId = setTimeout(function () {
              $root.removeClass('is-open');
              updateExpanded(false);
              $inner.css('height', '');
              $option.css({
                height: '',
                overflow: '',
                display: '',
                transition: ''
              });
              $root.trigger('product-bar:close');
              state.timerId = null;
            }, TRANSITION_DELAY);
            return;
          }
        }

        // snap back — 열린 상태 유지
        $option.css('transition', TRANSITION_HEIGHT);
        forceReflow($option[0]);
        $option.css('height', state.optionHeight + 'px');
        state.timerId = setTimeout(function () {
          $inner.css('height', '');
          $option.css({
            height: '',
            overflow: '',
            transition: ''
          });
          state.timerId = null;
        }, TRANSITION_DELAY);
      } else {
        // 닫힌 상태 → 열기 판정
        var absDelta = Math.abs(deltaY);
        if (deltaY < 0) {
          var shouldOpen = velocity > VELOCITY_THRESHOLD || absDelta > state.optionHeight * CLOSE_RATIO;
          if (shouldOpen) {
            $option.css('transition', TRANSITION_HEIGHT);
            forceReflow($option[0]);
            $option.css('height', state.optionHeight + 'px');
            state.isOpen = true;
            $root.addClass('is-open');
            updateExpanded(true);
            $root.trigger('product-bar:open');
            state.timerId = setTimeout(function () {
              $option.css({
                height: '',
                overflow: '',
                transition: ''
              });
              state.timerId = null;
            }, TRANSITION_DELAY);
            return;
          }
        }

        // snap back — 닫힌 상태 유지
        $option.css('transition', TRANSITION_HEIGHT);
        forceReflow($option[0]);
        $option.css('height', 0);
        state.timerId = setTimeout(function () {
          $option.css({
            height: '',
            overflow: '',
            display: '',
            transition: ''
          });
          state.timerId = null;
        }, TRANSITION_DELAY);
      }
    }

    // 이벤트 바인딩 — 클릭
    $cartBtn.on('click' + NS, onActionClick);
    $buyBtn.on('click' + NS, onActionClick);
    $handle.on('click' + NS, function () {
      // 드래그 직후 click 이벤트 무시
      if (state.isDragging) {
        state.isDragging = false;
        return;
      }
      if (state.isOpen) {
        close();
      } else {
        open();
      }
    });

    // 드래그 — 터치 (native, passive: false)
    if (handleEl) {
      handleEl.addEventListener('touchstart', onDragStart, {
        passive: true
      });
      handleEl.addEventListener('touchmove', onDragMove, {
        passive: false
      });
      handleEl.addEventListener('touchend', onDragEnd);
      handleEl.addEventListener('touchcancel', onDragEnd);

      // 드래그 — 마우스 (데스크탑 호환)
      $handle.on('mousedown' + NS, function (e) {
        onDragStart(e.originalEvent);
        // e.preventDefault();
      });
    }
    updateExpanded(false);
    instances[id] = {
      open: open,
      close: close,
      handleEl: handleEl,
      onDragStart: onDragStart,
      onDragMove: onDragMove,
      onDragEnd: onDragEnd
    };
  }
  function destroy(id) {
    var inst = instances[id];
    if (!inst) return;
    var $root = $('#' + id);
    $root.find('[data-bar-cart], [data-bar-buy]').off(NS);
    $root.find('[data-bar-handle]').off(NS);
    $(document).off('mousemove' + NS + ' mouseup' + NS);
    if (inst.handleEl) {
      inst.handleEl.removeEventListener('touchstart', inst.onDragStart);
      inst.handleEl.removeEventListener('touchmove', inst.onDragMove);
      inst.handleEl.removeEventListener('touchend', inst.onDragEnd);
      inst.handleEl.removeEventListener('touchcancel', inst.onDragEnd);
    }
    $root.removeClass('is-open is-dragging');
    $root.find('[data-bar-option]').css({
      height: '',
      overflow: '',
      display: '',
      transition: ''
    });
    delete instances[id];
  }
  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="product-bar"]').each(function () {
      init(this);
    });
  }
  window.UI.bottomProductBar = {
    init: init,
    destroy: destroy,
    initAll: initAll,
    open: function (id) {
      if (instances[id]) instances[id].open();
    },
    close: function (id) {
      if (instances[id]) instances[id].close();
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 3064:
/***/ (function() {

/**
 * @file scripts/ui/form/input.js
 * @description input 공통: 값 유무에 따른 상태 클래스 토글
 * @scope .vits-input 컴포넌트 내부 input만 적용(전역 영향 없음)
 *
 * @state
 *  - root.is-filled: input에 값이 있을 때 토글
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - compositionend 직후 input 중복 발생 방지(debounce flag)
 *
 * @note 모바일 대응
 *  - compositionend 직후 input 중복 발생 방지(삼성키보드 등)
 *  - 브라우저 자동완성(autofill) 시 input/change 미발생 대응(CSS animation 트리거)
 *  - 자동완성 감지용 CSS 필요:
 *    @keyframes onAutoFillStart { from { opacity: 1; } to { opacity: 1; } }
 *    input:-webkit-autofill { animation-name: onAutoFillStart; }
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.input = window.UI.input || {};
  var MODULE_KEY = 'input';
  var NS = '.' + MODULE_KEY;
  var ROOT = '.vits-input';
  var INPUT = ROOT + ' input';

  // compositionend 직후 input 무시 간격(ms)
  var COMPOSE_DEBOUNCE = 50;

  // is-filled 토글
  function syncFilled($root, $input) {
    $root.toggleClass('is-filled', $input.val().length > 0);
  }

  // 단일 input 초기 동기화
  function initOne($input) {
    if (!$input || !$input.length) return;
    var $root = $input.closest(ROOT);
    if (!$root.length) return;
    syncFilled($root, $input);
  }

  // 이벤트 바인딩(위임 1회, init 재호출 대비)
  function bindOnce() {
    $(document).off(NS);

    // IME 조합 시작
    $(document).on('compositionstart' + NS, INPUT, function () {
      $(this).data('isComposing', true);
    });

    // IME 조합 완료
    $(document).on('compositionend' + NS, INPUT, function () {
      var $input = $(this);
      $input.data('isComposing', false);
      $input.data('compEndAt', Date.now());
      initOne($input);
    });

    // 입력 이벤트
    $(document).on('input' + NS, INPUT, function () {
      var $input = $(this);

      // compositionend 직후 중복 input 무시
      var compEndAt = $input.data('compEndAt') || 0;
      if (compEndAt && Date.now() - compEndAt < COMPOSE_DEBOUNCE) return;
      if ($input.data('isComposing')) return;
      var $root = $input.closest(ROOT);
      if (!$root.length) return;
      syncFilled($root, $input);
    });

    // JS 값 변경, 자동완성 후 동기화
    $(document).on('change' + NS, INPUT, function () {
      initOne($(this));
    });

    // 자동완성 감지 — autofill 시 input/change가 안 발생하는 브라우저 대응
    $(document).on('animationstart' + NS, INPUT, function (e) {
      if (e.originalEvent.animationName === 'onAutoFillStart') {
        initOne($(this));
      }
    });
  }

  // root 범위 초기화(부분 렌더 지원)
  function initAll(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find(INPUT).each(function () {
      initOne($(this));
    });
  }
  window.UI.input = {
    init: function (root) {
      if (!window.UI.input.__bound) {
        bindOnce();
        window.UI.input.__bound = true;
      }
      initAll(root);
    },
    destroy: function () {
      $(document).off(NS);
      window.UI.input.__bound = false;
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 3198:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/option-box.js
 * @description data-속성 기반 옵션 선택 박스 (모바일)
 * @scope [data-ui="option-box"]
 *
 * @mapping
 *   [data-option-trigger] — 열기/닫기 버튼
 *   [data-option-trigger] .text — 선택된 값 표시
 *   [data-option-list] — 옵션 목록 (열림/닫힘 대상)
 *   [data-select-value] — 옵션 버튼 (클릭 시 선택)
 *
 * @state
 *   is-open — 옵션 목록 열림
 *   is-selected — 선택된 옵션 항목
 *
 * @events
 *   option-box:select — 옵션 선택 시 발생 (detail: { value, text })
 *
 * @a11y aria-expanded 제어
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiOptionBox';
  var SCOPE = '[data-ui="option-box"]';
  var TRIGGER = '[data-option-trigger]';
  var LIST = '[data-option-list]';
  var OPTION_BTN = '[data-select-value]';
  var OPEN = 'is-open';
  var SELECTED = 'is-selected';
  var _bound = false;
  function openList($scope) {
    $scope.find(LIST).addClass(OPEN);
    $scope.find(TRIGGER).attr('aria-expanded', 'true');
  }
  function closeList($scope) {
    $scope.find(LIST).removeClass(OPEN);
    $scope.find(TRIGGER).attr('aria-expanded', 'false');
  }
  function bind() {
    if (_bound) return;
    _bound = true;

    // 트리거 클릭 — 열기/닫기
    $(document).on('click' + NS, TRIGGER, function (e) {
      e.preventDefault();
      var $scope = $(this).closest(SCOPE);
      if (!$scope.length) return;
      if ($scope.find(LIST).hasClass(OPEN)) {
        closeList($scope);
      } else {
        openList($scope);
      }
    });

    // 옵션 선택
    $(document).on('click' + NS, OPTION_BTN, function () {
      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;
      var value = $btn.attr('data-select-value');

      // 선택 상태 갱신
      $scope.find(OPTION_BTN).removeClass(SELECTED);
      $btn.addClass(SELECTED);

      // 트리거 텍스트 갱신
      var $trigger = $scope.find(TRIGGER + ' .text');
      if ($trigger.length) {
        $trigger.html($btn.html());
      }

      // 닫기
      closeList($scope);

      // 커스텀 이벤트
      $scope.trigger('option-box:select', {
        value: value,
        text: $trigger.text()
      });
    });

    // 외부 클릭 시 닫기
    $(document).on('mousedown' + NS + ' touchstart' + NS, function (e) {
      $(SCOPE).each(function () {
        var $scope = $(this);
        if (!$scope.find(LIST).hasClass(OPEN)) return;
        if ($(e.target).closest($scope).length) return;
        closeList($scope);
      });
    });
  }
  function init() {
    // aria-expanded 누락 트리거 일괄 보충
    $(SCOPE).each(function () {
      var $scope = $(this);
      var $trigger = $scope.find(TRIGGER);
      if ($trigger.length && !$trigger.attr('aria-expanded')) {
        $trigger.attr('aria-expanded', $scope.find(LIST).hasClass(OPEN) ? 'true' : 'false');
      }
    });
    bind();
  }
  function destroy() {
    $(document).off(NS);
    _bound = false;
  }
  window.UI.optionBox = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 3257:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/floating.js
 * @description 모바일 플로팅 TOP 버튼
 * @scope [data-floating-scope]
 * @mapping .vm-content-wrap (내부 스크롤 컨테이너)
 * @state is-visible: TOP 버튼 표시
 * @a11y aria-label="위로 이동" (마크업 측 명시)
 * @note
 *  - 스크롤 대상: .vm-content-wrap (body scroll 아님)
 *  - init(): 멱등성 보장
 *  - destroy(): DOM 제거 전 호출 권장 (미호출 시 자동 cleanup)
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var STATE = {
    VISIBLE: 'is-visible'
  };
  var SELECTOR = {
    SCOPE: '[data-floating-scope]',
    TOP: '[data-floating-top]',
    SCROLL_CONTAINER: '.vm-content-wrap'
  };
  var DATA_KEY = {
    BOUND: 'moFloatingBound'
  };
  var INTERNAL = {
    THROTTLE_DELAY: 100,
    TOP_THRESHOLD: 100,
    TOP_SCROLL_DURATION: 300
  };
  var EVENT_NS = '.uiMoFloating';
  var activeScopes = [];
  var $scrollContainer = null;
  var isScrollBound = false;
  var scrollThrottleTimer = null;

  // 스코프가 DOM에 연결되어 있는지 확인
  function isConnected($el) {
    if (!$el || !$el[0]) return false;
    return $.contains(document.documentElement, $el[0]);
  }

  // activeScopes에서 인덱스 찾기
  function findScopeIndex($scope) {
    var el = $scope[0];
    for (var i = 0; i < activeScopes.length; i++) {
      if (activeScopes[i].$scope[0] === el) return i;
    }
    return -1;
  }

  // activeScopes에 추가 (중복 방지)
  function addScope($scope, $top) {
    if (findScopeIndex($scope) === -1) {
      activeScopes.push({
        $scope: $scope,
        $top: $top
      });
    }
  }

  // activeScopes에서 제거
  function removeScope($scope) {
    var idx = findScopeIndex($scope);
    if (idx !== -1) {
      activeScopes.splice(idx, 1);
    }
  }

  // DOM 분리된 스코프 정리
  function cleanupDisconnected() {
    for (var i = activeScopes.length - 1; i >= 0; i--) {
      if (!isConnected(activeScopes[i].$scope)) {
        activeScopes[i].$scope.removeData(DATA_KEY.BOUND);
        activeScopes.splice(i, 1);
      }
    }
  }

  // 스크롤 컨테이너 캐싱
  function getScrollContainer() {
    if (!$scrollContainer || !$scrollContainer.length || !isConnected($scrollContainer)) {
      // 검색 오버레이(.vm-search-overlay) 내부 컨테이너 제외
      $scrollContainer = $(SELECTOR.SCROLL_CONTAINER).not(function () {
        return this.closest('.vm-search-overlay');
      }).first();
    }
    return $scrollContainer;
  }

  // TOP 버튼 표시/숨김 갱신
  function updateTopState() {
    cleanupDisconnected();
    if (activeScopes.length === 0) {
      unbindScroll();
      return;
    }
    var $container = getScrollContainer();
    if (!$container.length) return;
    var scrollY = $container.scrollTop();
    var visible = scrollY > INTERNAL.TOP_THRESHOLD;
    for (var i = 0; i < activeScopes.length; i++) {
      activeScopes[i].$top.toggleClass(STATE.VISIBLE, visible);
    }
  }

  // throttle 처리된 스크롤 핸들러
  function throttledScrollHandler() {
    if (scrollThrottleTimer) return;
    scrollThrottleTimer = setTimeout(function () {
      updateTopState();
      scrollThrottleTimer = null;
    }, INTERNAL.THROTTLE_DELAY);
  }

  // 스크롤 이벤트 바인딩
  function bindScroll() {
    if (isScrollBound) return;
    var $container = getScrollContainer();
    if (!$container.length) return;
    isScrollBound = true;
    $container.on('scroll' + EVENT_NS, throttledScrollHandler);
  }

  // 스크롤 이벤트 해제
  function unbindScroll() {
    if (!isScrollBound) return;
    isScrollBound = false;
    var $container = getScrollContainer();
    if ($container.length) {
      $container.off('scroll' + EVENT_NS);
    }
    if (scrollThrottleTimer) {
      clearTimeout(scrollThrottleTimer);
      scrollThrottleTimer = null;
    }
  }

  // 최상단 스크롤
  function scrollToTop() {
    var $container = getScrollContainer();
    if (!$container.length) return;
    $container.animate({
      scrollTop: 0
    }, INTERNAL.TOP_SCROLL_DURATION);
  }

  // 스코프 바인딩
  function bindScope($scope) {
    if (!isConnected($scope)) return;
    var $top = $scope.find(SELECTOR.TOP);
    if (!$top.length) return;

    // 이미 바인딩된 스코프면 activeScopes만 갱신
    if ($scope.data(DATA_KEY.BOUND)) {
      addScope($scope, $top);
      return;
    }
    $scope.data(DATA_KEY.BOUND, true);

    // TOP 버튼 클릭
    $scope.on('click' + EVENT_NS, SELECTOR.TOP, function (e) {
      e.preventDefault();
      scrollToTop();
    });
    addScope($scope, $top);
  }

  // 스코프 해제
  function unbindScope($scope) {
    $scope.off(EVENT_NS);
    $scope.removeData(DATA_KEY.BOUND);
    removeScope($scope);
  }
  window.UI.floating = {
    // 초기화
    init: function () {
      cleanupDisconnected();
      $(SELECTOR.SCOPE).each(function () {
        bindScope($(this));
      });
      if (activeScopes.length > 0) {
        bindScroll();
        // 초기 상태 반영
        updateTopState();
      } else {
        unbindScroll();
      }
    },
    // 갱신
    refresh: function ($scope) {
      cleanupDisconnected();
      if ($scope) {
        bindScope($scope);
      } else {
        $(SELECTOR.SCOPE).each(function () {
          bindScope($(this));
        });
      }
      if (activeScopes.length > 0) {
        bindScroll();
        updateTopState();
      } else {
        unbindScroll();
      }
    },
    // 해제
    destroy: function ($scope) {
      if ($scope) {
        unbindScope($scope);
      } else {
        while (activeScopes.length) {
          unbindScope(activeScopes[0].$scope);
        }
      }
      if (activeScopes.length === 0) {
        unbindScroll();
        $scrollContainer = null;
      }
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 3474:
/***/ (function() {

/**
 * @file scroll-buttons.js
 * @description 수평 스크롤 버튼 그룹 — 활성 버튼 자동 스크롤 및 상태 관리
 * @scope [data-scroll-buttons]
 * @option data-peek {number} 잘린 버튼 노출 여백 (기본 40px)
 * @state .is-active — 선택된 버튼
 * @events scrollbuttons:change — 버튼 변경 시 발생, detail: {$btn}
 * @note SKIP 셀렉터([data-range-picker-toggle])는 preventDefault 제외
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  var DATA_KEY = 'scrollButtons';
  var TOUCH_SUPPORTED = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var clickEvent = TOUCH_SUPPORTED ? 'touchend' : 'click';
  var Selector = {
    SCOPE: '[data-scroll-buttons]',
    BTN: 'button, a',
    SKIP: '[data-range-picker-toggle]'
  };
  var ClassName = {
    ACTIVE: 'is-active'
  };
  function init(el) {
    var $scope = $(el);
    if ($scope.data(DATA_KEY)) return;
    var peek = parseInt($scope.attr('data-peek') || 40, 10);
    var $btns = $scope.find(Selector.BTN);
    var handlers = [];

    // 활성 버튼이 보이도록 스크롤 위치 보정
    function scrollToBtn($btn) {
      var wrap = $scope[0];
      var btn = $btn[0];
      var btnLeft = btn.offsetLeft;
      var btnRight = btnLeft + btn.offsetWidth;
      var wrapLeft = wrap.scrollLeft;
      var wrapRight = wrapLeft + wrap.offsetWidth;
      if (btn === $btns.last()[0]) {
        // 마지막 버튼은 끝까지
        $scope.animate({
          scrollLeft: wrap.scrollWidth
        }, 200);
      } else if (btn === $btns.first()[0]) {
        // 첫 번째 버튼은 처음으로
        $scope.animate({
          scrollLeft: 0
        }, 200);
      } else if (btnLeft < wrapLeft) {
        // 왼쪽으로 잘린 경우
        $scope.animate({
          scrollLeft: btnLeft - peek
        }, 200);
      } else if (btnRight > wrapRight) {
        // 오른쪽으로 잘린 경우
        $scope.animate({
          scrollLeft: btnRight - wrap.offsetWidth + peek
        }, 200);
      }
    }

    // 버튼 활성 상태 전환 및 이벤트 발행
    function setActive($btn) {
      var scrollOnly = $scope.is('[data-scroll-only]');
      if (!scrollOnly) {
        $btns.removeClass(ClassName.ACTIVE);
        $btn.addClass(ClassName.ACTIVE);
        $scope.trigger('scrollbuttons:change', [{
          $btn: $btn
        }]);
      }
      scrollToBtn($btn);
    }

    // 터치 스크롤과 탭을 구분하는 핸들러 생성
    function createHandler(btn) {
      // var isSkip = $(btn).is(Selector.SKIP);
      var touchStartX = 0;
      var moved = false;
      btn.addEventListener('touchstart', function (e) {
        touchStartX = e.touches[0].clientX;
        moved = false;
      }, {
        passive: true
      });
      btn.addEventListener('touchmove', function (e) {
        if (Math.abs(e.touches[0].clientX - touchStartX) > 5) {
          moved = true;
        }
      }, {
        passive: true
      });
      return function () {
        if (moved) return;
        // [2026-03-22] 개발 요청: click 이벤트 기반 API 호출 차단 방지를 위해 preventDefault 제거
        // var scrollOnly = $scope.is('[data-scroll-only]');
        // if (!isSkip && !scrollOnly) {
        //   e.preventDefault();
        // }
        setActive($(btn));
      };
    }

    // 모든 버튼 바인딩 — SKIP 대상은 preventDefault 제외
    $btns.each(function () {
      var handler = createHandler(this);
      this.addEventListener(clickEvent, handler, {
        passive: false
      });
      handlers.push({
        el: this,
        handler: handler
      });
    });
    var instance = {
      setActive: setActive,
      destroy: function () {
        handlers.forEach(function (item) {
          item.el.removeEventListener(clickEvent, item.handler);
        });
        handlers = [];
        $scope.removeData(DATA_KEY);
      }
    };

    // 초기 로드 시 활성 버튼이 있으면 스크롤 위치 보정
    var $activeBtn = $btns.filter('.' + ClassName.ACTIVE);
    if ($activeBtn.length) {
      setTimeout(function () {
        scrollToBtn($activeBtn.first());
      }, 0);
    }
    $scope.data(DATA_KEY, instance);
  }
  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find(Selector.SCOPE).each(function () {
      init(this);
    });
  }
  function getInstance(selector) {
    return $(selector).data(DATA_KEY) || null;
  }
  window.scrollButtons = {
    init: init,
    initAll: initAll,
    getInstance: getInstance
  };
  $(function () {
    initAll();
  });
})(window);

/***/ }),

/***/ 4305:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/overflow-menu.js
 * @description 오버플로 메뉴 (더보기 등)
 * @scope [data-vm-overflow-menu]
 * @state .is-open — 메뉴 열림
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiOverflowMenu';
  var ROOT = '[data-vm-overflow-menu]';
  var TRIGGER = '[data-vm-overflow-trigger]';
  var LIST = '[data-vm-overflow-list]';
  var CLS_OPEN = 'is-open';
  var _bound = false;
  function close($root) {
    $root.removeClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'false');
  }
  function closeAll() {
    $(ROOT + '.' + CLS_OPEN).each(function () {
      close($(this));
    });
  }
  function open($root) {
    closeAll();
    $root.addClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'true');
  }
  function toggle($root) {
    if ($root.hasClass(CLS_OPEN)) {
      close($root);
    } else {
      open($root);
    }
  }
  function bind() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 트리거 클릭
    $doc.on('click' + NS, TRIGGER, function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle($(this).closest(ROOT));
    });

    // 메뉴 항목 클릭 → 닫기
    $doc.on('click' + NS, LIST + ' a, ' + LIST + ' button', function () {
      close($(this).closest(ROOT));
    });

    // 외부 클릭 → 닫기
    $doc.on('mousedown' + NS + ' touchstart' + NS, function (e) {
      if (!$(e.target).closest(ROOT).length) {
        closeAll();
      }
    });
  }
  function init() {
    // aria-expanded 누락 트리거 일괄 보충
    $(ROOT).each(function () {
      var $root = $(this);
      var $trigger = $root.find(TRIGGER);
      if ($trigger.length && !$trigger.attr('aria-expanded')) {
        $trigger.attr('aria-expanded', $root.hasClass(CLS_OPEN) ? 'true' : 'false');
      }
    });
    bind();
  }
  function destroy() {
    closeAll();
    $(document).off(NS);
    _bound = false;
  }
  window.UI.overflowMenu = {
    init: init,
    destroy: destroy,
    close: close,
    closeAll: closeAll
  };
})(window.jQuery, window);

/***/ }),

/***/ 4387:
/***/ (function() {

/**
 * @file scripts-mo/ui/kendo/kendo-window.js
 * @description 모바일 Kendo Window 초기화 모듈
 * @variant 'bottomsheet' — 하단에서 슬라이드 업 (CSS 애니메이션)
 * @variant 'slide-right' — 오른쪽에서 슬라이드 인 (풀스크린)
 * @variant 'slide-left'  — 왼쪽에서 슬라이드 인 (풀스크린)
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
  var savedScrollTop = 0;
  var openedWindows = [];
  var contentObservers = {};
  var debounceTimers = {};

  // vm-content-wrap 내부 스크롤 구조에서는 body fixed 불필요
  // 스크롤 위치만 저장하고 overflow 잠금
  function lockBody() {
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;
    var $scroll = $('.vm-content-wrap');
    savedScrollTop = $scroll.length ? $scroll[0].scrollTop : 0;
    $('body').addClass(BODY_LOCK_CLASS);
    $scroll.css('overflow-y', 'hidden');
  }
  function unlockBody() {
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;
    var $scroll = $('.vm-content-wrap');
    $('body').removeClass(BODY_LOCK_CLASS);
    $scroll.css('overflow-y', '');

    // 스크롤 위치 복원
    if ($scroll.length) {
      $scroll[0].scrollTop = savedScrollTop;
    }
  }
  function checkScroll(id) {
    var $el = $('#' + id);
    $el.find('[data-scroll-check]').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }

  // collapse 높이 모드 재판별
  function refreshCollapse(id) {
    if (window.UI && window.UI.collapse && window.UI.collapse.refresh) {
      window.UI.collapse.refresh('#' + id);
    }
  }
  function refresh(id) {
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;
      checkScroll(id);
      var $kw = $el.closest('.k-window');
      if (!$kw.hasClass('is-bottomsheet') && !$kw.hasClass('is-slideright') && !$kw.hasClass('is-slideleft')) {
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
    var isSlide = variant === 'slide-right' || variant === 'slide-left';
    var isSlideLeft = variant === 'slide-left';
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
        $(document).trigger('kendo:open', [id]);
      },
      close: function () {
        disconnectContent(id);
        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }

        // 닫힘 이벤트 발행
        $(document).trigger('kendo:close', [id]);
      }
    };
    $el.kendoWindow(opts);
    var $kw = $el.closest('.k-window');
    if (isBottom) {
      $kw.addClass('is-bottomsheet');
    }
    if (isSlide) {
      $kw.addClass(isSlideLeft ? 'is-slideleft' : 'is-slideright');
    }
  }
  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }

  // open 함수 밖 (모듈 스코프)
  function playOpenAnimation($kw, id) {
    $kw.addClass('is-opening');
    var done = false;
    var onEnd = function () {
      if (done) return;
      done = true;
      $kw.removeClass('is-opening');
      refreshCollapse(id);
    };
    $kw.one('animationend', onEnd);
    setTimeout(onEnd, ANIMATION_TIMEOUT);
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
      var isSlide = $kw.hasClass('is-slideright') || $kw.hasClass('is-slideleft');
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
        playOpenAnimation($kw, id);
      }

      // 슬라이드: 풀스크린 + 스택 z-index
      if (isSlide) {
        // 열린 슬라이드 중 최상위 z-index 산출
        var maxZ = 10010;
        openedWindows.forEach(function (winId) {
          if (winId === id) return;
          var $w = $('#' + winId).closest('.k-window');
          if ($w.hasClass('is-slideright') || $w.hasClass('is-slideleft')) {
            var z = parseInt($w.css('z-index'), 10) || 0;
            if (z >= maxZ) maxZ = z + 1;
          }
        });
        $kw.css({
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100%',
          height: '100%',
          position: 'fixed'
        });
        if (!$kw.find('.category-full-popup, .modal-filter-sheet, .my-shipment-popup').length) {
          $kw[0].style.setProperty('z-index', String(maxZ), 'important');
        }
        playOpenAnimation($kw, id);
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
      var isSlide = $kw.hasClass('is-slideright') || $kw.hasClass('is-slideleft');
      var isBottom = $kw.hasClass('is-bottomsheet');
      $el.find('.vm-modal-content').removeClass('has-scroll');

      // 슬라이드만 애니메이션 후 close
      if (isSlide || isBottom) {
        closeWithAnimation($kw, inst);
        return;
      }
      inst.close();
    }
  }

  // dimClose 옵션으로 딤 클릭 닫기 제어
  $(document).on('click' + NS, '.k-overlay', function () {
    var ids = openedWindows.slice();

    // 최상위가 슬라이드인지 판별
    var topId = ids[ids.length - 1];
    var $topW = topId ? $('#' + topId).closest('.k-window') : $();
    var isTopSlide = $topW.hasClass('is-slideright') || $topW.hasClass('is-slideleft');
    if (isTopSlide) {
      // 슬라이드: 최상위 하나만 닫기
      if ($('#' + topId).attr('data-dim-close') !== 'false') {
        close(topId);
      }
    } else {
      // 기존 동작 (슬라이드는 제외)
      ids.forEach(function (winId) {
        if ($('#' + winId).attr('data-dim-close') === 'false') return;
        var $w = $('#' + winId).closest('.k-window');
        if ($w.hasClass('is-slideright') || $w.hasClass('is-slideleft')) return;
        close(winId);
      });
    }
  });
  window.VmKendoWindow = {
    initAll: initAll,
    open: open,
    close: close,
    refresh: refresh
  };
})(window.jQuery, window);

/***/ }),

/***/ 4627:
/***/ (function(__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./src/assets/scripts-mo/core/utils.js
var utils = __webpack_require__(1781);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/scroll-lock.js
var scroll_lock = __webpack_require__(2066);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/kendo/kendo-window.js
var kendo_window = __webpack_require__(4387);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/kendo/kendo-datepicker.js
var kendo_datepicker = __webpack_require__(7713);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/kendo/kendo-datepicker-single.js
var kendo_datepicker_single = __webpack_require__(1014);
;// ./src/assets/scripts-mo/ui/kendo/index.js
/**
 * @file scripts-mo/ui/kendo/index.js
 * @description Kendo UI 관련 모듈 통합 관리
 */



(function (window) {
  'use strict';

  window.UI = window.UI || {};
  var modules = ['VmKendoWindow', 'VmKendoRangePicker', 'VmKendoDatePickerSingle'];
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
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/overflow-menu.js
var overflow_menu = __webpack_require__(4305);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/toggle.js
var toggle = __webpack_require__(8955);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/step-flow.js
var step_flow = __webpack_require__(8486);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/expand.js
var expand = __webpack_require__(8839);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/tab.js
var tab = __webpack_require__(5332);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/scroll-buttons.js
var scroll_buttons = __webpack_require__(3474);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/tab-sticky.js
var tab_sticky = __webpack_require__(2006);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/collapse.js
var collapse = __webpack_require__(9212);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/scroll-overflow-gradient.js
var scroll_overflow_gradient = __webpack_require__(2638);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/option-box.js
var option_box = __webpack_require__(3198);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/step-tab.js
var step_tab = __webpack_require__(6323);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/auth.js
var auth = __webpack_require__(689);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/survey-detail.js
var survey_detail = __webpack_require__(1151);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/voice-blob.js
var voice_blob = __webpack_require__(5365);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/bottom-tab-bar.js
var bottom_tab_bar = __webpack_require__(4714);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/chip-button.js
var chip_button = __webpack_require__(9098);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/floating.js
var floating = __webpack_require__(3257);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/common/pull-refresh.js
var pull_refresh = __webpack_require__(862);
// EXTERNAL MODULE: ./node_modules/.pnpm/swiper@11.2.8/node_modules/swiper/swiper-bundle.mjs + 32 modules
var swiper_bundle = __webpack_require__(7111);
;// ./src/assets/scripts-mo/ui/common/swiper-base.js
/**
 * @file scripts-mo/ui/common/swiper-base.js
 * @description 범용 Swiper (프리셋 이름으로 옵션 매핑, 홈 외 공통 사용)
 * @scope [data-ui="swiper-base"]
 * @option data-swiper — 프리셋 이름 (product 등)
 * @option data-overflow-gradient — 끝 미도달 시 그라데이션 표시
 * @state is-overflow — 끝 미도달 상태
 * @note slidesPerView: 'auto' 고정, 슬라이드 너비는 프리셋의 slideWidth로 인라인 적용
 * @note equalHeight: true인 프리셋은 가장 높은 슬라이드 기준으로 높이 균일화
 */

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="swiper-base"]';
  var CLS_OVERFLOW = 'is-overflow';

  // 공통 기본값 (프리셋에 없는 항목은 여기서 가져감)
  var DEFAULTS = {
    slidesPerView: 'auto',
    speed: 400
  };

  // 프리셋: 공통과 다른 값만 정의
  var PRESETS = {
    product: {
      slideWidth: 136,
      spaceBetween: 20,
      equalHeight: true
    }
  };
  function getBool(el, name) {
    return el.getAttribute('data-' + name) === 'true';
  }

  // 프리셋 + 기본값 병합 → Swiper config 생성
  function buildConfig(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};
    var config = {
      slidesPerView: DEFAULTS.slidesPerView,
      speed: preset.speed || DEFAULTS.speed,
      observer: true,
      observeParents: true,
      preventClicks: true,
      preventClicksPropagation: true
    };

    // spaceBetween은 프리셋에 있을 때만 적용
    if (preset.spaceBetween != null) {
      config.spaceBetween = preset.spaceBetween;
    }
    return config;
  }

  // 프리셋 slideWidth가 있으면 슬라이드에 인라인 너비 적용
  function applySlideWidth(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};
    if (!preset.slideWidth) return;
    $(el).find('.swiper-slide').each(function () {
      this.style.width = preset.slideWidth + 'px';
    });
  }

  // 슬라이드 높이 균일화 — DOM 변화 시 재계산 (debounce 적용)
  function applyEqualHeight(el) {
    var name = el.getAttribute('data-swiper');
    var preset = name && PRESETS[name] ? PRESETS[name] : {};
    if (!preset.equalHeight) return;
    var timer = null;
    var wrapper = el.querySelector('.swiper-wrapper');
    var observer = new MutationObserver(debouncedRecalc);
    function recalc() {
      // 재계산 중 observer 일시 중단 (height 변경이 다시 트리거하는 것 방지)
      observer.disconnect();
      var $slides = $(el).find('.swiper-slide');
      $slides.css('height', '');
      var maxH = 0;
      $slides.each(function () {
        var h = this.offsetHeight;
        if (h > maxH) maxH = h;
      });
      if (maxH > 0) {
        $slides.css('height', maxH + 'px');
      }

      // observer 재연결
      observer.observe(wrapper, {
        childList: true,
        subtree: true
      });
    }
    function debouncedRecalc() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(recalc, 50);
    }
    recalc();
    $(el).data('equalHeightObserver', observer);
  }

  // 끝 미도달 시 그라데이션 토글
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;
    var update = function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    };
    update();
    swiper.on('slideChange', update);
    swiper.on('reachEnd', update);
  }
  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;
      applySlideWidth(el);
      applyEqualHeight(el);
      var config = buildConfig(el);
      var swiperInstance = new swiper_bundle/* default */.A(swiperEl, config);
      if (getBool(el, 'overflow-gradient')) {
        bindOverflow(swiperInstance, $root);
      }
      $root.data('init', true);
    });
  }
  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }

      // 인라인 스타일 제거
      $root.find('.swiper-slide').each(function () {
        this.style.width = '';
        this.style.height = '';
      });
      $root.removeClass(CLS_OVERFLOW);
      $root.removeData('init');
      var observer = $root.data('equalHeightObserver');
      if (observer) {
        observer.disconnect();
        $root.removeData('equalHeightObserver');
      }
    });
  }
  window.UI = window.UI || {};
  window.UI.swiperBase = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);
;// ./src/assets/scripts-mo/ui/common/index.js
/**
 * @file scripts-mo/ui/common/index.js
 * @description 공통 UI 모듈 통합
 */






















(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['tooltip', 'stickyObserver', 'overflowMenu', 'toggle', 'stepFlow', 'expand', 'tab', 'scrollButtons', 'tabSticky', 'collapse', 'scrollOverflowGradient', 'optionBox', 'stepTab', 'auth', 'surveyDetail', 'voiceBlob', 'bottomTabBar', 'chipButton', 'floating', 'pullRefresh', 'swiperBase'];
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
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/form/checkbox-total.js
var checkbox_total = __webpack_require__(548);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/form/textarea.js
var form_textarea = __webpack_require__(5912);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/form/input.js
var input = __webpack_require__(3064);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/form/input-search.js
var input_search = __webpack_require__(6525);
;// ./src/assets/scripts-mo/ui/form/index.js
/**
 * @file scripts-mo/ui/form/index.js
 * @description 폼 관련 UI 모듈 통합
 */






(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['select', 'checkboxTotal', 'textarea', 'input', 'inputSearch'];
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
;// ./src/assets/scripts-mo/ui/product/detail-gallery.js
/**
 * @file detail-gallery.js
 * @description 상품 상세 썸네일 갤러리 (메인 슬라이더 + 상세이미지 팝업 모달)
 * @scope [data-ui="detail-gallery"]
 * @mapping detail-overview-thumb.ejs
 * @state .is-open — 모달 활성화
 * @a11y hidden/aria-modal, ESC 닫기
 * @note iOS body scroll lock — position:fixed + scrollTop 저장
 * @note Android 물리 백버튼 — history.pushState 활용
 * @example 외부 사용 예시
 *          const gallery = UI.detailGallery.getInstance();
 *          if (gallery) {
 *            const idx = gallery.getActiveIndex();
 *            gallery.slideTo(2);
 *            gallery.openZoom();
 *          }
 */

(function () {
  'use strict';

  const SCOPE = '[data-ui="detail-gallery"]';
  const IS_OPEN = 'is-open';
  let savedScrollY = 0;

  // iOS body scroll lock
  function lockScroll() {
    savedScrollY = window.scrollY;
    document.body.style.cssText = 'position:fixed;top:' + -savedScrollY + 'px;left:0;right:0;overflow:hidden;';
  }
  function unlockScroll() {
    document.body.style.cssText = '';
    window.scrollTo(0, savedScrollY);
  }
  function init() {
    const root = document.querySelector(SCOPE);
    if (!root) return;

    // 중복 초기화 방지
    if (root._galleryInstance) return;
    const mainEl = root.querySelector('[data-role="main"]');
    const zoomEl = root.querySelector('[data-role="zoom"]');
    const zoomSwiperEl = root.querySelector('[data-role="zoom-swiper"]');
    const zoomThumbsEl = root.querySelector('[data-role="zoom-thumbs"]');
    if (!mainEl) return;
    const total = mainEl.querySelectorAll('.swiper-slide').length;
    const isSingle = total < 2;

    // 1장이면 모달 썸네일 숨김
    if (isSingle && zoomThumbsEl) zoomThumbsEl.style.display = 'none';

    // 메인 Swiper
    const mainSwiper = new swiper_bundle/* default */.A(mainEl, {
      slidesPerView: 1,
      loop: false,
      allowTouchMove: !isSingle,
      observer: true,
      observeParents: true,
      pagination: isSingle ? false : {
        el: mainEl.querySelector('.swiper-pagination'),
        clickable: true
      }
    });

    // 모달 Swiper — lazy init
    let zoomSwiper = null;
    let zoomThumbSwiper = null;
    function createZoom(index) {
      if (!zoomSwiper) {
        if (!isSingle && zoomThumbsEl) {
          zoomThumbSwiper = new swiper_bundle/* default */.A(zoomThumbsEl, {
            slidesPerView: 'auto',
            spaceBetween: 7,
            watchSlidesProgress: true
          });
        }
        zoomSwiper = new swiper_bundle/* default */.A(zoomSwiperEl, {
          slidesPerView: 1,
          spaceBetween: 20,
          loop: false,
          autoHeight: true,
          observer: true,
          observeParents: true,
          thumbs: zoomThumbSwiper ? {
            swiper: zoomThumbSwiper
          } : undefined,
          on: {
            slideChange: function () {
              // 활성 썸네일이 보이도록 스크롤
              if (zoomThumbSwiper) {
                zoomThumbSwiper.slideTo(this.activeIndex);
              }
            }
          }
        });
      } else {
        zoomSwiper.update();
        if (zoomThumbSwiper) zoomThumbSwiper.update();
      }
      zoomSwiper.slideTo(index, 0);
    }

    // 모달 열기
    function openZoom() {
      if (!zoomEl) return;
      const index = mainSwiper.activeIndex;
      zoomEl.removeAttribute('hidden');
      zoomEl.classList.add(IS_OPEN);
      lockScroll();

      // 풀스크린 모달 — bottom-bar 겹침 방지
      var bottomBar = document.querySelector('.vm-bottom-bar');
      var floating = document.querySelector('.vm-floating-section');
      if (bottomBar) bottomBar.style.display = 'none';
      if (floating) floating.style.display = 'none';

      // Android 뒤로가기 대응
      history.pushState({
        detailGalleryOpen: true
      }, '');
      requestAnimationFrame(() => {
        createZoom(index);
      });
    }

    // 모달 닫기
    function closeZoom(fromPop) {
      if (!zoomEl || !zoomEl.classList.contains(IS_OPEN)) return;
      const index = zoomSwiper ? zoomSwiper.activeIndex : mainSwiper.activeIndex;
      zoomEl.classList.remove(IS_OPEN);
      zoomEl.setAttribute('hidden', '');
      unlockScroll();

      // 풀스크린 모달 해제 — bottom-bar 복원
      var bottomBar = document.querySelector('.vm-bottom-bar');
      var floating = document.querySelector('.vm-floating-section');
      if (bottomBar) bottomBar.style.display = '';
      if (floating) floating.style.display = 'flex';
      mainSwiper.slideTo(index, 0);
      if (!fromPop) history.back();
    }

    // 이벤트
    root.addEventListener('click', e => {
      const target = e.target.closest('[data-role]');
      if (!target) return;
      const role = target.getAttribute('data-role');
      if (role === 'zoom-open') openZoom();
      if (role === 'zoom-close') closeZoom();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && zoomEl?.classList.contains(IS_OPEN)) {
        closeZoom();
      }
    });

    // Android 물리 백버튼
    window.addEventListener('popstate', () => {
      if (zoomEl?.classList.contains(IS_OPEN)) {
        closeZoom(true);
      }
    });

    // public API
    root._galleryInstance = {
      main: mainSwiper,
      zoom: () => zoomSwiper,
      zoomThumb: () => zoomThumbSwiper,
      // 외부 접근용 API
      getActiveIndex: () => mainSwiper.activeIndex,
      slideTo: index => mainSwiper.slideTo(index),
      openZoom,
      closeZoom,
      getTotal: () => total
    };
  }
  function destroy() {
    const root = document.querySelector(SCOPE);
    if (!root || !root._galleryInstance) return;
    const inst = root._galleryInstance;
    inst.main?.destroy(true, true);
    inst.zoom()?.destroy(true, true);
    inst.zoomThumb()?.destroy(true, true);
    delete root._galleryInstance;
  }
  window.UI = window.UI || {};
  window.UI.detailGallery = {
    init,
    destroy,
    // 외부에서 UI.detailGallery.getInstance()로 접근
    getInstance: () => document.querySelector(SCOPE)?._galleryInstance
  };
})();
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/product/bottom-product-bar.js
var bottom_product_bar = __webpack_require__(3012);
;// ./src/assets/scripts-mo/ui/product/index.js
/**
 * @file scripts-mo/ui/product/index.js
 * @description 상품 관련 UI 모듈 통합
 */




(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['productViewToggle', 'productInlineBanner', 'detailGallery', 'bottomProductBar'];
  window.UI.product = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (!mod) return;

        // initAll 우선, 없으면 init
        if (typeof mod.initAll === 'function') {
          mod.initAll();
        } else if (typeof mod.init === 'function') {
          mod.init();
        }
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/category/category-renderer.js
var category_renderer = __webpack_require__(8134);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/category/category-tree-search.js
var category_tree_search = __webpack_require__(1234);
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
  var modules = ['CategorySheet', 'CategoryTreeSearch'];
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
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/filter/filter-mapage.js
var filter_mapage = __webpack_require__(2624);
;// ./src/assets/scripts-mo/ui/filter/index.js
/**
 * @file scripts-mo/ui/filter/index.js
 * @description 필터 UI 모듈 통합
 */



(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['FilterProduct', 'FilterMypage'];
  window.UI.filter = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/cart-order/cart.js
var cart = __webpack_require__(9459);
;// ./src/assets/scripts-mo/ui/cart-order/order.js
/**
 * @file scripts-mo/ui/cart-order/order.js
 * @description 주문/결제(주문서) 페이지 UI 기능
 * - 배송 방법 탭 전환 (택배/퀵배송/화물)
 * - 화물 선택 시 노출/비노출 영역 제어 (data-freight-visible, data-freight-hidden)
 * - 결제수단 탭 전환 (vm-payment-tab / vm-payment-tab-panel)
 * - 결제수단 라디오와 패널 매칭 (vm-payment-item / vm-payment-panel)
 * - 결제수단 토글 클릭 시 해당 패널 활성화 (vm-payment-item-toggle)
 * - 결제 카드/계좌 리스트 Swiper (data-swiper-type="payment")
 */


(function ($, window) {
  'use strict';

  if (!$) {
    return;
  }
  window.UI = window.UI || {};
  var EVENT_NS = '.uiOrder';
  var ROOT_SEL = '.vm-cart-order';
  var METHOD_BTN_SEL = '.vm-shipping-method-btn';
  var METHOD_PANEL_SEL = '.vm-shipping-panel';
  var FREIGHT_VISIBLE_SEL = '[data-freight-visible="false"]';
  var FREIGHT_HIDDEN_SEL = '[data-freight-hidden="false"]';
  var INIT_KEY = 'uiOrderInit';
  var TOGGLE_DELEGATE_KEY = 'uiOrderToggleDelegate';

  // 결제수단 (모바일 vm-*)
  var PAYMENT_TAB_SEL = '.vm-payment-tab[role="tab"]';
  var PAYMENT_TAB_PANEL_SEL = '.vm-payment-tab-panel[role="tabpanel"]';
  var PAYMENT_ITEM_SEL = '.vm-payment-item';
  var PAYMENT_ITEM_TOGGLE_SEL = '.vm-payment-item-toggle';
  var PAYMENT_RADIO_SEL = '.vm-payment-item input[type="radio"][aria-controls]';
  var PAYMENT_PANEL_SEL = '.vm-payment-panel';
  var PAYMENT_METHOD_SEL = '.vm-payment-method';

  // 결제 카드/계좌 Swiper
  var PAYMENT_SWIPER_SEL = '.vm-card-list.js-swiper[data-swiper-type="payment"]';
  var SWIPER_DATA_KEY = 'uiPaymentSwiper';
  var PAYMENT_SWIPER_OPTIONS = {
    slidesPerView: 'auto',
    spaceBetween: 12,
    speed: 500,
    slidesOffsetAfter: 20,
    a11y: false,
    on: {
      init: function (swiper) {
        if (!swiper.slides || !swiper.slides.length) return;
        var $slides = $(swiper.slides);
        if (!$slides.filter('.is-selected').length) {
          $slides.eq(0).addClass('is-selected');
        }
        // 초기 상태에서 끝에 도달해 있으면 클래스 부여
        $(swiper.el).toggleClass('is-end', swiper.isEnd);
      },
      reachEnd: function (swiper) {
        $(swiper.el).addClass('is-end');
      },
      fromEdge: function (swiper) {
        $(swiper.el).removeClass('is-end');
      }
    }
  };
  var METHOD_FREIGHT = 'freight';
  var ID_TAB_SIMPLE_ACCOUNT = 'tab-simple-account';
  var ID_TAB_SIMPLE_CARD = 'tab-simple-card';
  var ID_PAY_SIMPLE = 'pay-simple';
  var ID_PANEL_CREDIT = 'panel-credit';
  var ID_TAX_INVOICE_BATCH = 'tax-invoice-batch';
  function getScope(root) {
    if (!root) return $(ROOT_SEL);
    var $el = $(root);
    if (!$el.length) return $el;
    return $el.find(ROOT_SEL).addBack().filter(ROOT_SEL);
  }

  /**
   * 배송 방법 탭 클릭 시 해당 패널만 활성화
   */
  function bindShippingMethodTabs($scope) {
    var $btns = $scope.find(METHOD_BTN_SEL);
    var $panels = $scope.find(METHOD_PANEL_SEL);
    if (!$btns.length || !$panels.length) return;
    $btns.off('click' + EVENT_NS);
    $btns.on('click' + EVENT_NS, function () {
      var method = $(this).data('method');
      if (!method) return;
      $btns.removeClass('is-active');
      $(this).addClass('is-active');
      $panels.removeClass('is-active');
      $panels.filter('[data-panel="' + method + '"]').addClass('is-active');
      updateFreightVisibility($scope, method);
    });
  }

  /**
   * 화물 선택 시 data-freight-visible 영역 노출, data-freight-hidden 영역 비노출
   */
  function updateFreightVisibility($scope, method) {
    var isFreight = method === METHOD_FREIGHT;
    $scope.find(FREIGHT_VISIBLE_SEL).toggle(isFreight);
    $scope.find(FREIGHT_HIDDEN_SEL).toggle(!isFreight);
  }
  function bindFreightVisibility($scope) {
    var $activeBtn = $scope.find(METHOD_BTN_SEL + '.is-active');
    var method = $activeBtn.length ? $activeBtn.data('method') : '';
    updateFreightVisibility($scope, method);
  }

  /**
   * 결제수단 탭 클릭 시 해당 탭패널만 활성화 (간편결제 내 카드/계좌 탭)
   */
  function setPaymentTabState($scope, $tab) {
    if (!$tab || !$tab.length) return;
    var tabId = $tab.attr('id');
    var controlsId = $tab.attr('aria-controls');
    var $tablist = $tab.closest('[role="tablist"]');
    var $parentPanel = $tablist.closest(PAYMENT_PANEL_SEL);
    if (!$tablist.length || !$parentPanel.length) return;
    var $tabs = $tablist.find(PAYMENT_TAB_SEL);
    var $panels = $parentPanel.find(PAYMENT_TAB_PANEL_SEL);
    $tabs.each(function () {
      var $t = $(this);
      $t.removeClass('is-active');
      $t.attr('aria-selected', 'false');
      $t.attr('aria-expanded', 'false');
    });
    $tab.addClass('is-active');
    $tab.attr('aria-selected', 'true');
    $panels.each(function () {
      $(this).removeClass('is-active');
    });
    if (controlsId) {
      var $targetPanel = $scope.find('#' + controlsId);
      if ($targetPanel.length) {
        $targetPanel.addClass('is-active');
        $tab.attr('aria-expanded', 'true');
        var currentLabelledBy = $targetPanel.attr('aria-labelledby');
        if (!currentLabelledBy || currentLabelledBy !== tabId) {
          $targetPanel.attr('aria-labelledby', tabId);
        }
        // 노출된 패널 안의 payment 스와이퍼는 초기화 시 숨겨져 있었을 수 있으므로 크기 재계산
        $targetPanel.find(PAYMENT_SWIPER_SEL).each(function () {
          var instance = $(this).data(SWIPER_DATA_KEY);
          if (instance && typeof instance.update === 'function') instance.update();
        });
      }
    }
  }

  /**
   * 결제수단 라디오 변경 시 해당 패널만 활성화 (간편결제/카드/계좌이체/무통장/여신)
   */
  function setPaymentPanelState($scope, $radio) {
    if (!$radio || !$radio.length) return;
    var controlsId = $radio.attr('aria-controls');
    if (!controlsId) return;
    var radioId = $radio.attr('id');
    var $item = $radio.closest(PAYMENT_ITEM_SEL);
    var $methodWrap = $item.closest(PAYMENT_METHOD_SEL);
    if (!$item.length || !$methodWrap.length) return;
    var $allPanels = $methodWrap.find(PAYMENT_PANEL_SEL);

    // 간편결제 탭이 '계좌'일 때 다른 결제수단 선택 시 카드 탭으로 전환
    var $tabSimpleAccount = $scope.find('#' + ID_TAB_SIMPLE_ACCOUNT);
    if ($tabSimpleAccount.length && $tabSimpleAccount.hasClass('is-active')) {
      if (radioId !== ID_PAY_SIMPLE) {
        var $tabSimpleCard = $scope.find('#' + ID_TAB_SIMPLE_CARD);
        if ($tabSimpleCard.length) {
          setPaymentTabState($scope, $tabSimpleCard);
        }
      }
    }
    $allPanels.each(function () {
      $(this).removeClass('is-active');
    });
    $methodWrap.find(PAYMENT_RADIO_SEL).attr('aria-expanded', 'false');
    var $targetPanel = $methodWrap.find('#' + controlsId);
    if ($targetPanel.length) {
      $targetPanel.addClass('is-active');
      $radio.attr('aria-expanded', 'true');
      var currentLabelledBy = $targetPanel.attr('aria-labelledby');
      if (!currentLabelledBy || currentLabelledBy !== radioId) {
        $targetPanel.attr('aria-labelledby', radioId);
      }
      // 여신결제 패널 활성화 시 세금계산서 '일괄 발급' 선택 (유지되도록 매번 설정)
      if (controlsId === ID_PANEL_CREDIT) {
        var $taxBatch = $targetPanel.find('.vits-tax #' + ID_TAX_INVOICE_BATCH);
        if ($taxBatch.length) $taxBatch.prop('checked', true);
      }
    } else {
      $radio.attr('aria-expanded', 'false');
    }
  }

  /**
   * 결제 카드/계좌 리스트 Swiper 초기화
   */
  function initPaymentSwipers($scope) {
    if (typeof swiper_bundle/* default */.A === 'undefined') return;
    var $containers = $scope.find(PAYMENT_SWIPER_SEL);
    if (!$containers.length) return;
    $containers.each(function () {
      if ($(this).data(SWIPER_DATA_KEY)) return;
      if (!this.querySelector('.swiper-wrapper')) return;
      var prevEl = this.querySelector('.swiper-button-prev');
      var nextEl = this.querySelector('.swiper-button-next');
      var $el = $(this);

      // DOM에 없으면 자동 생성
      if (!prevEl || !nextEl) {
        var navWrap = document.createElement('div');
        navWrap.className = 'vits-swiper-navs';
        prevEl = document.createElement('button');
        prevEl.className = 'swiper-button-prev';
        prevEl.setAttribute('type', 'button');
        prevEl.setAttribute('aria-label', '이전');
        nextEl = document.createElement('button');
        nextEl.className = 'swiper-button-next';
        nextEl.setAttribute('type', 'button');
        nextEl.setAttribute('aria-label', '다음');
        navWrap.appendChild(prevEl);
        navWrap.appendChild(nextEl);
        this.appendChild(navWrap);
      }
      if (!this.classList.contains('swiper')) this.classList.add('swiper');
      var options = Object.assign({}, PAYMENT_SWIPER_OPTIONS);
      var slideCount = this.querySelectorAll('.swiper-slide').length;
      if (slideCount <= 1) {
        options.allowTouchMove = false;
        options.slidesOffsetAfter = 0;
      }
      if (prevEl && nextEl && slideCount > 1) {
        options.navigation = {
          nextEl: nextEl,
          prevEl: prevEl,
          disabledClass: 'swiper-button-disabled'
        };
      } else if (prevEl && nextEl) {
        // 1개 이하일 때 화살표 숨김
        prevEl.style.display = 'none';
        nextEl.style.display = 'none';
      }
      try {
        var instance = new swiper_bundle/* default */.A(this, options);
        $el.data(SWIPER_DATA_KEY, instance);
        var totalSlides = instance.slides.length;
        this.querySelectorAll('.swiper-slide').forEach(function (slide, index) {
          slide.addEventListener('click', function () {
            $(instance.slides).removeClass('is-selected');
            $(slide).addClass('is-selected');
            $el.toggleClass('is-last-selected', index === totalSlides - 1);
            instance.slideTo(index);
          });
        });
      } catch (e) {
        console.warn('[order] Payment swiper init failed', e);
      }
    });
  }

  /**
   * 결제수단 탭/라디오 이벤트 바인딩 및 초기 상태
   */
  function bindPayment($scope) {
    var $payment = $scope.find('.vm-payment');
    if (!$payment.length) return;

    // 초기: 간편결제 카드 탭 활성화
    var $tabSimpleCard = $scope.find('#' + ID_TAB_SIMPLE_CARD);
    if ($tabSimpleCard.length && !$tabSimpleCard.hasClass('is-active')) {
      setPaymentTabState($scope, $tabSimpleCard);
    }

    // 탭 aria-expanded 초기화
    $scope.find(PAYMENT_TAB_SEL).each(function () {
      var $tab = $(this);
      var isActive = $tab.hasClass('is-active');
      var controlsId = $tab.attr('aria-controls');
      if (controlsId) {
        var $panel = $scope.find('#' + controlsId);
        var isPanelActive = $panel.length && $panel.hasClass('is-active');
        $tab.attr('aria-expanded', isActive && isPanelActive ? 'true' : 'false');
      } else {
        $tab.attr('aria-expanded', 'false');
      }
    });
    $scope.find(PAYMENT_TAB_SEL + '.is-active').each(function () {
      setPaymentTabState($scope, $(this));
    });

    // 라디오 aria-expanded 초기화 후 체크된 항목 기준으로 패널 활성화
    $scope.find(PAYMENT_RADIO_SEL).each(function () {
      var $radio = $(this);
      var controlsId = $radio.attr('aria-controls');
      var isChecked = $radio.is(':checked');
      if (controlsId) {
        var $panel = $scope.find('#' + controlsId);
        var isPanelActive = $panel.length && $panel.hasClass('is-active');
        $radio.attr('aria-expanded', isChecked && isPanelActive ? 'true' : 'false');
      } else {
        $radio.attr('aria-expanded', 'false');
      }
    });
    $scope.find(PAYMENT_RADIO_SEL + ':checked').each(function () {
      setPaymentPanelState($scope, $(this));
    });

    // 결제수단 탭 클릭
    $scope.off('click' + EVENT_NS, PAYMENT_TAB_SEL);
    $scope.on('click' + EVENT_NS, PAYMENT_TAB_SEL, function (e) {
      e.preventDefault();
      setPaymentTabState($scope, $(this));
    });

    // 결제수단 라디오 변경
    $scope.off('change' + EVENT_NS, PAYMENT_RADIO_SEL);
    $scope.on('change' + EVENT_NS, PAYMENT_RADIO_SEL, function () {
      setPaymentPanelState($scope, $(this));
    });

    // 결제수단 토글 클릭 시 해당 패널 활성화
    if (!$(document).data(TOGGLE_DELEGATE_KEY)) {
      $(document).data(TOGGLE_DELEGATE_KEY, true);
      $(document).on('click' + EVENT_NS, ROOT_SEL + ' ' + PAYMENT_ITEM_TOGGLE_SEL, function (e) {
        e.preventDefault();
        var $toggle = $(this);
        var $scope = $toggle.closest(ROOT_SEL);
        if (!$scope.length) return;
        var $item = $toggle.closest(PAYMENT_ITEM_SEL);
        var $radio = $item.find('input[type="radio"][aria-controls]');
        if (!$radio.length) return;
        var controlsId = $radio.attr('aria-controls');
        var $panel = $scope.find('#' + controlsId);
        var isOpen = $panel.hasClass('is-active') && $radio.is(':checked');
        if (isOpen) {
          // 열려있으면 닫기
          $panel.removeClass('is-active');
          $radio.attr('aria-expanded', 'false');
        } else {
          // 닫혀있으면 라디오 체크 + 패널 열기
          $radio.prop('checked', true);
          setPaymentPanelState($scope, $radio);
        }
      });
    }

    // 결제 카드/계좌 Swiper 초기화
    initPaymentSwipers($scope);
  }

  /**
   * 주문서 영역 초기화 (배송 탭, 화물 노출, 결제수단)
   */
  function bindRoot($scope) {
    if ($scope.data(INIT_KEY)) return;
    $scope.data(INIT_KEY, true);
    bindShippingMethodTabs($scope);
    bindFreightVisibility($scope);
    bindPayment($scope);
  }
  window.UI.order = {
    init: function (root) {
      var $scope = getScope(root);
      if (!$scope.length) return;
      $scope.each(function () {
        bindRoot($(this));
      });
    }
  };
})(window.jQuery, window);
;// ./src/assets/scripts-mo/ui/cart-order/index.js
/**
 * @file scripts-mo/ui/cart-order/index.js
 * @description 장바구니/주문 UI 모듈 통합
 */



(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['cart', 'order'];
  window.UI.cartOrder = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/brand/brand-sheet.js
var brand_sheet = __webpack_require__(8844);
;// ./src/assets/scripts-mo/ui/brand/index.js
/**
 * @file scripts-mo/ui/brand/index.js
 * @description 브랜드 UI 모듈 통합
 */


(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['brandSheet'];
  window.UI.brand = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/search/search-rank.js
var search_rank = __webpack_require__(8307);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/search/search-suggest.js
var search_suggest = __webpack_require__(6823);
;// ./src/assets/scripts-mo/ui/search/index.js
/**
 * @file scripts-mo/ui/search/index.js
 * @description 검색 UI 모듈 통합
 */



(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['searchRank', 'searchSuggest'];
  window.UI.search = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    },
    destroy: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.destroy === 'function') mod.destroy();
      });
    }
  };
})(window.jQuery || window.$, window);
;// ./src/assets/scripts-mo/ui/home/home-swiper-visual.js
/**
 * @file scripts-mo/ui/home/home-swiper-visual.js
 * @description 홈 비주얼 배너 Swiper (slide + CSS scale 기반 카드 캐러셀)
 * @scope [data-ui="banner-visual"]
 * @option data-autoplay, data-speed
 */

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-visual"]';
  // loop 안정성을 위한 최소 슬라이드 수 (Swiper 11 버그 대응)
  var MIN_SLIDES = 9;
  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  // 슬라이드 수동 복제 (원본 3개 → 9개, loop + centeredSlides 버그 대응)
  function cloneSlides($wrapper) {
    var $originals = $wrapper.children('.swiper-slide');
    var originalCount = $originals.length;
    if (originalCount >= MIN_SLIDES) return originalCount;
    var needed = Math.ceil((MIN_SLIDES - originalCount) / originalCount);
    for (var i = 0; i < needed; i++) {
      $originals.each(function () {
        $wrapper.append($(this).clone().attr('data-cloned', 'true'));
      });
    }
    return originalCount;
  }
  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;
      var $wrapper = $(swiperEl).find('.swiper-wrapper');
      var slideCount = $wrapper.children('.swiper-slide').length;

      // 슬라이드 1개 이하면 Swiper 불필요
      if (slideCount < 2) return;

      // 복제 후 원본 슬라이드 수 저장
      var originalCount = cloneSlides($wrapper);
      $root.data('originalCount', originalCount);
      var config = {
        speed: getInt(el, 'speed') || 600,
        loop: true,
        slidesPerView: 'auto',
        centeredSlides: true,
        spaceBetween: -10,
        watchSlidesProgress: true,
        observer: true,
        observeParents: true,
        threshold: 2,
        touchStartPreventDefault: false,
        passiveListeners: true,
        grabCursor: true
      };
      var autoplayVal = getInt(el, 'autoplay');
      if (autoplayVal) {
        config.autoplay = {
          delay: autoplayVal,
          disableOnInteraction: false
        };
      }
      var swiper = new swiper_bundle/* default */.A(swiperEl, config);

      // nav 버튼 (이벤트 위임)
      $root.on('click.bannerVisual', '[data-role]', function () {
        var role = $(this).attr('data-role');
        if (role === 'prev') swiper.slidePrev();
        if (role === 'next') swiper.slideNext();
        if (role === 'toggle-play') {
          if (swiper.autoplay.running) {
            swiper.autoplay.stop();
            $(this).addClass('is-play').attr('aria-label', '재생');
          } else {
            swiper.autoplay.start();
            $(this).removeClass('is-play').attr('aria-label', '일시정지');
          }
        }
      });
      $root.data('init', true);
    });
  }
  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }

      // 복제 슬라이드 제거
      $(swiperEl).find('[data-cloned="true"]').remove();
      $root.off('.bannerVisual');
      $root.removeData('init originalCount');
    });
  }
  window.UI = window.UI || {};
  window.UI.homeSwiperVisual = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);
;// ./src/assets/scripts-mo/ui/home/home-swiper-tab.js
/**
 * @file scripts-mo/ui/home/home-swiper-tab.js
 * @description 홈 탭형 배너 Swiper (세로 리스트 + 가로 상품)
 * @scope [data-ui="banner-tab"]
 * @option data-autoplay — 콘텐츠 자동 재생 딜레이(ms)
 * @option data-type="hscroll" — 가로 스크롤 내부 Swiper 모드
 * @option data-menu-space-between — 탭 메뉴 간격(px, 기본 8) / inner 간격(px, 기본 10)
 * @option data-content-space-between — 콘텐츠 슬라이드 간격(px, 기본 0)
 * @option data-swipe-threshold — 경계 스와이프 감도(px, 기본 40)
 * @state swiper-slide-thumb-active — 활성 탭 표시
 * @state is-overflow — Swiper 끝 미도달 시 오른쪽 그라데이션 표시
 * @events click.bannerTab — 탭 클릭 바인딩 (destroy 시 해제)
 */

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-tab"]';
  var DEFAULT_SWIPE_THRESHOLD = 40;
  var CLS_OVERFLOW = 'is-overflow';
  var TAB_GUTTER = 20;
  // 드래그 중 탭 클릭 오발 방지 임계값(px)
  var TAP_THRESHOLD = 5;

  // 공통 옵션 — observer 제거(동적 슬라이드 변경 없음)
  var commonOpts = {
    preventClicks: true,
    preventClicksPropagation: false
  };
  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  // 탭 활성 동기화 + 뷰포트 중앙 이동
  function syncTabActive(tabSwiper, idx) {
    var slides = tabSwiper.slides;
    for (var i = 0; i < slides.length; i++) {
      if (i === idx) {
        slides[i].classList.add('swiper-slide-thumb-active');
      } else {
        slides[i].classList.remove('swiper-slide-thumb-active');
      }
    }
    var slide = slides[idx];
    if (!slide) return;
    if (idx === 0) {
      tabSwiper.translateTo(0, 200);
      return;
    }
    var containerWidth = tabSwiper.el.clientWidth;
    var slideLeft = slide.offsetLeft;
    var slideWidth = slide.offsetWidth;
    // 그라데이션 가려짐 방지 — 활성 탭을 중앙에서 왼쪽으로 TAB_GUTTER만큼 추가 이동
    var centerOffset = slideLeft - containerWidth / 2 + slideWidth / 2 + TAB_GUTTER;
    var maxTranslate = tabSwiper.maxTranslate();
    var minTranslate = tabSwiper.minTranslate();
    var target = Math.max(maxTranslate, Math.min(minTranslate, -centerOffset));

    // 탭 이동 애니메이션 200ms로 경량화
    tabSwiper.translateTo(target, 200);
  }

  // Swiper 오버플로 그라데이션 바인딩
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;
    $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    swiper.on('reachEnd', function () {
      $target.removeClass(CLS_OVERFLOW);
    });
    swiper.on('fromEdge', function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    });
  }

  // 탭 Swiper 생성 — freeMode로 자유 드래그, 경계에서 터치 해제
  function createTabSwiper(el, spaceBetween) {
    return new swiper_bundle/* default */.A(el, {
      slidesPerView: 'auto',
      spaceBetween: spaceBetween,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      watchSlidesProgress: true,
      freeMode: true,
      touchReleaseOnEdges: true
    });
  }

  // 탭 클릭(pointerup) 바인딩 — click보다 빠른 응답
  function bindTabTaps(tabSwiper, contentSwiper, isLoop) {
    var handlers = [];
    for (var i = 0; i < tabSwiper.slides.length; i++) {
      (function (idx) {
        var handler = function () {
          // 드래그 중 오발 방지
          if (Math.abs(tabSwiper.touches.diff) > TAP_THRESHOLD) return;
          if (isLoop) {
            contentSwiper.slideToLoop(idx);
          } else {
            contentSwiper.slideTo(idx);
          }
        };
        tabSwiper.slides[idx].addEventListener('pointerup', handler);
        handlers.push({
          el: tabSwiper.slides[idx],
          fn: handler
        });
      })(i);
    }
    return handlers;
  }

  // 탭 클릭 해제
  function unbindTabTaps(handlers) {
    for (var i = 0; i < handlers.length; i++) {
      handlers[i].el.removeEventListener('pointerup', handlers[i].fn);
    }
  }

  // 세로형(list) 초기화
  function initList($root, el) {
    var tabEl = $root.find('.tab-swiper-menus > .swiper')[0];
    var contentEl = $root.find('.tab-swiper-content > .swiper')[0];
    if (!tabEl || !contentEl) return;
    var tabSwiper = createTabSwiper(tabEl, getInt(el, 'menu-space-between') || 8);

    // 탭 메뉴 그라데이션
    bindOverflow(tabSwiper, $root.find('[data-role="menu-overflow"]'));
    var contentSwiper = new swiper_bundle/* default */.A(contentEl, $.extend({}, commonOpts, {
      slidesPerView: 1,
      spaceBetween: getInt(el, 'content-space-between') || 0,
      loop: true,
      allowTouchMove: true,
      thumbs: {
        swiper: tabSwiper
      },
      on: {
        slideChange: function (swiper) {
          syncTabActive(tabSwiper, swiper.realIndex);
        }
      }
    }));

    // 탭 클릭 — pointerup으로 빠른 응답
    var tapHandlers = bindTabTaps(tabSwiper, contentSwiper, true);
    var autoplayVal = getInt(el, 'autoplay');
    if (autoplayVal) {
      contentSwiper.params.autoplay = {
        delay: autoplayVal,
        disableOnInteraction: false
      };
      contentSwiper.autoplay.start();
    }
    $root.data('tabSwiper', tabSwiper);
    $root.data('contentSwiper', contentSwiper);
    $root.data('tapHandlers', tapHandlers);
  }

  // 가로형(hscroll) 초기화
  function initHscroll($root, el) {
    var tabEl = $root.find('.tab-swiper-menus > .swiper')[0];
    var contentEl = $root.find('.tab-swiper-content > .swiper')[0];
    if (!tabEl || !contentEl) return;
    var totalTabs = tabEl.querySelectorAll(':scope > .swiper-wrapper > .swiper-slide').length;
    var swipeThreshold = getInt(el, 'swipe-threshold') || DEFAULT_SWIPE_THRESHOLD;
    var tabSwiper = createTabSwiper(tabEl, getInt(el, 'menu-space-between') || 8);

    // 탭 메뉴 그라데이션
    bindOverflow(tabSwiper, $root.find('[data-role="menu-overflow"]'));
    var innerSwipers = [];
    var contentSwiper = new swiper_bundle/* default */.A(contentEl, $.extend({}, commonOpts, {
      slidesPerView: 1,
      spaceBetween: getInt(el, 'content-space-between') || 0,
      loop: false,
      allowTouchMove: false,
      thumbs: {
        swiper: tabSwiper
      },
      on: {
        // 전환 시작 시점에 탭 동기화 + inner 리셋 (전환 완료 대기 불필요)
        slideChange: function (swiper) {
          syncTabActive(tabSwiper, swiper.activeIndex);
          var targetInner = innerSwipers[swiper.activeIndex];
          if (targetInner) {
            targetInner.slideTo(0, 0);
            // 탭 전환 후 그라데이션 상태 재평가
            $contentOverflow.toggleClass(CLS_OVERFLOW, !targetInner.isEnd);
          }
        }
      }
    }));

    // 내부 가로 Swiper 초기화
    var innerSpaceBetween = getInt(el, 'content-space-between') || 10;
    var $contentOverflow = $root.find('[data-role="content-overflow"]');
    $root.find('[data-role="inner-swiper"] .swiper').each(function (i, innerEl) {
      var touchStartX = 0;
      var wasAtEnd = false;
      var wasAtBeginning = false;
      var inner = new swiper_bundle/* default */.A(innerEl, {
        slidesPerView: 'auto',
        spaceBetween: innerSpaceBetween,
        nested: true,
        preventClicks: true,
        preventClicksPropagation: false,
        on: {
          touchStart: function (swiper, e) {
            var touch = e.touches && e.touches[0] || e;
            if (typeof touch.clientX !== 'number') return;
            touchStartX = touch.clientX;
            // 터치 시작 시점의 경계 상태 저장 — 2번 스와이프 판정용
            wasAtEnd = swiper.isEnd;
            wasAtBeginning = swiper.isBeginning;
          },
          touchEnd: function (swiper, e) {
            var touch = e.changedTouches && e.changedTouches[0] || e;
            if (typeof touch.clientX !== 'number') return;
            var diff = touchStartX - touch.clientX;
            if (totalTabs <= 1) return;
            var currentIdx = contentSwiper.activeIndex;

            // 왼쪽 스와이프 + 시작·끝 모두 끝 상태 → 다음 탭
            if (diff > swipeThreshold && wasAtEnd && swiper.isEnd) {
              var next = (currentIdx + 1) % totalTabs;
              contentSwiper.slideTo(next);
              syncTabActive(tabSwiper, next);
            }

            // 오른쪽 스와이프 + 시작·끝 모두 처음 상태 → 이전 탭
            if (diff < -swipeThreshold && wasAtBeginning && swiper.isBeginning) {
              var prev = (currentIdx - 1 + totalTabs) % totalTabs;
              contentSwiper.slideTo(prev);
              syncTabActive(tabSwiper, prev);
            }
          }
        }
      });

      // 내부 상품 그라데이션
      bindOverflow(inner, $contentOverflow);
      innerSwipers.push(inner);
    });

    // 탭 클릭 — pointerup으로 빠른 응답
    var tapHandlers = bindTabTaps(tabSwiper, contentSwiper, false);
    $root.data('tabSwiper', tabSwiper);
    $root.data('contentSwiper', contentSwiper);
    $root.data('innerSwipers', innerSwipers);
    $root.data('tapHandlers', tapHandlers);
  }
  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;
      var type = $root.attr('data-type');
      if (type === 'hscroll') {
        initHscroll($root, el);
      } else {
        initList($root, el);
      }
      $root.data('init', true);
    });
  }
  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;

      // pointerup 핸들러 해제
      var tapHandlers = $root.data('tapHandlers') || [];
      unbindTabTaps(tapHandlers);

      // 그라데이션 클래스 제거
      $root.find('[data-role="menu-overflow"]').removeClass(CLS_OVERFLOW);
      $root.find('[data-role="content-overflow"]').removeClass(CLS_OVERFLOW);
      var innerSwipers = $root.data('innerSwipers') || [];
      for (var i = 0; i < innerSwipers.length; i++) {
        if (innerSwipers[i]) innerSwipers[i].destroy(true, true);
      }
      var contentSwiper = $root.data('contentSwiper');
      var tabSwiper = $root.data('tabSwiper');
      if (contentSwiper) contentSwiper.destroy(true, true);
      if (tabSwiper) tabSwiper.destroy(true, true);
      $root.removeData('tabSwiper');
      $root.removeData('contentSwiper');
      $root.removeData('innerSwipers');
      $root.removeData('tapHandlers');
      $root.removeData('init');
    });
  }
  window.UI = window.UI || {};
  window.UI.homeSwiperTab = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);
;// ./src/assets/scripts-mo/ui/home/home-swiper-peek.js
/**
 * @file scripts-mo/ui/home/home-swiper-peek.js
 * @description 홈 peek형 배너 Swiper
 * @scope [data-ui="banner-peek"]
 * @option data-slides-per-view, data-space-between, data-loop, data-autoplay,
 *         data-speed, data-centered-slides, data-overflow-gradient
 */

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-peek"]';
  var CLS_OVERFLOW = 'is-overflow';
  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }
  function getFloat(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseFloat(val) : null;
  }
  function getBool(el, name) {
    return el.getAttribute('data-' + name) === 'true';
  }

  // Swiper 끝 미도달 시 오른쪽 그라데이션 표시
  function bindOverflow(swiper, $target) {
    if (!$target.length) return;
    $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    swiper.on('slideChange', function () {
      $target.toggleClass(CLS_OVERFLOW, !swiper.isEnd);
    });
  }
  function init() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if ($root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (!swiperEl) return;
      var config = {
        slidesPerView: getFloat(el, 'slides-per-view') || 1.2,
        spaceBetween: getInt(el, 'space-between') || 12,
        observer: true,
        observeParents: true,
        preventClicks: true,
        preventClicksPropagation: true
      };
      if (getBool(el, 'loop')) config.loop = true;
      if (getBool(el, 'centered-slides')) config.centeredSlides = true;
      var autoplayVal = getInt(el, 'autoplay');
      if (autoplayVal) config.autoplay = {
        delay: autoplayVal,
        disableOnInteraction: false
      };
      var speedVal = getInt(el, 'speed');
      if (speedVal) config.speed = speedVal;
      var swiperInstance = new swiper_bundle/* default */.A(swiperEl, config);

      // 그라데이션 바인딩
      if (getBool(el, 'overflow-gradient')) {
        bindOverflow(swiperInstance, $root);
      }
      $root.data('init', true);
    });
  }
  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;
      var swiperEl = $root.find('> .swiper')[0];
      if (swiperEl && swiperEl.swiper) {
        swiperEl.swiper.destroy(true, true);
      }
      $root.removeClass(CLS_OVERFLOW);
      $root.removeData('init');
    });
  }
  window.UI = window.UI || {};
  window.UI.homeSwiperPeek = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/home/home-recommend-legend.js
var home_recommend_legend = __webpack_require__(1283);
;// ./src/assets/scripts-mo/ui/home/index.js
/**
 * @file scripts-mo/ui/home/index.js
 * @description 홈 진입점
 */




(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['homeSwiperVisual', 'homeSwiperTab', 'homeSwiperPeek', 'homeRecommendLegend'];
  window.UI.home = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    },
    destroy: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.destroy === 'function') mod.destroy();
      });
    }
  };
})(window.jQuery, window);
// EXTERNAL MODULE: ./src/assets/scripts-mo/ui/header/header-button.js
var header_button = __webpack_require__(7451);
;// ./src/assets/scripts-mo/ui/header/index.js
/**
 * @file scripts-mo/ui/header/index.js
 * @description 헤더 UI 모듈 통합
 */


(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var modules = ['headerButton'];
  window.UI.header = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window[name];
        if (typeof mod.init === 'function') mod.init();
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
  var modules = ['scrollLock', 'kendo', 'common', 'form', 'product', 'category', 'filter', 'cartOrder', 'brand', 'search', 'home', 'header'];
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



;// ./src/app-mo.js
// 모바일 전용


// 공통 (PC와 동일)







// 모바일 전용





/***/ }),

/***/ 4714:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/bottom-tab-bar.js
 * @description 하단 탭바 액션 위임 + 카테고리 풀팝업 제어
 * @scope .bottom-tab-bar
 *
 * @mapping
 *  [data-action]  → 페이지 이동이 아닌 액션 트리거 버튼
 *
 * @events
 *  tabBar:{action명} (document) — 액션 버튼 클릭 시 발행
 *
 * @note
 *  - 카테고리 풀팝업 열기/닫기(토글) 직접 제어
 *  - 풀팝업 내부 탭 전환 시 팝업 헤더 타이틀 동기화
 *  - 카테고리 선택 시 해당 카테고리 페이지로 이동
 *  - GNB 브랜드 버튼으로 열 때 래퍼에 from-gnb 클래스 추가
 *  - 홈 화면(.wrap-home)에서 바텀탭바 카테고리로 열 때도 from-gnb 추가
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiBottomTabBar';
  var SCOPE = '.bottom-tab-bar';
  var FULL_POPUP = '.category-full-popup';
  var POPUP_ID = 'categoryFullPopup';
  var CAT_SCOPE = '[data-category-sheet]';
  // Kendo Window open 애니메이션 완료 후 스크롤 보정용 지연
  var OPEN_DELAY = 300;
  var SEL_BREADCRUMB = '[data-ui="breadcrumb"]';

  // 풀팝업 내부 카테고리 상태
  var _state = {
    path: {
      depth1Id: '',
      depth2Id: '',
      depth3Id: ''
    },
    browseD1: ''
  };
  var _scopeBound = false;
  var _bound = false;

  // 풀팝업 열림 여부
  function isPopupOpen() {
    var $popup = $(FULL_POPUP);
    return $popup.length && $popup.closest('.k-window').is(':visible');
  }

  // 풀팝업 안의 카테고리 스코프
  function $catScope() {
    return $('#' + POPUP_ID).find(CAT_SCOPE);
  }

  // 카테고리 선택 확정 → 페이지 이동
  function onCommit(path) {
    // 브레드크럼 있으면 바텀시트와 동일하게 처리 (브레드크럼 갱신 + 팝업 닫기)
    if ($(SEL_BREADCRUMB).length) {
      if (window.CategorySheet && window.CategorySheet.commitFromPopup) {
        window.CategorySheet.commitFromPopup(path);
      }
      window.VmKendoWindow.close(POPUP_ID);
      return;
    }

    // 브레드크럼 없으면 페이지 이동
    var lastDepth = path.depth3Id || path.depth2Id || path.depth1Id;
    if (lastDepth) {
      var params = ['searchType=C', 'categoryType=N'];
      if (path.depth1Id) params.push('lvl1Cty=' + encodeURIComponent(path.depth1Id));
      if (path.depth2Id) params.push('lvl2Cty=' + encodeURIComponent(path.depth2Id));
      if (path.depth3Id) params.push('lvl3Cty=' + encodeURIComponent(path.depth3Id));
      window.location.href = '/mro/m/shop/productList.do?' + params.join('&');
    }
  }

  // 풀팝업 카테고리 렌더 + 이벤트 바인딩
  function openCategoryPopup() {
    if (!window.VmKendoWindow || !window.CategoryRenderer) return;
    var R = window.CategoryRenderer;

    // 바텀시트 경로 동기화
    if (window.CategorySheet) {
      var sheetPath = window.CategorySheet.getPath();
      if (sheetPath.depth1Id) {
        _state.path = sheetPath;
        _state.browseD1 = sheetPath.depth1Id;
      }
    }

    // 팝업 먼저 열기 — 즉시 반응
    window.VmKendoWindow.open(POPUP_ID);

    // 26-03-10 [주석처리] 메인/서브 구분 없이 동일 UI — fromGnb 분기 제거
    // GNB 브랜드 또는 홈 카테고리 경유 시 래퍼에 from-gnb 클래스 추가
    // var $popupEl = $('#' + POPUP_ID);
    // var win = $popupEl.data('kendoWindow');
    // if (win && win.wrapper && $popupEl.data('fromGnb')) {
    //   win.wrapper.addClass('from-gnb');
    //   // 헤더 닫기 버튼 노출
    //   $('.header-main-bar .btn-close').removeAttr('hidden');
    //   $popupEl.removeData('fromGnb');
    // }

    // 콘텐츠는 팝업 안에서 비동기 렌더
    R.loadTree(function () {
      var $scope = $catScope();
      if (!$scope.length) return;
      if (!_scopeBound) {
        // 팝업 DOM이 잔류할 경우 대비 — 방어적 unbind 후 재바인딩
        R.unbindScopeEvents($scope);
        R.bindScopeEvents($scope, _state, onCommit);
        _scopeBound = true;
      }
      var tree = R.getTree();
      if (!_state.path.depth1Id && tree.length) {
        _state.browseD1 = tree[0].categoryCode;
      } else {
        _state.browseD1 = _state.path.depth1Id;
      }
      R.renderDepth1($scope, _state.path, _state.browseD1);
      if (!_state.path.depth1Id && tree.length) {
        $scope.find('[data-depth1-item]').first().addClass('is-current');
        R.renderSub($scope, _state.browseD1, _state.path);
      }
      if (window.UI && window.UI.tab) {
        var $tabScope = $('#' + POPUP_ID).find('[data-tab-scope]');
        if ($tabScope.length) {
          var $popup = $('#' + POPUP_ID);
          var requestTab = $popup.attr('data-request-tab') || 'categoryTab';
          $popup.removeAttr('data-request-tab');
          window.UI.tab.activate($tabScope, requestTab);
        }
      }
      setTimeout(function () {
        if (_state.path.depth1Id) {
          R.scrollToActive($scope);
        } else {
          $scope.find('[data-depth1-panel]').scrollTop(0);
          $scope.find('[data-sub-panel]').scrollTop(0);
        }
      }, OPEN_DELAY);
    });
  }
  function bind() {
    if (_bound) return;
    _bound = true;

    // GNB 브랜드 → 브랜드탭으로 카테고리 팝업 열기
    $(document).on('click' + NS, '[data-action="open-brand-sheet"]', function (e) {
      e.preventDefault();
      if (!window.VmKendoWindow) return;
      if (isPopupOpen()) {
        window.VmKendoWindow.close(POPUP_ID);
        return;
      }
      $('#' + POPUP_ID).attr('data-request-tab', 'brandTab');
      // 26-03-10 [주석처리] fromGnb 불필요
      // GNB 브랜드에서 열었음을 표시
      // $('#' + POPUP_ID).data('fromGnb', true);
      openCategoryPopup();
    });

    // 액션 버튼 클릭 → 풀팝업 열기/토글
    $(document).on('click' + NS, SCOPE + ' [data-action]', function (e) {
      e.preventDefault();
      var action = $(this).data('action');
      if (!action) return;

      // 카테고리 액션
      if (action === 'open-category-sheet') {
        if (!window.VmKendoWindow) return;
        // 바텀시트 열려있으면 닫고 풀팝업 열기
        var $sheet = $('#categorySheet');
        var sheetInst = $sheet.data('kendoWindow');
        if (sheetInst && $sheet.is(':visible')) {
          window.VmKendoWindow.close('categorySheet');
        }
        // 풀팝업 토글
        if (isPopupOpen()) {
          window.VmKendoWindow.close(POPUP_ID);
          return;
        }
        // 26-03-10 [주석처리] fromGnb 불필요
        // 홈에서 열 때 GNB와 동일하게 from-gnb 표시
        // if ($('.wrap-home').length) {
        //   $('#' + POPUP_ID).data('fromGnb', true);
        // }
        openCategoryPopup();
        return;
      }

      // 그 외 액션은 이벤트 발행
      $(document).trigger('tabBar:' + action);
    });

    // 풀팝업 내부 탭 전환 → 팝업 타이틀 갱신
    $(document).on('tab:change' + NS, FULL_POPUP + ' [data-tab-scope]', function (e, target, $btn) {
      var title = $btn.find('.text').text();
      $(this).closest(FULL_POPUP).find('.vm-modal-title').text(title);
    });

    // 헤더 닫기 버튼 → 풀팝업 닫기
    $(document).on('click' + NS, '.header-main-bar .btn-close', function (e) {
      e.preventDefault();
      if (isPopupOpen()) {
        window.VmKendoWindow.close(POPUP_ID);
      }
    });

    // 26-03-10 [주석처리] fromGnb 제거 로직 불필요
    // 풀팝업 닫힐 때 from-gnb 제거
    // $(document).on('kendo:close' + NS, function (e, id) {
    //   if (id !== POPUP_ID) return;
    //   var win = $('#' + POPUP_ID).data('kendoWindow');
    //   if (win && win.wrapper) {
    //     win.wrapper.removeClass('from-gnb');
    //     // 헤더 닫기 버튼 숨김
    //     $('.header-main-bar .btn-close').attr('hidden', '');
    //   }
    // });

    // 바텀시트 카테고리 선택 → 풀팝업 상태 동기화
    $(document).on('category:change' + NS, function (e, data) {
      if (data && data.path) {
        _state.path = $.extend({}, data.path);
        _state.browseD1 = data.path.depth1Id;
      }
    });
  }
  function init() {
    bind();
  }
  function destroy() {
    $(document).off(NS);
    var $scope = $catScope();
    if ($scope.length && window.CategoryRenderer) {
      window.CategoryRenderer.unbindScopeEvents($scope);
    }
    _state = {
      path: {
        depth1Id: '',
        depth2Id: '',
        depth3Id: ''
      },
      browseD1: ''
    };
    _scopeBound = false;
    _bound = false;
  }
  window.UI.bottomTabBar = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 5332:
/***/ (function() {

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiTab';
  var SCOPE = '[data-tab-scope]';
  var BTN = '[data-tab-btn]';
  var PANEL = '[data-tab-panel]';
  var ACTIVE = 'is-active';
  var PEEK = 40;
  var _bound = false;

  // 활성 탭 버튼이 보이도록 스크롤 보정
  function scrollToBtn($scope, $btn) {
    var $tabList = $scope.find('[role="tablist"]');
    if (!$tabList.length || !$tabList[0].scrollWidth) return;
    var wrap = $tabList[0];
    var btn = $btn[0];
    var $btns = $tabList.find(BTN);
    var btnLeft = btn.offsetLeft;
    var btnRight = btnLeft + btn.offsetWidth;
    var wrapLeft = wrap.scrollLeft;
    var wrapRight = wrapLeft + wrap.offsetWidth;
    if (btn === $btns.last()[0]) {
      $tabList.animate({
        scrollLeft: wrap.scrollWidth
      }, 200);
    } else if (btn === $btns.first()[0]) {
      $tabList.animate({
        scrollLeft: 0
      }, 200);
    } else if (btnLeft < wrapLeft) {
      $tabList.animate({
        scrollLeft: btnLeft - PEEK
      }, 200);
    } else if (btnRight > wrapRight) {
      $tabList.animate({
        scrollLeft: btnRight - wrap.offsetWidth + PEEK
      }, 200);
    }
  }

  // 탭 전환
  function activate($scope, target) {
    // 모든 버튼 비활성
    $scope.find(BTN).each(function () {
      var $btn = $(this);
      $btn.removeClass(ACTIVE);
      $btn.attr('aria-selected', 'false');
      $btn.attr('tabindex', '-1');
    });

    // 모든 패널 비활성
    $scope.find(PANEL).each(function () {
      $(this).removeClass(ACTIVE).attr('hidden', '');
    });

    // 대상 버튼 활성
    var $activeBtn = $scope.find(BTN + '[data-tab-target="' + target + '"]');
    $activeBtn.addClass(ACTIVE);
    $activeBtn.attr('aria-selected', 'true');
    $activeBtn.attr('tabindex', '0');

    // 대상 패널 활성
    var $activePanel = $scope.find(PANEL + '[data-tab-panel="' + target + '"]');
    $activePanel.addClass(ACTIVE).removeAttr('hidden');

    // 스크롤 보정
    scrollToBtn($scope, $activeBtn);

    // 탭 전환 이벤트 발행
    $scope.trigger('tab:change', [target, $activeBtn]);
  }
  function bind() {
    if (_bound) return;
    _bound = true;

    // 탭 클릭
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;
      var target = $btn.data('tabTarget');
      if (!target) return;
      activate($scope, target);
    });

    // 키보드 좌우 화살표 이동
    $(document).on('keydown' + NS, BTN, function (e) {
      var key = e.keyCode;
      if (key !== 37 && key !== 39) return;
      var $btn = $(this);
      var $scope = $btn.closest(SCOPE);
      if (!$scope.length) return;
      var $tabs = $scope.find(BTN);
      var idx = $tabs.index($btn);
      var len = $tabs.length;

      // 좌: 이전, 우: 다음 (순환)
      var nextIdx = key === 37 ? (idx - 1 + len) % len : (idx + 1) % len;
      var $next = $tabs.eq(nextIdx);
      $next.focus();
      $next.trigger('click');
    });
  }
  function init() {
    bind();

    // URL 파라미터 기반 탭 딥링크 (?tab=tab2)
    var urlTab = new URLSearchParams(window.location.search).get('tab');

    // 초기 활성 탭 설정
    $(SCOPE).each(function () {
      var $scope = $(this);
      var $activeBtn;

      // URL 파라미터 우선
      if (urlTab) {
        $activeBtn = $scope.find(BTN + '[data-tab-target="' + urlTab + '"]');
      }

      // URL 매칭 없으면 is-active 기준
      if (!$activeBtn || !$activeBtn.length) {
        $activeBtn = $scope.find(BTN + '.' + ACTIVE);
      }

      // 그것도 없으면 첫 번째 자동 활성
      if (!$activeBtn.length) {
        $activeBtn = $scope.find(BTN).first();
      }
      var target = $activeBtn.data('tabTarget');
      if (target) activate($scope, target);
    });
  }
  function destroy() {
    $(document).off(NS);
    _bound = false;
  }
  window.UI.tab = {
    init: init,
    destroy: destroy,
    activate: activate
  };
})(window.jQuery, window);

/***/ }),

/***/ 5365:
/***/ (function() {

/**
 * @file voice-blob.js
 * @description AI 음성인식 Lottie 애니메이션 제어
 * @scope [data-voice-blob-anim]
 * @option {string} data-voice-blob-anim — Lottie JSON 파일 경로 (URL)
 * @state instance — dotlottie-wc 플레이어 인스턴스
 */

// voice-blob.json import 제거 — URL 직접 참조로 전환
(function ($) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var instance = null;
  var CDN_URL = 'https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.4/dist/dotlottie-wc.js';
  function init() {
    var $container = $('[data-voice-blob-anim]');
    if (!$container.length || instance) return;

    // data-voice-blob-anim 속성값으로 JSON 경로 주입 (마크업에서 관리)
    var animSrc = $container.data('voice-blob-anim');
    if (!animSrc) return;
    var script = document.createElement('script');
    script.type = 'module';
    script.src = CDN_URL;
    script.onload = function () {
      customElements.whenDefined('dotlottie-wc').then(function () {
        if (instance) return;
        var player = document.createElement('dotlottie-wc');

        // data prop 대신 src 속성 사용 — 서버 환경에서 안정적
        player.setAttribute('src', animSrc);
        player.setAttribute('loop', '');
        player.setAttribute('autoplay', '');
        player.useFrameInterpolation = false;
        player.style.width = '100%';
        player.style.height = '100%';
        $container[0].innerHTML = '';
        $container[0].appendChild(player);
        instance = player;
      });
    };
    document.head.appendChild(script);
  }
  function destroy() {
    if (!instance) return;
    instance.remove();
    instance = null;
  }
  window.UI.voiceBlob = {
    init: init,
    destroy: destroy
  };
})(window.jQuery);

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
    var rawTop = parseInt($el.css('top'), 10) || 0;
    // 양수 top만 rootMargin 보정, 음수 top은 보정 불필요
    var topOffset = rawTop > 0 ? rawTop : 0;
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

/***/ 5912:
/***/ (function() {

/**
 * @file scripts/ui/form/textarea.js
 * @purpose textarea 공통: 글자수 카운트/제한(그래핌 기준) + IME(조합) 대응 + 스크롤 상태 클래스 토글
 * @scope .vits-textarea 컴포넌트 내부 textarea만 적용(전역 영향 없음)
 *
 * @rule
 *  - 높이/줄수/리사이즈는 CSS에서만 관리(JS는 height에 관여하지 않음)  // 단, single-auto/single-lock 모드에서만 inline height를 사용
 *  - 스크롤 발생 시에만 root에 .is-scroll
 *
 * @state
 *  - root.is-scroll: textarea 실제 overflow 발생 시 토글
 *
 * @option (root) data-textarea-count="true|false"
 * @option (textarea) data-max-length="500" // 입력 제한(선택, 그래핌 기준)
 * @option (root) data-textarea-mode="single-fixed|single-auto|single-lock|multi-fixed"
 * @option (root) data-textarea-max-lines="N"      // single-auto 최대 줄(선택)
 * @option (root) data-textarea-lock-lines="N"     // single-lock 잠금 줄(선택)
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - Intl.Segmenter 미지원 환경은 Array.from 폴백(그래핌 근사)
 *
 * @note 모바일 대응
 *  - 가상 키보드 open/close 시 높이·스크롤 재계산(focus/blur + visualViewport)
 *  - iOS Safari scrollHeight shrink 보정(height:0 → 측정 → 복원)
 *  - compositionend 직후 input 중복 발생 방지(debounce flag)
 *  - 화면 회전(orientationchange/resize) 시 전체 재동기화
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.textarea = window.UI.textarea || {};
  var MODULE_KEY = 'textarea';
  var NS = '.' + MODULE_KEY;
  var ROOT = '.vits-textarea';
  var TA = ROOT + ' textarea';
  var MODE = {
    SINGLE_FIXED: 'single-fixed',
    SINGLE_AUTO: 'single-auto',
    SINGLE_LOCK: 'single-lock',
    MULTI_FIXED: 'multi-fixed'
  };

  // compositionend 직후 input 무시 간격(ms)
  var COMPOSE_DEBOUNCE = 50;

  // resize 디바운스 간격(ms) — 회전/키보드 애니메이션 완료 대기
  var RESIZE_DEBOUNCE = 150;
  var resizeTimer = null;

  // 숫자 data-속성 파싱(없으면 0)
  function intAttr($el, name) {
    if (!$el || !$el.length) return 0;
    var v = parseInt($el.attr(name), 10);
    return Number.isFinite(v) ? v : 0;
  }

  // root 옵션 조회(문자열)
  function rootOpt($root, name) {
    return $root && $root.length ? $root.attr(name) || '' : '';
  }

  // root 옵션 조회(숫자)
  function rootOptInt($root, name) {
    return intAttr($root, name);
  }

  // 그래핌(사용자 체감 글자) 단위 카운트
  function graphemeCount(str) {
    var s = String(str || '');
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var c = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) c += 1;
        return c;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }
    return Array.from(s).length;
  }

  // 최대 글자수 기준 자르기(그래핌 우선)
  function sliceToMax(str, max) {
    var s = String(str || '');
    var m = parseInt(max, 10) || 0;
    if (!m) return s;
    try {
      if (window.Intl && Intl.Segmenter) {
        var seg = new Intl.Segmenter('ko', {
          granularity: 'grapheme'
        });
        var out = '';
        var i = 0;
        for (var it = seg.segment(s)[Symbol.iterator](), r = it.next(); !r.done; r = it.next()) {
          if (i >= m) break;
          out += r.value.segment;
          i += 1;
        }
        return out;
      }
    } catch (err) {
      console.warn('[textarea] Intl.Segmenter unavailable, fallback to Array.from', err);
    }
    return Array.from(s).slice(0, m).join('');
  }

  // 입력 제한 적용(조합 중엔 미적용)
  function enforceMaxLength($ta, isComposing) {
    if (!$ta || !$ta.length) return;
    var maxLen = intAttr($ta, 'data-max-length');
    if (!maxLen || isComposing) return;
    var v = $ta.val() || '';
    var next = sliceToMax(v, maxLen);
    if (next !== v) $ta.val(next);
  }

  // css 값(px) 파싱
  function pxNum(v) {
    var n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  // textarea 스타일 기반 line/extra 계산
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

  // rows 기준 높이(px) 계산
  function heightByRows($ta, rows) {
    var m = metrics($ta);
    var r = Math.max(1, rows || 1);
    return m.line * r + m.extra;
  }

  // textarea 높이(px) 주입
  function setHeightPx($ta, px) {
    $ta[0].style.height = Math.max(0, px) + 'px';
  }

  // inline height 제거(CSS 규칙으로 복귀)
  function clearHeightPx($ta) {
    $ta[0].style.height = '';
    $ta.removeClass('is-clamped is-locked');
  }

  // scrollHeight 기반 자동 높이 계산(clamp)
  // iOS Safari에서 shrink가 안 되는 문제 보정: height:0 → 측정 → 복원
  function calcAutoHeightPx($ta, minPx, maxPx) {
    var el = $ta[0];

    // iOS Safari는 height:auto만으로 shrink 시 이전 scrollHeight가 남음
    // height:0으로 강제 축소 후 scrollHeight 측정하면 정확한 콘텐츠 높이를 얻음
    el.style.height = '0px';
    var h = el.scrollHeight || 0;
    if (minPx) h = Math.max(h, minPx);
    if (maxPx) h = Math.min(h, maxPx);
    return h;
  }

  // 카운트 UI 갱신(옵션 true일 때만)
  function updateCountUI($root, $ta) {
    if (rootOpt($root, 'data-textarea-count') !== 'true') return;
    var $count = $root.find('[data-ui-textarea-count]').first();
    if (!$count.length) return;
    var v = $ta.val() || '';
    $count.text(String(graphemeCount(v)));
    var maxLen = intAttr($ta, 'data-max-length');
    var $max = $root.find('[data-ui-textarea-max]').first();
    if (maxLen && $max.length) $max.text(String(maxLen));
  }

  // 스크롤 발생 여부 감지(스크롤바 표시 시점 기준)
  function syncScrollState($root, $ta) {
    var el = $ta[0];
    if (!el) return;
    var oy = window.getComputedStyle(el).overflowY;
    var canScroll = oy === 'auto' || oy === 'scroll';
    if (!canScroll) {
      $root.removeClass('is-scroll');
      $ta.removeClass('vits-scrollbar');
      return;
    }
    var isOverflow = el.scrollHeight - el.clientHeight > 1;
    $root.toggleClass('is-scroll', isOverflow);
    $ta.toggleClass('vits-scrollbar', isOverflow);
  }

  // fixed 모드 처리(높이는 CSS가 담당)
  function syncFixedByCss($root, $ta) {
    $root.removeAttr('data-textarea-locked data-textarea-locked-px');
    clearHeightPx($ta);
  }

  // single-auto 높이 동기화(1줄 → max-lines까지 확장)
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

  // single-lock 높이 동기화(지정 줄수 도달 시 고정 전환)
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

    // 줄수는 \n 기준(단일락 정책 유지)
    var v = ($ta.val() || '').replace(/\r\n/g, '\n');
    var lines = v.length ? v.split('\n').length : 1;
    if (lines >= lockLines) {
      $root.attr('data-textarea-locked', 'true');
      $root.attr('data-textarea-locked-px', String(next));
      $ta.addClass('is-locked');
    }
    $ta.toggleClass('is-clamped', next >= maxPx);
  }

  // 모드별 적용(제한 → 높이 → 카운트 → 스크롤)
  function apply($root, $ta, opts) {
    var isComposing = !!(opts && opts.isComposing);
    var mode = rootOpt($root, 'data-textarea-mode');
    enforceMaxLength($ta, isComposing);
    if (mode === MODE.SINGLE_FIXED || mode === MODE.MULTI_FIXED) syncFixedByCss($root, $ta);
    if (mode === MODE.SINGLE_AUTO) syncSingleAuto($root, $ta);
    if (mode === MODE.SINGLE_LOCK) syncSingleLock($root, $ta);
    updateCountUI($root, $ta);
    syncScrollState($root, $ta);
  }

  // 단일 textarea 초기 동기화
  function initOne($ta) {
    if (!$ta || !$ta.length) return;
    var $root = $ta.closest(ROOT);
    if (!$root.length) return;
    apply($root, $ta, {
      isComposing: false
    });
  }

  // 전체 textarea 재동기화(회전/리사이즈용)
  function resyncAll() {
    $(TA).each(function () {
      initOne($(this));
    });
  }

  // 디바운스된 리사이즈 핸들러
  function onResizeDebounced() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resyncAll, RESIZE_DEBOUNCE);
  }

  // 이벤트 바인딩(위임 1회, init 재호출 대비)
  function bindOnce() {
    $(document).off(NS);
    $(window).off(NS);

    // IME 조합 시작
    $(document).on('compositionstart' + NS, TA, function () {
      $(this).data('isComposing', true);
    });

    // IME 조합 완료 → 재적용 + 직후 input 무시 플래그
    $(document).on('compositionend' + NS, TA, function () {
      var $ta = $(this);
      $ta.data('isComposing', false);

      // compositionend 직후 발생하는 input 이벤트 무시용 타임스탬프
      $ta.data('compEndAt', Date.now());
      initOne($ta);
    });

    // 입력 이벤트
    $(document).on('input' + NS, TA, function () {
      var $ta = $(this);

      // compositionend 직후 중복 input 무시(삼성키보드/일부 모바일 브라우저)
      var compEndAt = $ta.data('compEndAt') || 0;
      if (compEndAt && Date.now() - compEndAt < COMPOSE_DEBOUNCE) return;
      var $root = $ta.closest(ROOT);
      if (!$root.length) return;
      apply($root, $ta, {
        isComposing: !!$ta.data('isComposing')
      });
    });

    // 가상 키보드 열림 → 높이·스크롤 재계산
    $(document).on('focus' + NS, TA, function () {
      var $ta = $(this);

      // 가상 키보드 애니메이션 완료 후 재계산
      setTimeout(function () {
        initOne($ta);
      }, RESIZE_DEBOUNCE);
    });

    // 가상 키보드 닫힘 → 높이·스크롤 재계산
    $(document).on('blur' + NS, TA, function () {
      var $ta = $(this);
      setTimeout(function () {
        initOne($ta);
      }, RESIZE_DEBOUNCE);
    });

    // 화면 회전 + 윈도우 리사이즈 대응
    $(window).on('resize' + NS + ' orientationchange' + NS, onResizeDebounced);

    // visualViewport 지원 시 가상 키보드 높이 변화도 감지
    if (window.visualViewport) {
      $(window.visualViewport).on('resize' + NS, onResizeDebounced);
    }
  }

  // root 범위 초기화(부분 렌더 지원)
  function initAll(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find(TA).each(function () {
      initOne($(this));
    });
  }
  window.UI.textarea = {
    init: function (root) {
      if (!window.UI.textarea.__bound) {
        bindOnce();
        window.UI.textarea.__bound = true;
      }
      initAll(root);
    },
    destroy: function () {
      $(document).off(NS);
      $(window).off(NS);

      // visualViewport 이벤트도 해제
      if (window.visualViewport) {
        $(window.visualViewport).off(NS);
      }
      clearTimeout(resizeTimer);
      window.UI.textarea.__bound = false;
    },
    // 외부에서 수동 재동기화 호출 가능(탭 전환, 모달 열림 등)
    resync: resyncAll
  };
})(window.jQuery || window.$, window, document);

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

/***/ 6323:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/step-tab.js
 * @description 단방향 스텝 탭 — 완료 버튼으로만 다음 스텝 이동
 * @scope [data-step-tab-root]
 * @mapping data-step-tab-nav 헤더(시각 표시만), data-step-tab-page 콘텐츠, data-step-tab-complete 완료 버튼
 * @state .is-active — 현재 스텝 (탭·페이지)
 * @state .is-done — 완료된 스텝 (탭)
 * @state .is-disabled — 미도달 스텝 (탭)
 * @option data-step-tab-root {number} 시작 스텝 (기본 1)
 * @a11y aria-current="step" 현재 스텝, aria-disabled 미도달 스텝
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiStepTab';
  var DATA_KEY = 'stepTab';
  var ROOT = '[data-step-tab-root]';
  var NAV = '[data-step-tab-nav]';
  var PAGE = '[data-step-tab-page]';
  var COMPLETE = '[data-step-tab-complete]';
  var CLS = {
    active: 'is-active',
    done: 'is-done',
    disabled: 'is-disabled'
  };
  var DEFAULTS = {
    startStep: 1,
    onBeforeComplete: null,
    onComplete: null,
    onAllDone: null
  };
  function parseOptions($root) {
    var parsed = {};
    var start = Number($root.attr('data-step-tab-root'));
    if (start > 0) parsed.startStep = start;
    return parsed;
  }

  // 스텝 전환 (내부용)
  function goTo($root, step) {
    var state = $root.data(DATA_KEY);
    if (!state || step < 1 || step > state.total) return;
    state.current = step;

    // 페이지 전환
    $root.find(PAGE).removeClass(CLS.active).filter('[data-step-tab-page="' + step + '"]').addClass(CLS.active);

    // 탭 상태 갱신
    $root.find(NAV).each(function () {
      var $btn = $(this);
      var n = Number($btn.data('stepTabNav'));
      $btn.removeClass(CLS.active + ' ' + CLS.done + ' ' + CLS.disabled).removeAttr('aria-current');
      if (n === step) {
        $btn.addClass(CLS.active).attr('aria-current', 'step');
      } else if (n < step) {
        $btn.addClass(CLS.done).attr('aria-disabled', 'true');
      } else {
        $btn.addClass(CLS.disabled).attr('aria-disabled', 'true');
      }
    });
  }

  // 현재 스텝 완료 → 다음 이동
  function complete($root) {
    var state = $root.data(DATA_KEY);
    if (!state) return;
    var opt = state.opt;
    var current = state.current;

    // 완료 전 콜백 — false 반환 시 중단
    if (typeof opt.onBeforeComplete === 'function') {
      if (opt.onBeforeComplete(current) === false) return;
    }
    var isLast = current >= state.total;

    // 스텝 완료 콜백
    if (typeof opt.onComplete === 'function') {
      opt.onComplete(current, isLast);
    }

    // 마지막 스텝 → 전체 완료 처리
    if (isLast) {
      $root.find(NAV + '[data-step-tab-nav="' + current + '"]').removeClass(CLS.active).addClass(CLS.done).removeAttr('aria-current').attr('aria-disabled', 'true');
      if (typeof opt.onAllDone === 'function') {
        opt.onAllDone();
      }
      return;
    }
    goTo($root, current + 1);
  }
  function bind($root) {
    // 탭 헤더는 클릭 불가 — 이벤트 바인딩 없음 (단방향)

    // 완료 버튼
    $root.on('click' + NS, COMPLETE, function (e) {
      e.preventDefault();
      complete($root);
    });
  }
  function init(scope, options) {
    var $root = $(scope || ROOT);
    if ($root.data(DATA_KEY)) return;
    var opt = $.extend({}, DEFAULTS, parseOptions($root), options);
    var total = $root.find(PAGE).length;
    if (total < 2) return;
    $root.data(DATA_KEY, {
      opt: opt,
      total: total,
      current: 0
    });
    bind($root);
    goTo($root, opt.startStep);
  }
  function destroy(scope) {
    var $root = $(scope || ROOT);
    var state = $root.data(DATA_KEY);
    if (!state) return;
    $root.off(NS).removeData(DATA_KEY);
    $root.find(NAV).removeClass(CLS.active + ' ' + CLS.done + ' ' + CLS.disabled);
    $root.find(PAGE).removeClass(CLS.active);
  }
  window.UI.stepTab = {
    init: init,
    destroy: destroy,
    // 외부에서 프로그래밍 방식으로 완료
    complete: function (scope) {
      var $root = $(scope || ROOT);
      if ($root.data(DATA_KEY)) {
        complete($root);
      }
    },
    reset: function (scope) {
      var $root = $(scope || ROOT);
      var state = $root.data(DATA_KEY);
      if (!state) return;
      $root.find(NAV).removeClass(CLS.done);
      goTo($root, state.opt.startStep);
    },
    getCurrent: function (scope) {
      var state = $(scope || ROOT).data(DATA_KEY);
      return state ? state.current : null;
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 6410:
/***/ (function() {

/**
 * @file scripts-mo/ui/category/category-sheet.js
 * @description 카테고리 바텀시트 — CategoryRenderer 기반 렌더 + 브레드크럼 갱신
 * @scope [data-category-sheet]
 *
 * @events
 *  category:change (document) — 선택 확정 시 발행 { path, names, depth4 }
 *
 * @a11y role="option", aria-selected, aria-expanded, Enter/Space 키보드 지원
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  var NS = '.uiCategorySheet';
  var SCOPE = '[data-category-sheet]';
  var POPUP_ID = 'categorySheet';
  var OPEN_DELAY = 300;
  var SEL = {
    breadcrumbBtn: '[data-ui="breadcrumb"] button.vm-breadcrumb-btn',
    breadcrumbItems: '[data-ui="breadcrumb"] .vm-breadcrumb-items'
  };

  // 내부 상태
  var _state = {
    path: {
      depth1Id: '',
      depth2Id: '',
      depth3Id: ''
    },
    browseD1: ''
  };
  var _savedPath = null;
  var _bound = false;

  // 카테고리 시트 열림 여부
  function isSheetOpen() {
    var $el = $('#' + POPUP_ID);
    var inst = $el.data('kendoWindow');
    return inst && inst.element.is(':visible');
  }

  // 바텀시트 안의 스코프
  function $sheetScope() {
    return $('#' + POPUP_ID).find(SCOPE);
  }

  // 브레드크럼 갱신
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
  function onCommit(path) {
    _state.path = $.extend({}, path);
    _state.browseD1 = path.depth1Id;
    _savedPath = null;
    var R = window.CategoryRenderer;
    var names = R.pathNames(path);
    var d4 = R.depth4Items(path);
    updateBreadcrumb(names);
    $('[data-header-title]').text(names[names.length - 1] || '');
    $(document).trigger('category:change', [{
      path: $.extend({}, path),
      names: names,
      depth4: d4
    }]);
    if (window.VmKendoWindow) {
      window.VmKendoWindow.close(POPUP_ID);
    }
  }

  // 시트 열기
  function openSheet() {
    if (!window.VmKendoWindow || !window.CategoryRenderer) return;
    var R = window.CategoryRenderer;
    var $scope = $sheetScope();
    if (!$scope.length) return;

    // 열기 전 경로 백업
    _savedPath = $.extend({}, _state.path);
    _state.browseD1 = _state.path.depth1Id;
    R.renderDepth1($scope, _state.path, _state.browseD1);
    window.VmKendoWindow.open(POPUP_ID);
    setTimeout(function () {
      R.scrollToActive($scope);
    }, OPEN_DELAY);
  }
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 브레드크럼 클릭 → 바텀시트 오픈
    $doc.on('click' + NS, SEL.breadcrumbBtn, function () {
      if (isSheetOpen()) return;
      openSheet();
    });

    // 바텀시트 닫힘 → 선택 안 했으면 탐색 상태 복원
    $(document).on('kendo:close' + NS, function (e, id) {
      if (id !== POPUP_ID) return;
      if (_savedPath) {
        _state.path = $.extend({}, _savedPath);
        _state.browseD1 = _savedPath.depth1Id;
        _savedPath = null;
      }
    });
  }
  function init() {
    if (!window.CategoryRenderer) return;
    var R = window.CategoryRenderer;

    // 바텀시트 내부 스코프에서 경로 읽기
    var $scope = $sheetScope();
    if ($scope.length) {
      _state.path = {
        depth1Id: $scope.data('depth1') || '',
        depth2Id: $scope.data('depth2') || '',
        depth3Id: $scope.data('depth3') || ''
      };
      _state.browseD1 = _state.path.depth1Id;
    }
    bindEvents();

    // tree 로드 후 스코프 이벤트 바인딩 + 브레드크럼 초기화
    R.loadTree(function () {
      var $scope = $sheetScope();
      if ($scope.length) {
        R.bindScopeEvents($scope, _state, onCommit);
      }
      updateBreadcrumb(R.pathNames(_state.path));
    });
  }
  function destroy() {
    $(document).off(NS);
    var $scope = $sheetScope();
    if ($scope.length && window.CategoryRenderer) {
      window.CategoryRenderer.unbindScopeEvents($scope);
    }
    _state = {
      path: {
        depth1Id: '',
        depth2Id: '',
        depth3Id: ''
      },
      browseD1: ''
    };
    _bound = false;
  }
  window.CategorySheet = {
    init: init,
    destroy: destroy,
    getPath: function () {
      return $.extend({}, _state.path);
    },
    commitFromPopup: function (path) {
      _state.path = $.extend({}, path);
      _state.browseD1 = path.depth1Id;
      var R = window.CategoryRenderer;
      var names = R.pathNames(path);
      var d4 = R.depth4Items(path);
      updateBreadcrumb(names);
      $('[data-header-title]').text(names[names.length - 1] || '');
      $(document).trigger('category:change', [{
        path: $.extend({}, path),
        names: names,
        depth4: d4
      }]);
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 6525:
/***/ (function() {

/**
 * @file scripts-mo/ui/form/input-search.js
 * @description input-search 공통 (모바일)
 * @scope [data-search-form]
 *
 * @events (인풋에서 버블링)
 *  inputSearch:submit { query }
 *  inputSearch:clear
 *
 * @events ($(document))
 *  ui:input-search-submit { query, form, input }
 *  ui:input-search-clear  { form, input }
 *
 * @api
 *  init(root?, opt?)                    스캔 초기화
 *  init({$form,$input}, {onSubmit})     단일 폼 초기화
 *  destroy(root?)                       해제
 *  setValue(target, value)              값 세팅 (이벤트 미발생)
 *  clear(target)                        초기화 + 이벤트
 *  setInvalid(arg, on)                  validation 토글
 *  setMessage(target, message)          메시지 변경 + invalid 토글
 *  normalize(str)                       trim + 연속공백 → 1칸
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  window.UI.inputSearch = window.UI.inputSearch || {};
  var NS = '.inputSearch';
  var DATA_KEY = 'inputSearchInit';
  var FORM = '[data-search-form]';
  var INPUT = '[data-search-input]';
  var CLEAR = '[data-search-clear]';
  var VALID_WRAP = '.vits-input-search.vits-validation';
  var VALID_MSG = '.input-validation';
  var MSG_TEXT = '[aria-live="polite"]';

  // 한글 IME 조합 중 submit 방지용 플래그
  var _composing = false;
  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }
  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }
  function findValidation($input) {
    if (!$input || !$input.length) return $();
    var $wrap = $input.closest(VALID_WRAP);
    return $wrap.length ? $wrap.find(VALID_MSG).first() : $();
  }
  function setInvalid($input, $validation, on) {
    if ($input && $input.length) {
      $input.attr('aria-invalid', on ? 'true' : 'false');
    }
    if ($validation && $validation.length) {
      if (on) {
        $validation.removeAttr('hidden');
      } else {
        $validation.attr('hidden', '');
      }
    }
  }
  function resolveFromForm($form) {
    var $input = $form.find(INPUT).first();
    return {
      $form: $form,
      $input: $input,
      $clear: $form.find(CLEAR),
      $validation: $input.length ? findValidation($input) : $()
    };
  }
  function resolveFromArg(arg) {
    if (!arg || !arg.$form || !arg.$input) return null;
    return {
      $form: arg.$form,
      $input: arg.$input,
      $clear: arg.$clear && arg.$clear.length ? arg.$clear : arg.$form.find(CLEAR),
      $validation: arg.$validation && arg.$validation.length ? arg.$validation : findValidation(arg.$input)
    };
  }
  function getEl(target) {
    var $t = $(target);
    var $form = $t.is(FORM) ? $t : $t.closest(FORM);
    if (!$form.length) $form = $t.find(FORM).first();
    return $form.data(DATA_KEY) || null;
  }
  function syncClearBtn(el) {
    if (!el.$clear.length) return;
    if (trimText(el.$input.val())) {
      el.$clear.removeAttr('hidden');
    } else {
      el.$clear.attr('hidden', '');
    }
  }
  function doClear(el) {
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    setInvalid(el.$input, el.$validation, false);
  }
  function bindEvents(el, opt) {
    var onSubmit = opt && typeof opt.onSubmit === 'function' ? opt.onSubmit : null;
    var input = el.$input[0];

    // 입력 → validation 해제 + 클리어 버튼 토글
    el.$input.off('input' + NS).on('input' + NS, function () {
      setInvalid(el.$input, el.$validation, false);
      syncClearBtn(el);
    });

    // 한글 IME 조합 중 submit 방지
    input.addEventListener('compositionstart', function () {
      _composing = true;
    });
    input.addEventListener('compositionend', function () {
      _composing = false;
    });

    // 클리어(X) 버튼 — touchend로 iOS 300ms 딜레이 회피
    if (el.$clear.length) {
      el.$clear.off('click' + NS + ' touchend' + NS).on('click' + NS + ' touchend' + NS, function (e) {
        e.preventDefault();
        doClear(el);
        el.$input.focus();
      });
    }

    // submit
    el.$form.off('submit' + NS).on('submit' + NS, function (e) {
      e.preventDefault();

      // IME 조합 중이면 무시
      if (_composing) return;
      var query = normalizeSpaces(el.$input.val());
      if (!query) {
        syncClearBtn(el);
        el.$input.trigger('inputSearch:clear');
        $(document).trigger('ui:input-search-clear', {
          form: el.$form[0],
          input: el.$input[0]
        });
        el.$input[0].blur();
        return;
      }
      var ctx = {
        $form: el.$form,
        $input: el.$input,
        $validation: el.$validation
      };
      var ok = true;
      if (onSubmit) ok = onSubmit(query, ctx) !== false;
      setInvalid(el.$input, el.$validation, !ok);
      if (ok) {
        syncClearBtn(el);
        el.$input.trigger('inputSearch:submit', {
          query: query
        });
        $(document).trigger('ui:input-search-submit', {
          query: query,
          form: el.$form[0],
          input: el.$input[0]
        });
      }

      // iOS에서 키보드 닫기
      el.$input[0].blur();
    });
  }
  function unbindEvents(el) {
    el.$input.off(NS);
    el.$form.off(NS);
    if (el.$clear.length) el.$clear.off(NS);

    // addEventListener로 붙인 건 참조가 없어 제거 불가 — destroy 시 DOM 제거 전제
    // compositionstart/end는 경량이라 누수 무시 가능
  }
  function initOne($form, opt) {
    if ($form.data(DATA_KEY)) return;
    var el = resolveFromForm($form);
    if (!el.$input.length) return;

    // iOS 16px 미만 폰트에서 자동 줌 방지
    if (/iPhone|iPad/.test(navigator.userAgent)) {
      var fontSize = parseFloat(window.getComputedStyle(el.$input[0]).fontSize);
      if (fontSize < 16) {
        el.$input.css('font-size', '16px');
      }
    }
    bindEvents(el, opt);
    syncClearBtn(el);
    $form.data(DATA_KEY, el);
  }
  function destroyOne($form) {
    var el = $form.data(DATA_KEY);
    if (!el) return;
    unbindEvents(el);
    setInvalid(el.$input, el.$validation, false);
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    $form.removeData(DATA_KEY);
  }
  function eachForm(root, fn) {
    var $scope = root ? $(root) : $(document);
    if ($scope.is(FORM)) {
      fn($scope);
      return;
    }
    $scope.find(FORM).each(function () {
      fn($(this));
    });
  }
  window.UI.inputSearch.normalize = function (str) {
    return normalizeSpaces(str);
  };
  window.UI.inputSearch.setInvalid = function (arg, on) {
    var $input = arg && arg.$input ? arg.$input : $();
    var $validation = arg && arg.$validation ? arg.$validation : $();
    setInvalid($input, $validation, !!on);
  };
  window.UI.inputSearch.setMessage = function (target, message) {
    var el = getEl(target);
    if (!el || !el.$validation.length) return;
    el.$validation.find(MSG_TEXT).text(message || '');
    setInvalid(el.$input, el.$validation, !!message);
  };
  window.UI.inputSearch.setValue = function (target, value) {
    var el = getEl(target);
    if (!el) return;
    el.$input.val(value);
    syncClearBtn(el);
  };
  window.UI.inputSearch.clear = function (target) {
    var el = getEl(target);
    if (el) doClear(el);
  };
  window.UI.inputSearch.init = function (arg, opt) {
    var el = resolveFromArg(arg);
    if (el) {
      if (el.$form.data(DATA_KEY)) return;
      bindEvents(el, opt);
      el.$form.data(DATA_KEY, el);
      return;
    }
    var isRootEl = arg instanceof $ || arg && arg.nodeType || typeof arg === 'string' && $(arg).length;
    var root = isRootEl ? arg : null;
    var options = opt || (!isRootEl && arg && typeof arg === 'object' ? arg : null);
    eachForm(root, function ($form) {
      initOne($form, options);
    });
  };
  window.UI.inputSearch.destroy = function (root) {
    eachForm(root, destroyOne);
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 6823:
/***/ (function() {

/**
 * @file search-suggest.js
 * @description 검색 입력 상태에 따라 기본 뷰/연관검색어 뷰 토글
 * @scope [data-search-view]
 * @state .is-hidden — 비활성 뷰 숨김
 * @note clear 버튼, input 이벤트 연동
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.searchSuggest';
  var IS_HIDDEN = 'is-hidden';
  var bound = false;
  var SEL = {
    DEFAULT: '[data-search-view="default"]',
    SUGGEST: '[data-search-view="suggest"]',
    INPUT: '[data-search-input]',
    CLEAR: '[data-search-clear]'
  };
  function init() {
    // 중복 바인딩 방지
    if (bound) return;
    var $default = $(SEL.DEFAULT).first();
    var $suggest = $(SEL.SUGGEST).first();
    var $input = $(SEL.INPUT).first();
    if (!$default.length || !$suggest.length || !$input.length) return;
    function showSuggest() {
      $default.addClass(IS_HIDDEN);
      $suggest.removeClass(IS_HIDDEN);
    }
    function showDefault() {
      $suggest.addClass(IS_HIDDEN);
      $default.removeClass(IS_HIDDEN);
    }

    // 입력 감지
    $input.on('input' + NS, function () {
      if ($.trim($(this).val())) {
        showSuggest();
      } else {
        showDefault();
      }
    });

    // clear 버튼
    $input.closest('form').on('click' + NS, SEL.CLEAR, function () {
      showDefault();
    });
    bound = true;
  }
  function destroy() {
    $(SEL.INPUT).off(NS);
    $(SEL.INPUT).closest('form').off(NS);
    bound = false;
  }
  window.UI.searchSuggest = {
    init: init,
    destroy: destroy
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 7451:
/***/ (function() {

/**
 * @file scripts-mo/ui/header/header-button.js
 * @description 헤더 버튼 뱃지 카운트 관리
 * @scope [data-header-badge="count"]
 *
 * @state is-hidden (뱃지 숨김), is-single/is-double/is-over (자릿수)
 *
 * @note
 *   - init 시 MutationObserver로 .num 텍스트 변경 자동 감지
 *   - 99 초과 시 99+ 표시, 0이면 뱃지 숨김
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  var SEL = {
    badge: '[data-header-badge="count"]',
    num: '.num'
  };
  var CLS = {
    hidden: 'is-hidden',
    single: 'is-single',
    double: 'is-double',
    over: 'is-over'
  };
  var MAX_COUNT = 99;
  var _observers = [];
  function syncBadge($badge, $num) {
    var text = $.trim($num.text());
    var raw = text === MAX_COUNT + '+' ? MAX_COUNT + 1 : parseInt(text, 10) || 0;
    var display = raw > MAX_COUNT ? MAX_COUNT + '+' : String(raw);
    if (text !== display) {
      $num.text(display);
    }
    $badge.toggleClass(CLS.single, raw > 0 && raw < 10).toggleClass(CLS.double, raw >= 10 && raw <= MAX_COUNT).toggleClass(CLS.over, raw > MAX_COUNT).toggleClass(CLS.hidden, raw === 0);
  }
  function init() {
    $(SEL.badge).each(function () {
      var $badge = $(this);
      var $num = $badge.find(SEL.num);
      if (!$num.length) return;
      syncBadge($badge, $num);
      var observer = new MutationObserver(function () {
        syncBadge($badge, $num);
      });
      observer.observe($num[0], {
        childList: true,
        characterData: true,
        subtree: true
      });
      _observers.push(observer);
    });
  }
  function destroy() {
    _observers.forEach(function (obs) {
      obs.disconnect();
    });
    _observers = [];
  }
  window.headerButton = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 7713:
/***/ (function() {

/**
 * @file scripts/ui/kendo/kendo-datepicker.js
 * @description Kendo Calendar 기반 모바일 Range Picker 모듈
 * @scope [data-ui="kendo-range-picker"]
 * @mapping js-range-display(표시), js-calendar-popup(팝업), js-calendar-toggle(토글), js-kendo-calendar(캘린더)
 * @state is-open: 팝업 열림, is-disabled: 비활성, is-selected: 범위 선택 완료, has-range: 범위 존재
 * @option format, separator, placeholder, min, max (data-opt JSON)
 * @a11y Escape 키 닫기
 * @events rangepicker:change, rangepicker:open, rangepicker:close, rangepicker:reset
 * @note iOS Safari 스크롤 잠금, touchend 기반 ghost click 차단 포함
 * @note 외부 트리거 버튼(data-range-picker-toggle) 텍스트 갱신 포함
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  var DATA_UI = 'kendo-range-picker';
  var DATA_KEY = 'vmKendoRangePicker';
  var NS = '.vmRangePicker';
  var TOUCH_SUPPORTED = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var IS_IOS = TOUCH_SUPPORTED && /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent);
  var DELAY = {
    OBSERVER_RECONNECT: 50,
    NAVIGATE_UI: 10
  };
  var Selector = {
    SCOPE: '[data-ui="' + DATA_UI + '"]',
    DISPLAY: '.js-range-display',
    POPUP: '.js-calendar-popup',
    TOGGLE: '.js-calendar-toggle',
    CALENDAR: '.js-kendo-calendar',
    START_INPUT: '.js-start-date',
    END_INPUT: '.js-end-date'
  };
  var ClassName = {
    OPEN: 'is-open',
    DISABLED: 'is-disabled',
    SELECTED: 'is-selected',
    HAS_RANGE: 'has-range',
    EMPTY_ROW: 'is-empty-row',
    RANGE_START: 'k-range-start',
    RANGE_END: 'k-range-end',
    RANGE_MID: 'k-range-mid'
  };
  var MONTH_MAP = {
    Jan: '1월',
    Feb: '2월',
    Mar: '3월',
    Apr: '4월',
    May: '5월',
    Jun: '6월',
    Jul: '7월',
    Aug: '8월',
    Sep: '9월',
    Oct: '10월',
    Nov: '11월',
    Dec: '12월'
  };
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // 스크롤 잠금
  var savedScrollY = 0;
  var scrollLocked = false;
  function lockBodyScroll() {
    if (scrollLocked) return;
    scrollLocked = true;
    savedScrollY = window.scrollY || window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
  }
  function unlockBodyScroll() {
    if (!scrollLocked) return;
    scrollLocked = false;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = '';
    window.scrollTo(0, savedScrollY);
  }

  // 유틸리티
  function parseJsonSafe(str) {
    if (!str) return null;
    var decoded = str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    try {
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
  function ensureKendoAvailable() {
    return !!($ && window.kendo && $.fn && $.fn.kendoCalendar);
  }
  function parseDateValue(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    try {
      return new Date(val);
    } catch {
      return null;
    }
  }
  function formatDate(date, format) {
    if (!date) return '';
    if (window.kendo && window.kendo.toString) {
      return window.kendo.toString(date, format);
    }
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }
  function toDateOnly(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }
  function applyPrefixClassToWrapper($wrap, $popup) {
    if (!$wrap || !$wrap.length || !$popup || !$popup.length) return;
    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);
    for (var i = 0; i < classList.length; i++) {
      // vits-(PC), vm-(모바일) 모두 대응
      if (classList[i].indexOf('vits-') === 0 || classList[i].indexOf('vm-') === 0) {
        $popup.addClass(classList[i]);
      }
    }
  }

  // Range Picker 초기화
  function initRangePicker(el) {
    var $el = $(el);
    if ($el.data(DATA_KEY)) return;
    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    opts.format = opts.format || 'yyyy.MM.dd';
    opts.separator = opts.separator || ' ~ ';
    opts.placeholder = opts.placeholder || '시작일 ~ 종료일';
    if (opts.min) opts.min = parseDateValue(opts.min);
    if (opts.max) opts.max = parseDateValue(opts.max);
    var $wrap = $el;
    var $display = $wrap.find(Selector.DISPLAY);
    var $popup = $wrap.find(Selector.POPUP);
    var $toggle = $wrap.find(Selector.TOGGLE);
    var $calendarWrap = $wrap.find(Selector.CALENDAR);
    var $startInput = $wrap.find(Selector.START_INPUT);
    var $endInput = $wrap.find(Selector.END_INPUT);
    var elId = $el.attr('id') || '';
    var nsDoc = NS + '_' + elId;

    // 외부 트리거 버튼 셀렉터
    var extSelector = '[data-range-picker-toggle="' + elId + '"]';
    var state = {
      startDate: null,
      endDate: null,
      isSelectingEnd: false,
      isOpen: false
    };
    var isHighlighting = false;
    var isUpdatingUI = false;

    // 초기값 파싱
    var startVal = $startInput.val();
    var endVal = $endInput.val();
    if (startVal) state.startDate = parseDateValue(startVal);
    if (endVal) state.endDate = parseDateValue(endVal);

    // 캘린더 생성
    var calendarOpts = {
      change: onCalendarChange,
      navigate: onCalendarNavigate,
      culture: 'en-US',
      animation: false,
      footer: false,
      month: {
        header: '#= kendo.toString(data.date, "yyyy.MM") #',
        empty: '&nbsp;',
        content: '<span tabindex="-1" class="k-link" data-href="\\#" data-value="#= data.dateString #">#= data.value #</span>'
      },
      start: 'month',
      depth: 'month'
    };
    if (opts.min) calendarOpts.min = opts.min;
    // max는 Kendo에 넘기지 않음 — disableMaxDates()에서 DOM 후처리로 비활성화

    $calendarWrap.kendoCalendar(calendarOpts);
    var calendar = $calendarWrap.data('kendoCalendar');

    // UI 갱신
    function updateNavTitle() {
      var currentDate = calendar.current();
      var year = currentDate.getFullYear();
      var month = String(currentDate.getMonth() + 1).padStart(2, '0');
      // html()은 Date 객체 기반 숫자만 삽입하므로 XSS 안전
      var title = year + '<span class="nav-dot">.</span>' + month;
      $calendarWrap.find('.k-button-text').html(title);
    }
    function updateMonthNames() {
      $calendarWrap.find('.k-calendar-view td .k-link').each(function () {
        var $link = $(this);
        var mapped = MONTH_MAP[$link.text().trim()];
        if (mapped) $link.text(mapped);
      });
    }
    function updateDayNames() {
      $calendarWrap.find('th').each(function (index) {
        var $th = $(this);
        if ($th.text().trim().length <= 3) {
          $th.text(DAY_NAMES[index]);
        }
      });
    }
    function removeEmptyRows() {
      $calendarWrap.find('.k-calendar-monthview tbody tr').each(function () {
        var $tr = $(this);
        var hasCurrentMonth = $tr.find('td:not(.k-other-month)').length > 0;
        $tr.toggleClass(ClassName.EMPTY_ROW, !hasCurrentMonth);
      });
    }

    // max 이후 날짜 비활성화 — opts.max 설정 시에만 동작
    function disableMaxDates() {
      if (!opts.max) return;
      var maxTime = toDateOnly(opts.max);
      $calendarWrap.find('.k-calendar-monthview td').each(function () {
        var $cell = $(this);
        if ($cell.hasClass('k-other-month')) return;
        var $link = $cell.find('.k-link');
        var dateValue = $link.attr('data-value');
        if (!dateValue) return;
        var parts = dateValue.split('/');
        var cellTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)).getTime();
        if (cellTime > maxTime) {
          $cell.addClass('k-state-disabled');
          $link.removeAttr('tabindex').css('pointer-events', 'none');
        }
      });
    }
    function refreshUI() {
      // navigate 이후 전체 UI 갱신 통합 진입점
      updateNavTitle();
      updateDayNames();
      updateMonthNames();
      disableMaxDates();
      highlightRange();
      removeEmptyRows();
    }

    // MutationObserver — DOM 변경 시 UI 동기화
    var uiObserver = new MutationObserver(function () {
      if (isHighlighting || isUpdatingUI) return;
      isUpdatingUI = true;
      uiObserver.disconnect();
      refreshUI();
      window.setTimeout(function () {
        uiObserver.observe($calendarWrap[0], {
          childList: true,
          subtree: true,
          characterData: true
        });
        isUpdatingUI = false;
      }, DELAY.OBSERVER_RECONNECT);
    });
    uiObserver.observe($calendarWrap[0], {
      childList: true,
      subtree: true,
      characterData: true
    });

    // 상태 클래스
    function updateSelectedState() {
      $wrap.toggleClass(ClassName.SELECTED, !!(state.startDate && state.endDate));
    }

    // 이벤트 핸들러
    function onCalendarChange() {
      var selectedDate = calendar.value();

      // max 초과 날짜 선택 방어 — opts.max 설정 시에만
      if (opts.max && selectedDate && toDateOnly(selectedDate) > toDateOnly(opts.max)) {
        var restoreDate = state.startDate || null;
        calendar.value(restoreDate);
        return;
      }
      if (!state.isSelectingEnd) {
        state.startDate = selectedDate;
        state.endDate = null;
        state.isSelectingEnd = true;
      } else {
        // 시작일보다 이전 날짜 선택 시 자동 스왑
        if (selectedDate < state.startDate) {
          state.endDate = state.startDate;
          state.startDate = selectedDate;
        } else {
          state.endDate = selectedDate;
        }
        state.isSelectingEnd = false;
        closePopup();

        // 외부 트리거 버튼 텍스트 갱신 + scroll-buttons 연동
        var $extBtn = $(extSelector);
        if ($extBtn.length) {
          $extBtn.find('.text').text(formatDate(state.startDate, opts.format) + opts.separator + formatDate(state.endDate, opts.format));
          if (window.scrollButtons) {
            var $scrollScope = $extBtn.closest('[data-scroll-buttons]');
            if ($scrollScope.length) {
              var sbInstance = window.scrollButtons.getInstance($scrollScope[0]);
              if (sbInstance) sbInstance.setActive($extBtn);
            }
          }
        }
        $el.trigger('rangepicker:change', [getPublicValue()]);
      }
      updateDisplay();
      updateHiddenInputs();
      highlightRange();
      updateSelectedState();
    }
    function onCalendarNavigate() {
      // calendar 초기화 완료 전 방어
      if (!calendar) return;

      // 네비게이션은 항상 허용 — refreshUI에서 disableMaxDates가 해당 월 날짜를 비활성화
      window.setTimeout(function () {
        refreshUI();
      }, DELAY.NAVIGATE_UI);
    }
    function highlightRange() {
      isHighlighting = true;
      var $cells = $calendarWrap.find('td');
      $cells.removeClass(ClassName.RANGE_START + ' ' + ClassName.RANGE_END + ' ' + ClassName.RANGE_MID);
      $calendarWrap.toggleClass(ClassName.HAS_RANGE, !!(state.startDate && state.endDate));
      if (!state.startDate) {
        isHighlighting = false;
        return;
      }
      var startTime = toDateOnly(state.startDate);
      var endTime = state.endDate ? toDateOnly(state.endDate) : null;

      // yearview에서는 월 단위로 비교 (셀 data-value가 1일 기준)
      var isYearView = $calendarWrap.find('.k-calendar-yearview').length > 0;
      if (isYearView) {
        startTime = new Date(state.startDate.getFullYear(), state.startDate.getMonth(), 1).getTime();
        if (state.endDate) {
          endTime = new Date(state.endDate.getFullYear(), state.endDate.getMonth(), 1).getTime();
        }
      }
      $cells.each(function () {
        var $cell = $(this);
        var dateValue = $cell.find('.k-link').attr('data-value');
        if (!dateValue) return;
        var parts = dateValue.split('/');
        var cellTime = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)).getTime();
        if (cellTime === startTime) $cell.addClass(ClassName.RANGE_START);
        if (endTime && cellTime === endTime) $cell.addClass(ClassName.RANGE_END);
        if (endTime && cellTime > startTime && cellTime < endTime) $cell.addClass(ClassName.RANGE_MID);
      });
      isHighlighting = false;
    }
    function updateDisplay() {
      var value = '';
      if (state.startDate && state.endDate) {
        value = formatDate(state.startDate, opts.format) + opts.separator + formatDate(state.endDate, opts.format);
      } else if (state.startDate) {
        value = formatDate(state.startDate, opts.format) + opts.separator;
      }
      $display.val(value);
    }
    function updateHiddenInputs() {
      $startInput.val(state.startDate ? formatDate(state.startDate, opts.format) : '');
      $endInput.val(state.endDate ? formatDate(state.endDate, opts.format) : '');
    }
    function openPopup() {
      if ($wrap.hasClass(ClassName.DISABLED)) return;

      // 항상 monthview(날짜)로 이동
      var targetDate = state.startDate || new Date();
      calendar.navigate(targetDate, 'month');
      $popup.addClass(ClassName.OPEN);
      state.isOpen = true;
      lockBodyScroll();
      highlightRange();
      disableMaxDates();
      removeEmptyRows();
      applyPrefixClassToWrapper($wrap, $popup);
      $el.trigger('rangepicker:open');
    }
    function closePopup() {
      if (!state.isOpen) return;

      // 미완료 선택 상태 초기화 (시작일만 선택하고 닫은 경우)
      if (state.isSelectingEnd) {
        state.startDate = null;
        state.isSelectingEnd = false;
        updateDisplay();
        updateHiddenInputs();
        highlightRange();
        updateSelectedState();
      }
      $popup.removeClass(ClassName.OPEN);
      state.isOpen = false;
      unlockBodyScroll();
      $el.trigger('rangepicker:close');
    }
    function togglePopup() {
      if (state.isOpen) {
        closePopup();
      } else {
        openPopup();
      }
    }
    function getPublicValue() {
      return {
        start: state.startDate,
        end: state.endDate,
        startStr: $startInput.val(),
        endStr: $endInput.val()
      };
    }

    // 이벤트 바인딩 — touchend + preventDefault로 ghost click 차단
    var toggleEvent = TOUCH_SUPPORTED ? 'touchend' : 'click';
    var extMoved = false;
    var extTouchStartX = 0;
    function handleToggle(e) {
      e.preventDefault();
      e.stopPropagation();
      togglePopup();
    }
    $display.on(toggleEvent + NS, handleToggle);
    $toggle.on(toggleEvent + NS, handleToggle);

    // 외부 트리거 버튼 — 수평 스크롤 중 touchend 무시
    $(document).on('touchstart' + NS + '_ext_' + elId, extSelector, function (e) {
      extTouchStartX = e.touches[0].clientX;
      extMoved = false;
    });
    $(document).on('touchmove' + NS + '_ext_' + elId, extSelector, function (e) {
      if (Math.abs(e.touches[0].clientX - extTouchStartX) > 5) {
        extMoved = true;
      }
    });
    $(document).on(toggleEvent + NS + '_ext_' + elId, extSelector, function (e) {
      if (extMoved) return;
      handleToggle(e);
    });

    // 팝업 내부 이벤트 전파 차단
    $popup.on(toggleEvent + NS, function (e) {
      e.stopPropagation();
    });

    // iOS 팝업 내부 스크롤 허용
    if (IS_IOS) {
      $popup.on('touchmove' + NS, function (e) {
        e.stopPropagation();
      });
    }

    // 외부 터치/클릭 닫기
    var docCloseEvent = TOUCH_SUPPORTED ? 'touchstart' : 'click';
    $(document).on(docCloseEvent + nsDoc, function (e) {
      if (!state.isOpen || state.isSelectingEnd) return;
      if ($(e.target).closest($wrap).length) return;
      // 외부 트리거 버튼 클릭은 제외
      if ($(e.target).closest(extSelector).length) return;
      closePopup();
    });
    $(document).on('keydown' + nsDoc, function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closePopup();
      }
    });

    // Public API
    var instance = {
      getValue: getPublicValue,
      setValue: function (start, end) {
        state.startDate = start ? parseDateValue(start) : null;
        state.endDate = end ? parseDateValue(end) : null;
        state.isSelectingEnd = false;
        updateDisplay();
        updateHiddenInputs();
        highlightRange();
        updateSelectedState();
        if (calendar && state.startDate) {
          calendar.navigate(state.startDate);
        }
        $el.trigger('rangepicker:change', [getPublicValue()]);
      },
      reset: function () {
        state.startDate = null;
        state.endDate = null;
        state.isSelectingEnd = false;
        $display.val('');
        $startInput.val('');
        $endInput.val('');
        if (calendar) calendar.value(null);
        highlightRange();
        updateSelectedState();
        $el.trigger('rangepicker:reset');
      },
      open: openPopup,
      close: closePopup,
      toggle: togglePopup,
      disable: function () {
        $wrap.addClass(ClassName.DISABLED);
        $display.prop('disabled', true);
        $toggle.prop('disabled', true);
        closePopup();
      },
      enable: function () {
        $wrap.removeClass(ClassName.DISABLED);
        $display.prop('disabled', false);
        $toggle.prop('disabled', false);
      },
      destroy: function () {
        $(document).off(nsDoc);
        $(document).off(NS + '_ext_' + elId);
        $display.off(NS);
        $toggle.off(NS);
        $popup.off(NS);
        if (state.isOpen) unlockBodyScroll();
        if (calendar) calendar.destroy();
        if (uiObserver) uiObserver.disconnect();
        $el.removeData(DATA_KEY);
      }
    };
    $el.data(DATA_KEY, instance);
    updateDisplay();
    highlightRange();
    disableMaxDates();
    removeEmptyRows();
    updateSelectedState();
  }

  // 초기화
  function initOne(el) {
    var $el = $(el);
    if ($el.attr('data-ui') === DATA_UI) {
      initRangePicker(el);
    }
  }
  function initAll(root) {
    if (!ensureKendoAvailable()) {
      console.warn('[' + DATA_UI + '] Kendo UI not available');
      return;
    }
    var $root = root ? $(root) : $(document);
    $root.find(Selector.SCOPE).each(function () {
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
  function getInstance(selector) {
    return $(selector).data(DATA_KEY) || null;
  }

  // 전역 API
  window.VmKendoRangePicker = {
    initAll: initAll,
    initOne: initOne,
    autoBindStart: autoBindStart,
    getInstance: getInstance
  };

  // DOM Ready
  if ($) {
    $(function () {
      autoBindStart();
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.jQuery) autoBindStart();
    });
  }
})(window);

/***/ }),

/***/ 8134:
/***/ (function() {

/**
 * @file scripts-mo/ui/category/category-renderer.js
 * @description 카테고리 depth1/2/3 렌더 공통 모듈
 * @note 바텀시트, 풀팝업 등에서 스코프($scope)를 넘겨 재사용
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  // [26-03-12] data-tree-url 속성으로 대체, loadTree 참고
  // var TREE_URL = '/public/resources/mock/category.json';
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
    viewAll: '[data-view-all]'
  };
  var ESC_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  // 공유 tree 데이터 — 한 번만 fetch
  var _tree = [];
  var _treeLoaded = false;
  var _treeCallbacks = [];
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
  function validChildren(node) {
    if (!node || !Array.isArray(node.categoryList)) return [];
    return node.categoryList.filter(function (c) {
      return c && c.categoryCode;
    });
  }

  // tree 로드 — 캐싱, 중복 요청 방지
  function loadTree(callback) {
    if (_treeLoaded) {
      callback(_tree);
      return;
    }
    _treeCallbacks.push(callback);
    // 첫 번째 요청만 fetch
    if (_treeCallbacks.length > 1) return;

    // [26-03-12] 마크업 data-tree-url 기반으로 변경 — 실서버 mock fetch 방지
    var url = $('[data-category-sheet]').attr('data-tree-url') || '';
    if (!url) {
      _treeLoaded = true;
      for (var i = 0; i < _treeCallbacks.length; i++) {
        _treeCallbacks[i](_tree);
      }
      _treeCallbacks = [];
      return;
    }
    $.getJSON(url).done(function (data) {
      _tree = Array.isArray(data) ? data : data.tree || [];
      _treeLoaded = true;
      for (var i = 0; i < _treeCallbacks.length; i++) {
        _treeCallbacks[i](_tree);
      }
      _treeCallbacks = [];
    }).fail(function () {
      console.warn('[CategoryRenderer] tree 로드 실패');
      _treeCallbacks = [];
    });
  }
  function getTree() {
    return _tree;
  }

  // [26-03-12] 실서버용 — 외부 API 데이터 주입
  function setTree(data) {
    _tree = Array.isArray(data) ? data : data.tree || [];
    _treeLoaded = true;
  }

  // 경로 기준 노드 조회
  function resolvePath(path) {
    var d1 = findNode(_tree, path.depth1Id);
    if (!d1) return {
      d1: null,
      d2: null,
      d3: null
    };
    var d2 = findNode(validChildren(d1), path.depth2Id);
    var d3 = d2 ? findNode(validChildren(d2), path.depth3Id) : null;
    return {
      d1: d1,
      d2: d2,
      d3: d3
    };
  }
  function pathNames(path) {
    var p = resolvePath(path);
    if (!p.d1) return [];
    var names = [p.d1.categoryNm];
    if (p.d2) names.push(p.d2.categoryNm);
    if (p.d3) names.push(p.d3.categoryNm);
    return names;
  }
  function depth4Items(path) {
    var p = resolvePath(path);
    return p.d3 ? validChildren(p.d3) : [];
  }
  function scrollToCenter(panel, item) {
    if (!panel || !item) return;
    var h = panel.clientHeight;
    panel.scrollTop = Math.max(0, item.offsetTop - (h - item.offsetHeight) / 2);
  }

  // 스크롤: 활성 항목 중앙 정렬
  function scrollToActive($scope) {
    requestAnimationFrame(function () {
      var d1Panel = $scope.find(SEL.depth1Panel)[0];
      var d1Target = d1Panel && (d1Panel.querySelector(SEL.depth1Item + '.' + CLS.active) || d1Panel.querySelector(SEL.depth1Item + '.' + CLS.current));
      scrollToCenter(d1Panel, d1Target);
      var subPanel = $scope.find(SEL.subPanel)[0];
      var subTarget = subPanel && (subPanel.querySelector(SEL.depth3Item + '.' + CLS.active) || subPanel.querySelector(SEL.depth2Item + '.' + CLS.active) || subPanel.querySelector(SEL.viewAll + '.' + CLS.active));
      scrollToCenter(subPanel, subTarget);
    });
  }

  // 렌더: depth1 (좌측 패널)
  function renderDepth1($scope, path, browseD1) {
    var $list = $scope.find(SEL.depth1List);
    if (!$list.length || !_tree.length) return;
    var html = [];
    for (var i = 0; i < _tree.length; i++) {
      var node = _tree[i];
      if (!node || !node.categoryCode) continue;
      var code = node.categoryCode;
      var isActive = code === path.depth1Id;
      var isCurrent = code === browseD1;
      html.push('<li class="depth1-item' + (isActive ? ' ' + CLS.active : '') + (isCurrent ? ' ' + CLS.current : '') + '"' + ' data-depth1-item role="option" tabindex="0"' + ' aria-selected="' + isActive + '"' + ' data-code="' + esc(code) + '">' + esc(node.categoryNm) + '</li>');
    }
    $list.html(html.join(''));
    if (browseD1) {
      renderSub($scope, browseD1, path);
    }
  }

  // 렌더: 우측 패널 (전체보기 + depth2/3)
  function renderSub($scope, d1Code, path) {
    var $list = $scope.find(SEL.subList);
    if (!$list.length) return;
    var d1 = findNode(_tree, d1Code);
    if (!d1) {
      $list.empty();
      return;
    }
    var isConfirmed = d1Code === path.depth1Id;
    var isViewAllActive = isConfirmed && !path.depth2Id;
    var d2List = validChildren(d1);
    var html = ['<li class="view-all' + (isViewAllActive ? ' ' + CLS.active : '') + '" data-view-all>' + '<button type="button" class="text">전체보기</button>' + '</li>'];
    for (var i = 0; i < d2List.length; i++) {
      html.push(buildDepth2Html(d2List[i], isConfirmed, path));
    }
    $list.html(html.join(''));
  }
  function buildDepth2Html(d2, isConfirmed, path) {
    var children = validChildren(d2);
    var hasChild = children.length > 0;
    var code = esc(d2.categoryCode);
    var name = esc(d2.categoryNm);
    var d3Id = 'depth3-' + code;
    var hasActiveD3 = false;
    var isOpen = false;
    var isD2Active = false;
    if (isConfirmed) {
      hasActiveD3 = hasChild && path.depth3Id && children.some(function (c) {
        return c.categoryCode === path.depth3Id;
      });
      isOpen = hasActiveD3;
      isD2Active = hasActiveD3 || !path.depth3Id && d2.categoryCode === path.depth2Id;
    }
    var p = [];
    p.push('<li class="depth2-item' + (hasChild ? ' ' + CLS.hasChildren : '') + (isOpen ? ' ' + CLS.open : '') + (isD2Active ? ' ' + CLS.active : '') + '" data-depth2-item data-code="' + code + '">');
    p.push('<div class="depth2-header">');
    p.push('<button type="button" class="text" data-depth2-select>' + name + '</button>');
    if (hasChild) {
      p.push('<button type="button" class="toggle-btn" data-toggle-btn' + ' aria-expanded="' + !!isOpen + '"' + ' aria-controls="' + d3Id + '"' + ' aria-label="' + name + ' 하위 카테고리 펼치기">' + '<i class="ic ic-arrow-right"></i>' + '</button>');
    }
    p.push('</div>');
    if (hasChild) {
      p.push('<ul class="depth3-list" data-depth3-list' + ' id="' + d3Id + '" role="listbox"' + (isOpen ? '' : ' style="display:none"') + '>');
      for (var j = 0; j < children.length; j++) {
        var d3 = children[j];
        var isD3Active = isConfirmed && d3.categoryCode === path.depth3Id;
        p.push('<li class="depth3-item' + (isD3Active ? ' ' + CLS.active : '') + '"' + ' data-depth3-item role="option" tabindex="0"' + ' data-code="' + esc(d3.categoryCode) + '"' + ' data-depth2="' + code + '">' + esc(d3.categoryNm) + '</li>');
      }
      p.push('</ul>');
    }
    p.push('</li>');
    return p.join('');
  }

  // 이벤트 바인딩 — 스코프 내부 클릭 처리 (콜백 방식)
  function bindScopeEvents($scope, state, onCommit) {
    var ns = '.uiCatRenderer' + $scope.attr('id');
    // 중복 바인딩 방지
    $scope.off(ns);

    // depth1 클릭
    $scope.on('click' + ns, SEL.depth1Item, function () {
      var $item = $(this);
      var code = $item.attr('data-code');
      $item.addClass(CLS.current).siblings().removeClass(CLS.current);
      state.browseD1 = code;
      state.path.depth2Id = '';
      state.path.depth3Id = '';
      renderSub($scope, code, state.path);
    });

    // 전체보기
    $scope.on('click' + ns, SEL.viewAll, function () {
      state.path.depth2Id = '';
      state.path.depth3Id = '';
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // depth2 선택
    $scope.on('click' + ns, SEL.depth2Select, function () {
      var $d2 = $(this).closest(SEL.depth2Item);
      state.path.depth2Id = $d2.attr('data-code');
      state.path.depth3Id = '';
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // depth2 토글
    $scope.on('click' + ns, SEL.toggleBtn, function (e) {
      e.stopPropagation();
      var $btn = $(this);
      var $d2 = $btn.closest(SEL.depth2Item);
      var $list = $d2.find(SEL.depth3List);
      var isOpen = $d2.hasClass(CLS.open);
      $d2.toggleClass(CLS.open);
      $btn.attr('aria-expanded', String(!isOpen));
      $list.slideToggle(SLIDE_DURATION);
    });

    // depth3 선택
    $scope.on('click' + ns, SEL.depth3Item, function () {
      var $item = $(this);
      state.path.depth2Id = $item.attr('data-depth2');
      state.path.depth3Id = $item.attr('data-code');
      state.path.depth1Id = state.browseD1;
      if (onCommit) onCommit(state.path);
    });

    // 키보드
    $scope.on('keydown' + ns, SEL.depth1Item + ',' + SEL.depth3Item, function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(e.target).trigger('click');
      }
    });
  }

  // 이벤트 해제
  function unbindScopeEvents($scope) {
    var ns = '.uiCatRenderer' + $scope.attr('id');
    $scope.off(ns);
  }
  window.CategoryRenderer = {
    loadTree: loadTree,
    setTree: setTree,
    // [26-03-12] 실서버용 데이터 주입
    getTree: getTree,
    renderDepth1: renderDepth1,
    renderSub: renderSub,
    scrollToActive: scrollToActive,
    pathNames: pathNames,
    depth4Items: depth4Items,
    bindScopeEvents: bindScopeEvents,
    unbindScopeEvents: unbindScopeEvents,
    SEL: SEL,
    CLS: CLS
  };
})(window.jQuery, window);

/***/ }),

/***/ 8307:
/***/ (function() {

/**
 * @file search-rank.js
 * @description 실시간 검색어 2열 순차 flip 롤링
 * @scope [data-ui="search-rank"]
 * @state .is-flipping — flip 전환 중
 * @option data-rank-interval — 롤링 간격 ms(기본 3000)
 * @note 순차 딜레이는 SCSS nth-child, JS는 마지막 아이템 transitionend로 정리
 * @note JS 셀렉터는 data- 속성 전용 — 클래스 변경에 영향 없음
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var MODULE_KEY = 'searchRank';
  var SCOPE_SEL = '[data-ui="search-rank"]';
  var NS = '.searchRank';
  var SEL = {
    ITEM: '[data-rank-item]',
    FLIP: '[data-rank-flip]',
    CURRENT: '[data-rank-slot="current"]',
    NEXT: '[data-rank-slot="next"]',
    NUM: '[data-rank-num]',
    WORD: '[data-rank-word]',
    MOVE: '[data-rank-move]'
  };
  var MOVE_CLS = 'move-up move-down move-same move-new';
  function toInt(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }
  function calcMove(prev, curr) {
    if (prev === null) return 'new';
    if (prev > curr) return 'up';
    if (prev < curr) return 'down';
    return 'same';
  }

  // DOM에서 현재 데이터 수집
  function readList($scope) {
    var items = [];
    $scope.find(SEL.ITEM).each(function () {
      var $it = $(this);
      var word = ($it.attr('data-word') || '').trim();
      if (!word) return;
      var prev = toInt($it.attr('data-prev-rank'));
      var curr = toInt($it.attr('data-curr-rank'));
      items.push({
        currRank: curr,
        word: word,
        move: calcMove(prev, curr)
      });
    });
    return items;
  }

  // 슬롯에 데이터 반영
  function renderSlot($slot, it) {
    if (!$slot.length || !it) return;
    $slot.find(SEL.NUM).text(it.currRank != null ? it.currRank : '');
    $slot.find(SEL.WORD).text(it.word);
    var $mv = $slot.find(SEL.MOVE);
    $mv.removeClass(MOVE_CLS).addClass('move-' + it.move);
  }

  // 트랜지션 끄고 원위치
  function resetFlip($item) {
    var flip = $item.find(SEL.FLIP)[0];
    if (!flip) return;
    flip.style.transition = 'none';
    $item.removeClass('is-flipping');
    void flip.offsetHeight; // reflow
    flip.style.transition = '';
  }
  function createInstance($scope) {
    var interval = parseInt($scope.attr('data-rank-interval'), 10) || 3000;
    var timer = null;
    var animating = false;
    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      $scope.off(NS);
    }
    function start() {
      stop();
      timer = window.setInterval(tick, interval);
    }

    // flip 완료 처리
    function finalize(newItems) {
      var $items = $scope.find(SEL.ITEM);
      $items.each(function (i) {
        var $row = $(this);

        // current에 새 데이터 복사
        renderSlot($row.find(SEL.CURRENT), newItems[i]);

        // data 속성 갱신(다음 flip 변동 계산용)
        if (newItems[i]) {
          $row.attr('data-curr-rank', newItems[i].currRank);
          $row.attr('data-word', newItems[i].word);
        }
        resetFlip($row);
      });
      animating = false;
    }
    function flip(newItems) {
      if (animating) return;
      animating = true;
      var $items = $scope.find(SEL.ITEM);

      // next 슬롯에 새 데이터 세팅
      $items.each(function (i) {
        renderSlot($(this).find(SEL.NEXT), newItems[i]);
      });

      // flip 트리거
      $items.each(function () {
        $(this).addClass('is-flipping');
      });

      // 마지막 아이템(딜레이 가장 긴)의 transitionend 한 번만 감지
      var $lastInCol = $scope.find('[data-rank-item]:last-child').last();
      $lastInCol.one('transitionend' + NS, function (e) {
        if (e.originalEvent.propertyName !== 'transform') {
          // transform 아닌 이벤트면 다시 한 번 대기
          $lastInCol.one('transitionend' + NS, function () {
            finalize(newItems);
          });
          return;
        }
        finalize(newItems);
      });
    }
    function tick() {
      if (animating) return;
      // 퍼블 확인용 — 실서비스에서는 update()로 대체
      var list = readList($scope);
      if (list.length < 2) return;
      flip(list);
    }

    // 초기 current 슬롯 세팅
    var initialList = readList($scope);
    $scope.find(SEL.ITEM).each(function (i) {
      renderSlot($(this).find(SEL.CURRENT), initialList[i]);
    });
    var touchStartX = 0;
    var touchMoved = false;
    var SCROLL_THRESHOLD = 10;
    $scope.on('touchstart' + NS, SEL.ITEM, function (e) {
      touchStartX = e.originalEvent.touches[0].clientX;
      touchMoved = false;
    }).on('touchmove' + NS, SEL.ITEM, function (e) {
      var dx = Math.abs(e.originalEvent.touches[0].clientX - touchStartX);
      if (dx > SCROLL_THRESHOLD) touchMoved = true;
    }).on('click' + NS, SEL.ITEM, function (e) {
      if (touchMoved) e.preventDefault();
    });
    start();
    return {
      start: start,
      stop: stop,
      update: function (newItems) {
        flip(newItems);
      },
      destroy: function () {
        stop();
        animating = false;
      }
    };
  }
  window.UI.searchRank = {
    init: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        if ($el.data(MODULE_KEY)) return;
        var inst = createInstance($el);
        $el.data(MODULE_KEY, inst);
      });
    },
    destroy: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        var $el = $(this);
        var inst = $el.data(MODULE_KEY);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
        $el.removeData(MODULE_KEY);
      });
    },
    getInstance: function () {
      var $el = $(SCOPE_SEL).first();
      return $el.length ? $el.data(MODULE_KEY) : null;
    }
  };
})(window.jQuery || window.$, window, document);

/***/ }),

/***/ 8486:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/step-flow.js
 * @description 다단계 스텝 화면 이동·상태 관리
 * @scope [data-step]
 * @mapping data-step-nav 헤더 버튼, data-step-page 콘텐츠, data-step-bar 하단 바, data-step-action 액션 버튼
 * @state .is-active — 현재 콘텐츠 페이지
 * @state .is-current — 현재 스텝 버튼
 * @state .is-visited — 방문한 스텝 버튼
 * @state .is-price — 하단 바 가격 노출
 * @option data-step-price {string} 가격 노출 스텝 번호 (쉼표 구분, 예: "3" 또는 "2,3")
 * @option data-step-next {string} 다음 버튼 텍스트
 * @option data-step-done {string} 완료 버튼 텍스트
 * @a11y aria-current="step" 현재 스텝, aria-disabled 미방문 스텝
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiStepFlow';
  var DATA_KEY = 'stepFlow';
  var ROOT = '[data-step]';
  var NAV = '[data-step-nav]';
  var PAGE = '[data-step-page]';
  var BAR = '[data-step-bar]';
  var ACTION = '[data-step-action]';
  var CLS = {
    active: 'is-active',
    current: 'is-current',
    visited: 'is-visited',
    price: 'is-price'
  };
  var DEFAULTS = {
    startStep: 1,
    priceSteps: [],
    nextText: '다음',
    doneText: '완료',
    onBeforeChange: null,
    onChange: null,
    onComplete: null
  };

  // 마크업 data 속성에서 옵션 파싱
  function parseOptions($root) {
    var parsed = {};
    var start = Number($root.attr('data-step'));
    if (start > 0) parsed.startStep = start;
    var price = $root.attr('data-step-prices');
    if (price) {
      parsed.priceSteps = price.split(',').map(Number);
    }
    var next = $root.attr('data-step-next');
    if (next) parsed.nextText = next;
    var done = $root.attr('data-step-done');
    if (done) parsed.doneText = done;
    return parsed;
  }
  function goTo($root, step) {
    var state = $root.data(DATA_KEY);
    if (!state || step < 1 || step > state.total) return;
    var prev = state.current;
    var opt = state.opt;
    if (typeof opt.onBeforeChange === 'function') {
      if (opt.onBeforeChange(step, prev) === false) return;
    }
    state.current = step;
    $root.attr('data-step', step);

    // 페이지 전환
    $root.find(PAGE).removeClass(CLS.active).filter('[data-step-page="' + step + '"]').addClass(CLS.active);

    // 네비게이션 상태
    $root.find(NAV).each(function () {
      var $btn = $(this);
      var n = Number($btn.data('step-nav'));
      $btn.removeClass(CLS.current).removeAttr('aria-current');
      if (n <= step) {
        $btn.addClass(CLS.visited).attr('aria-disabled', 'false');
      } else {
        $btn.removeClass(CLS.visited).attr('aria-disabled', 'true');
      }
      if (n === step) {
        $btn.addClass(CLS.current).attr('aria-current', 'step');
      }
    });

    // 하단 가격 토글
    var hasPrice = opt.priceSteps.indexOf(step) > -1;
    $root.find(BAR).toggleClass(CLS.price, hasPrice);

    // 액션 버튼 텍스트
    var isLast = step >= state.total;
    $root.find(ACTION).find('.text').text(isLast ? opt.doneText : opt.nextText);
    if (typeof opt.onChange === 'function') {
      opt.onChange(step, prev);
    }
  }
  function bind($root) {
    // 헤더 스텝 클릭 — 이전 단계만 허용
    $root.on('click' + NS, NAV, function () {
      var state = $root.data(DATA_KEY);
      var target = Number($(this).data('step-nav'));
      if (target >= state.current) return;
      goTo($root, target);
    });

    // 하단 액션 버튼
    $root.on('click' + NS, ACTION, function () {
      var state = $root.data(DATA_KEY);
      if (state.current >= state.total) {
        if (typeof state.opt.onComplete === 'function') {
          state.opt.onComplete(state.current);
        }
        return;
      }
      goTo($root, state.current + 1);
    });
  }
  function init(scope, options) {
    var $root = $(scope || ROOT);
    if ($root.data(DATA_KEY)) return;

    // data 속성 → options 인자 → DEFAULTS 순 병합
    var opt = $.extend({}, DEFAULTS, parseOptions($root), options);
    var total = $root.find(PAGE).length;
    if (total < 2) return;
    $root.data(DATA_KEY, {
      opt: opt,
      total: total,
      current: 0
    });
    bind($root);
    goTo($root, opt.startStep);
  }
  function destroy(scope) {
    var $root = $(scope || ROOT);
    var state = $root.data(DATA_KEY);
    if (!state) return;
    $root.off(NS).removeData(DATA_KEY).removeAttr('data-step');
    $root.find(NAV).removeClass(CLS.current + ' ' + CLS.visited);
    $root.find(PAGE).removeClass(CLS.active);
    $root.find(BAR).removeClass(CLS.price);
  }
  window.UI.stepFlow = {
    init: init,
    destroy: destroy,
    goTo: function (scope, step) {
      goTo($(scope || ROOT), step);
    },
    getCurrent: function (scope) {
      var state = $(scope || ROOT).data(DATA_KEY);
      return state ? state.current : null;
    }
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

  // 현재 페이지 스크롤 오프셋 반환
  function getScrollOffset() {
    return {
      top: window.pageYOffset || document.documentElement.scrollTop,
      left: window.pageXOffset || document.documentElement.scrollLeft
    };
  }

  // portal list 닫기 (원위치 복귀)
  function closePortal($root) {
    var $list = findPortalList($root);
    if (!$list.length) return;
    $list.removeData(DATA_PORTAL_ORIGIN).removeClass(CLS_PORTAL_LIST).css({
      position: '',
      top: '',
      left: '',
      bottom: '',
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

  // portal 모드 열기 (absolute 기준, 페이지 좌표)
  function openPortal($root) {
    var $trigger = $root.find(TRIGGER);
    var $list = $root.find(LIST);
    if (!$trigger.length || !$list.length) return;
    var rect = $trigger[0].getBoundingClientRect();
    var scroll = getScrollOffset();
    var customMaxH = $root.attr('data-max-height');
    if (customMaxH && /^\d+$/.test(customMaxH)) {
      customMaxH = customMaxH + 'px';
    }

    // body에 absolute로 append, 페이지 좌표 기준
    $list.data(DATA_PORTAL_ORIGIN, $root).addClass(CLS_PORTAL_LIST).css({
      position: 'absolute',
      left: rect.left + scroll.left + 'px',
      minWidth: rect.width + 'px',
      zIndex: Z_INDEX_PORTAL
    }).appendTo('body');

    // 뷰포트 기준 여백 계산 (dropup 판단용)
    var spaceBelow = window.innerHeight - rect.bottom - GUTTER;
    var spaceAbove = rect.top - GUTTER;
    var listH = $list.outerHeight();
    var shouldDropUp = spaceBelow < listH && spaceAbove > spaceBelow;
    var calcMaxH;
    var maxH;
    if (shouldDropUp) {
      calcMaxH = Math.max(spaceAbove, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      // absolute에서 bottom은 body.scrollHeight 기준
      var bodyH = document.body.scrollHeight;
      $list.css({
        top: '',
        bottom: bodyH - (rect.top + scroll.top) + PORTAL_GAP + 'px',
        maxHeight: maxH
      });
      $root.addClass(CLS_DROPUP);
    } else {
      calcMaxH = Math.max(spaceBelow, MIN_H) + 'px';
      maxH = customMaxH || calcMaxH;
      $list.css({
        top: rect.bottom + scroll.top + PORTAL_GAP + 'px',
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

    // 스크롤 감지 — portal이 특정 컨테이너 내부일 때만 닫기 (capture phase)
    document.addEventListener('scroll', function (e) {
      var $scrolled = $(e.target);
      // portal list 내부 스크롤은 무시
      if ($scrolled.closest(LIST).length || $scrolled.hasClass(CLS_PORTAL_LIST)) return;
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          // k-window(모달) 또는 data-scroll-auto-hidden 내부 스크롤이면 닫기
          if (scope.openRoot.closest('.k-window').length || scope.openRoot.closest('[data-scroll-auto-hidden]').length) {
            closeOpenedInScope(k);
          }
        }
      });
    }, true);

    // 리사이즈 — portal 열려있으면 닫기 (뷰포트 변경 시 좌표 틀어짐 방지)
    $(window).on('resize' + NS, function () {
      Object.keys(scopes).forEach(function (k) {
        var scope = scopes[k];
        if (scope && scope.openRoot && isPortal(scope.openRoot)) {
          closeOpenedInScope(k);
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

/***/ 8839:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/expand.js
 * @description data-속성 기반 텍스트 더보기(expand/collapse) (모바일)
 * @scope [data-expand]
 *
 * @mapping [data-expand-text] → 넘침 감지 시 [data-expand-btn] 동적 생성
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @note
 *  - 텍스트가 넘치면 버튼 동적 생성, 넘치지 않으면 버튼 미생성 또는 hidden
 *  - block 요소는 Range API로 텍스트 실제 너비 측정, 그 외는 overflow 해제 후 scrollWidth 측정
 *  - ResizeObserver로 레이아웃 변경 시 넘침 여부 자동 재판별
 *  - destroy 시 동적 생성된 버튼 제거
 *
 * @a11y aria-expanded 제어
 */

(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiExpand';
  var ROOT = '[data-expand]';
  var TEXT = '[data-expand-text]';
  var BTN = '[data-expand-btn]';
  var ACTIVE = 'is-open';
  var _bound = false;
  var _observers = [];
  var _domObserver = null;

  // 버튼 동적 생성
  function createBtn($root) {
    var $btn = $('<button type="button" class="coupon-scope-toggle" data-expand-btn aria-expanded="false">' + '<i class="ic ic-arrow-down"></i>' + '</button>');
    $root.append($btn);
    return $btn;
  }

  // 텍스트 넘침 여부 체크 → 버튼 노출 제어
  function checkOverflow($root) {
    var $text = $root.find(TEXT);
    if (!$text.length) return;

    // 펼친 상태면 체크 생략
    if ($root.hasClass(ACTIVE)) return;
    var el = $text[0];

    // block 요소는 scrollWidth가 clientWidth와 같아지는 한계가 있어 Range로 측정
    var sw, cw;
    if (window.getComputedStyle(el).display === 'block') {
      var maxW = parseFloat(window.getComputedStyle(el).maxWidth);

      // ceil로 올림 — 경계값 소수점 오탐 방지
      cw = maxW && isFinite(maxW) ? Math.ceil(maxW) : el.clientWidth;
      var range = document.createRange();
      range.selectNodeContents(el);
      sw = range.getBoundingClientRect().width;
    } else {
      el.style.setProperty('overflow', 'visible', 'important');
      sw = el.scrollWidth;
      cw = el.clientWidth;
      el.style.removeProperty('overflow');
    }

    // 레이아웃 미계산 상태면 건너뜀
    if (sw === 0 && cw === 0) return;
    var isOverflow = sw > cw;
    var $btn = $root.find(BTN);
    if (isOverflow && !$btn.length) {
      createBtn($root);
    } else if ($btn.length) {
      $btn.prop('hidden', !isOverflow);
    }
  }
  function bind() {
    if (_bound) return;
    _bound = true;

    // 버튼 클릭 (동적 생성 요소 대응 — 이벤트 위임)
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $root = $btn.closest(ROOT);
      if (!$root.length) return;
      var isOpen = $root.hasClass(ACTIVE);
      $root.toggleClass(ACTIVE);
      $btn.attr('aria-expanded', !isOpen ? 'true' : 'false');
    });
  }
  function init() {
    bind();

    // ResizeObserver로 넘침 체크
    $(ROOT).each(function () {
      var $root = $(this);
      var $text = $root.find(TEXT);
      if (!$text.length) return;
      var observer = new ResizeObserver(function () {
        checkOverflow($root);
      });
      observer.observe($text[0]);
      _observers.push(observer);
    });

    // 서버 환경 렌더 지연 대응 — 초기 체크 보강
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $(ROOT).each(function () {
          checkOverflow($(this));
        });
      });
    });

    // 웹폰트 로딩 후 재체크
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        $(ROOT).each(function () {
          checkOverflow($(this));
        });
      });
    }

    // 동적 삽입 대응 — DOM에 나중에 추가되는 [data-expand] 감지
    if (window.MutationObserver) {
      _domObserver = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (!node || node.nodeType !== 1) continue;
            var $targets = $(node).find(TEXT).addBack(TEXT);
            $targets.each(function () {
              var $text = $(this);
              var $root = $text.closest(ROOT);
              if (!$root.length) return;
              if ($text.data('expandObserved')) return;
              $text.data('expandObserved', true);
              var observer = new ResizeObserver(function () {
                checkOverflow($root);
              });
              observer.observe($text[0]);
              _observers.push(observer);
              checkOverflow($root);
            });
          }
        }
      });
      _domObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
  function destroy() {
    $(document).off(NS);
    _observers.forEach(function (observer) {
      observer.disconnect();
    });
    _observers = [];
    if (_domObserver) {
      _domObserver.disconnect();
      _domObserver = null;
    }

    // 동적 생성된 버튼 제거
    $(ROOT).find(BTN).remove();
    $(TEXT).removeData('expandObserved');
    _bound = false;
  }
  window.UI.expand = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 8844:
/***/ (function() {

/**
 * @file scripts-mo/ui/brand/brand-sheet.js
 * @description 브랜드 시트 — 필터 스크롤 + 검색 + 목록 필터링
 * @scope [data-brand-sheet]
 *
 * @state is-active (필터 버튼), is-disabled (화살표)
 * @events inputSearch:submit, inputSearch:clear
 *
 * @note
 *   - 필터 버튼: 전체 / ㄱ~ㅎ / A~Z 한 줄 스크롤
 *   - 화살표: 보이는 영역만큼 스냅 스크롤, 끝에서 is-disabled
 *   - 검색: 2자 이상 입력 후 엔터 → 목록 필터링
 *   - fitButtons: 뷰포트 너비에 맞춰 버튼 너비 역산 → 잘림 방지
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  var NS = '.uiBrandSheet';
  var SCOPE = '[data-brand-sheet]';
  var SEL = {
    filter: '[data-brand-filter]',
    prev: '[data-brand-prev]',
    next: '[data-brand-next]',
    scroll: '[data-brand-scroll]',
    filterBtn: '.brand-filter-btn',
    body: '[data-brand-body]',
    list: '[data-brand-list]',
    item: '[data-brand-item]',
    count: '[data-brand-count]',
    empty: '[data-brand-empty]',
    input: '[data-search-input]'
  };
  var CLS = {
    active: 'is-active',
    disabled: 'is-disabled'
  };
  var GAP = 8;
  var MIN_W = 38;
  var _bound = false;
  var _scrollTimer = null;
  var _btnCache = null;
  function $scope() {
    return $(SCOPE);
  }

  // 버튼 기본 정보 캐싱
  function cacheBtnWidths($root) {
    _btnCache = [];
    $root.find('.brand-filter-list > li').each(function () {
      var $btn = $(this).find(SEL.filterBtn);
      _btnCache.push({
        $btn: $btn,
        li: this,
        baseWidth: $btn.outerWidth()
      });
    });
  }

  // 뷰포트에 맞춰 버튼 너비 역산 — 잘림 방지 핵심
  function fitButtons($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el || !_btnCache || !_btnCache.length) return;
    var viewWidth = el.clientWidth;

    // 뷰포트에 온전히 들어가는 버튼 수
    var fitCount = Math.floor((viewWidth + GAP) / (MIN_W + GAP));
    if (fitCount < 1) fitCount = 1;

    // 역산: fitCount × btnW + (fitCount - 1) × GAP = viewWidth
    var btnW = (viewWidth - (fitCount - 1) * GAP) / fitCount;

    // 모든 버튼에 동일 너비 적용
    for (var i = 0; i < _btnCache.length; i++) {
      _btnCache[i].$btn.css('width', btnW + 'px');
    }

    // 스크롤 이동 계산용 캐싱
    $root.data('fitCount', fitCount);
    $root.data('unitW', btnW + GAP);
  }

  // 화살표 disabled 상태 갱신 (너비 분배 로직 제거 — fitButtons가 담당)
  function updateArrows($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el) return;
    var maxScroll = el.scrollWidth - el.clientWidth;
    $root.find(SEL.prev).toggleClass(CLS.disabled, el.scrollLeft <= 1);
    $root.find(SEL.next).toggleClass(CLS.disabled, el.scrollLeft >= maxScroll - 1);
  }

  // 화살표 클릭 → fitCount 단위 스냅 스크롤
  function scrollFilter($root, direction) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el || !_btnCache || !_btnCache.length) return;
    var fitCount = $root.data('fitCount') || 1;
    var unit = $root.data('unitW') || MIN_W + GAP;
    var scrollLeft = el.scrollLeft;
    var totalBtns = _btnCache.length;

    // 현재 시작 버튼 인덱스 (unit 단위 정렬)
    var currentIdx = Math.round(scrollLeft / unit);
    var targetIdx;
    if (direction === 'next') {
      targetIdx = currentIdx + fitCount;
    } else {
      targetIdx = currentIdx - fitCount;
    }

    // 마지막 그룹 시작 인덱스 = 전체 - 한 화면분
    var lastGroupIdx = totalBtns - fitCount;
    if (lastGroupIdx < 0) lastGroupIdx = 0;

    // 범위 보정
    if (targetIdx > lastGroupIdx) targetIdx = lastGroupIdx;
    if (targetIdx < 0) targetIdx = 0;
    var target = targetIdx * unit;
    $scroll.animate({
      scrollLeft: target
    }, 200, function () {
      updateArrows($root);
    });
  }

  // 자유 스크롤 후 가장 가까운 버튼 경계로 스냅
  function snapScroll($root) {
    var $scroll = $root.find(SEL.scroll);
    var el = $scroll[0];
    if (!el) return;
    var unit = $root.data('unitW') || MIN_W + GAP;
    var scrollLeft = el.scrollLeft;
    var maxScroll = el.scrollWidth - el.clientWidth;

    // 끝에 도달한 경우 스냅하지 않음
    if (scrollLeft <= 1 || scrollLeft >= maxScroll - 1) return;

    // 가장 가까운 unit 배수로 스냅
    var snapped = Math.round(scrollLeft / unit) * unit;
    snapped = Math.max(0, Math.min(snapped, maxScroll));

    // 이미 정렬돼 있으면 무시
    if (Math.abs(scrollLeft - snapped) < 1) return;
    $scroll.animate({
      scrollLeft: snapped
    }, 120, function () {
      updateArrows($root);
    });
  }

  // 초성 추출
  function getChosung(char) {
    var code = char.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return null;
    var list = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    return list[Math.floor(code / 588)];
  }

  // 쌍자음 → 기본 자음
  function normalizeChosung(cho) {
    var map = {
      ㄲ: 'ㄱ',
      ㄸ: 'ㄷ',
      ㅃ: 'ㅂ',
      ㅆ: 'ㅅ',
      ㅉ: 'ㅈ'
    };
    return map[cho] || cho;
  }

  // 브랜드명이 필터 기준에 맞는지 판별
  function matchFilter(text, filter) {
    if (filter === 'all') return true;
    if (!text) return false;
    var first = text.charAt(0);
    if (/[ㄱ-ㅎ]/.test(filter)) {
      if (/[가-힣]/.test(first)) {
        return normalizeChosung(getChosung(first)) === filter;
      }
      return false;
    }
    if (/[A-Z]/.test(filter)) {
      return first.toUpperCase() === filter;
    }
    return false;
  }

  // 브랜드 캐시 생성
  function cacheBrands($root) {
    var items = [];
    $root.find(SEL.item).each(function () {
      var $el = $(this);
      items.push({
        $el: $el,
        text: $.trim($el.text())
      });
    });
    $root.data('brandCache', items);
  }

  // 목록 필터링
  function filterList($root, filter, keyword) {
    var items = $root.data('brandCache');
    if (!items) return;
    var count = 0;
    var kw = keyword ? keyword.toLowerCase() : '';
    items.forEach(function (item) {
      var filterMatch = matchFilter(item.text, filter);
      var kwMatch = !kw || item.text.toLowerCase().indexOf(kw) > -1;
      var show = filterMatch && kwMatch;
      if (show) {
        item.$el.removeClass('is-hidden');
        count++;
      } else {
        item.$el.addClass('is-hidden');
      }
    });
    $root.find(SEL.count).text(count);
    var $empty = $root.find(SEL.empty);
    var $list = $root.find(SEL.list);
    if (count === 0) {
      $list.addClass('is-hidden');
      $empty.removeClass('is-hidden');
    } else {
      $list.removeClass('is-hidden');
      $empty.addClass('is-hidden');
    }

    // 목록 스크롤 최상위로
    var $body = $root.find(SEL.body);
    if ($body[0]) $body[0].scrollTop = 0;
  }

  // 현재 활성 필터값
  function activeFilter($root) {
    return $root.find(SEL.filterBtn + '.' + CLS.active).data('filter') || 'all';
  }
  function bindEvents() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 화살표 클릭
    $doc.on('click' + NS, SEL.prev, function () {
      scrollFilter($(this).closest(SCOPE), 'prev');
    });
    $doc.on('click' + NS, SEL.next, function () {
      scrollFilter($(this).closest(SCOPE), 'next');
    });

    // 스크롤 끝나면 버튼 경계로 스냅
    $(SCOPE).find(SEL.scroll).on('scroll' + NS, function () {
      var $el = $(this);
      var $root = $el.closest(SCOPE);
      updateArrows($root);

      // 스크롤 멈춤 감지 → 스냅 정렬
      clearTimeout(_scrollTimer);
      _scrollTimer = setTimeout(function () {
        snapScroll($root);
      }, 150);
    });

    // 필터 버튼 클릭
    $doc.on('click' + NS, SEL.filterBtn, function () {
      var $btn = $(this);
      var $root = $btn.closest(SCOPE);
      var filter = $btn.data('filter');
      $root.find(SEL.filterBtn).removeClass(CLS.active).attr({
        'aria-selected': 'false',
        tabindex: '-1'
      });
      $btn.addClass(CLS.active).attr({
        'aria-selected': 'true',
        tabindex: '0'
      });

      // 숨긴 필터 버튼 + 화살표 복원
      $root.find('.brand-filter-list > li').removeClass('is-hidden');
      $root.find(SEL.prev).removeClass('is-hidden');
      $root.find(SEL.next).removeClass('is-hidden');

      // 버튼 너비 재계산 + 화살표 상태 갱신
      fitButtons($root);
      updateArrows($root);
      filterList($root, filter, '');
      if (window.UI && window.UI.inputSearch) {
        window.UI.inputSearch.clear($root);
      }
    });

    // 검색 실행 — 전체만 보이고 나머지 필터 숨김
    $doc.on('inputSearch:submit' + NS, SEL.input, function (e, data) {
      var $root = $(this).closest(SCOPE);

      // 필터 전체로 전환
      $root.find(SEL.filterBtn).removeClass(CLS.active).attr({
        'aria-selected': 'false',
        tabindex: '-1'
      });
      $root.find(SEL.filterBtn + '[data-filter="all"]').addClass(CLS.active).attr({
        'aria-selected': 'true',
        tabindex: '0'
      });

      // 전체 외 필터 버튼 숨김 + 화살표 숨김
      $root.find('.brand-filter-list > li').each(function () {
        var $btn = $(this).find(SEL.filterBtn);
        if ($btn.data('filter') !== 'all') {
          $(this).addClass('is-hidden');
        }
      });
      $root.find(SEL.prev).addClass('is-hidden');
      $root.find(SEL.next).addClass('is-hidden');

      // 스크롤 초기화
      var $scroll = $root.find(SEL.scroll);
      if ($scroll[0]) $scroll[0].scrollLeft = 0;
      filterList($root, 'all', data.query);
    });

    // 검색 초기화 — 필터 메뉴 전부 복원
    $doc.on('inputSearch:clear' + NS, SEL.input, function () {
      var $root = $(this).closest(SCOPE);

      // 숨긴 필터 버튼 + 화살표 복원
      $root.find('.brand-filter-list > li').removeClass('is-hidden');
      $root.find(SEL.prev).removeClass('is-hidden');
      $root.find(SEL.next).removeClass('is-hidden');

      // 버튼 너비 재계산 + 화살표 상태 갱신
      fitButtons($root);
      updateArrows($root);
      filterList($root, activeFilter($root), '');
    });

    // 브랜드 탭 활성화 시 fitButtons + 화살표 갱신
    $doc.on('tab:change' + NS, function (e, data) {
      if (data === 'brandTab') {
        var $root = $scope();
        if (!$root.length) return;
        if (!_btnCache || !_btnCache.length) {
          cacheBtnWidths($root);
        }
        fitButtons($root);
        updateArrows($root);

        // 텍스트가 채워져 있으면 즉시 캐시 갱신 + 필터
        var hasText = $root.find(SEL.item).filter(function () {
          return $.trim($(this).text());
        }).length > 0;
        if (hasText) {
          cacheBrands($root);
          filterList($root, activeFilter($root), '');
          return;
        }

        // 비동기 텍스트 주입 대응 — DOM 변경 감지 후 캐시 갱신
        var list = $root.find(SEL.list)[0];
        if (!list) return;
        var observer = new MutationObserver(function () {
          var filled = $root.find(SEL.item).filter(function () {
            return $.trim($(this).text());
          }).length > 0;
          if (filled) {
            observer.disconnect();
            cacheBrands($root);
            filterList($root, activeFilter($root), '');
          }
        });
        observer.observe(list, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    });
  }

  // init에 cacheBtnWidths + fitButtons + updateArrows 추가
  function init() {
    var $root = $scope();
    if (!$root.length) return;
    cacheBrands($root);
    cacheBtnWidths($root);
    fitButtons($root);
    bindEvents();
    updateArrows($root);

    // 초기 필터 적용 — 텍스트 유무에 따라 즉시 or 대기
    var hasText = $root.find(SEL.item).filter(function () {
      return $.trim($(this).text());
    }).length > 0;
    if (hasText) {
      filterList($root, activeFilter($root), '');
    } else {
      var list = $root.find(SEL.list)[0];
      if (list) {
        var observer = new MutationObserver(function () {
          var filled = $root.find(SEL.item).filter(function () {
            return $.trim($(this).text());
          }).length > 0;
          if (filled) {
            observer.disconnect();
            cacheBrands($root);
            filterList($root, activeFilter($root), '');
          }
        });
        observer.observe(list, {
          childList: true,
          subtree: true,
          characterData: true
        });
      }
    }
  }
  function destroy() {
    $(document).off(NS);
    clearTimeout(_scrollTimer);
    _scrollTimer = null;
    var $root = $scope();
    if ($root.length) {
      $root.removeData('brandCache');
      $root.removeData('fitCount');
      $root.removeData('unitW');
    }
    _bound = false;
    _btnCache = null;
  }
  window.brandSheet = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);

/***/ }),

/***/ 8955:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/toggle.js
 * @description data-속성 기반 토글/아코디언 공통 (모바일)
 * @scope [data-toggle-scope]
 *
 * @mapping [data-toggle-btn][data-toggle-target] ↔ [data-toggle-box="target"]
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @option
 *  - data-toggle-group="true"   : 스코프 내 1개만 오픈 (아코디언)
 *  - data-toggle-outside="true" : 스코프 외 클릭/터치 시 닫기
 *  - data-toggle-group-except="true" : 그룹 닫기에서 제외
 *  - data-aria-label-base="..." : aria-label "열기/닫기" 자동 동기화
 *
 * @a11y aria-expanded 제어, aria-label-base 옵션 시 열기/닫기 라벨 동기화
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiToggle';
  var ACTIVE = 'is-open';
  var GROUP_EXCEPT_KEY = 'toggleGroupExceptActive';
  var OUTSIDE_ACTIVE_KEY = 'toggleOutsideActive';
  var _bound = false;

  // aria-label 동기화
  function syncAriaLabel($btn) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;
    var isExpanded = $btn.attr('aria-expanded') === 'true';
    $btn.attr('aria-label', base + ' ' + (isExpanded ? '닫기' : '열기'));
  }
  function open($btn, $box) {
    var shouldCloseOnOutside = $btn.data('toggleOutside') === true;
    var isGroupExcept = $btn.data('toggleGroupExcept') === true;
    $box.addClass(ACTIVE);
    $box.data(OUTSIDE_ACTIVE_KEY, shouldCloseOnOutside);
    $box.data(GROUP_EXCEPT_KEY, isGroupExcept);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn);
  }
  function close($btn, $box) {
    $box.removeClass(ACTIVE);
    $box.removeData(OUTSIDE_ACTIVE_KEY);
    $box.removeData(GROUP_EXCEPT_KEY);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn);
  }

  // 스코프 내 열린 패널 일괄 닫기
  function closeAll($scope) {
    $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
      var $box = $(this);
      if ($box.data(GROUP_EXCEPT_KEY) === true) return;
      $box.removeClass(ACTIVE);
      $box.removeData(OUTSIDE_ACTIVE_KEY);
      $box.removeData(GROUP_EXCEPT_KEY);
    });
    $scope.find('[data-toggle-btn][aria-expanded="true"]').each(function () {
      var $btn = $(this);
      var target = $btn.data('toggleTarget');
      if (!target) return;
      var $box = $scope.find('[data-toggle-box="' + target + '"]');
      if ($box.length && $box.hasClass(ACTIVE) && $box.data(GROUP_EXCEPT_KEY) === true) return;
      $btn.attr('aria-expanded', 'false');
      syncAriaLabel($btn);
    });
  }
  function bind() {
    if (_bound) return;
    _bound = true;
    var $doc = $(document);

    // 버튼 클릭 위임
    $doc.on('click' + NS, '[data-toggle-btn]', function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $scope = $btn.closest('[data-toggle-scope]');
      if (!$scope.length) return;
      var target = $btn.data('toggleTarget');
      if (!target) return;

      // aria-expanded 누락 방어
      if (!$btn.attr('aria-expanded')) {
        var $initBox = $scope.find('[data-toggle-box="' + target + '"]');
        $btn.attr('aria-expanded', $initBox.hasClass(ACTIVE) ? 'true' : 'false');
        syncAriaLabel($btn);
      }
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

    // 외부 클릭/터치 시 outside=true 패널 닫기
    $doc.on('mousedown' + NS + ' touchstart' + NS, function (e) {
      $('[data-toggle-scope]').each(function () {
        var $scope = $(this);
        if ($(e.target).closest($scope).length) return;
        $scope.find('[data-toggle-box].' + ACTIVE).each(function () {
          var $box = $(this);
          if ($box.data(OUTSIDE_ACTIVE_KEY) !== true) return;
          var target = $box.attr('data-toggle-box');
          var $btn = $scope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();
          if (!$btn.length) return;
          close($btn, $box);
        });
      });
    });
  }
  function init() {
    // aria-expanded 누락 버튼 일괄 보충
    $('[data-toggle-scope]').each(function () {
      var $scope = $(this);
      $scope.find('[data-toggle-btn]:not([aria-expanded])').each(function () {
        var $btn = $(this);
        var target = $btn.data('toggleTarget');
        if (!target) return;
        var $box = $scope.find('[data-toggle-box="' + target + '"]');
        $btn.attr('aria-expanded', $box.hasClass(ACTIVE) ? 'true' : 'false');
        syncAriaLabel($btn);
      });
    });
    bind();
  }
  function destroy() {
    $(document).off(NS);
    _bound = false;
  }
  window.UI.toggle = {
    init: init,
    destroy: destroy,
    closeAll: closeAll
  };
})(window.jQuery, window);

/***/ }),

/***/ 9098:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/chip-button.js
 * @description 칩 버튼 제거(삭제) 공통: data-속성 기반
 * @scope .vits-chip-button-group
 *
 * @mapping
 *  [data-chip-action="remove"] → 해당 칩(.vits-chip-button) DOM 제거
 *  [data-chip-clear]           → 스코프([data-chip-clear-scope]) 내 칩 전체 제거
 *
 * @events
 *  ui:chip-remove     (document) — 칩 삭제 시 발행 { value, chipEl, groupEl }
 *  ui:chip-remove-all (document) — 전체 삭제 시 발행 { groupEl }
 *
 * @a11y
 *  - X 버튼은 aria-label로 "… 삭제" 제공(마크업에서 처리)
 *
 * @note
 *  - 이벤트 위임 방식으로 동적 렌더에도 대응
 *  - 표현/상태는 CSS에서 처리, JS는 삭제 동작만 담당
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiChipButton';
  var GROUP_SEL = '.vits-chip-button-group';
  var CHIP_SEL = '.vits-chip-button';
  var REMOVE_SEL = '[data-chip-action="remove"]';
  var CLEAR_SEL = '[data-chip-clear]';
  var SCOPE_SEL = '[data-chip-clear-scope]';
  var _bound = false;
  var _observers = [];

  // 칩 제거 → DOM 삭제 + 커스텀 이벤트 발행
  function removeChip($chip) {
    if (!$chip || !$chip.length) return;
    var value = $chip.attr('data-chip-value') || '';
    var chipEl = $chip[0];
    var $group = $chip.closest(GROUP_SEL);
    var groupEl = $group.length ? $group[0] : null;
    $chip.remove();

    // 스코프 내 남은 칩 없으면 전체삭제 버튼 숨김
    var $scope = $(groupEl).closest(SCOPE_SEL);
    if ($scope.length && !$scope.find(CHIP_SEL).length) {
      $scope.find(CLEAR_SEL).addClass('is-hidden');
    }
    $(document).trigger('ui:chip-remove', {
      value: value,
      chipEl: chipEl,
      groupEl: groupEl
    });
  }

  // 전체 삭제 → 스코프 내 칩 일괄 제거 + 커스텀 이벤트 발행
  function removeAll($scope) {
    if (!$scope || !$scope.length) return;
    var $group = $scope.find(GROUP_SEL);
    var groupEl = $group.length ? $group[0] : null;
    $scope.find(CHIP_SEL).remove();

    // 전체삭제 후 버튼 숨김
    $scope.find(CLEAR_SEL).addClass('is-hidden');
    $(document).trigger('ui:chip-remove-all', {
      groupEl: groupEl
    });
  }
  function bind() {
    if (_bound) return;
    _bound = true;

    // 이벤트 위임: 그룹 내 remove 버튼 클릭(터치) 처리
    $(document).on('click' + NS, GROUP_SEL + ' ' + REMOVE_SEL, function (e) {
      e.preventDefault();
      var $chip = $(this).closest(CHIP_SEL);
      removeChip($chip);
    });

    // 칩 추가/제거 감지 → 전체삭제 버튼 상태 갱신
    $(SCOPE_SEL).each(function (_, el) {
      var $scope = $(el);
      var groupEl = $scope.find(GROUP_SEL)[0];
      if (!groupEl) return;
      var ob = new MutationObserver(function () {
        var hasChip = $scope.find(CHIP_SEL).length > 0;
        $scope.find(CLEAR_SEL).toggleClass('is-hidden', !hasChip);
      });
      ob.observe(groupEl, {
        childList: true
      });
      _observers.push(ob);
    });

    // 전체삭제: 가장 가까운 부모 스코프 내 칩 전체 제거
    $(document).on('click' + NS, CLEAR_SEL, function (e) {
      e.preventDefault();
      var $scope = $(this).closest(SCOPE_SEL);
      if (!$scope.length) $scope = $(this).parent();
      removeAll($scope);
    });
  }
  function init() {
    bind();
  }
  function destroy() {
    $(document).off(NS);
    _bound = false;
  }
  window.UI.chipButton = {
    init: init,
    destroy: destroy,
    // 외부에서 칩 추가 후 전체삭제 버튼 상태 갱신
    updateClearBtn: function ($scope) {
      if (!$scope || !$scope.length) return;
      var hasChip = $scope.find(CHIP_SEL).length > 0;
      $scope.find(CLEAR_SEL).toggleClass('is-hidden', !hasChip);
    }
  };
})(window.jQuery, window);

/***/ }),

/***/ 9212:
/***/ (function() {

/**
 * @file scripts-mo/ui/common/collapse.js
 * @description data-속성 기반 더보기/접기 공통 (모바일)
 * @scope [data-collapse]
 *
 * @mapping [data-collapse-btn] ↔ [data-collapse-content]
 * @state is-open 클래스 + aria-expanded 값으로 제어
 *
 * @option
 *  - data-visible-count="N"       : N개까지만 노출 (개수 기반, dt+dd 쌍 대응)
 *  - data-visible-height="N"      : Npx까지만 노출 (높이 기반, 인라인 스타일)
 *  - data-visible-hidden           : 콘텐츠 전체 숨김 → 버튼으로 노출 (CSS 트랜지션)
 *  - data-aria-label-base="..."   : aria-label 접두어 (예: "혜택")
 *  - data-aria-label-pair="A,B"   : 닫힘/열림 라벨 (기본: "열기,닫기")
 *
 * @a11y aria-expanded 제어, aria-label 상태별 동기화
 *
 * @note
 *  - 콘텐츠가 기준 이하면 버튼 자동 숨김 (hidden)
 *  - 개수 모드: is-hidden 클래스로 개별 아이템 숨김
 *  - 높이 모드: data 속성값 기반 인라인 max-height 제어
 *  - 숨김 모드: is-open 클래스만 토글, CSS 트랜지션 전담 (_collapse.scss)
 */
(function ($, window) {
  'use strict';

  if (!$) return;
  window.UI = window.UI || {};
  var NS = '.uiCollapse';
  var ROOT = '[data-collapse]';
  var CONTENT = '[data-collapse-content]';
  var BTN = '[data-collapse-btn]';
  var ACTIVE = 'is-open';
  var HIDDEN = 'is-hidden';
  var DEFAULT_PAIR = '열기,닫기';
  var _bound = false;

  // 모드 판별
  function getMode($content) {
    if ($content.is('[data-visible-count]')) return 'count';
    if ($content.is('[data-visible-height]')) return 'height';
    if ($content.is('[data-visible-hidden]')) return 'hidden';
    return null;
  }

  // 개수 기반: 자식 아이템 조회 (dt+dd 쌍 대응)
  function getCountItems($content) {
    var hasDt = $content.children('dt').length > 0;
    return {
      $items: hasDt ? $content.children('dt') : $content.children(),
      hasDt: hasDt
    };
  }

  // aria-label 동기화
  function syncAriaLabel($btn, isOpen) {
    var base = $btn.attr('data-aria-label-base');
    if (!base) return;
    var pairStr = $btn.attr('data-aria-label-pair') || DEFAULT_PAIR;
    var pair = pairStr.split(',').map(function (s) {
      return s.trim();
    });
    $btn.attr('aria-label', base + ' ' + (isOpen ? pair[1] : pair[0]));
  }

  // 개수 기반: N번째 이후 아이템 is-hidden 토글
  function applyCount($content, isOpen) {
    var count = parseInt($content.data('visibleCount'), 10);
    var result = getCountItems($content);
    result.$items.each(function (i) {
      if (i < count) return;
      var $item = $(this);
      var $pair = result.hasDt ? $item.add($item.next('dd')) : $item;
      $pair.toggleClass(HIDDEN, !isOpen);
    });
  }

  // 높이 기반: data 속성값으로 max-height 제어
  function applyHeight($content, isOpen) {
    if (isOpen) {
      $content.css({
        maxHeight: 'none',
        overflow: 'visible'
      });
    } else {
      $content.css({
        maxHeight: $content.data('visibleHeight'),
        overflow: 'hidden'
      });
    }
  }
  function open($btn, $content, $root) {
    var mode = getMode($content);
    $root.addClass(ACTIVE);
    $btn.attr('aria-expanded', 'true');
    syncAriaLabel($btn, true);
    if (mode === 'count') applyCount($content, true);else if (mode === 'height') applyHeight($content, true);
    // hidden 모드는 is-open 클래스만으로 CSS가 트랜지션 처리
  }
  function close($btn, $content, $root) {
    var mode = getMode($content);
    $root.removeClass(ACTIVE);
    $btn.attr('aria-expanded', 'false');
    syncAriaLabel($btn, false);
    if (mode === 'count') applyCount($content, false);else if (mode === 'height') applyHeight($content, false);
  }

  // 높이 모드 버튼 판별 (이미지 로드 완료 후 scrollHeight 재측정)
  function checkHeightNeedBtn($content, $btn) {
    var visibleH = parseInt($content.data('visibleHeight'), 10);
    function evaluate() {
      // 팝업 등 비가시 영역은 scrollHeight가 0 → 버튼 숨기지 않음
      if ($content[0].scrollHeight === 0) return;
      $btn.prop('hidden', $content[0].scrollHeight <= visibleH);
    }
    var $imgs = $content.find('img');
    var total = $imgs.length;

    // 이미지 없으면 즉시 판별
    if (!total) {
      evaluate();
      return;
    }
    var loaded = 0;
    function onLoad() {
      loaded++;
      if (loaded >= total) evaluate();
    }
    $imgs.each(function () {
      if (this.complete) {
        onLoad();
      } else {
        $(this).one('load error', onLoad);
      }
    });
  }

  // 콘텐츠가 기준 이하면 버튼 숨김
  function checkNeedBtn($content, $btn) {
    var mode = getMode($content);
    if (mode === 'count') {
      var result = getCountItems($content);
      var count = parseInt($content.data('visibleCount'), 10);
      $btn.prop('hidden', result.$items.length <= count);
    } else if (mode === 'height') {
      checkHeightNeedBtn($content, $btn);
    }
    // hidden 모드는 항상 버튼 필요
  }

  // 초기 상태 세팅
  function setupAll() {
    $(ROOT).each(function () {
      var $root = $(this);
      var $content = $root.find(CONTENT);
      var $btn = $root.find(BTN);
      if (!$content.length || !$btn.length) return;
      var mode = getMode($content);
      if (!mode) return;

      // 초기 aria-expanded 명시
      $btn.attr('aria-expanded', 'false');

      // 접힌 초기 상태 적용
      if (mode === 'count') applyCount($content, false);else if (mode === 'height') applyHeight($content, false);
      // hidden 모드는 CSS 기본 상태가 접힌 상태

      syncAriaLabel($btn, false);
      checkNeedBtn($content, $btn);
    });
  }
  function bind() {
    if (_bound) return;
    _bound = true;
    $(document).on('click' + NS, BTN, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $root = $btn.closest(ROOT);
      if (!$root.length) return;
      var $content = $root.find(CONTENT);
      if (!$content.length) return;
      var isOpen = $root.hasClass(ACTIVE);
      if (isOpen) {
        close($btn, $content, $root);
      } else {
        open($btn, $content, $root);
      }
    });
  }
  function init() {
    setupAll();
    bind();
  }
  function destroy() {
    $(document).off(NS);
    _bound = false;

    // 상태 복원
    $(CONTENT).each(function () {
      $(this).removeAttr('style').children().removeClass(HIDDEN);
    });
    $(ROOT).removeClass(ACTIVE);
  }

  // 외부에서 가시 상태 변경 후 재판별 호출용
  function refresh($scope) {
    var $target = $scope ? $($scope).find(ROOT) : $(ROOT);
    $target.each(function () {
      var $root = $(this);
      var $content = $root.find(CONTENT);
      var $btn = $root.find(BTN);
      if (!$content.length || !$btn.length) return;
      checkNeedBtn($content, $btn);
    });
  }
  window.UI.collapse = {
    init: init,
    destroy: destroy,
    refresh: refresh
  };
})(window.jQuery, window);

/***/ }),

/***/ 9459:
/***/ (function() {

/**
 * @file scripts-mo/ui/cart-order/cart.js
 * @description 장바구니 관련 UI 기능
 */

(function ($, window) {
  'use strict';

  if (!$) {
    return;
  }
  window.UI = window.UI || {};
  var EVENT_NS = '.uiCartQuantityStepper';
  var ROOT_SEL = '.quantity-control';
  var INPUT_SEL = '.quantity-input';
  var MEASURE_SEL = '.quantity-input-measure';
  var BTN_MINUS_SEL = '.btn-step.vits-minus-icon';
  var BTN_PLUS_SEL = '.btn-step.vits-plus-icon';
  var INIT_KEY = 'uiCartQuantityStepperInit';
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
    // 이미 초기화되었거나 다른 스크립트(quantity-stepper)로 초기화된 경우 건너뛰기
    if ($root.data(INIT_KEY) || $root.data('uiQuantityStepperInit')) return;
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
        // 이 스크립트로 초기화된 요소만 처리
        if (!$root.data(INIT_KEY)) return;
        var $input = $root.find(INPUT_SEL);
        var $measure = $root.find(MEASURE_SEL);
        if (!$input.length) return;
        syncMeasureFont($input, $measure);
        resizeInput($input, $measure, getOptions($input).minW);
      });
    });
  }
  window.UI.cart = {
    init: function (root) {
      var $scope = root ? $(root) : $(document);
      $scope.find(ROOT_SEL).each(function () {
        var $root = $(this);
        // 기존 quantity-stepper로 초기화되지 않은 요소만 처리
        if (!$root.data('uiQuantityStepperInit')) {
          bindRoot($root);
        }
      });
      bindResize();
    }
  };
})(window.jQuery, window);

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
    if (!$content.attr('aria-hidden')) {
      $content.attr('aria-hidden', $content.hasClass(ACTIVE) ? 'false' : 'true');
    }
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
/******/ 			152: 0,
/******/ 			817: 0,
/******/ 			133: 0,
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
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [96,152,817,133,486,766,979], function() { return __webpack_require__(4627); })
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;