/**
 * @file scripts/ui/cart-order/cart-order.js
 * @purpose 장바구니 , 배송정보 , 결제 페이지에 대한 공통 UI 처리
 * @description
 *  - 할인금액 토글 처리 (클릭 시 할인금액 상세 표시/숨김)
 *  - 배송방법 탭과 패널 매칭 처리 (data-method/data-panel 기반)
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[cart-order] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  window.UI.cartOrder = {
    init: function () {
      //vits-cart-body 영역
      var discountItemSelector = '.vits-cart-summary-item.has-discount';
      var shippingWrapSelector = '.vits-shipping';
      var shippingBtnSelector = '.vits-shipping-method-btn[data-method]';
      var shippingPanelSelector = '.vits-shipping-panel[data-panel]';

      function setDiscountState($item, isActive) {
        var $toggle = $item.find('.discount-toggle').first();
        var $info = $item.find('.discount-info').first();
        var $detail = $item.find('.discount-info-detail').first();
        var $icon = $toggle.find('.ic').first();
        var nextActive = !!isActive;

        if (!$toggle.length || !$info.length || !$detail.length) return;

        $info.toggleClass('is-active', nextActive);
        $toggle.attr('aria-expanded', nextActive ? 'true' : 'false');
        $detail.attr('aria-hidden', nextActive ? 'true' : 'false');

        if ($icon.length) {
          $icon.toggleClass('ic-arrow-down', !nextActive);
          $icon.toggleClass('ic-arrow-up', nextActive);
        }
      }

      function setShippingState($wrap, method) {
        if (!$wrap.length || !method) return;

        var $buttons = $wrap.find(shippingBtnSelector);
        var $panels = $wrap.find(shippingPanelSelector);
        var methodValue = String(method);
        var hasPanel = $panels.filter('[data-panel="' + methodValue + '"]').length > 0;

        if (!hasPanel) return;

        $buttons.each(function () {
          var $btn = $(this);
          var isActive = $btn.attr('data-method') === methodValue;
          $btn.toggleClass('is-active', isActive);
        });

        $panels.each(function () {
          var $panel = $(this);
          var isActive = $panel.attr('data-panel') === methodValue;
          $panel.toggleClass('is-active', isActive);
        });
      }

      $(discountItemSelector).each(function () {
        var $item = $(this);
        var isActive = $item.find('.discount-info').first().hasClass('is-active');
        setDiscountState($item, isActive);
      });

      $(shippingWrapSelector).each(function () {
        var $wrap = $(this);
        var $activeBtn = $wrap.find(shippingBtnSelector + '.is-active').first();
        var activeMethod = $activeBtn.attr('data-method');

        if (!activeMethod) {
          activeMethod = $wrap.find(shippingBtnSelector).first().attr('data-method');
        }

        if (activeMethod) {
          setShippingState($wrap, activeMethod);
        }
      });

      $(document)
        .off('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle')
        .on('click.cartOrderDiscount', discountItemSelector + ' .discount-toggle', function () {
          var $toggle = $(this);
          var $item = $toggle.closest(discountItemSelector);
          var isActive = $item.find('.discount-info').first().hasClass('is-active');
          setDiscountState($item, !isActive);
        });

      $(document)
        .off('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector)
        .on('click.cartOrderShipping', shippingWrapSelector + ' ' + shippingBtnSelector, function () {
          var $btn = $(this);
          var $wrap = $btn.closest(shippingWrapSelector);
          var method = $btn.attr('data-method');
          setShippingState($wrap, method);
        });
    }
  };

  console.log('[cart-order] module loaded');
})(window.jQuery || window.$, window);
