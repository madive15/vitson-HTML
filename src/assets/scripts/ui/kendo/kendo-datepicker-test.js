/**
 * @file scripts/ui/kendo/kendo-datepicker.js
 * @description
 * Kendo DatePicker/DateRangePicker 자동 초기화 모듈.
 */

(function (window) {
  'use strict';

  var _dateInputPlaceholderOverridden = false;

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
    return !!(
      window.jQuery &&
      window.kendo &&
      window.jQuery.fn &&
      window.jQuery.fn.kendoDatePicker &&
      window.jQuery.fn.kendoDateRangePicker
    );
  }

  function applyGlobalDateInputPlaceholderOverride() {
    if (_dateInputPlaceholderOverridden) return;
    if (!window.kendo || !window.kendo.ui || !window.kendo.ui.DateInput) return;
    if (!window.kendo.ui.DateInput.fn || !window.kendo.ui.DateInput.fn.options) return;

    window.kendo.ui.DateInput.fn.options.formatPlaceholder = {
      year: '',
      month: '',
      day: ''
    };
    _dateInputPlaceholderOverridden = true;
  }

  function applyVitsClassToWrapper($wrap, inst) {
    if (!$wrap || !$wrap.length || !inst) return;

    var classList = ($wrap.attr('class') || '').split(/\s+/).filter(Boolean);

    if (inst.wrapper) {
      for (var i = 0; i < classList.length; i++) {
        if (classList[i].indexOf('vits-') === 0) {
          inst.wrapper.addClass(classList[i]);
        }
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

  function parseDateValue(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    try {
      return new Date(val);
    } catch {
      return null;
    }
  }

  function initDatePicker(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDatePicker')) return;

    applyGlobalDateInputPlaceholderOverride();

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw);

    if (!opts) {
      opts = {};
    }

    var $wrap = $el.closest('.vits-datepicker');

    if ($wrap.length && opts.appendTo === undefined) {
      opts.appendTo = $wrap[0];
    }

    opts.format = opts.format || 'yyyy.MM.dd';
    opts.culture = opts.culture || 'ko-KR';
    opts.footer = false;
    if (opts.formatPlaceholder === undefined) {
      opts.formatPlaceholder = {year: '', month: '', day: ''};
    }
    if (opts.dateInput === undefined) {
      opts.dateInput = false;
    }
    if (opts.dateInput === true) {
      opts.dateInput = {formatPlaceholder: {year: '', month: '', day: ''}};
    } else if (opts.dateInput && typeof opts.dateInput === 'object') {
      if (opts.dateInput.formatPlaceholder === undefined) {
        opts.dateInput.formatPlaceholder = {year: '', month: '', day: ''};
      }
    } else if (opts.dateInput === undefined) {
      opts.dateInput = {formatPlaceholder: {year: '', month: '', day: ''}};
    }
    opts.parseFormats = ['yyyy.MM.dd', 'yyyyMMdd', 'yyyy-MM-dd'];

    if (opts.value) {
      opts.value = parseDateValue(opts.value);
    }
    if (opts.min) {
      opts.min = parseDateValue(opts.min);
    }
    if (opts.max) {
      opts.max = parseDateValue(opts.max);
    }

    $el.kendoDatePicker(opts);

    var inst = $el.data('kendoDatePicker');

    if (inst && inst.bind) {
      inst.bind('open', function () {
        applyVitsClassToWrapper($wrap, inst);
      });

      inst.bind('change', function () {
        $el.trigger('datepicker:change', [this.value()]);
      });
    }

    applyVitsClassToWrapper($wrap, inst);

    $el.on('blur', function () {
      window.setTimeout(function () {
        var value = $el.val();
        if (!value) return;

        var numbers = value.replace(/[^\d]/g, '');

        if (numbers.length > 0 && numbers.length !== 8) {
          alert('날짜는 8자리 숫자로 입력해주세요. (예: 20260101)');
          $el.val('');
          if (inst && typeof inst.value === 'function') {
            inst.value(null);
          }
          return;
        }

        if (numbers.length === 8) {
          var year = parseInt(numbers.substring(0, 4));
          var month = parseInt(numbers.substring(4, 6));
          var day = parseInt(numbers.substring(6, 8));

          if (month < 1 || month > 12) {
            alert('월은 01~12 사이여야 합니다.');
            $el.val('');
            if (inst && typeof inst.value === 'function') {
              inst.value(null);
            }
            return;
          }

          if (day < 1 || day > 31) {
            alert('일은 01~31 사이여야 합니다.');
            $el.val('');
            if (inst && typeof inst.value === 'function') {
              inst.value(null);
            }
            return;
          }

          try {
            var date = new Date(year, month - 1, day);

            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
              alert('유효하지 않은 날짜입니다.');
              $el.val('');
              if (inst && typeof inst.value === 'function') {
                inst.value(null);
              }
              return;
            }

            if (inst && typeof inst.value === 'function') {
              inst.value(date);
            }
          } catch {
            alert('날짜 형식이 올바르지 않습니다.');
            $el.val('');
            if (inst && typeof inst.value === 'function') {
              inst.value(null);
            }
          }
        }
      }, 200);
    });
  }

  function initDateRangePicker(el) {
    var $el = window.jQuery(el);
    if ($el.data('kendoDateRangePicker')) return;

    applyGlobalDateInputPlaceholderOverride();

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};

    var $wrap = $el.closest('.vits-daterangepicker');

    if ($wrap.length && opts.appendTo === undefined) {
      opts.appendTo = $wrap[0];
    }

    opts.format = opts.format || 'yyyy.MM.dd';
    opts.culture = opts.culture || 'ko-KR';
    opts.footer = false;
    if (opts.formatPlaceholder === undefined) {
      opts.formatPlaceholder = {year: '', month: '', day: ''};
    }
    if (opts.dateInput === undefined) {
      opts.dateInput = false;
    }
    if (opts.dateInput === true) {
      opts.dateInput = {formatPlaceholder: {year: '', month: '', day: ''}};
    } else if (opts.dateInput && typeof opts.dateInput === 'object') {
      if (opts.dateInput.formatPlaceholder === undefined) {
        opts.dateInput.formatPlaceholder = {year: '', month: '', day: ''};
      }
    } else if (opts.dateInput === undefined) {
      opts.dateInput = {formatPlaceholder: {year: '', month: '', day: ''}};
    }

    if (opts.range) {
      opts.range = {
        start: opts.range.start ? parseDateValue(opts.range.start) : null,
        end: opts.range.end ? parseDateValue(opts.range.end) : null
      };
    }
    if (opts.min) opts.min = parseDateValue(opts.min);
    if (opts.max) opts.max = parseDateValue(opts.max);

    $el.kendoDateRangePicker(opts);

    var inst = $el.data('kendoDateRangePicker');

    var isOpen = false;
    var suppressOpenUntil = 0;

    if (inst && inst.bind) {
      inst.bind('open', function (e) {
        if (Date.now() < suppressOpenUntil) {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          return;
        }
        isOpen = true;
        applyVitsClassToWrapper($wrap, inst);
        resetDateInputPlaceholders();
        enforceInputState();
        window.requestAnimationFrame(enforceInputState);
        window.requestAnimationFrame(syncHintOverlay);
      });

      inst.bind('close', function () {
        isOpen = false;
        resetDateInputPlaceholders();
        enforceInputState();
        window.requestAnimationFrame(enforceInputState);
        window.setTimeout(enforceInputState, 0);
        window.setTimeout(enforceInputState, 50);
        window.requestAnimationFrame(syncHintOverlay);
      });

      inst.bind('change', function () {
        var range = this.range();
        $el.trigger('daterangepicker:change', [range]);
        resetDateInputPlaceholders();
        enforceInputState();
        window.requestAnimationFrame(enforceInputState);
        window.requestAnimationFrame(syncHintOverlay);
      });
    }

    applyVitsClassToWrapper($wrap, inst);

    // ----------------------------------------------------
    // 아이콘 위 클릭 레이어 버튼 (재오픈 방지)
    // ----------------------------------------------------
    var $hit = $wrap.find('.vits-daterangepicker__icon-hit');
    if (!$hit.length) {
      $hit = window.jQuery(
        '<button type="button" class="vits-daterangepicker__icon-hit" aria-label="달력 열기/닫기"></button>'
      );
      $wrap.append($hit);
    }

    $hit.off('.vitsKendoRangeHit');

    $hit.on('mousedown.vitsKendoRangeHit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    });

    $hit.on('click.vitsKendoRangeHit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      if (!inst) return;

      if (isOpen) {
        suppressOpenUntil = Date.now() + 500;
        inst.close();

        window.setTimeout(function () {
          var ae = document.activeElement;
          if (ae && $wrap[0].contains(ae) && typeof ae.blur === 'function') ae.blur();

          $wrap.find('input').each(function () {
            if (this && typeof this.blur === 'function') this.blur();
          });
        }, 0);
      } else {
        inst.open();
      }
    });

    $wrap.off('click.vitsKendoDaterange');

    // ----------------------------------------------------
    // “시작일/종료일” 힌트 오버레이 (빈 값 판단을 input.val()이 아니라 range로)
    // ----------------------------------------------------
    var startText = opts.messages && opts.messages.startLabel ? opts.messages.startLabel : '시작일';
    var endText = opts.messages && opts.messages.endLabel ? opts.messages.endLabel : '종료일';
    var useHintOverlay =
      opts.useHintOverlay !== undefined
        ? !!opts.useHintOverlay
        : !(opts.messages && (opts.messages.startLabel || opts.messages.endLabel));

    var $layer = $wrap.find('.vits-range-hint-layer');
    var $hintStart = null;
    var $hintEnd = null;

    function styleHint($hint) {
      $hint.css({
        position: 'absolute',
        pointerEvents: 'none',
        color: '#999',
        whiteSpace: 'nowrap',
        lineHeight: '1',
        transform: 'translateY(-50%)'
      });
    }

    if (useHintOverlay) {
      if ($wrap.css('position') === 'static') $wrap.css('position', 'relative');

      if (!$layer.length) {
        $layer = window.jQuery('<div class="vits-range-hint-layer" aria-hidden="true"></div>');
        $wrap.append($layer);
      }

      $layer.css({
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 25
      });

      $hintStart = $layer.find('.vits-range-hint--start');
      $hintEnd = $layer.find('.vits-range-hint--end');

      if (!$hintStart.length) {
        $hintStart = window.jQuery('<span class="vits-range-hint vits-range-hint--start"></span>');
        $layer.append($hintStart);
      }
      if (!$hintEnd.length) {
        $hintEnd = window.jQuery('<span class="vits-range-hint vits-range-hint--end"></span>');
        $layer.append($hintEnd);
      }

      $hintStart.text(startText);
      $hintEnd.text(endText);
      styleHint($hintStart);
      styleHint($hintEnd);
    } else if ($layer.length) {
      $layer.remove();
    }

    function getTwoInputs() {
      var $inputs = $wrap.find('input').filter(function () {
        return this.type === 'text' && window.jQuery(this).is(':visible');
      });
      return $inputs.length >= 2 ? $inputs.slice(0, 2) : null;
    }

    function syncInputPlaceholders() {
      var $inputs = getTwoInputs();
      if (!$inputs) return;

      $inputs.eq(0).attr('placeholder', startText);
      $inputs.eq(1).attr('placeholder', endText);

      $inputs.each(function () {
        var $input = window.jQuery(this);
        var value = ($input.val() || '').trim();
        if (/^year\.month\.day$/i.test(value)) {
          $input.val('');
        }
      });
    }

    function clearInjectedPlaceholderText() {
      var $inputs = getTwoInputs();
      if (!$inputs) return;

      $inputs.each(function () {
        var $input = window.jQuery(this);
        var value = ($input.val() || '').trim();
        if (/^year\.month\.day$/i.test(value)) {
          $input.val('');
        }
      });
    }

    function enforceInputState() {
      syncInputPlaceholders();
      clearInjectedPlaceholderText();
    }

    function resetDateInputPlaceholders() {
      if (!inst) return;

      var targets = [];
      if (inst._startInput) targets.push(inst._startInput);
      if (inst._endInput) targets.push(inst._endInput);

      targets.forEach(function (input) {
        if (input && typeof input.setOptions === 'function') {
          input.setOptions({formatPlaceholder: {year: '', month: '', day: ''}});
        }
        if (input && input.element && input.element.length) {
          var val = (input.element.val() || '').trim();
          if (/^year\.month\.day$/i.test(val)) {
            input.element.val('');
          }
        }
      });
    }

    function syncHintOverlay() {
      var $inputs = getTwoInputs();
      if (!$inputs) return;

      var $startInput = $inputs.eq(0);
      var $endInput = $inputs.eq(1);

      var wrapRect = $wrap[0].getBoundingClientRect();
      var startRect = $startInput[0].getBoundingClientRect();
      var endRect = $endInput[0].getBoundingClientRect();

      var padLeftStart = parseInt($startInput.css('paddingLeft'), 10) || 0;
      var padLeftEnd = parseInt($endInput.css('paddingLeft'), 10) || 0;

      if ($hintStart) {
        $hintStart.css({
          left: startRect.left - wrapRect.left + padLeftStart + 'px',
          top: startRect.top - wrapRect.top + startRect.height / 2 + 'px'
        });
      }

      if ($hintEnd) {
        $hintEnd.css({
          left: endRect.left - wrapRect.left + padLeftEnd + 'px',
          top: endRect.top - wrapRect.top + endRect.height / 2 + 'px'
        });
      }

      // 핵심: 빈 값 판단을 input.val()이 아니라 “실제 range 값”으로 한다
      var r = inst && typeof inst.range === 'function' ? inst.range() : null;
      var hasStart = !!(r && r.start);
      var hasEnd = !!(r && r.end);

      var ae = document.activeElement;
      var focusOnStart = ae === $startInput[0];
      var focusOnEnd = ae === $endInput[0];

      if ($hintStart) $hintStart.toggle(!hasStart && !focusOnStart);
      if ($hintEnd) $hintEnd.toggle(!hasEnd && !focusOnEnd);
    }

    enforceInputState();
    window.requestAnimationFrame(enforceInputState);
    if (useHintOverlay) window.requestAnimationFrame(syncHintOverlay);

    window.setTimeout(function () {
      resetDateInputPlaceholders();
      enforceInputState();
    }, 0);

    window.setTimeout(function () {
      resetDateInputPlaceholders();
      enforceInputState();
    }, 50);

    window.setTimeout(function () {
      resetDateInputPlaceholders();
      enforceInputState();
    }, 200);

    $wrap.off('.vitsRangePlaceholderGuard');
    $wrap.on(
      'input.vitsRangePlaceholderGuard change.vitsRangePlaceholderGuard focusin.vitsRangePlaceholderGuard focusout.vitsRangePlaceholderGuard blur.vitsRangePlaceholderGuard keyup.vitsRangePlaceholderGuard keydown.vitsRangePlaceholderGuard mousedown.vitsRangePlaceholderGuard mouseup.vitsRangePlaceholderGuard',
      'input',
      function () {
        enforceInputState();
        window.requestAnimationFrame(enforceInputState);
      }
    );

    $wrap.off('.vitsRangeHintOverlay');
    $wrap.on(
      'input.vitsRangeHintOverlay change.vitsRangeHintOverlay focusin.vitsRangeHintOverlay focusout.vitsRangeHintOverlay',
      'input',
      function () {
        enforceInputState();
        window.requestAnimationFrame(enforceInputState);
        if (useHintOverlay) window.requestAnimationFrame(syncHintOverlay);
      }
    );

    window
      .jQuery(window)
      .off('resize.vitsRangeHintOverlay')
      .on('resize.vitsRangeHintOverlay', function () {
        if (useHintOverlay) window.requestAnimationFrame(syncHintOverlay);
      });
  }

  function initOne(el) {
    var $el = window.jQuery(el);
    var uiType = $el.attr('data-ui');

    if (uiType === 'kendo-datepicker') {
      initDatePicker(el);
    } else if (uiType === 'kendo-daterangepicker') {
      initDateRangePicker(el);
    }
  }

  function initAll(root) {
    if (!ensureKendoAvailable()) {
      return;
    }

    var $root = root ? window.jQuery(root) : window.jQuery(document);

    $root.find('[data-ui="kendo-datepicker"]').each(function () {
      initOne(this);
    });

    $root.find('[data-ui="kendo-daterangepicker"]').each(function () {
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

  window.VitsKendoDatepicker = {
    initAll: initAll,
    autoBindStart: autoBindStart
  };

  console.log('[kendo-datepicker] loaded');
})(window);
