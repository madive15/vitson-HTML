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
    $root
      .find(PAGE)
      .removeClass(CLS.active)
      .filter('[data-step-tab-page="' + step + '"]')
      .addClass(CLS.active);

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
      $root
        .find(NAV + '[data-step-tab-nav="' + current + '"]')
        .removeClass(CLS.active)
        .addClass(CLS.done)
        .removeAttr('aria-current')
        .attr('aria-disabled', 'true');

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
