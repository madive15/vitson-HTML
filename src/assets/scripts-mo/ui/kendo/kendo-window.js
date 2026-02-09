/**
 * @file scripts-mo/ui/kendo/kendo-window.js
 * @description 모바일 Kendo Window 초기화 모듈
 * @variant 'bottomsheet' — 하단에서 슬라이드 업 (CSS 애니메이션)
 * @variant 'slide-right' — 오른쪽에서 슬라이드 인 (풀스크린)
 *
 * VmKendoWindow.open('myWindow');
 * VmKendoWindow.close('myWindow');
 * VmKendoWindow.refresh('myWindow');
 * VmKendoWindow.initAll();
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  var NS = '.uiKendoWindow';
  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var DEBOUNCE_DELAY = 80;
  var ANIMATION_TIMEOUT = 500;

  var scrollY = 0;
  var openedWindows = [];
  var contentObservers = {};
  var debounceTimers = {};

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

  function refresh(id) {
    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;

      checkScroll(id);

      var $kw = $el.closest('.k-window');
      if (!$kw.hasClass('is-bottomsheet') && !$kw.hasClass('is-slideright')) {
        inst.center();
      }
    }, DEBOUNCE_DELAY);
  }

  function observeContent(id) {
    if (!window.MutationObserver) return;
    if (contentObservers[id]) return;

    var $el = $('#' + id);
    var $content = $el.find('.vm-modal-content');
    if (!$content.length) return;

    var obs = new MutationObserver(function () {
      refresh(id);
    });

    obs.observe($content[0], {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });

    contentObservers[id] = obs;
  }

  function disconnectContent(id) {
    if (contentObservers[id]) {
      contentObservers[id].disconnect();
      delete contentObservers[id];
    }

    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  // 슬라이드 닫힘 애니메이션 + 안전장치
  function closeWithAnimation($kw, inst) {
    $kw.addClass('is-closing');
    var closed = false;

    function done() {
      if (closed) return;
      closed = true;
      $kw.removeClass('is-closing');
      inst.close();
    }

    $kw.one('animationend', done);
    setTimeout(done, ANIMATION_TIMEOUT);
  }

  function initOne(el) {
    var $el = $(el);

    if ($el.data('kendoWindow')) return;

    var id = $el.attr('id');
    var variant = $el.attr('data-variant');
    var isBottom = variant === 'bottomsheet';
    var isSlide = variant === 'slide-right';
    var noAnimation = isBottom || isSlide;

    var opts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
      animation: noAnimation ? false : undefined,
      open: function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
      },
      close: function () {
        disconnectContent(id);

        var idx = openedWindows.indexOf(id);
        if (idx > -1) openedWindows.splice(idx, 1);
        if (openedWindows.length === 0) {
          unlockBody();
        }
      }
    };

    $el.kendoWindow(opts);

    var $kw = $el.closest('.k-window');

    if (isBottom) {
      $kw.addClass('is-bottomsheet');
    }

    if (isSlide) {
      $kw.addClass('is-slideright');
    }
  }

  function initAll(root) {
    var $root = root ? $(root) : $(document);

    $root.find('[data-ui="kendo-window"]').each(function () {
      initOne(this);
    });
  }

  function open(id) {
    var $el = $('#' + id);
    if (!$el.length) return;

    var inst = $el.data('kendoWindow');

    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }

    if (inst) {
      var $kw = $el.closest('.k-window');
      var isBottom = $kw.hasClass('is-bottomsheet');
      var isSlide = $kw.hasClass('is-slideright');

      if (!isBottom && !isSlide) inst.center();
      inst.open();

      // 바텀시트: 하단 고정 + 슬라이드 업
      if (isBottom) {
        $kw.css({
          top: 'auto',
          left: '0',
          bottom: '0',
          width: '100%',
          position: 'fixed'
        });
        $kw.addClass('is-opening');
        $kw.one('animationend', function () {
          $kw.removeClass('is-opening');
        });
      }

      // 슬라이드 라이트: 풀스크린 + 오른쪽에서 인
      if (isSlide) {
        $kw.css({
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          width: '100%',
          height: '100%',
          position: 'fixed'
        });
        $kw.addClass('is-opening');
        $kw.one('animationend', function () {
          $kw.removeClass('is-opening');
        });
      }

      // 렌더 후 스크롤 체크 (다음 프레임)
      setTimeout(function () {
        checkScroll(id);
      }, 0);
    }
  }

  function close(id) {
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');

    if (inst) {
      var $kw = $el.closest('.k-window');
      var isSlide = $kw.hasClass('is-slideright');

      $el.find('.vm-modal-content').removeClass('has-scroll');

      // 슬라이드 라이트만 애니메이션 후 close
      if (isSlide) {
        closeWithAnimation($kw, inst);
        return;
      }

      inst.close();
    }
  }

  // 딤 클릭 시 닫기
  $(document).on('click' + NS, '.k-overlay', function () {
    var ids = openedWindows.slice();
    ids.forEach(function (winId) {
      close(winId);
    });
  });

  window.VmKendoWindow = {
    initAll: initAll,
    open: open,
    close: close,
    refresh: refresh
  };
})(window.jQuery, window);
