/**
 * @file scripts-mo/ui/kendo/kendo-window.js
 * @description 모바일 Kendo Window — 바텀시트 모드 (PC 구조 기반)
 * @scope data-ui="kendo-window" 요소 자동 초기화
 * @state is-kendo-window-open: body 스크롤 잠금
 */
(function (window) {
  'use strict';

  var $ = window.jQuery;
  if (!$) return;

  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var SHEET_CLASS = 'vm-bottom-sheet';
  var scrollY = 0;
  var openedWindows = [];

  function lockBody() {
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;

    scrollY = window.pageYOffset || 0;
    $('body')
      .addClass(BODY_LOCK_CLASS)
      .css({
        position: 'fixed',
        top: -scrollY + 'px',
        left: 0,
        right: 0,
        overflow: 'hidden'
      });
  }

  function unlockBody() {
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;

    $('body').removeClass(BODY_LOCK_CLASS).css({
      position: '',
      top: '',
      left: '',
      right: '',
      overflow: ''
    });
    window.scrollTo(0, scrollY);
  }

  function checkScroll(id) {
    var $el = $('#' + id);
    $el.find('[data-scroll-check]').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }

  function positionSheet(id) {
    var $el = $('#' + id);
    var $kWindow = $el.closest('.k-window');

    $kWindow.addClass(SHEET_CLASS).css({
      top: 'auto',
      left: '0',
      right: '0',
      bottom: '0',
      width: '100%',
      position: 'fixed'
    });

    requestAnimationFrame(function () {
      $kWindow.addClass('is-active');
    });
  }

  function initOne(el) {
    var $el = $(el);
    if ($el.data('kendoWindow')) return;

    var id = $el.attr('id');

    $el.kendoWindow({
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) openedWindows.push(id);
      },
      close: function () {
        $('#' + id)
          .closest('.k-window')
          .removeClass('is-active');
        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) unlockBody();
      }
    });
  }

  function initAll(root) {
    var $root = root ? $(root) : $(document);
    $root.find('[data-ui="kendo-window"]').each(function () {
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

  function open(id) {
    var $el = $('#' + id);
    if (!$el.length) return;

    var inst = $el.data('kendoWindow');
    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }

    if (!inst) return;

    inst.open();
    positionSheet(id);

    setTimeout(function () {
      checkScroll(id);
    }, 0);
  }

  function close(id) {
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');
    if (inst) inst.close();
  }

  $(document).on('click', '.k-overlay', function () {
    openedWindows.slice().forEach(function (id) {
      close(id);
    });
  });

  window.KendoWindow = {
    initAll: initAll,
    autoBindStart: autoBindStart,
    open: open,
    close: close
  };
})(window);
