/**
 * @file scripts/ui/header/header-gnb.js
 * @purpose GNB 프로모션(가변) 클리핑 + more 노출/패널 동기화 + (카테/브랜드) dim 동기화 + (전체카테고리) 1→2→3 hover 연동
 * @assumption
 *  - 클리핑 대상: .gnb-item-promo-list .gnb-promo-list > a.gnb-link
 *  - more/카테/브랜드 패널 open/close는 toggle.js가 담당(본 파일은 상태/리스트/hover 동기화만)
 *  - 전체카테고리 마크업은 box 구조(data-d2-box / data-d3-box)로 고정
 *  - 1뎁스/2뎁스는 a 태그이며 hover는 “옆 컬럼 내용 교체”만 수행(클릭 이동 유지)
 * @markup-control
 *  - [data-toggle-box="gnb-more"][data-gnb-more-mode="all"] : 패널에 전체 메뉴 노출
 *  - (default) data-gnb-more-mode 미지정                : 패널에 접힌 메뉴만 노출
 * @state
 *  - root.is-more-visible : more(+) 버튼 노출
 *  - root.is-dim-on       : dim 노출
 *  - .gnb-category-box.is-active : 해당 depth box 노출
 *  - .gnb-category.is-col2-open  : 2뎁스 컬럼 표시(영역 차지)
 *  - .gnb-category.is-col3-open  : 3뎁스 컬럼 표시(영역 차지)
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

  // root 기준 필수 DOM 캐시(구조 변경 시 셀렉터부터 점검)
  function getEls($root) {
    var $navList = $root.find('[data-gnb-nav-list]').first();
    var $promoItem = $navList.find('.gnb-item-promo-list').first();
    var $promoList = $promoItem.find('.gnb-promo-list').first();
    var $morePanel = $root.find('[data-toggle-box="gnb-more"]').first();

    // 카테/브랜드만 감지/닫기 범위를 제한(다른 패널 영향 방지)
    var $panelScope = $root.find('[data-gnb-panel-scope]').first();

    // dim은 header 하위 위치 변경 가능하므로 header 기준으로 탐색
    var $dim = $root.closest('.vits-header').find('[data-gnb-dim]').first();

    // 전체카테고리 hover 연동 대상(1~4컬럼 래퍼)
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

  // more 필요할 때만 root 클래스 토글(스타일 분기용)
  function setMoreVisible($root, on) {
    $root.toggleClass(CLS_MORE_VISIBLE, !!on);
  }

  // 클리핑 계산 전/후 숨김 상태 원복(누적 방지)
  function resetPromoHidden(els) {
    els.$promoLinks.removeClass('is-hidden');
  }

  // 오버플로우 해소까지 마지막 보이는 링크부터 숨김
  function applyPromoClip(els) {
    if (!els.$promoList.length) return;

    // promoItem이 폭을 과하게 먹지 않게(우측 고정 메뉴 침범 방지)
    if (els.$promoItem.length) els.$promoItem[0].style.flex = '0 1 auto';

    resetPromoHidden(els);

    var promoEl = els.$promoList[0];
    if (!promoEl) return;

    var safety = 0;

    // scrollWidth > clientWidth면 실제 오버플로우(1px 오차 보정)
    while (promoEl.scrollWidth > promoEl.clientWidth + 1) {
      var $lastVisible = els.$promoLinks.not('.is-hidden').last();
      if (!$lastVisible.length) break;

      $lastVisible.addClass('is-hidden');

      safety += 1;
      if (safety > els.$promoLinks.length) break;
    }
  }

  // more 패널 모드(all | hidden)
  function getMoreMode(els) {
    if (!els.$morePanel.length) return 'hidden';
    var mode = (els.$morePanel.attr('data-gnb-more-mode') || '').toLowerCase();
    return mode === 'all' ? 'all' : 'hidden';
  }

  // more 패널 리스트 초기화
  function clearMoreList(els) {
    if (els.$moreList.length) els.$moreList.empty();
  }

  // 링크를 패널용 li로 복제(innerHTML로 2줄 구조 유지)
  function appendMoreItem(els, $a) {
    if (!els.$moreList.length) return;

    var $li = $('<li/>');
    var $copy = $('<a class="gnb-link" />', {href: $a.attr('href') || '#'});
    $copy.html($a.html());
    $li.append($copy);
    els.$moreList.append($li);
  }

  // more 패널 리스트 채우기(all: 전체 / hidden: 접힌 것만)
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

  // more 필요 여부(현재 폭에서 오버플로우 발생 여부)
  function getNeedMore(els) {
    if (!els.$promoList.length) return false;
    var el = els.$promoList[0];
    return (el.scrollWidth || 0) > (el.clientWidth || 0) + 1;
  }

  // 클리핑 + more 노출 + 패널 리스트 동기화
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

  // 리사이즈 시 클리핑/패널 재계산(디바운스)
  function bindResize(els) {
    var t = null;

    $(window).on('resize.headerGnb', function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(function () {
        updatePromoMore(els);
      }, 80);
    });
  }

  // 초기 렌더/폰트 지연 대비(0/120/300ms 재측정)
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

  // 카테/브랜드 열림 상태에 맞춰 dim 동기화
  function updateDim(els) {
    if (!els.$panelScope.length || !els.$dim.length) return;

    var hasOpen =
      els.$panelScope.find('[data-toggle-box="gnb-category"].is-open, [data-toggle-box="gnb-brand"].is-open').length >
      0;

    els.$root.toggleClass(CLS_DIM_ON, hasOpen);
    els.$dim.attr('aria-hidden', hasOpen ? 'false' : 'true');
  }

  // dim 클릭 시 카테/브랜드만 닫기(toggle.js 흐름 유지 위해 버튼 클릭)
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

  // dim 클릭 바인딩(dim 위치 변경 가능하므로 dim에 직접 바인딩)
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

  // 카테/브랜드 class 변화 감지로 dim 자동 동기화
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

  // 컬럼 표시/숨김(영역 차지 제어는 CSS가 담당, JS는 클래스만 토글)
  function setCol2Open(els, on) {
    if (!els.$catRoot.length) return;
    els.$catRoot.toggleClass(CLS_COL2_OPEN, !!on);
    if (!on) setCol3Open(els, false);
  }

  function setCol3Open(els, on) {
    if (!els.$catRoot.length) return;
    els.$catRoot.toggleClass(CLS_COL3_OPEN, !!on);
  }

  // 2뎁스/3뎁스 박스 전부 닫기(잔상 제거)
  function hideDepth2And3(els) {
    if (!els.$catRoot.length) return;

    els.$catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    els.$catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    els.$catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    els.$catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');

    els.$catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    els.$catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');

    setCol2Open(els, false);
  }

  // 3뎁스만 닫기(2뎁스 유지)
  function hideDepth3(els) {
    if (!els.$catRoot.length) return;

    els.$catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');
    els.$catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');
    els.$catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');

    setCol3Open(els, false);
  }

  // 초기 상태 강제(2/3뎁스는 항상 닫힌 상태로 시작)
  function resetCategoryInitial(els) {
    if (!els.$catRoot.length) return;

    els.$catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    els.$catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    els.$catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');
    els.$catRoot.find('[data-gnb-d2] [data-d2] > a[aria-expanded]').attr('aria-expanded', 'false');

    els.$catRoot.find('[data-d2-box]').removeClass('is-active').attr('aria-hidden', 'true');
    els.$catRoot.find('[data-d3-box]').removeClass('is-active').attr('aria-hidden', 'true');

    setCol2Open(els, false);
  }

  // d1에 매칭되는 d2 box가 있고 내부에 [data-d2]가 있으면 true
  function hasDepth2(els, d1Key) {
    if (!els.$catRoot.length || !d1Key) return false;

    var $box = els.$catRoot.find('[data-d2-box="' + d1Key + '"]').first();
    if (!$box.length) return false;

    return $box.find('[data-d2]').length > 0;
  }

  // d2에 매칭되는 d3 box가 있고 내부 li가 있으면 true(“하위 없음”이면 영역 차지 금지)
  function hasDepth3(els, d2Key) {
    if (!els.$catRoot.length || !d2Key) return false;

    var $box = els.$catRoot.find('[data-d3-box="' + d2Key + '"]').first();
    if (!$box.length) return false;

    return $box.find('li').length > 0;
  }

  // leaf용: 1뎁스만 active 유지하고 2/3뎁스는 닫기
  function setDepth12Only(els, $d1Item) {
    if (!els.$catRoot.length) return;

    els.$catRoot.find('[data-gnb-d1] [data-d1]').removeClass('is-active');
    if ($d1Item && $d1Item.length) $d1Item.addClass('is-active');

    els.$catRoot.find('[data-gnb-d1] [data-d1] > a[aria-expanded]').attr('aria-expanded', 'false');

    hideDepth2And3(els);
  }

  // 1뎁스 hover 시 해당 2뎁스 box만 활성화(3뎁스는 닫힌 상태로 유지)
  function showDepth2(els, d1Key) {
    if (!els.$catRoot.length || !d1Key) return;

    var $d2Boxes = els.$catRoot.find('[data-d2-box]');
    var $target = $d2Boxes.filter('[data-d2-box="' + d1Key + '"]');

    $d2Boxes.removeClass('is-active').attr('aria-hidden', 'true');
    els.$catRoot.find('[data-gnb-d2] [data-d2]').removeClass('is-active');

    // 2뎁스가 없으면 col2/col3 자체를 닫아 “영역 차지”를 없앰
    if (!$target.length || $target.find('[data-d2]').length === 0) {
      setCol2Open(els, false);
      hideDepth3(els);
      return;
    }

    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol2Open(els, true);

    // 2뎁스가 바뀌면 3뎁스는 무조건 닫기
    hideDepth3(els);
  }

  // 2뎁스 hover 시 해당 3뎁스 box만 활성화(하위 없으면 col3 닫기)
  function showDepth3(els, d2Key) {
    if (!els.$catRoot.length || !d2Key) return;

    var $d3Boxes = els.$catRoot.find('[data-d3-box]');
    var $target = $d3Boxes.filter('[data-d3-box="' + d2Key + '"]');

    $d3Boxes.removeClass('is-active').attr('aria-hidden', 'true');

    // 3뎁스 하위(li) 없으면 “영역 차지”가 없어야 하므로 col3을 닫음
    if (!$target.length || $target.find('li').length === 0) {
      setCol3Open(els, false);
      return;
    }

    $target.addClass('is-active').attr('aria-hidden', 'false');
    setCol3Open(els, true);
  }

  // 전체카테고리 hover 바인딩(1→2 이동 끊김 방지: leave 기반 지연 닫기)
  function bindCategoryHover(els) {
    if (!els.$catRoot.length) return;

    var $col1 = els.$catRoot.find('.gnb-category-col-1').first();
    var $col2 = els.$catRoot.find('[data-gnb-d2-col]').first();
    var $col3 = els.$catRoot.find('[data-gnb-d3-col]').first();

    var closeT = null;

    // 닫기 타이머 해제(이동 중 끊김 방지)
    function clearCloseTimer() {
      if (closeT) {
        window.clearTimeout(closeT);
        closeT = null;
      }
    }

    // 1→2 이동 시 스침 방지용 지연 닫기
    function scheduleCloseAll(delay) {
      clearCloseTimer();
      closeT = window.setTimeout(function () {
        hideDepth2And3(els);
        closeT = null;
      }, delay || 150);
    }

    // mouseleave에서만 판정 가능한 이동 타겟(relatedTarget)
    function isMoveTo(e, $col) {
      var next = e && e.relatedTarget ? e.relatedTarget : null;
      if (!next || !$col || !$col.length) return false;
      return $(next).closest($col).length > 0;
    }

    // 1뎁스 hover → 2뎁스 교체(leaf면 닫기)
    els.$catRoot
      .find('[data-gnb-d1] [data-d1]')
      .off('mouseenter.headerCatD1 mouseleave.headerCatD1')
      .on('mouseenter.headerCatD1', function () {
        var $item = $(this);
        var key = $item.attr('data-d1');
        if (!key) return;

        clearCloseTimer();

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
        // 1 → 2 이동은 허용
        if (isMoveTo(e, $col2)) return;
        scheduleCloseAll(150);
      });

    // 1뎁스 컬럼 leave: 2로 이동은 허용, 그 외 닫기
    $col1.off('mouseleave.headerCatCol1').on('mouseleave.headerCatCol1', function (e) {
      if (isMoveTo(e, $col2)) return;
      scheduleCloseAll(150);
    });

    // 2뎁스 컬럼 진입 시 닫기 타이머 해제
    $col2.off('mouseenter.headerCatCol2Enter').on('mouseenter.headerCatCol2Enter', function () {
      clearCloseTimer();
    });

    // 2뎁스 hover → 3뎁스 교체(하위 없으면 col3 자체 닫힘)
    els.$catRoot
      .find('[data-gnb-d2-col]')
      .off('mouseenter.headerCatD2 mouseleave.headerCatD2', '[data-d2]')
      .on('mouseenter.headerCatD2', '[data-d2]', function () {
        var $item = $(this);
        var key = $item.attr('data-d2');
        if (!key) return;

        if (!$item.closest('[data-d2-box]').hasClass('is-active')) return;

        clearCloseTimer();

        $item.addClass('is-active').siblings().removeClass('is-active');
        $item.find('> a[aria-expanded]').attr('aria-expanded', 'true');
        $item.siblings().find('> a[aria-expanded]').attr('aria-expanded', 'false');

        // 3뎁스 하위가 없으면 col3을 닫아 “영역 차지” 제거
        if (!hasDepth3(els, key)) {
          setCol3Open(els, false);
          return;
        }

        showDepth3(els, key);
      })
      .on('mouseleave.headerCatD2', '[data-d2]', function (e) {
        // 2 → 3 이동은 허용
        if (isMoveTo(e, $col3)) return;
      });

    // 2뎁스 컬럼 leave: 3으로 이동은 허용, 그 외 닫기
    $col2.off('mouseleave.headerCatCol2').on('mouseleave.headerCatCol2', function (e) {
      if (isMoveTo(e, $col3)) return;
      scheduleCloseAll(120);
    });

    // 3뎁스 컬럼 leave: 2로 돌아가면 3만 닫기, 밖이면 전체 닫기
    $col3.off('mouseleave.headerCatCol3').on('mouseleave.headerCatCol3', function (e) {
      if (isMoveTo(e, $col2)) {
        hideDepth3(els);
        return;
      }
      scheduleCloseAll(120);
    });

    // 패널 전체 leave → 전부 초기화
    els.$catRoot.off('mouseleave.headerCatLeave').on('mouseleave.headerCatLeave', function () {
      clearCloseTimer();
      resetCategoryInitial(els);
    });
  }

  // 카테고리 패널이 열릴 때마다 초기 상태로 강제(기본 is-active/aria-hidden 오염 방지)
  function bindCategoryPanelOpenReset(els) {
    if (!els.$panelScope.length || !els.$catRoot.length) return;

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

  // root 1개 초기화
  function initRoot($root) {
    var els = getEls($root);

    // 프로모션 more 초기화
    if (els.$promoList.length && els.$moreBtn.length) {
      scheduleInitialMeasure(els);
      bindResize(els);

      $root.off('click.headerGnbMore').on('click.headerGnbMore', '[data-gnb-more]', function () {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, 0);
      });
    }

    // dim 초기화
    if (els.$panelScope.length && els.$dim.length) {
      updateDim(els);
      bindDimClose(els);
      bindPanelObserver(els);
    }

    // 전체카테고리 hover 초기화
    if (els.$catRoot.length) {
      resetCategoryInitial(els);
      bindCategoryHover(els);
      bindCategoryPanelOpenReset(els);
    }
  }

  window.UI.headerGnb = {
    // UI.init()에서 호출되는 엔트리
    init: function () {
      $(ROOT_SEL).each(function () {
        initRoot($(this));
      });
    }
  };
})(window.jQuery || window.$, window);
