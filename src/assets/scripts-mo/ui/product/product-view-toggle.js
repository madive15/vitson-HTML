/**
 * @file scripts-mo/ui/product/product-view-toggle.js
 * @description 상품 목록 뷰 전환 (thumb ↔ list)
 * @scope [data-ui="product-list"]
 * @a11y aria-pressed(true → 리스트형 활성), aria-label 동적 전환
 * @events click → [data-ui="product-view-toggle"], productViewChange (발행)
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiProductViewToggle';
  var SCOPE = '[data-ui="product-list"]';
  var BTN = '[data-ui="product-view-toggle"]';
  var ITEMS = '[data-ui="product-items"]';

  var VIEW = {THUMB: 'view-thumb', LIST: 'view-list'};
  var LABEL = {THUMB: '썸네일형 전환', LIST: '리스트형 전환'};

  var _bound = false;

  function bindEvents() {
    if (_bound) return;
    _bound = true;

    $(document).on('click' + NS, BTN, function () {
      var $btn = $(this);
      var $list = $btn.closest(SCOPE).find(ITEMS);
      var toList = $btn.hasClass(VIEW.THUMB);

      $btn
        .toggleClass(VIEW.THUMB, !toList)
        .toggleClass(VIEW.LIST, toList)
        .attr({
          'aria-label': toList ? LABEL.THUMB : LABEL.LIST,
          'aria-pressed': String(toList)
        });

      $list.toggleClass(VIEW.THUMB, !toList).toggleClass(VIEW.LIST, toList);

      // 뷰 변경 알림 (배너 위치 재계산 등)
      $(document).trigger('productViewChange');
    });
  }

  window.UI.productViewToggle = {
    init: function () {
      bindEvents();
    }
  };
})(window.jQuery, window);
