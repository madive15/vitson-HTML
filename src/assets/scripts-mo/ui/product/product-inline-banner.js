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
