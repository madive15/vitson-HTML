/**
 * @file scripts/ui/kendo/kendo-range-picker.js
 * @description
 * Kendo Calendar 기반 단일 달력 Range Picker 자동 초기화 모듈.
 */

(function (window) {
  'use strict';

  // ============================================
  // 유틸리티 함수
  // ============================================

  function parseJsonSafe(str) {
    if (!str) return null;

    var decoded = str
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    try {
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  function ensureKendoAvailable() {
    return !!(window.jQuery && window.kendo && window.jQuery.fn && window.jQuery.fn.kendoCalendar);
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

  // 2026-01-30 isSameDate 함수 삭제

  function applyVitsClassToWrapper($wrap, $popup) {
    if (!$wrap || !$wrap.length) return;

    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);

    if ($popup && $popup.length) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) {
          $popup.addClass(classList[i]);
        }
      }
    }
  }

  // ============================================
  // Range Picker 초기화
  // ============================================
  function initRangePicker(el) {
    var $ = window.jQuery;
    var $el = $(el);

    if ($el.data('vitsKendoRangePicker')) return;

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};

    opts.format = opts.format || 'yyyy.MM.dd';
    opts.separator = opts.separator || ' ~ ';
    opts.placeholder = opts.placeholder || '시작일 ~ 종료일';

    if (opts.min) opts.min = parseDateValue(opts.min);
    if (opts.max) opts.max = parseDateValue(opts.max);

    var $wrap = $el;
    var $display = $wrap.find('.js-range-display');
    var $popup = $wrap.find('.js-calendar-popup');
    var $toggle = $wrap.find('.js-calendar-toggle');
    var $calendarWrap = $wrap.find('.js-kendo-calendar');
    var $startInput = $wrap.find('.js-start-date');
    var $endInput = $wrap.find('.js-end-date');

    var state = {
      startDate: null,
      endDate: null,
      isSelectingEnd: false,
      isOpen: false
    };

    var isHighlighting = false; // 2026-01-30 추가

    var startVal = $startInput.val();
    var endVal = $endInput.val();
    if (startVal) state.startDate = parseDateValue(startVal);
    if (endVal) state.endDate = parseDateValue(endVal);

    var calendarOpts = {
      change: onCalendarChange,
      navigate: onCalendarNavigate,
      culture: 'en-US',
      animation: false,
      footer: false,
      month: {
        header: '#= kendo.toString(data.date, "yyyy.MM") #',
        empty: '&nbsp;' // 2026-02-10 추가 - 이전/다음 달 셀 빈칸 처리
      },
      start: 'month',
      depth: 'month'
    };

    if (opts.min) calendarOpts.min = opts.min;
    if (opts.max) calendarOpts.max = opts.max;

    $calendarWrap.kendoCalendar(calendarOpts);
    var calendar = $calendarWrap.data('kendoCalendar');

    var navTitleScheduled = false;
    var dayNameScheduled = false;
    var monthNameScheduled = false;

    function scheduleNavTitle() {
      if (navTitleScheduled) return;
      navTitleScheduled = true;
      window.requestAnimationFrame(function () {
        navTitleScheduled = false;
        updateNavTitle();
      });
    }

    function scheduleDayNames() {
      if (dayNameScheduled) return;
      dayNameScheduled = true;
      window.requestAnimationFrame(function () {
        dayNameScheduled = false;
        updateDayNames();
      });
    }

    function forceUpdateUI() {
      scheduleNavTitle();
      scheduleDayNames();
      scheduleMonthNames();
      window.setTimeout(function () {
        scheduleNavTitle();
        scheduleDayNames();
        scheduleMonthNames();
        removeEmptyRows(); // 2026-02-10 추가
      }, 0);
    }

    function updateNavTitle() {
      var currentDate = calendar.current();
      var year = currentDate.getFullYear();
      var month = String(currentDate.getMonth() + 1).padStart(2, '0');
      var title = year + '<span class="nav-dot">.</span>' + month;

      $calendarWrap.find('.k-button-text').html(title);
    }

    // 월 영문 -> 숫자로 표시
    function updateMonthNames() {
      $calendarWrap.find('.k-calendar-view td .k-link').each(function () {
        var $link = $(this);
        var text = $link.text().trim();

        var monthMap = {
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

        if (monthMap[text]) {
          $link.text(monthMap[text]);
        }
      });
    }

    function scheduleMonthNames() {
      if (monthNameScheduled) return;
      monthNameScheduled = true;
      window.requestAnimationFrame(function () {
        monthNameScheduled = false;
        updateMonthNames();
      });
    }

    // 영문 요일 표시
    function updateDayNames() {
      var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      $calendarWrap.find('th').each(function (index) {
        var $th = $(this);
        if ($th.text().trim().length <= 3) {
          $th.text(dayNames[index]);
        }
      });
    }

    // 2026-02-10 추가 - other-month 셀만 있는 빈 행 숨김
    function removeEmptyRows() {
      $calendarWrap.find('.k-calendar-monthview tbody tr').each(function () {
        var $tr = $(this);
        var hasCurrentMonth = $tr.find('td:not(.k-other-month)').length > 0;

        if (!hasCurrentMonth) {
          $tr.addClass('is-empty-row');
        } else {
          $tr.removeClass('is-empty-row');
        }
      });
    }

    var isUpdatingUI = false; // 2026-01-30 추가

    // 2026-01-30 var uiObserver 수정
    var uiObserver = new MutationObserver(function () {
      if (isHighlighting || isUpdatingUI) return;

      isUpdatingUI = true;
      uiObserver.disconnect();

      // schedule 함수 대신 직접 호출
      updateNavTitle();
      updateDayNames();
      updateMonthNames();
      highlightRange();
      removeEmptyRows(); // 2026-02-10 추가

      window.setTimeout(function () {
        uiObserver.observe($calendarWrap[0], {childList: true, subtree: true, characterData: true});
        isUpdatingUI = false;
      }, 50);
    });
    uiObserver.observe($calendarWrap[0], {childList: true, subtree: true, characterData: true});

    // ============================================
    // 상태 클래스 관리
    // ============================================

    // 2026-02-03 추가 - 범위 선택 완료 시 래퍼에 is-selected 클래스 토글
    function updateSelectedState() {
      $wrap.toggleClass('is-selected', !!(state.startDate && state.endDate));
    }

    // ============================================
    // 이벤트 핸들러
    // ============================================

    function onCalendarChange() {
      var selectedDate = calendar.value();

      if (!state.isSelectingEnd) {
        state.startDate = selectedDate;
        state.endDate = null;
        state.isSelectingEnd = true;
      } else {
        if (selectedDate < state.startDate) {
          state.endDate = state.startDate;
          state.startDate = selectedDate;
        } else {
          state.endDate = selectedDate;
        }

        state.isSelectingEnd = false;
        closePopup();

        $el.trigger('rangepicker:change', [getPublicValue()]);
      }

      updateDisplay();
      updateHiddenInputs();
      highlightRange();
      updateSelectedState(); // 2026-02-03 추가
    }

    function onCalendarNavigate() {
      forceUpdateUI();
      window.setTimeout(function () {
        highlightRange();
        updateNavTitle();
        updateDayNames();
        removeEmptyRows(); // 2026-02-10 추가
      }, 10);
    }

    function highlightRange() {
      isHighlighting = true; // 2026-01-30 추가

      var $cells = $calendarWrap.find('td');
      $cells.removeClass('k-range-start k-range-end k-range-mid');

      if (state.startDate && state.endDate) {
        $calendarWrap.addClass('has-range');
      } else {
        $calendarWrap.removeClass('has-range');
      }

      // 2026-01-30 수정
      if (!state.startDate) {
        isHighlighting = false;
        return;
      }

      // 2026-01-30 추가 - 시간 제거한 순수 날짜로 비교
      var startTime = new Date(
        state.startDate.getFullYear(),
        state.startDate.getMonth(),
        state.startDate.getDate()
      ).getTime();
      var endTime = state.endDate
        ? new Date(state.endDate.getFullYear(), state.endDate.getMonth(), state.endDate.getDate()).getTime()
        : null;

      $cells.each(function () {
        var $cell = $(this);
        var $link = $cell.find('.k-link');
        var dateValue = $link.attr('data-value');

        if (!dateValue) return;

        var parts = dateValue.split('/');
        var cellDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10));
        var cellTime = cellDate.getTime(); // 2026-01-30 추가

        var isStart = cellTime === startTime; // 2026-01-30 수정
        var isEnd = endTime && cellTime === endTime; // 2026-01-30 수정
        var isInRange = endTime && cellTime > startTime && cellTime < endTime; // 2026-01-30 수정

        if (isStart) $cell.addClass('k-range-start');
        if (isEnd) $cell.addClass('k-range-end');
        if (isInRange) $cell.addClass('k-range-mid');
      });

      isHighlighting = false; // 2026-01-30 추가
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
      if ($wrap.hasClass('is-disabled')) return;

      $popup.addClass('is-open');
      state.isOpen = true;
      highlightRange();
      removeEmptyRows(); // 2026-02-10 추가
      applyVitsClassToWrapper($wrap, $popup);

      $el.trigger('rangepicker:open');
    }

    function closePopup() {
      $popup.removeClass('is-open');
      state.isOpen = false;

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

    // ============================================
    // 이벤트 바인딩
    // ============================================

    $display.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
      togglePopup();
    });

    $toggle.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
      togglePopup();
    });

    $popup.on('click.vitsRangePicker', function (e) {
      e.stopPropagation();
    });

    $(document).on('click.vitsRangePicker_' + $el.attr('id'), function () {
      if (!state.isSelectingEnd) {
        closePopup();
      }
    });

    $(document).on('keydown.vitsRangePicker_' + $el.attr('id'), function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closePopup();
      }
    });

    // ============================================
    // Public API
    // ============================================
    var instance = {
      getValue: getPublicValue,

      setValue: function (start, end) {
        state.startDate = start ? parseDateValue(start) : null;
        state.endDate = end ? parseDateValue(end) : null;
        state.isSelectingEnd = false;

        updateDisplay();
        updateHiddenInputs();
        highlightRange();
        removeEmptyRows(); // 2026-02-10 추가
        updateSelectedState(); // 2026-02-03 추가

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

        if (calendar) {
          calendar.value(null);
        }

        highlightRange();
        removeEmptyRows(); // 2026-02-10 추가
        updateSelectedState(); // 2026-02-03 추가
        $el.trigger('rangepicker:reset');
      },

      open: openPopup,
      close: closePopup,
      toggle: togglePopup,

      disable: function () {
        $wrap.addClass('is-disabled');
        $display.prop('disabled', true);
        $toggle.prop('disabled', true);
        closePopup();
      },

      enable: function () {
        $wrap.removeClass('is-disabled');
        $display.prop('disabled', false);
        $toggle.prop('disabled', false);
      },

      destroy: function () {
        var id = $el.attr('id') || '';
        $(document).off('.vitsRangePicker_' + id);
        $display.off('.vitsRangePicker');
        $toggle.off('.vitsRangePicker');
        $popup.off('.vitsRangePicker');

        if (calendar) {
          calendar.destroy();
        }

        $el.removeData('vitsKendoRangePicker');
      }
    };

    $el.data('vitsKendoRangePicker', instance);

    updateDisplay();
    highlightRange();
    removeEmptyRows(); // 2026-02-10 추가
    updateSelectedState(); // 2026-02-03 추가 - 초기값이 있을 경우 대응

    console.log('[kendo-range-picker] initialized:', $el.attr('id') || 'anonymous');
  }

  // ============================================
  // 초기화 함수들
  // ============================================

  function initOne(el) {
    var $el = window.jQuery(el);
    var uiType = $el.attr('data-ui');

    if (uiType === 'kendo-range-picker') {
      initRangePicker(el);
    }
  }

  function initAll(root) {
    if (!ensureKendoAvailable()) {
      console.warn('[kendo-range-picker] Kendo UI not available');
      return;
    }

    var $root = root ? window.jQuery(root) : window.jQuery(document);

    $root.find('[data-ui="kendo-range-picker"]').each(function () {
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

    obs.observe(target, {childList: true, subtree: true});
    return obs;
  }

  function getInstance(selector) {
    var $el = window.jQuery(selector);
    return $el.data('vitsKendoRangePicker') || null;
  }

  // ============================================
  // 전역 API 노출
  // ============================================
  window.VitsKendoRangePicker = {
    initAll: initAll,
    initOne: initOne,
    autoBindStart: autoBindStart,
    getInstance: getInstance
  };

  // ============================================
  // DOM Ready 시 자동 초기화
  // ============================================
  if (window.jQuery) {
    window.jQuery(function () {
      autoBindStart();
    });
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      if (window.jQuery) {
        autoBindStart();
      }
    });
  }

  console.log('[kendo-range-picker] loaded');
})(window);
