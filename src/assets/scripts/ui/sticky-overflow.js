/**
 * @file scripts/ui/sticky-overflow.js
 * @description 스티키 컨테이너 내 제외 영역 높이를 계산하여 CSS 변수로 전달
 * @scope [data-sticky-overflow="root"]
 * @mapping
 *   root    → 스티키 컨테이너 (CSS 변수 --sticky-overflow-offset 세팅 대상)
 *   exclude → 제외 영역 (합산하여 offset 계산)
 * @note 스크롤 영역의 max-height 적용은 CSS에서 처리
 */

(function ($, window) {
  'use strict';

  if (!$) {
    return;
  }

  window.UI = window.UI || {};

  var ATTR = 'data-sticky-overflow';
  var ROOT_SEL = '[' + ATTR + '="root"]';
  var EXCLUDE_SEL = '[' + ATTR + '="exclude"]';
  var DEFAULT_GAP = 20;

  var instances = [];
  var resizeTimer = null;

  function calc(root) {
    var $root = $(root);
    var stickyTop = parseInt(getComputedStyle(root).top, 10) || 0;
    var gap = parseInt($root.attr(ATTR + '-gap'), 10) || DEFAULT_GAP;

    // exclude 영역 높이 합산
    var excludeH = 0;
    $root.find(EXCLUDE_SEL).each(function () {
      excludeH += $(this).outerHeight(true);
    });

    root.style.setProperty('--sticky-overflow-offset', stickyTop + excludeH + gap + 'px');

    // 패널 스크롤 발생 여부 체크
    $root.find('[data-payment-panel]').each(function () {
      if (this.scrollHeight > this.clientHeight) {
        this.classList.add('is-scrollable');
      } else {
        this.classList.remove('is-scrollable');
      }
    });
  }

  function updateAll() {
    for (var i = 0; i < instances.length; i++) {
      calc(instances[i]);
    }
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateAll, 100);
  }

  window.UI.stickyOverflow = {
    init: function () {
      this.destroy();

      $(ROOT_SEL).each(function () {
        instances.push(this);
      });

      if (!instances.length) return;

      updateAll();
      $(window).on('resize.stickyOverflow', onResize);
    },

    update: function () {
      updateAll();
    },

    destroy: function () {
      $(window).off('resize.stickyOverflow');
      clearTimeout(resizeTimer);

      for (var i = 0; i < instances.length; i++) {
        instances[i].style.removeProperty('--sticky-overflow-offset');
      }

      instances = [];
    }
  };
})(window.jQuery || window.$, window);
