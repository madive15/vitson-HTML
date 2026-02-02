/**
 * @file scripts/ui/header/header-search.js
 * @purpose 헤더 검색 패널 UI (최근검색어 + 연관검색어 + 상품패널)
 * @description
 *  - 스코프: [data-header-search] 내부에서만 동작
 *  - 패널: 인풋 포커스/입력 시 열림, ESC/외부클릭 시 닫힘
 *  - 연관검색어 hover → 상품패널 노출 (200ms 딜레이로 숨김)
 * @markup_contract
 *  - 인풋: [data-search-input] + [data-search-clear]
 *  - 패널: [data-search-panel]
 *  - 최근검색어: [data-recent-wrap] > [data-recent-list] > li[data-recent-item]
 *  - 연관검색어: [data-related-wrap] > [data-related-list] > li[data-related-item="key"] > a.search-related-item
 *  - 상품패널: [data-products-wrap] > [data-products-panel="key"] (key로 매핑)
 * @state_classes
 *  - is-open: 패널 열림
 *  - is-active: 연관검색어/상품패널 활성
 *  - is-visible: 삭제버튼 표시
 *  - is-hidden: 전체삭제 숨김
 * @requires jQuery
 */

(function ($, window, document) {
  'use strict';

  if (!$) {
    console.warn('[headerSearch] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var MODULE_KEY = 'headerSearch';
  var SCOPE_SEL = '[data-header-search]';

  var CONFIG = {
    PRODUCTS_TOP_GAP: 100,
    HIDE_DELAY: 200,
    RESIZE_DEBOUNCE: 150,
    VIEWPORT_MARGIN: 10
  };

  var KEY = {ESC: 27};
  var DUMMY_HREFS = ['', '#', '#!'];

  var CLS = {
    OPEN: 'is-open',
    ACTIVE: 'is-active',
    VISIBLE: 'is-visible',
    HIDDEN: 'is-hidden'
  };

  var SEL = {
    INPUT: '[data-search-input]',
    CLEAR_BTN: '[data-search-clear]',
    PANEL: '[data-search-panel]',
    RECENT_WRAP: '[data-recent-wrap]',
    RECENT_LIST: '[data-recent-list]',
    RECENT_ITEM: '[data-recent-item]',
    RECENT_DEL: '[data-recent-del]',
    RECENT_CLEAR: '[data-recent-clear]',
    RELATED_WRAP: '[data-related-wrap]',
    RELATED_LIST: '[data-related-list]',
    RELATED_ITEM: '[data-related-item]',
    RELATED_LINK: '[data-related-item] > a.search-related-item',
    PRODUCTS_WRAP: '[data-products-wrap]',
    PRODUCTS_PANEL: '[data-products-panel]',
    PRODUCTS_TITLE: '[data-products-title]'
  };

  // 고유 ID 생성
  function generateId() {
    return '_' + Math.random().toString(36).slice(2, 11);
  }

  // 셀렉터 이스케이프 (XSS 방지)
  var escapeSelector =
    $.escapeSelector ||
    function (str) {
      return String(str).replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
    };

  // state 조회/저장
  function getState($scope) {
    return $scope.data(MODULE_KEY) || {};
  }

  function setState($scope, state) {
    $scope.data(MODULE_KEY, state);
  }

  // DOM 캐싱 조회
  function getEls($scope) {
    var state = getState($scope);
    if (state.$els) return state.$els;

    state.$els = {
      $input: $scope.find(SEL.INPUT).first(),
      $clearBtn: $scope.find(SEL.CLEAR_BTN).first(),
      $panel: $scope.find(SEL.PANEL).first(),
      $recentWrap: $scope.find(SEL.RECENT_WRAP).first(),
      $recentList: $scope.find(SEL.RECENT_LIST).first(),
      $relatedWrap: $scope.find(SEL.RELATED_WRAP).first(),
      $relatedList: $scope.find(SEL.RELATED_LIST).first(),
      $productsWrap: $scope.find(SEL.PRODUCTS_WRAP).first()
    };
    return state.$els;
  }

  // 인풋 값 조회
  function getInputValue($scope) {
    return String(getEls($scope).$input.val() || '').trim();
  }

  // 타이머/rAF 취소
  function cancelRaf(state) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
  }

  function cancelHideTimer(state) {
    if (state.hideTimer) {
      clearTimeout(state.hideTimer);
      state.hideTimer = null;
    }
  }

  // 상품패널 타이머 정리
  function cleanupProductsTimers(state) {
    cancelHideTimer(state);
    cancelRaf(state);
  }

  // 전체 타이머 정리 (destroy용)
  function cleanupAllTimers(state) {
    cleanupProductsTimers(state);
    if (state.resizeTimer) {
      clearTimeout(state.resizeTimer);
      state.resizeTimer = null;
    }
  }

  // 패널 열기/닫기
  function openPanel($scope) {
    var state = getState($scope);
    if (state.isOpen) return;

    var els = getEls($scope);
    if (!els.$panel.length) return;

    els.$panel.addClass(CLS.OPEN);
    els.$input.attr('aria-expanded', 'true');
    state.isOpen = true;
    setState($scope, state);
  }

  function closePanel($scope, opts) {
    opts = opts || {};
    var state = getState($scope);
    if (!state.isOpen) return;

    var els = getEls($scope);
    els.$panel.removeClass(CLS.OPEN);
    els.$input.attr('aria-expanded', 'false');
    state.isOpen = false;
    setState($scope, state);

    if (!opts.skipProducts) resetProducts($scope);
  }

  // 삭제버튼 동기화
  function syncClearBtn($scope) {
    var $clearBtn = getEls($scope).$clearBtn;
    if ($clearBtn.length) {
      $clearBtn.toggleClass(CLS.VISIBLE, getInputValue($scope).length > 0);
    }
  }

  // 최근검색어 전체삭제 버튼 동기화
  function syncRecentClearBtn($scope) {
    var $recentWrap = getEls($scope).$recentWrap;
    if (!$recentWrap.length) return;

    var $clearBtn = $recentWrap.find(SEL.RECENT_CLEAR);
    if ($clearBtn.length) {
      $clearBtn.toggleClass(CLS.HIDDEN, !$recentWrap.find(SEL.RECENT_ITEM).length);
    }
  }

  // 최근검색어 삭제 핸들러
  function handleRecentDelClick($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    $(e.currentTarget).closest(SEL.RECENT_ITEM).remove();
    syncRecentClearBtn($scope);
  }

  function handleRecentClearAll($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    var $recentList = getEls($scope).$recentList;
    if ($recentList.length) $recentList.empty();
    syncRecentClearBtn($scope);
  }

  // 상품패널 노출 (rAF로 위치 계산)
  function showProducts($scope, key, opts) {
    if (!key) return;
    opts = opts || {};

    var els = getEls($scope);
    var $productsWrap = els.$productsWrap;
    if (!$productsWrap.length) return;

    var $targetPanel = $productsWrap.find('[data-products-panel="' + escapeSelector(key) + '"]').first();
    if (!$targetPanel.length) return;

    var state = getState($scope);
    if (opts.fromResize) {
      state.resizeTimer = null;
      state.baseLeft = null;
    }

    cancelRaf(state);

    var mySeq = (state.showSeq || 0) + 1;
    state.showSeq = mySeq;

    $productsWrap.css({top: '', left: ''}).addClass(CLS.ACTIVE);

    // 타이틀: 마지막 카테고리명만
    var $title = $productsWrap.find(SEL.PRODUCTS_TITLE);
    if ($title.length) {
      var category = String($targetPanel.data('products-category') || '');
      $title.text(category.split(' > ').pop().trim());
    }

    // rAF: 위치 계산 + 뷰포트 오버플로우 보정
    state.rafId = requestAnimationFrame(function () {
      var s = getState($scope);
      if (!s.bound || s.showSeq !== mySeq) return;
      s.rafId = null;

      // baseLeft 캐싱 (최초 1회)
      if (typeof s.baseLeft !== 'number') {
        var posLeft = $productsWrap.position().left;
        s.baseLeft = typeof posLeft === 'number' && !isNaN(posLeft) ? posLeft : 0;
      }

      // top 위치 계산
      var $relatedWrap = els.$relatedWrap;
      var $panel = els.$panel;
      if ($relatedWrap.length && $panel.length) {
        var panelOffset = $panel.offset();
        var wrapOffset = $relatedWrap.offset();
        if (panelOffset && wrapOffset) {
          var gap = parseInt($productsWrap.data('products-gap'), 10) || CONFIG.PRODUCTS_TOP_GAP;
          $productsWrap.css('top', wrapOffset.top - panelOffset.top - gap + 'px');
        }
      }

      // 뷰포트 오른쪽 오버플로우 보정
      var productsOffset = $productsWrap.offset();
      var productsWidth = $productsWrap.outerWidth();
      var viewportWidth = $(window).width();
      if (productsOffset && productsWidth) {
        var rightEdge = productsOffset.left + productsWidth;
        if (rightEdge > viewportWidth) {
          var overflow = rightEdge - viewportWidth + CONFIG.VIEWPORT_MARGIN;
          $productsWrap.css('left', s.baseLeft - overflow + 'px');
        }
      }

      $productsWrap.find(SEL.PRODUCTS_PANEL).removeClass(CLS.ACTIVE);
      $targetPanel.addClass(CLS.ACTIVE);
      setState($scope, s);
    });

    setState($scope, state);
  }

  // 상품패널 UI 초기화
  function resetProductsUI($scope) {
    var els = getEls($scope);
    if (els.$productsWrap.length) {
      els.$productsWrap.removeClass(CLS.ACTIVE).css({top: '', left: ''});
      els.$productsWrap.find(SEL.PRODUCTS_PANEL).removeClass(CLS.ACTIVE);
    }
    if (els.$relatedList.length) {
      els.$relatedList.find(SEL.RELATED_ITEM).removeClass(CLS.ACTIVE);
    }
  }

  // 상품패널 초기화 (state + UI)
  function resetProducts($scope) {
    var state = getState($scope);
    cleanupProductsTimers(state);
    state.showSeq = (state.showSeq || 0) + 1;
    setState($scope, state);
    resetProductsUI($scope);
  }

  // 상품패널 숨김 예약/취소
  function scheduleProductsHide($scope) {
    var state = getState($scope);
    cancelHideTimer(state);
    state.hideTimer = setTimeout(function () {
      resetProducts($scope);
    }, CONFIG.HIDE_DELAY);
    setState($scope, state);
  }

  function cancelProductsHide($scope) {
    var state = getState($scope);
    if (!state.hideTimer) return;
    cancelHideTimer(state);
    setState($scope, state);
  }

  // 연관검색어 hover 핸들러
  function handleRelatedEnter($scope, e) {
    cancelProductsHide($scope);

    var $item = $(e.currentTarget);
    var key = $item.attr('data-related-item');
    if (!key) return;

    var $relatedList = getEls($scope).$relatedList;
    if ($relatedList.length) $relatedList.find(SEL.RELATED_ITEM).removeClass(CLS.ACTIVE);
    $item.addClass(CLS.ACTIVE);

    showProducts($scope, key);
  }

  // 연관검색어 leave (li 내부/상품패널 이동은 무시)
  function handleRelatedLeave($scope, e) {
    var toElement = e.relatedTarget || e.toElement;

    if (toElement && $(toElement).closest(SEL.RELATED_ITEM)[0] === e.currentTarget) return;

    var $productsWrap = getEls($scope).$productsWrap;
    if (toElement && $productsWrap.length && $(toElement).closest($productsWrap).length) return;

    scheduleProductsHide($scope);
  }

  // 연관검색어 클릭 (a 기본동작 허용)
  function handleRelatedClick($scope, e) {
    var href = String($(e.currentTarget).attr('href') || '').trim();
    if (DUMMY_HREFS.indexOf(href) > -1) e.preventDefault();
    closePanel($scope);
  }

  // 상품패널 leave
  function handleProductsLeave($scope, e) {
    var toElement = e.relatedTarget || e.toElement;
    if (toElement && $(toElement).closest(SEL.RELATED_ITEM).length) return;
    scheduleProductsHide($scope);
  }

  // 인풋 핸들러
  function handleInput($scope) {
    syncClearBtn($scope);
    if (getInputValue($scope).length > 0) {
      openPanel($scope);
    } else {
      closePanel($scope);
    }
  }

  function handleClearClick($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    getEls($scope).$input.val('').trigger('focus');
    syncClearBtn($scope);
    closePanel($scope);
  }

  function handleFormSubmit($scope, e) {
    e.preventDefault();
    closePanel($scope);
    var els = getEls($scope);
    els.$input.trigger('blur');
    if (els.$clearBtn.length) els.$clearBtn.removeClass(CLS.VISIBLE);
  }

  // 외부클릭/ESC 핸들러
  function handleOutsideClick($scope, e) {
    var state = getState($scope);
    if (!state.isOpen) return;
    if ($(e.target).closest($scope[0]).length) return;
    closePanel($scope);
  }

  function handleKeydown($scope, e) {
    var state = getState($scope);
    if (!state.isOpen) return;
    if (e.keyCode === KEY.ESC) {
      e.preventDefault();
      closePanel($scope);
      getEls($scope).$input.trigger('blur');
    }
  }

  // 이벤트 바인딩
  function bindScope($scope) {
    var ns = '.' + MODULE_KEY;
    var state = getState($scope);
    if (state.bound) return;

    if (!state.id) state.id = generateId();

    var els = getEls($scope);
    if (!els.$input.length || !els.$panel.length) return;

    setState($scope, state);

    // 인풋
    els.$input.on('input' + ns, function () {
      handleInput($scope);
    });
    els.$input.on('focus' + ns, function () {
      if (getInputValue($scope).length > 0) {
        syncClearBtn($scope);
        openPanel($scope);
      }
    });

    // 삭제버튼
    if (els.$clearBtn.length) {
      els.$clearBtn.on('click' + ns, function (e) {
        handleClearClick($scope, e);
      });
    }

    // 폼
    $scope.on('submit' + ns, function (e) {
      handleFormSubmit($scope, e);
    });

    // 최근검색어 (위임)
    if (els.$recentWrap.length) {
      $scope.on('click' + ns, SEL.RECENT_DEL, function (e) {
        handleRecentDelClick($scope, e);
      });
      $scope.on('click' + ns, SEL.RECENT_CLEAR, function (e) {
        handleRecentClearAll($scope, e);
      });
    }

    // 연관검색어 (위임)
    if (els.$relatedList.length) {
      $scope.on('mouseenter' + ns, SEL.RELATED_ITEM, function (e) {
        handleRelatedEnter($scope, e);
      });
      $scope.on('mouseleave' + ns, SEL.RELATED_ITEM, function (e) {
        handleRelatedLeave($scope, e);
      });
      $scope.on('click' + ns, SEL.RELATED_LINK, function (e) {
        handleRelatedClick($scope, e);
      });
    }

    // 상품패널 (직접)
    if (els.$productsWrap.length) {
      els.$productsWrap.on('mouseenter' + ns, function () {
        cancelProductsHide($scope);
      });
      els.$productsWrap.on('mouseleave' + ns, function (e) {
        handleProductsLeave($scope, e);
      });
    }

    // document 이벤트
    var docNs = ns + state.id;
    $(document).on('click' + docNs, function (e) {
      handleOutsideClick($scope, e);
    });
    $(document).on('keydown' + docNs, function (e) {
      handleKeydown($scope, e);
    });

    // 리사이즈 (디바운스)
    $(window).on('resize' + docNs, function () {
      var state = getState($scope);
      if (state.resizeTimer) clearTimeout(state.resizeTimer);

      state.resizeTimer = setTimeout(function () {
        var s = getState($scope);
        if (s.isOpen && els.$productsWrap.hasClass(CLS.ACTIVE)) {
          var $activeItem = els.$relatedList.find(SEL.RELATED_ITEM + '.' + CLS.ACTIVE);
          var activeKey = $activeItem.attr('data-related-item');
          if (activeKey) {
            showProducts($scope, activeKey, {fromResize: true});
            return;
          }
        }
        s.resizeTimer = null;
        setState($scope, s);
      }, CONFIG.RESIZE_DEBOUNCE);

      setState($scope, state);
    });

    // 초기 동기화
    syncClearBtn($scope);
    if (els.$recentWrap.length) syncRecentClearBtn($scope);

    state.bound = true;
    state.docNs = docNs;
    state.resizeTimer = null;
    setState($scope, state);
  }

  // 이벤트 해제
  function unbindScope($scope) {
    var ns = '.' + MODULE_KEY;
    var state = getState($scope);

    cleanupAllTimers(state);

    var els = getEls($scope);
    els.$input.off(ns);
    els.$clearBtn.off(ns);
    $scope.off(ns);
    if (els.$productsWrap.length) els.$productsWrap.off(ns);

    if (state.docNs) {
      $(document).off(state.docNs);
      $(window).off(state.docNs);
    }

    els.$panel.removeClass(CLS.OPEN);
    resetProductsUI($scope);
    $scope.removeData(MODULE_KEY);
  }

  // Public API
  window.UI.headerSearch = {
    init: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        var $scope = $(this);
        var prev = getState($scope);
        if (prev.bound) unbindScope($scope);

        setState($scope, {
          id: generateId(),
          isOpen: false,
          hideTimer: null,
          resizeTimer: null,
          rafId: null,
          showSeq: 0,
          baseLeft: null,
          bound: false,
          docNs: null,
          $els: null
        });

        bindScope($scope);
      });
    },

    destroy: function (root) {
      var $root = root ? $(root) : $(document);
      $root.find(SCOPE_SEL).each(function () {
        unbindScope($(this));
      });
    },

    refresh: function (root) {
      this.destroy(root);
      this.init(root);
    }
  };
})(window.jQuery || window.$, window, document);
