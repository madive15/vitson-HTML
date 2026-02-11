/**
 * @file scripts-mo/ui/common/overflow-menu.js
 * @description 오버플로 메뉴 (더보기 등)
 * @scope [data-vm-overflow-menu]
 * @state .is-open — 메뉴 열림
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiOverflowMenu';
  var ROOT = '[data-vm-overflow-menu]';
  var TRIGGER = '[data-vm-overflow-trigger]';
  var LIST = '[data-vm-overflow-list]';
  var CLS_OPEN = 'is-open';

  var _bound = false;

  function close($root) {
    $root.removeClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'false');
  }

  function closeAll() {
    $(ROOT + '.' + CLS_OPEN).each(function () {
      close($(this));
    });
  }

  function open($root) {
    closeAll();
    $root.addClass(CLS_OPEN);
    $root.find(TRIGGER).attr('aria-expanded', 'true');
  }

  function toggle($root) {
    if ($root.hasClass(CLS_OPEN)) {
      close($root);
    } else {
      open($root);
    }
  }

  function bind() {
    if (_bound) return;
    _bound = true;

    var $doc = $(document);

    // 트리거 클릭
    $doc.on('click' + NS, TRIGGER, function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggle($(this).closest(ROOT));
    });

    // 메뉴 항목 클릭 → 닫기
    $doc.on('click' + NS, LIST + ' a, ' + LIST + ' button', function () {
      close($(this).closest(ROOT));
    });

    // 외부 클릭 → 닫기
    $doc.on('mousedown' + NS + ' touchstart' + NS, function (e) {
      if (!$(e.target).closest(ROOT).length) {
        closeAll();
      }
    });
  }

  function init() {
    bind();
  }

  function destroy() {
    closeAll();
    $(document).off(NS);
    _bound = false;
  }

  window.UI.overflowMenu = {
    init: init,
    destroy: destroy,
    close: close,
    closeAll: closeAll
  };
})(window.jQuery, window);
