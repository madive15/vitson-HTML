/**
 * @file scripts/ui/header/header-gnb.js
 * @purpose GNB 프로모션 클리핑 + more 패널 동기화 + (카테/브랜드) dim 동기화 + (전체카테고리) 1→2→3 hover 연동 + is-current 표시 + 추천영역 겹침 방지
 * @assumption
 *  - 클리핑 대상: .gnb-item-promo-list .gnb-promo-list > a.gnb-link
 *  - more/카테/브랜드 패널 open/close는 toggle.js가 담당(본 파일은 상태/리스트/hover 동기화만)
 *  - 전체카테고리 마크업은 box 구조(data-d2-box / data-d3-box)로 고정
 *  - 1뎁스/2뎁스는 a 태그이며 hover는 "옆 컬럼 내용 교체"만 수행(클릭 이동 유지)
 *  - 현재 포커스 표시는 is-current 클래스로만 제어(시각 효과는 CSS에서 관리)
 *  - 2/3뎁스 열림 시 추천영역 밀림으로 인한 잘림 항목 자동 숨김 처리
 * @markup-control
 *  - [data-toggle-box="gnb-more"][data-gnb-more-mode="all"] : 패널에 전체 메뉴 노출
 *  - (default) data-gnb-more-mode 미지정                : 패널에 접힌 메뉴만 노출
 * @state
 *  - root.is-more-visible           : more(+) 버튼 노출
 *  - root.is-dim-on                 : dim 노출
 *  - .gnb-category-box.is-active    : 해당 depth box 노출
 *  - .gnb-category.is-col2-open     : 2뎁스 컬럼 표시(영역 차지)
 *  - .gnb-category.is-col3-open     : 3뎁스 컬럼 표시(영역 차지)
 *  - .gnb-category-item.is-current  : 현재 포커스(마우스 기준) 표시
 *  - .gnb-reco-item.is-hidden       : 추천 항목 잘림으로 인한 숨김 처리
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var ROOT_SEL = '[data-header-gnb]';

  var CLS_MORE_VISIBLE = 'is-more-visible';
  var CLS_DIM_ON = 'is-dim-on';

  var CLS_COL2_OPEN = 'is-col2-open';
  var CLS_COL3_OPEN = 'is-col3-open';
  var CLS_CURRENT = 'is-current';

  // root 하위 필수 요소 캐시
  function getEls($root) {
    var $navList = $root.find('[data-gnb-nav-list]').first();
    var $promoItem = $navList.find('.gnb-item-promo-list').first();
    var $promoList = $promoItem.find('.gnb-promo-list').first();
    var $morePanel = $root.find('[data-toggle-box="gnb-more"]').first();

    var $panelScope = $root.find('[data-gnb-panel-scope]').first();
    var $dim = $root.closest('.vits-header').find('[data-gnb-dim]').first();
    var $catRoot = $root.find('[data-gnb-category]').first();

    return {
      $root: $root,

      $promoItem: $promoItem,
      $promoList: $promoList,
      $promoLinks: $promoList.children('a.gnb-link'),

      $moreBtn: $promoItem.find('[data-gnb-more]').first(),
      $moreBox: $promoItem.find('.gnb-more-box').first(),
      $morePanel: $morePanel,
      $moreList: $morePanel.find('[data-gnb-more-list]').first(),

      $panelScope: $panelScope,
      $dim: $dim,

      $catRoot: $catRoot
    };
  }

  // catRoot 재조회(패널 DOM 교체 대비)
  function getCatRoot(els) {
    if (els && els.$catRoot && els.$catRoot.length) return els.$catRoot;
    if (!els || !els.$root || !els.$root.length) return $();
    return els.$root.find('[data-gnb-category]').first();
  }

  // more 버튼 노출 상태 토글
  function setMoreVisible($root, on) {
    $root.toggleClass(CLS_MORE_VISIBLE, !!on);
  }

  // 클리핑 초기화(is-hidden 제거)
  function resetPromoHidden(els) {
    els.$promoLinks.removeClass('is-hidden');
  }

  // 프로모션 링크 클리핑 적용(overflow 해소까지 마지막 항목부터 숨김)
  function applyPromoClip(els) {
    if (!els.$promoList.length) return;

    if (els.$promoItem.length) els.$promoItem[0].style.flex = '0 1 auto';

    resetPromoHidden(els);

    var promoEl = els.$promoList[0];
    if (!promoEl) return;

    var safety = 0;

    while (promoEl.scrollWidth > promoEl.clientWidth + 1) {
      var $lastVisible = els.$promoLinks.not('.is-hidden').last();
      if (!$lastVisible.length) break;

      $lastVisible.addClass('is-hidden');

      safety += 1;
      if (safety > els.$promoLinks.length) break;
    }
  }

  // more 패널 모드 반환(all: 전체 / hidden: 접힌 것만)
  function getMoreMode(els) {
    if (!els.$morePanel.length) return 'hidden';
    var mode = (els.$morePanel.attr('data-gnb-more-mode') || '').toLowerCase();
    return mode === 'all' ? 'all' : 'hidden';
  }

  // more 패널 리스트 비우기
  function clearMoreList(els) {
    if (els.$moreList.length) els.$moreList.empty();
  }

  // 프로모션 링크를 more 패널용 li로 복제 추가
  function appendMoreItem(els, $a) {
    if (!els.$moreList.length) return;

    var $li = $('<li/>');
    var $copy = $('<a class="gnb-link" />', {href: $a.attr('href') || '#'});
    $copy.html($a.html());
    $li.append($copy);
    els.$moreList.append($li);
  }

  // more 패널 리스트 채우기(모드별)
  function fillMoreList(els, mode) {
    if (!els.$moreList.length) return;

    clearMoreList(els);

    els.$promoLinks.each(function () {
      var $a = $(this);

      if (mode === 'all') {
        appendMoreItem(els, $a);
        return;
      }

      if ($a.hasClass('is-hidden')) appendMoreItem(els, $a);
    });
  }

  // more 필요 여부 판단(overflow 체크)
  function getNeedMore(els) {
    if (!els.$promoList.length) return false;
    var el = els.$promoList[0];
    return (el.scrollWidth || 0) > (el.clientWidth || 0) + 1;
  }

  // 프로모션 클리핑 + more 노출 + 패널 리스트 동기화
  function updatePromoMore(els) {
    if (!els.$promoList.length || !els.$moreBtn.length) return;

    resetPromoHidden(els);

    var mode = getMoreMode(els);
    var needMore = getNeedMore(els);

    setMoreVisible(els.$root, needMore);
    if (els.$moreBox.length) els.$moreBox.toggleClass('is-active', needMore);

    if (needMore) applyPromoClip(els);
    else resetPromoHidden(els);

    if (mode === 'all') {
      fillMoreList(els, 'all');
      return;
    }

    if (!needMore) {
      clearMoreList(els);
      return;
    }

    fillMoreList(els, 'hidden');
  }

  // 리사이즈 이벤트 바인딩(디바운스)
  function bindResize(els) {
    var t = null;

    $(window).on('resize.headerGnb', function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(function () {
        updatePromoMore(els);
      }, 80);
    });
  }

  // 초기 렌더/폰트 로드 대비 재측정
  function scheduleInitialMeasure(els) {
    var delays = [0, 120, 300];

    for (var i = 0; i < delays.length; i += 1) {
      (function (d) {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, d);
      })(delays[i]);
    }
  }

  // 카테고리/브랜드 패널 열림 상태에 따라 dim 동기화
  function updateDim(els) {
    if (!els.$panelScope.length || !els.$dim.length) return;

    var hasOpen =
      els.$panelScope.find('[data-toggle-box="gnb-category"].is-open, [data-toggle-box="gnb-brand"].is-open').length >
      0;

    els.$root.toggleClass(CLS_DIM_ON, hasOpen);
    els.$dim.attr('aria-hidden', hasOpen ? 'false' : 'true');
  }

  // dim 클릭 시 카테고리/브랜드 패널 닫기
  function closePanelsLocal(els) {
    if (!els.$panelScope.length) return;

    els.$panelScope
      .find('[data-toggle-box="gnb-category"].is-open, [data-toggle-box="gnb-brand"].is-open')
      .each(function () {
        var target = $(this).attr('data-toggle-box');
        var $btn = els.$panelScope.find('[data-toggle-btn][data-toggle-target="' + target + '"]').first();

        if ($btn.length) $btn.trigger('click');
        else $(this).removeClass('is-open');
      });
  }

  // dim 클릭 이벤트 바인딩
  function bindDimClose(els) {
    if (!els.$dim.length) return;

    els.$dim.off('click.headerGnbDim').on('click.headerGnbDim', function (e) {
      e.preventDefault();

      closePanelsLocal(els);

      window.setTimeout(function () {
        updateDim(els);
      }, 0);
    });
  }

  // 카테고리/브랜드 패널 open 상태 변화 감지해 dim 자동 동기화
  function bindPanelObserver(els) {
    if (!els.$panelScope.length) return;

    var $cat = els.$panelScope.find('[data-toggle-box="gnb-category"]').first();
    var $brand = els.$panelScope.find('[data-toggle-box="gnb-brand"]').first();

    if (window.MutationObserver && ($cat.length || $brand.length)) {
      var obs = new MutationObserver(function () {
        updateDim(els);
      });

      if ($cat.length) obs.observe($cat[0], {attributes: true, attributeFilter: ['class']});
      if ($brand.length) obs.observe($brand[0], {attributes: true, attributeFilter: ['class']});
      return;
    }

    els.$panelScope.on('click', '[data-toggle-btn]', function () {
      window.setTimeout(function () {
        updateDim(els);
      }, 0);
    });
  }

  // viewport 밖으로 밀려난 추천 항목 숨김 처리
  function updateRecoVisibility(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    var $recoItems = $catRoot.find('.gnb-reco-item');
    if (!$recoItems.length) return;

    $recoItems.removeClass('is-hidden');

    var isCol2Open = $catRoot.hasClass(CLS_COL2_OPEN);
    var isCol3Open = $catRoot.hasClass(CLS_COL3_OPEN);

    if (!isCol2Open && !isCol3Open) return;

    var viewportRight = window.innerWidth || document.documentElement.clientWidth;

    $recoItems.each(function () {
      var itemRect = this.getBoundingClientRect();
      if (itemRect.right > viewportRight) {
        $(this).addClass('is-hidden');
      }
    });
  }

  // 2뎁스 컬럼 열림 상태 토글
  function setCol2Open(els, on) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.toggleClass(CLS_COL2_OPEN, !!on);

    var $col2 = $catRoot.find('[data-gnb-d2-col]').first();
    if ($col2.length) $col2.toggleClass(CLS_COL2_OPEN, !!on);

    if (!on) setCol3Open(els, false);

    updateRecoVisibility(els);
  }

  // 3뎁스 컬럼 열림 상태 토글
  function setCol3Open(els, on) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.toggleClass(CLS_COL3_OPEN, !!on);

    var $col3 = $catRoot.find('[data-gnb-d3-col]').first();
    if ($col3.length) $col3.toggleClass(CLS_COL3_OPEN, !!on);

    updateRecoVisibility(els);
  }

  // 1뎁스 current 초기화
  function clearCurrentD1(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass(CLS_CURRENT);
  }

  // 2뎁스 current 초기화
  function clearCurrentD2(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass(CLS_CURRENT);
  }

  // 3뎁스 current 초기화
  function clearCurrentD3(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;
    $catRoot.find('.gnb-category-list-3 .gnb-category-item').removeClass(CLS_CURRENT);
  }

  // 1뎁스 current 설정
  function setCurrentD1(els, $item) {
    clearCurrentD1(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 2뎁스 current 설정
  function setCurrentD2(els, $item) {
    clearCurrentD2(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 3뎁스 current 설정
  function setCurrentD3(els, $item) {
    clearCurrentD3(els);
    if ($item && $item.length) $item.addClass(CLS_CURRENT);
  }

  // 2/3뎁스 박스 및 상태 전체 닫기
  function hideDepth2And3(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    $catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');

    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');

    setCol2Open(els, false);
  }

  // 3뎁스만 닫기
  function hideDepth3Only(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');

    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');

    clearCurrentD3(els);
    setCol3Open(els, false);
  }

  // 카테고리 패널 초기 상태 리셋
  function resetCategoryInitial(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    $catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');

    $catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');

    setCol2Open(els, false);

    clearCurrentD1(els);
    clearCurrentD2(els);
    clearCurrentD3(els);
  }

  // 2뎁스 하위 항목 존재 여부 체크
  function hasDepth2(els, d1Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d1Key) return false;

    var $box = $catRoot.find('[data-d2-box="' + d1Key + '"]').first();
    if (!$box.length) return false;

    return $box.find('[data-d2]').length > 0;
  }

  // 1뎁스만 활성화(2/3뎁스 닫기)
  function setDepth12Only(els, $d1Item) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    $catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    if ($d1Item && $d1Item.length) $d1Item.addClass('is-active');

    $catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    hideDepth2And3(els);
    setCol3Open(els, false);
  }

  // 2뎁스 박스 활성화
  function showDepth2(els, d1Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d1Key) return;

    var $d2Boxes = $catRoot.find('[data-d2-box]');
    var $target = $d2Boxes.filter('[data-d2-box="' + d1Key + '"]');

    $d2Boxes.removeClass('is-active').attr('aria-hidden', 'true');
    $catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');

    if (!$target.length || $target.find('[data-d2]').length === 0) {
      setCol2Open(els, false);
      hideDepth3Only(els);
      return;
    }

    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol2Open(els, true);

    hideDepth3Only(els);
  }

  // 3뎁스 박스 활성화
  function showDepth3(els, d2Key) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length || !d2Key) return;

    var $d3Boxes = $catRoot.find('[data-d3-box]');
    var $target = $d3Boxes.filter('[data-d3-box="' + d2Key + '"]');

    $d3Boxes.removeClass('is-active').attr('aria-hidden', 'true');

    if (!$target.length || $target.find('li').length === 0) {
      setCol3Open(els, false);
      return;
    }

    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol3Open(els, true);
  }

  // 카테고리 hover 이벤트 바인딩(1→2→3 연동)
  function bindCategoryHover(els) {
    var $catRoot = getCatRoot(els);
    if (!$catRoot.length) return;

    var $col1 = $catRoot.find('.gnb-category-col-1').first();
    var $col2 = $catRoot.find('[data-gnb-d2-col]').first();
    var $col3 = $catRoot.find('[data-gnb-d3-col]').first();

    var activeD2Key = null;

    var closeAllT = null;
    var close3T = null;

    var lastPt = {x: 0, y: 0};

    // 마우스 좌표 추적(relatedTarget 불안정 보정)
    function trackPt(e) {
      if (!e) return;
      if (typeof e.clientX !== 'number' || typeof e.clientY !== 'number') return;
      lastPt.x = e.clientX;
      lastPt.y = e.clientY;
    }

    $catRoot.off('mousemove.headerCatTrack').on('mousemove.headerCatTrack', trackPt);

    // 좌표가 rect 안에 있는지 판정
    function rectContainsPt(rect) {
      if (!rect) return false;
      return lastPt.x >= rect.left && lastPt.x <= rect.right && lastPt.y >= rect.top && lastPt.y <= rect.bottom;
    }

    // 전체 닫기 타이머 해제
    function clearCloseAllTimer() {
      if (closeAllT) {
        window.clearTimeout(closeAllT);
        closeAllT = null;
      }
    }

    // 3뎁스 닫기 타이머 해제
    function clearClose3Timer() {
      if (close3T) {
        window.clearTimeout(close3T);
        close3T = null;
      }
    }

    // 포인터가 카테고리 패널 내부인지 체크
    function isPointerInCatRoot() {
      return rectContainsPt($catRoot[0].getBoundingClientRect());
    }

    // 포인터가 col3 영역인지 체크
    function isPointerInCol3() {
      if (!$col3.length) return false;
      return rectContainsPt($col3[0].getBoundingClientRect());
    }

    // 포인터가 col2 영역인지 체크
    function isPointerInCol2() {
      if (!$col2.length) return false;
      return rectContainsPt($col2[0].getBoundingClientRect());
    }

    // 전체 닫기 예약(패널 밖으로 나간 경우만 실행)
    function scheduleCloseAll(delay) {
      clearCloseAllTimer();
      closeAllT = window.setTimeout(function () {
        if (isPointerInCatRoot()) {
          closeAllT = null;
          return;
        }

        hideDepth2And3(els);
        clearCurrentD1(els);
        clearCurrentD2(els);
        clearCurrentD3(els);
        activeD2Key = null;
        closeAllT = null;
      }, delay || 170);
    }

    // 3뎁스 닫기 예약(col2 벗어난 경우)
    function scheduleClose3(delay) {
      clearClose3Timer();
      close3T = window.setTimeout(function () {
        if (isPointerInCol3()) {
          close3T = null;
          return;
        }

        if (isPointerInCatRoot()) {
          hideDepth3Only(els);
          clearCurrentD2(els); // 2뎁스 선택 상태도 해제
          clearCurrentD3(els);
          activeD2Key = null;
          close3T = null;
          return;
        }

        scheduleCloseAll(0);
        close3T = null;
      }, delay || 200);
    }

    // 패널 진입 시 닫기 타이머 해제
    $catRoot.off('mouseenter.headerCatEnter').on('mouseenter.headerCatEnter', function () {
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // 1뎁스 hover → 2뎁스 교체
    $catRoot
      .find('[data-gnb-d1] [data-d1]')
      .off('mouseenter.headerCatD1 mouseleave.headerCatD1')
      .on('mouseenter.headerCatD1', function (e) {
        trackPt(e);

        var $item = $(this);
        var key = $item.attr('data-d1');
        if (!key) return;

        clearCloseAllTimer();
        clearClose3Timer();

        setCurrentD1(els, $item);
        clearCurrentD2(els);
        clearCurrentD3(els);
        activeD2Key = null;

        if (!hasDepth2(els, key)) {
          setDepth12Only(els, $item);
          return;
        }

        $item.addClass('is-active').siblings().removeClass('is-active');
        $item.find('> a[aria-expanded]').attr('aria-expanded', 'true');
        $item.siblings().find('> a[aria-expanded]').attr('aria-expanded', 'false');

        showDepth2(els, key);
      })
      .on('mouseleave.headerCatD1', function (e) {
        trackPt(e);
        scheduleCloseAll(180);
      });

    // col1 leave 시 닫기 예약
    $col1.off('mouseleave.headerCatCol1').on('mouseleave.headerCatCol1', function (e) {
      trackPt(e);
      scheduleCloseAll(180);
    });

    // col2 진입 시 닫기 타이머 해제
    $col2.off('mouseenter.headerCatCol2Enter').on('mouseenter.headerCatCol2Enter', function (e) {
      trackPt(e);
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // 2뎁스 hover → 3뎁스 교체
    $catRoot
      .find('[data-gnb-d2-col]')
      .off('mouseenter.headerCatD2 mouseleave.headerCatD2', '[data-d2]')
      .on('mouseenter.headerCatD2', '[data-d2]', function (e) {
        trackPt(e);

        var $item = $(this);
        var key = $item.attr('data-d2');
        if (!key) return;

        if (!$item.closest('[data-d2-box]').hasClass('is-active')) return;

        clearCloseAllTimer();
        clearClose3Timer();

        setCurrentD2(els, $item);
        clearCurrentD3(els);
        activeD2Key = key;

        $item.addClass('is-active').siblings().removeClass('is-active');
        $item.find('> a[aria-expanded]').attr('aria-expanded', 'true');
        $item.siblings().find('> a[aria-expanded]').attr('aria-expanded', 'false');

        showDepth3(els, key);
      })
      .on('mouseleave.headerCatD2', '[data-d2]', function (e) {
        trackPt(e);

        // 3뎁스로 이동하는 경우 타이머만 예약하고 col3 진입 시 취소됨
        scheduleClose3(200);
      });

    // col2 leave 시 좌표 기반 판정(2→3 이동/스크롤바 오판 보정)
    $col2.off('mouseleave.headerCatCol2').on('mouseleave.headerCatCol2', function (e) {
      trackPt(e);

      if (isPointerInCol3()) {
        clearCloseAllTimer();
        clearClose3Timer();
        return;
      }

      if (isPointerInCol2()) {
        clearCloseAllTimer();
        clearClose3Timer();
        return;
      }

      scheduleClose3(160);
    });

    // col2 스크롤 중 닫기 타이머 해제
    $col2.off('scroll.headerCatCol2Scroll').on('scroll.headerCatCol2Scroll', function () {
      clearCloseAllTimer();
      clearClose3Timer();
    });

    // col3 진입 시 2뎁스 current 유지
    $col3.off('mouseenter.headerCatCol3Enter').on('mouseenter.headerCatCol3Enter', function (e) {
      trackPt(e);

      clearCloseAllTimer();
      clearClose3Timer();

      if (!activeD2Key) return;

      var $d2Item = $catRoot.find('[data-gnb-d2] [data-d2="' + activeD2Key + '"]').first();
      if ($d2Item.length) setCurrentD2(els, $d2Item);
    });

    // 3뎁스 항목 hover 시 current 표시
    $col3
      .off('mouseenter.headerCatD3Item mouseleave.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item')
      .on('mouseenter.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item', function (e) {
        trackPt(e);
        setCurrentD3(els, $(this));
      })
      .on('mouseleave.headerCatD3Item', '.gnb-category-list-3 .gnb-category-item', function (e) {
        trackPt(e);
        clearCurrentD3(els); // 3뎁스 선택 상태 해제
      });

    // col3 leave 시 처리
    $col3.off('mouseleave.headerCatCol3').on('mouseleave.headerCatCol3', function (e) {
      trackPt(e);

      if (isPointerInCol2()) {
        scheduleClose3(130);
        return;
      }

      activeD2Key = null;
      clearCurrentD2(els);
      clearCurrentD3(els);
      scheduleCloseAll(200);
    });

    // 패널 leave 시 초기화
    $catRoot.off('mouseleave.headerCatLeave').on('mouseleave.headerCatLeave', function () {
      clearCloseAllTimer();
      clearClose3Timer();
      resetCategoryInitial(els);
      activeD2Key = null;
    });
  }

  // 카테고리 패널 open 시 상태 초기화 바인딩
  function bindCategoryPanelOpenReset(els) {
    if (!els.$panelScope.length) return;

    var $catPanel = els.$panelScope.find('[data-toggle-box="gnb-category"]').first();
    if (!$catPanel.length) return;

    if (window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if ($catPanel.hasClass('is-open')) resetCategoryInitial(els);
      });

      obs.observe($catPanel[0], {attributes: true, attributeFilter: ['class']});
      return;
    }

    els.$panelScope
      .off('click.headerCatOpenReset')
      .on('click.headerCatOpenReset', '[data-toggle-btn][data-toggle-target="gnb-category"]', function () {
        window.setTimeout(function () {
          if ($catPanel.hasClass('is-open')) resetCategoryInitial(els);
        }, 0);
      });
  }

  // root 단위 초기화
  function initRoot($root) {
    var els = getEls($root);

    if (els.$promoList.length && els.$moreBtn.length) {
      scheduleInitialMeasure(els);
      bindResize(els);

      $root.off('click.headerGnbMore').on('click.headerGnbMore', '[data-gnb-more]', function () {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, 0);
      });
    }

    if (els.$panelScope.length && els.$dim.length) {
      updateDim(els);
      bindDimClose(els);
      bindPanelObserver(els);
    }

    if (getCatRoot(els).length) {
      resetCategoryInitial(els);
      bindCategoryHover(els);
      bindCategoryPanelOpenReset(els);
    }
  }

  window.UI.headerGnb = {
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);
