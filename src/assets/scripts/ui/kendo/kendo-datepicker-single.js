/**
 * @file scripts/ui/kendo/kendo-datepicker-single.js
 * @description
 * 단일 DatePicker 초기화 모듈
 * - 월 이동 애니메이션 제거
 * - 요일명(Sun~Sat) 완전 고정 (왕복 이동 포함)
 * - disablePast 옵션: 오늘 이전 날짜 선택 불가 (월 이동·Observer 재렌더 시에도 유지)
 * - ESLint no-unused-vars 완전 대응
 */

(function (window) {
  'use strict';

  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var YEARVIEW_MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

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

  function initDatePicker(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDatePicker')) return;

    var opts = parseJsonSafe($el.attr('data-opt') || '{}') || {};
    var $calendarWrap = null;
    var $wrapper = $el.closest('[data-ui="kendo-datepicker-single"]');

    // disablePast 활성 시 할당 — Observer 콜백에서도 참조
    var applyPastDisabledStyle = null;

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

    var dayNameObserver = null;
    var dayNameObserverTarget = null;
    var dayNameApplyScheduled = false;
    var headerMonthApplyScheduled = false;
    var yearViewMonthApplyScheduled = false;

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
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;

      $wrap.find('th').each(function (i) {
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
    }

    function scheduleDayNameApply() {
      if (dayNameApplyScheduled) return;
      dayNameApplyScheduled = true;
      window.requestAnimationFrame(function () {
        dayNameApplyScheduled = false;
        applyDayNamesImmediate();
      });
    }

    function applyHeaderMonthImmediate() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;

      var cal = getCalendar();
      var current = cal && typeof cal.current === 'function' ? cal.current() : null;
      var parts = formatHeaderMonthParts(current);
      if (!parts) return;
      var nextText = parts.year + '.' + parts.month;

      var $header = $wrap.find('.k-header, .k-calendar-header').first();
      var $headerLink = $wrap
        .find(
          '.k-nav-fast, .k-calendar-header .k-link, .k-header .k-link, .k-calendar-header .k-title, .k-header .k-title'
        )
        .first();

      if (!$headerLink.length && $header.length) $headerLink = $header;
      if (!$headerLink.length) return;

      var $buttonText = $headerLink.find('.k-button-text').first();
      var useDot = $header.hasClass('k-hstack');
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
    }

    function scheduleHeaderMonthApply() {
      if (headerMonthApplyScheduled) return;
      headerMonthApplyScheduled = true;
      window.requestAnimationFrame(function () {
        headerMonthApplyScheduled = false;
        applyHeaderMonthImmediate();
      });
    }

    function applyYearViewMonthNamesImmediate() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap) return;

      var $yearView = $wrap.find('.k-calendar-yearview').first();
      if (!$yearView.length) return;

      var $monthLinks = $yearView.find('td .k-link');
      if (!$monthLinks.length) return;

      $monthLinks.each(function (i) {
        var nextText = YEARVIEW_MONTH_NAMES[i];
        if (!nextText) return;

        var $link = window.jQuery(this);
        if ($link.text() !== nextText) $link.text(nextText);
      });
    }

    function scheduleYearViewMonthApply() {
      if (yearViewMonthApplyScheduled) return;
      yearViewMonthApplyScheduled = true;
      window.requestAnimationFrame(function () {
        yearViewMonthApplyScheduled = false;
        applyYearViewMonthNamesImmediate();
      });
    }

    // Calendar DOM 재렌더링 후 요일명 재적용
    function forceApplyDayNames() {
      scheduleDayNameApply();
      window.setTimeout(scheduleDayNameApply, 0);
    }

    function forceApplyHeaderMonth() {
      scheduleHeaderMonthApply();
      window.setTimeout(scheduleHeaderMonthApply, 0);
    }

    function forceApplyYearViewMonthNames() {
      scheduleYearViewMonthApply();
      window.setTimeout(scheduleYearViewMonthApply, 0);
    }

    function ensureDayNameObserver() {
      var $wrap = resolveCalendarWrap();
      if (!$wrap || !window.MutationObserver) return;

      var target = $wrap[0];
      if (dayNameObserver && dayNameObserverTarget === target) return;

      if (dayNameObserver) {
        dayNameObserver.disconnect();
      }

      dayNameObserverTarget = target;
      dayNameObserver = new window.MutationObserver(function () {
        scheduleDayNameApply();
        scheduleHeaderMonthApply();
        scheduleYearViewMonthApply();
        // Observer DOM 재조작 후 과거 날짜 비활성 스타일 재적용
        if (applyPastDisabledStyle) applyPastDisabledStyle();
      });
      dayNameObserver.observe(target, {childList: true, subtree: true, characterData: true});
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

    // 값 선택 시 래퍼에 is-selected 클래스 토글
    function updateSelectedState() {
      if (!$wrapper.length) return;
      var inst = $el.data('kendoDatePicker');
      $wrapper.toggleClass('is-selected', !!(inst && inst.value()));
    }

    /* 기본 옵션 */
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
      // setTimeout: Kendo DOM 교체 완료 대기
      applyPastDisabledStyle = function () {
        window.setTimeout(function () {
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
        }, 0);
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
          inst.popup.setOptions({animation: false});
        } catch {
          // no-op
        }
      }

      inst.bind('open', function () {
        disableCalendarAnimation();
        ensureDayNameObserver();
        forceApplyDayNames();
        forceApplyHeaderMonth();
        forceApplyYearViewMonthNames();
        updatePrevNavState();
      });

      inst.bind('change', function () {
        updateSelectedState();
      });

      updateSelectedState();
    }

    if (parseBool($el.attr('data-open')) && inst) {
      window.setTimeout(function () {
        inst.open();
      }, 0);
    }
  }

  function initAll() {
    if (!ensureKendoAvailable()) return;

    var targets = document.querySelectorAll('.vits-datepicker-single [data-ui="kendo-datepicker"]');

    for (var i = 0; i < targets.length; i++) {
      initDatePicker(targets[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})(window);
