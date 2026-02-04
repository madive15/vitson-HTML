/**
 * @file kendo-window.js
 * @description Kendo Window 자동 초기화 모듈
 * @note 컨텐츠 DOM 변화 시 자동으로 스크롤 체크 + 센터 정렬
 *
 * VitsKendoWindow.open('myWindow');
 * VitsKendoWindow.close('myWindow');
 * VitsKendoWindow.refresh('myWindow');
 * VitsKendoWindow.initAll();
 */

(function (window) {
  'use strict';

  var BODY_LOCK_CLASS = 'is-kendo-window-open';
  var scrollY = 0;
  var openedWindows = [];

  // 컨텐츠 변화 감지용 Observer 저장 (id → observer)
  var contentObservers = {};

  // 디바운스 타이머 저장 (id → timerId)
  var debounceTimers = {};
  var DEBOUNCE_DELAY = 80;

  function parseJsonSafe(str) {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }

  function lockBody() {
    var $ = window.jQuery;
    if ($('body').hasClass(BODY_LOCK_CLASS)) return;

    var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    scrollY = window.pageYOffset || 0;
    $('body')
      .addClass(BODY_LOCK_CLASS)
      .css({
        position: 'fixed',
        top: -scrollY + 'px',
        left: 0,
        right: 0,
        overflow: 'hidden',
        paddingRight: scrollbarWidth + 'px'
      });
  }

  function unlockBody() {
    var $ = window.jQuery;
    if (!$('body').hasClass(BODY_LOCK_CLASS)) return;

    $('body').removeClass(BODY_LOCK_CLASS).css({
      position: '',
      top: '',
      left: '',
      right: '',
      overflow: '',
      paddingRight: ''
    });
    window.scrollTo(0, scrollY);
  }

  function checkScroll(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);

    $el.find('[data-scroll-check]').each(function () {
      $(this).toggleClass('has-scroll', this.scrollHeight > this.clientHeight);
    });
  }

  /**
   * 스크롤 체크 + 센터 정렬 (디바운스 적용)
   * - 컨텐츠 DOM 변화, 수동 호출 모두 이 함수로 통일
   */
  function refresh(id) {
    var $ = window.jQuery;

    clearTimeout(debounceTimers[id]);
    debounceTimers[id] = setTimeout(function () {
      var $el = $('#' + id);
      var inst = $el.data('kendoWindow');
      if (!inst) return;

      checkScroll(id);

      var $kWindow = $el.closest('.k-window');
      var prevTop = $kWindow.position().top;

      inst.center();

      var nextTop = $kWindow.position().top;

      if (prevTop === nextTop) return;

      // 이전 위치로 되돌린 뒤 다음 프레임에서 transition 이동
      $kWindow.css({
        top: prevTop,
        transition: 'none'
      });

      requestAnimationFrame(function () {
        $kWindow.css({
          top: nextTop,
          transition: 'top 0.2s ease'
        });

        $kWindow.one('transitionend', function () {
          $kWindow.css('transition', '');
        });
      });
    }, DEBOUNCE_DELAY);
  }

  /**
   * 컨텐츠 영역 MutationObserver 시작
   * - open 시 호출, close 시 해제
   */
  function observeContent(id) {
    if (!window.MutationObserver) return;
    if (contentObservers[id]) return; // 중복 방지

    var $ = window.jQuery;
    var $el = $('#' + id);
    var $content = $el.find('.vits-modal-content');
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

  /**
   * 컨텐츠 영역 MutationObserver 해제
   */
  function disconnectContent(id) {
    if (contentObservers[id]) {
      contentObservers[id].disconnect();
      delete contentObservers[id];
    }

    clearTimeout(debounceTimers[id]);
    delete debounceTimers[id];
  }

  function initOne(el) {
    var $ = window.jQuery;
    var $el = $(el);

    if ($el.data('kendoWindow')) return;

    var optRaw = $el.attr('data-opt') || '{}';
    var opts = parseJsonSafe(optRaw) || {};
    var id = $el.attr('id');

    var defaultOpts = {
      title: false,
      visible: false,
      modal: true,
      pinned: true,
      draggable: false,
      resizable: false,
      actions: [],
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

    var finalOpts = $.extend({}, defaultOpts, opts);

    // draggable: true면 헤더를 드래그 핸들로 자동 지정
    if (finalOpts.draggable === true) {
      finalOpts.draggable = {
        dragHandle: '.vits-modal-header'
      };
    }

    $el.kendoWindow(finalOpts);

    // draggable일 때 클래스 추가
    if (finalOpts.draggable) {
      $el.closest('.k-window').addClass('is-draggable');
    }
  }

  function initAll(root) {
    var $ = window.jQuery;
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

  function open(id, options) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    if (!$el.length) return;

    var inst = $el.data('kendoWindow');

    if (!inst) {
      initOne($el[0]);
      inst = $el.data('kendoWindow');
    }

    if (options && typeof options.onOpen === 'function') {
      inst.unbind('open').bind('open', function () {
        lockBody();
        if (openedWindows.indexOf(id) === -1) {
          openedWindows.push(id);
        }
        observeContent(id);
        options.onOpen.call(inst);
      });
    }

    if (inst) {
      inst.center().open();

      setTimeout(function () {
        checkScroll(id);
      }, 0);
    }
  }

  function close(id) {
    var $ = window.jQuery;
    var $el = $('#' + id);
    var inst = $el.data('kendoWindow');

    if (inst) {
      $el.find('.vits-modal-content').removeClass('has-scroll');
      inst.close();
    }
  }

  // 리사이즈 시 열린 윈도우 중앙 재정렬 + 스크롤 체크
  window.jQuery(window).on('resize', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var inst = $('#' + id).data('kendoWindow');
      if (inst) {
        inst.center();
        checkScroll(id);
      }
    });
  });

  // 딤 클릭 시 닫기
  window.jQuery(document).on('click', '.k-overlay', function () {
    var $ = window.jQuery;
    openedWindows.forEach(function (id) {
      var inst = $('#' + id).data('kendoWindow');
      if (inst) inst.close();
    });
  });

  window.VitsKendoWindow = {
    initAll: initAll,
    autoBindStart: autoBindStart,
    open: open,
    close: close,
    refresh: refresh
  };
})(window);
