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
  var IS_IOS =
    (TOUCH_SUPPORTED && /iPad|iPhone|iPod/.test(navigator.userAgent)) ||
    (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));

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
        content:
          '<span tabindex="-1" class="k-link" data-href="\\#" data-value="#= data.dateString #">#= data.value #</span>'
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
        uiObserver.observe($calendarWrap[0], {childList: true, subtree: true, characterData: true});
        isUpdatingUI = false;
      }, DELAY.OBSERVER_RECONNECT);
    });
    uiObserver.observe($calendarWrap[0], {childList: true, subtree: true, characterData: true});

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
          $extBtn
            .find('.text')
            .text(formatDate(state.startDate, opts.format) + opts.separator + formatDate(state.endDate, opts.format));

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

    console.log('[' + DATA_UI + '] initialized:', elId || 'anonymous');
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

    obs.observe(target, {childList: true, subtree: true});
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

  console.log('[' + DATA_UI + '] loaded');
})(window);
