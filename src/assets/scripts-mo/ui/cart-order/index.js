/**
 * @file scripts-mo/ui/cart-order/index.js
 * @description 장바구니/주문 UI 모듈 통합
 */

import './cart.js';
import './order.js';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var modules = ['cart', 'order'];

  window.UI.cartOrder = {
    init: function () {
      modules.forEach(function (name) {
        var mod = window.UI[name];
        if (mod && typeof mod.init === 'function') mod.init();
      });
    }
  };
})(window.jQuery, window);
