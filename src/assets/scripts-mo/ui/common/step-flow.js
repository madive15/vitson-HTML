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
    $root
      .find(PAGE)
      .removeClass(CLS.active)
      .filter('[data-step-page="' + step + '"]')
      .addClass(CLS.active);

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
    $root
      .find(ACTION)
      .find('.text')
      .text(isLast ? opt.doneText : opt.nextText);

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
