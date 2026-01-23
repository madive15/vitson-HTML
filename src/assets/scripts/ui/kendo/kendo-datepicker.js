/**
 * @file scripts/ui/kendo/kendo-datepicker.js
 * @description
 * Kendo DatePicker/DateRangePicker 자동 초기화 모듈.
 */

(function (window) {
  'use strict';

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

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};

    var $wrap = $el.closest('.vits-daterangepicker');

    if ($wrap.length && opts.appendTo === undefined) {
      opts.appendTo = $wrap[0];
    }

    opts.format = opts.format || 'yyyy.MM.dd';
    opts.culture = opts.culture || 'ko-KR';
    opts.footer = false;

    if (opts.range) {
      opts.range = {
        start: opts.range.start ? parseDateValue(opts.range.start) : null,
        end: opts.range.end ? parseDateValue(opts.range.end) : null
      };
    }
    if (opts.min) opts.min = parseDateValue(opts.min);
    if (opts.max) opts.max = parseDateValue(opts.max);

    // 힌트 텍스트 설정
    var startText = opts.messages && opts.messages.startLabel ? opts.messages.startLabel : '시작일';
    var endText = opts.messages && opts.messages.endLabel ? opts.messages.endLabel : '종료일';

    $el.kendoDateRangePicker(opts);

    var inst = $el.data('kendoDateRangePicker');

    var isOpen = false;
    var suppressOpenUntil = 0;

    // ============================================
    // 스타일 삽입 (최초 1회)
    // ============================================
    if (!document.getElementById('vits-daterange-mask-style')) {
      var style = document.createElement('style');
      style.id = 'vits-daterange-mask-style';
      style.textContent = [
        // 마스크(빈 값) 완전히 숨김
        '.vits-daterangepicker .k-dateinput .k-input-inner.is-mask-empty {',
        '  color: transparent !important;',
        '}',
        // 포커스 시에도 마스크 숨김 유지
        '.vits-daterangepicker .k-dateinput .k-input-inner.is-mask-empty:focus {',
        '  color: transparent !important;',
        '}',
        // 실제 값 있을 때 표시
        '.vits-daterangepicker .k-dateinput .k-input-inner.has-value {',
        '  color: #333 !important;',
        '}',
        // ★ 세그먼트 하이라이트(파란색) 제거
        '.vits-daterangepicker .k-dateinput .k-input-inner::selection {',
        '  background: transparent !important;',
        '  color: inherit !important;',
        '}',
        '.vits-daterangepicker .k-dateinput .k-input-inner::-moz-selection {',
        '  background: transparent !important;',
        '  color: inherit !important;',
        '}',
        // 커서는 보이게 (타이핑용)
        '.vits-daterangepicker .k-dateinput .k-input-inner {',
        '  cursor: text !important;',
        '}',
        // 힌트 스타일
        '.vits-daterangepicker .vits-placeholder-hint {',
        '  position: absolute;',
        '  top: 50%;',
        '  transform: translateY(-50%);',
        '  color: #999;',
        '  font-size: 14px;',
        '  pointer-events: none;',
        '  white-space: nowrap;',
        '  z-index: 5;',
        '}',
        // 전체 영역 클릭 가능하게
        '.vits-daterangepicker .k-daterangepicker {',
        '  cursor: pointer;',
        '}'
      ].join('\n');
      document.head.appendChild(style);
    }

    // ============================================
    // 마스크 빈 값 판단 함수
    // ============================================
    function isMaskEmpty(val) {
      if (!val) return true;
      var emptyPatterns = ['year.month.day', 'yyyy.MM.dd', 'yyyy.mm.dd', '    .  .  ', '__.__.____', ''];
      var trimmed = val.trim().toLowerCase();
      for (var i = 0; i < emptyPatterns.length; i++) {
        if (trimmed === emptyPatterns[i].toLowerCase()) return true;
      }
      return !/\d/.test(val);
    }

    // ============================================
    // 두 input 가져오기
    // ============================================
    function getTwoInputs() {
      var $inputs = $wrap.find('input.k-input-inner');
      return $inputs.length >= 2 ? {$start: $inputs.eq(0), $end: $inputs.eq(1)} : null;
    }

    // ============================================
    // 힌트 요소 생성 (input 내부 위치)
    // ============================================
    function ensureHints() {
      var inputs = getTwoInputs();
      if (!inputs) return null;

      var $startWrap = inputs.$start.closest('.k-dateinput');
      var $endWrap = inputs.$end.closest('.k-dateinput');

      // position: relative 보장
      $startWrap.css('position', 'relative');
      $endWrap.css('position', 'relative');

      var $hintStart = $startWrap.find('.vits-placeholder-hint');
      var $hintEnd = $endWrap.find('.vits-placeholder-hint');

      if (!$hintStart.length) {
        $hintStart = window.jQuery('<span class="vits-placeholder-hint"></span>');
        $hintStart.text(startText);
        $startWrap.append($hintStart);
      }

      if (!$hintEnd.length) {
        $hintEnd = window.jQuery('<span class="vits-placeholder-hint"></span>');
        $hintEnd.text(endText);
        $endWrap.append($hintEnd);
      }

      // input의 padding-left에 맞춤
      var padStart = parseInt(inputs.$start.css('paddingLeft'), 10) || 0;
      var padEnd = parseInt(inputs.$end.css('paddingLeft'), 10) || 0;
      $hintStart.css('left', padStart + 'px');
      $hintEnd.css('left', padEnd + 'px');

      return {$hintStart: $hintStart, $hintEnd: $hintEnd};
    }

    // ============================================
    // 상태 동기화
    // ============================================
    function syncState() {
      var inputs = getTwoInputs();
      if (!inputs) return;

      var hints = ensureHints();
      if (!hints) return;

      var startVal = inputs.$start.val();
      var endVal = inputs.$end.val();
      var startEmpty = isMaskEmpty(startVal);
      var endEmpty = isMaskEmpty(endVal);

      // 마스크 클래스 토글
      if (startEmpty) {
        inputs.$start.addClass('is-mask-empty').removeClass('has-value');
      } else {
        inputs.$start.removeClass('is-mask-empty').addClass('has-value');
      }

      if (endEmpty) {
        inputs.$end.addClass('is-mask-empty').removeClass('has-value');
      } else {
        inputs.$end.removeClass('is-mask-empty').addClass('has-value');
      }

      // 힌트 표시/숨김 (빈 값일 때만 표시)
      hints.$hintStart.toggle(startEmpty);
      hints.$hintEnd.toggle(endEmpty);
    }

    // ============================================
    // 키보드 완전 차단 (캘린더로만 선택)
    // ============================================
    function blockIncrement() {
      var inputs = getTwoInputs();
      if (!inputs) return;

      // readonly로 키보드 입력 완전 차단
      inputs.$start.add(inputs.$end).attr('readonly', true);

      // 마우스 휠 차단
      inputs.$start.add(inputs.$end).each(function () {
        this.addEventListener(
          'wheel',
          function (e) {
            e.preventDefault();
          },
          {passive: false}
        );
      });
    }

    // ============================================
    // Kendo 이벤트 바인딩
    // ============================================
    if (inst && inst.bind) {
      inst.bind('open', function (e) {
        if (Date.now() < suppressOpenUntil) {
          if (e && typeof e.preventDefault === 'function') e.preventDefault();
          return;
        }
        isOpen = true;
        applyVitsClassToWrapper($wrap, inst);
        window.requestAnimationFrame(syncState);
      });

      inst.bind('close', function () {
        isOpen = false;
        window.requestAnimationFrame(syncState);
      });

      inst.bind('change', function () {
        var range = this.range();
        $el.trigger('daterangepicker:change', [range]);
        window.requestAnimationFrame(syncState);
      });
    }

    applyVitsClassToWrapper($wrap, inst);

    // ============================================
    // 전체 영역 클릭으로 열기
    // ============================================
    $wrap.off('click.vitsKendoOpen');
    $wrap.on('click.vitsKendoOpen', function (e) {
      // 이미 열려있거나 suppressed 상태면 무시
      if (isOpen || Date.now() < suppressOpenUntil) return;

      // input 직접 클릭은 Kendo가 처리
      if (window.jQuery(e.target).is('input.k-input-inner')) return;

      if (inst && typeof inst.open === 'function') {
        inst.open();
      }
    });

    // ============================================
    // 아이콘 위 클릭 레이어 버튼
    // ============================================
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
          syncState();
          blockIncrement();
        }, 0);
      } else {
        inst.open();
      }
    });

    // ============================================
    // 이벤트 바인딩
    // ============================================
    $wrap.off('.vitsRangeSync');
    $wrap.on(
      'input.vitsRangeSync change.vitsRangeSync focusin.vitsRangeSync focusout.vitsRangeSync',
      'input',
      function () {
        window.requestAnimationFrame(syncState);
      }
    );

    // 초기 동기화 (약간 딜레이 - Kendo 렌더링 완료 후)
    window.setTimeout(function () {
      syncState();
      blockIncrement();
    }, 50);
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
