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

  var KEY = {ESC: 27, UP: 38, DOWN: 40, ENTER: 13, TAB: 9};
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
    clearRelatedNavigation($scope);
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

  // 화살표 키로 연관검색어 탐색
  function navigateRelated($scope, direction) {
    var els = getEls($scope);
    if (!els.$relatedList.length) return;

    var $items = els.$relatedList.find(SEL.RELATED_ITEM);
    if (!$items.length) return;

    var $current = $items.filter('.' + CLS.ACTIVE);
    var currentIdx = $current.length ? $items.index($current) : -1;
    var nextIdx;

    if (direction === 'down') {
      nextIdx = currentIdx < $items.length - 1 ? currentIdx + 1 : 0;
    } else {
      nextIdx = currentIdx > 0 ? currentIdx - 1 : $items.length - 1;
    }

    // 기존 활성 해제
    $items.removeClass(CLS.ACTIVE);

    var $next = $items.eq(nextIdx);
    $next.addClass(CLS.ACTIVE);

    // aria-activedescendant 갱신
    els.$input.attr('aria-activedescendant', $next[0].id || '');

    // 상품패널 연동 (hover와 동일)
    cancelProductsHide($scope);
    var key = $next.attr('data-related-item');
    if (key) {
      showProducts($scope, key);
    } else {
      resetProducts($scope);
    }

    // 연관검색어 링크에 실제 포커스 이동 (탭 이동과 동일한 스타일링)
    var $nextLink = $next.find('a').first();
    if ($nextLink.length) $nextLink[0].focus();
  }

  // 화살표 탐색 해제 (패널 닫힐 때)
  function clearRelatedNavigation($scope) {
    var els = getEls($scope);
    els.$input.removeAttr('aria-activedescendant');
    if (els.$relatedList.length) {
      els.$relatedList.find(SEL.RELATED_ITEM).removeClass(CLS.ACTIVE);
    }
  }

  // 상품패널 leave
  function handleProductsLeave($scope, e) {
    var toElement = e.relatedTarget || e.toElement;
    if (toElement && $(toElement).closest(SEL.RELATED_ITEM).length) return;
    scheduleProductsHide($scope);
  }

  // 인풋 핸들러 - 포커스 중이면 빈 값이어도 패널 유지
  function handleInput($scope) {
    syncClearBtn($scope);
    // 타이핑 시 화살표 탐색 상태 초기화
    clearRelatedNavigation($scope);
    var state = getState($scope);
    if (state.escClosing) return;
    var isFocused = getEls($scope).$input.is(':focus');
    if (isFocused || getInputValue($scope).length > 0) {
      openPanel($scope);
    } else {
      closePanel($scope);
    }
  }

  // 지우기 후 포커스 유지, 패널 열린 상태 유지
  function handleClearClick($scope, e) {
    e.preventDefault();
    e.stopPropagation();
    getEls($scope).$input.val('').trigger('focus');
    syncClearBtn($scope);
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
      syncClearBtn($scope);
      var state = getState($scope);
      if (state.escClosing) return;
      openPanel($scope);
    });

    els.$input.on('click' + ns, function () {
      var state = getState($scope);
      if (!state.isOpen) openPanel($scope);
    });

    // 인풋 키보드: ESC(패널 닫기), ↑↓(연관검색어 탐색), Enter(활성 항목 이동)
    els.$input.on('keydown' + ns, function (e) {
      var code = e.keyCode;
      var state = getState($scope);
      var $active;
      var $link;

      // ESC: 패널 닫기
      if (code === KEY.ESC) {
        state.escClosing = true;
        setState($scope, state);
        if (state.isOpen) closePanel($scope);
        setTimeout(function () {
          var s = getState($scope);
          s.escClosing = false;
          setState($scope, s);
          syncClearBtn($scope);
        }, 0);
        return;
      }

      // ↑↓: 연관검색어 탐색
      if (code === KEY.UP || code === KEY.DOWN) {
        if (!state.isOpen) return;
        e.preventDefault(); // 커서 이동 방지
        navigateRelated($scope, code === KEY.DOWN ? 'down' : 'up');
        return;
      }

      // Enter: 활성 연관검색어 링크 이동
      if (code === KEY.ENTER) {
        $active = els.$relatedList.length ? els.$relatedList.find(SEL.RELATED_ITEM + '.' + CLS.ACTIVE) : $();
        $link = $active.length ? $active.find('a').first() : $();

        if ($active.length) {
          e.preventDefault(); // 폼 submit 방지

          if ($link.length) {
            var href = String($link.attr('href') || '').trim();
            if (DUMMY_HREFS.indexOf(href) === -1) {
              window.location.href = href;
            }
          }
          closePanel($scope);
        }
        // 활성 항목 없으면 기본 폼 submit 동작
      }

      // Tab: 활성 연관검색어가 있으면 해당 링크로 포커스 이동
      if (code === KEY.TAB && !e.shiftKey) {
        $active = els.$relatedList.length ? els.$relatedList.find(SEL.RELATED_ITEM + '.' + CLS.ACTIVE) : $();
        $link = $active.length ? $active.find('a').first() : $();

        if ($active.length && $link.length) {
          // 인풋 바로 다음에 탭이 가도록 중간 요소들을 일시적으로 탭 순서에서 제외
          var $skippable = $scope.find('a, button, input, [tabindex]').not(els.$input).not($link);
          $skippable.each(function () {
            var orig = this.getAttribute('tabindex');
            this.setAttribute('data-orig-tabindex', orig !== null ? orig : '');
            this.setAttribute('tabindex', '-1');
          });

          // 다음 프레임에서 복원
          requestAnimationFrame(function () {
            $skippable.each(function () {
              var orig = this.getAttribute('data-orig-tabindex');
              if (orig === '') {
                this.removeAttribute('tabindex');
              } else {
                this.setAttribute('tabindex', orig);
              }
              this.removeAttribute('data-orig-tabindex');
            });
          });
        }
      }
    });

    // 스코프 내 클릭 시 인풋 포커스 유지
    $scope.on('mousedown' + ns, function (e) {
      if ($(e.target).closest(SEL.INPUT).length) return;
      if ($(e.target).closest(SEL.RELATED_LINK).length) return;
      if ($(e.target).closest(SEL.PRODUCTS_WRAP).length) return;
      e.preventDefault();
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

      // 연관검색어 링크에서 화살표 탐색 (탭 이동 후 화살표키)
      $scope.on('keydown' + ns, SEL.RELATED_LINK, function (e) {
        var code = e.keyCode;

        // ↑↓: 연관검색어 간 이동
        if (code === KEY.UP || code === KEY.DOWN) {
          e.preventDefault();

          var $currentItem = $(e.currentTarget).closest(SEL.RELATED_ITEM);
          var $items = els.$relatedList.find(SEL.RELATED_ITEM);
          var currentIdx = $items.index($currentItem);
          var nextIdx;

          if (code === KEY.DOWN) {
            nextIdx = currentIdx < $items.length - 1 ? currentIdx + 1 : 0;
          } else {
            nextIdx = currentIdx > 0 ? currentIdx - 1 : $items.length - 1;
          }

          var $nextLink = $items.eq(nextIdx).find('a').first();
          if ($nextLink.length) $nextLink.trigger('focus');

          var $nextItem = $items.eq(nextIdx);
          $items.removeClass(CLS.ACTIVE);
          $nextItem.addClass(CLS.ACTIVE);

          cancelProductsHide($scope);
          var key = $nextItem.attr('data-related-item');
          if (key) {
            showProducts($scope, key);
          } else {
            resetProducts($scope);
          }
          return;
        }

        // Tab: 활성 상품패널의 첫 번째 상품 링크로 이동
        if (code === KEY.TAB && !e.shiftKey) {
          var $item = $(e.currentTarget).closest(SEL.RELATED_ITEM);
          var itemKey = $item.attr('data-related-item');
          if (itemKey && els.$productsWrap.length) {
            var $panel = els.$productsWrap.find('[data-products-panel="' + escapeSelector(itemKey) + '"]').first();
            var $firstProduct = $panel.find('a').first();
            if ($firstProduct.length) {
              e.preventDefault();
              $firstProduct[0].focus();
            }
          }
        }
      });

      // 연관검색어 링크 포커스 시 상품패널 연동 (탭 이동 대응)
      $scope.on('focus' + ns, SEL.RELATED_LINK, function () {
        var $item = $(this).closest(SEL.RELATED_ITEM);
        var $items = els.$relatedList.find(SEL.RELATED_ITEM);

        $items.removeClass(CLS.ACTIVE);
        $item.addClass(CLS.ACTIVE);

        cancelProductsHide($scope);
        var key = $item.attr('data-related-item');
        if (key) {
          showProducts($scope, key);
        } else {
          resetProducts($scope);
        }
      });

      // 상품패널로 포커스 이동 시에는 상품패널 유지
      $scope.on('blur' + ns, SEL.RELATED_LINK, function (e) {
        var toElement = e.relatedTarget;
        if (toElement && $(toElement).closest(SEL.PRODUCTS_WRAP).length) return;
        scheduleProductsHide($scope);
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

      // 상품패널 내 마지막 링크에서 Tab → 다음 연관검색어로 이동
      els.$productsWrap.on('keydown' + ns, 'a', function (e) {
        if (e.keyCode !== KEY.TAB || e.shiftKey) return;

        var $thisLink = $(e.currentTarget);
        var $panel = $thisLink.closest(SEL.PRODUCTS_PANEL);
        var $panelLinks = $panel.find('a');

        // 마지막 링크가 아니면 브라우저 기본 Tab 동작
        if ($panelLinks.index($thisLink) < $panelLinks.length - 1) return;

        // 현재 활성 연관검색어의 다음 항목으로 이동
        var panelKey = $panel.attr('data-products-panel');
        var $items = els.$relatedList.find(SEL.RELATED_ITEM);
        var $currentRelated = $items.filter('[data-related-item="' + escapeSelector(panelKey) + '"]');
        var currentIdx = $items.index($currentRelated);
        var nextIdx = currentIdx < $items.length - 1 ? currentIdx + 1 : -1;

        if (nextIdx > -1) {
          e.preventDefault();
          var $nextLink = $items.eq(nextIdx).find('a').first();
          if ($nextLink.length) $nextLink[0].focus();
        }
        // 마지막 연관검색어면 브라우저 기본 Tab 동작 (스코프 밖으로)
      });
    }

    // 패널 내 ESC: 패널 닫기 + 인풋으로 포커스 복귀
    $scope.on('keydown' + ns, SEL.PANEL, function (e) {
      if (e.keyCode !== KEY.ESC) return;
      var state = getState($scope);
      state.escClosing = true;
      setState($scope, state);
      if (state.isOpen) closePanel($scope);
      els.$input[0].focus();
      setTimeout(function () {
        var s = getState($scope);
        s.escClosing = false;
        setState($scope, s);
      }, 0);
    });

    // relatedTarget이 null이면 스코프 내 포커스 이동으로 간주
    $scope.on('focusout' + ns, function (e) {
      var toElement = e.relatedTarget;
      if (!toElement) return;
      if ($(toElement).closest($scope).length) return;
      var state = getState($scope);
      if (state.isOpen) closePanel($scope);
    });

    // document 이벤트
    var docNs = ns + state.id;
    $(document).on('click' + docNs, function (e) {
      handleOutsideClick($scope, e);
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
    if (!els.$input.attr('aria-expanded')) {
      els.$input.attr('aria-expanded', 'false');
    }

    // 연관검색어 항목 id 부여 (aria-activedescendant용)
    if (els.$relatedList.length) {
      els.$relatedList.find(SEL.RELATED_ITEM).each(function (i) {
        if (!this.id) this.id = state.id + '_related_' + i;
      });
    }
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
