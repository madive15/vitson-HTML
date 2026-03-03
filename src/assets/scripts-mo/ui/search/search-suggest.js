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
