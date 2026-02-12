/**
 * @file scripts/ui/kendo/kendo-datepicker-single.js
 * @description 단일 DatePicker 초기화 모듈 (모바일 최적화)
 * @scope .vits-datepicker-single [data-ui="kendo-datepicker"]
 * @mapping js-kendo-datepicker(입력), vits-datepicker-single(래퍼)
 * @state is-selected: 날짜 선택 완료
 * @option format, culture, min, max, open, popupAlign (data-opt JSON, data-open)
 * @a11y k-state-disabled + aria-disabled로 이전 달 네비게이션 차단
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
      return JSON.parse(
        str
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
      );
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
        var $headerLink = $wrap
          .find(
            '.k-nav-fast, .k-calendar-header .k-link, .k-header .k-link, .k-calendar-header .k-title, .k-header .k-title'
          )
          .first();

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

        addTimeout(
          setTimeout(function () {
            observer.observe(target, {
              childList: true,
              subtree: true,
              characterData: true
            });
            isUpdatingUI = false;
          }, MOBILE_TIMEOUT_DELAY)
        );
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
        cal.setOptions({animation: false});
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

    if (!opts.min) {
      var today = new Date();
      opts.min = new Date(today.getFullYear(), today.getMonth(), 1);
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
          inst.popup.setOptions({animation: false});
        } catch {
          // no-op
        }
      }

      inst.bind('open', function () {
        disableCalendarAnimation();

        // 팝업 렌더링 전 숨김 — 위치·텍스트 보정 중 깜빡임 방지
        var $wrap = resolveCalendarWrap();
        var $container = $wrap ? $wrap.closest('.k-animation-container') : null;
        if ($container && $container.length) {
          $container[0].style.setProperty('visibility', 'hidden');
        }

        addTimeout(
          setTimeout(function () {
            adjustPopupBounds();
            ensureDayNameObserver();
            applyDayNamesImmediate();
            applyHeaderMonthImmediate();
            applyYearViewMonthNamesImmediate();
            updatePrevNavState();

            // 모든 DOM 조작 완료 후 보이기
            if ($container && $container.length) {
              $container[0].style.removeProperty('visibility');
            }
          }, MOBILE_TIMEOUT_DELAY)
        );
      });

      inst.bind('change', function () {
        updateSelectedState();
      });

      inst.bind('destroy', function () {
        destroyCleanup();
      });

      updateSelectedState();
    }

    // 모바일에서 자동 열기 — 렌더링 안정화 후 실행
    if (parseBool($el.attr('data-open')) && inst) {
      addTimeout(
        setTimeout(function () {
          inst.open();
        }, MOBILE_TIMEOUT_DELAY)
      );
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

            var els = node.querySelectorAll
              ? node.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]')
              : [];

            for (var k = 0; k < els.length; k++) {
              initDatePicker(els[k]);
            }
          }
        }
      });

      obs.observe(target, {childList: true, subtree: true});
      return obs;
    },
    getInstance: function (selector) {
      return window.jQuery(selector).data('kendoDatePicker') || null;
    }
  };
})(window);
