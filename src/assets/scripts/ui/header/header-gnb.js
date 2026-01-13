/**
 * @file scripts/ui/header/header-gnb.js
 * @purpose GNB 프로모션(가변) 클리핑 + more 노출 + more 패널 리스트 채우기
 * @assumption
 *  - 클리핑 대상: .gnb-item-promo-list .gnb-promo-list > a.gnb-link
 *  - more 버튼/패널 open/close는 toggle.js가 담당(여긴 리스트/노출 동기화만)
 *  - 패널은 같은 data-toggle-scope 안에 존재: [data-toggle-box="gnb-more"]
 * @markup-control
 *  - [data-toggle-box="gnb-more"][data-gnb-more-mode="all"] : 패널에 전체 메뉴 노출
 *  - (default) data-gnb-more-mode 미지정                : 패널에 접힌 메뉴만 노출
 * @state
 *  - root.is-more-visible : more(+) 버튼 노출
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var ROOT_SEL = '[data-header-gnb]';
  var CLS_MORE_VISIBLE = 'is-more-visible';

  // root 내부 주요 엘리먼트 캐시
  function getEls($root) {
    var $navList = $root.find('[data-gnb-nav-list]').first();
    var $promoItem = $navList.find('.gnb-item-promo-list').first();
    var $promoList = $promoItem.find('.gnb-promo-list').first();

    var $morePanel = $root.find('[data-toggle-box="gnb-more"]').first();

    return {
      $root: $root,

      $navList: $navList,
      $promoItem: $promoItem,
      $promoList: $promoList,

      // 핵심: 직계 자식 a만 확실히 잡기(환경 차이 방지)
      $promoLinks: $promoList.children('a.gnb-link'),

      $moreBtn: $promoItem.find('[data-gnb-more]').first(),
      $moreBox: $promoItem.find('.gnb-more-box').first(),

      $morePanel: $morePanel,
      $moreList: $morePanel.find('[data-gnb-more-list]').first()
    };
  }

  // more 노출 상태(root 클래스) 토글
  function setMoreVisible($root, on) {
    $root.toggleClass(CLS_MORE_VISIBLE, !!on);
  }

  // 프로모션 링크 숨김 상태 초기화
  function resetPromoHidden(els) {
    els.$promoLinks.removeClass('is-hidden');
  }

  // promoList: 가로폭이 부족하면(겹침/오버플로우) 뒤쪽부터 is-hidden 처리
  function applyPromoClip(els) {
    if (!els.$promoList.length) return;

    // promoItem이 남는 폭을 먹지 않게(우측 고정 메뉴와 여백 방지)
    if (els.$promoItem.length) els.$promoItem[0].style.flex = '0 1 auto';

    // 측정 전 초기화
    resetPromoHidden(els);

    var promoEl = els.$promoList[0];
    if (!promoEl) return;

    // 오버플로우가 해소될 때까지 "마지막 보이는 링크"부터 숨김
    // (clientWidth = 실제 보이는 폭, scrollWidth = 콘텐츠 전체 폭)
    var safety = 0;
    while (promoEl.scrollWidth > promoEl.clientWidth + 1) {
      var $lastVisible = els.$promoLinks.not('.is-hidden').last();
      if (!$lastVisible.length) break;

      $lastVisible.addClass('is-hidden');

      safety += 1;
      if (safety > els.$promoLinks.length) break; // 무한루프 방지
    }
  }

  // more 패널 모드 읽기(markup)
  function getMoreMode(els) {
    if (!els.$morePanel.length) return 'hidden';
    var mode = (els.$morePanel.attr('data-gnb-more-mode') || '').toLowerCase();
    return mode === 'all' ? 'all' : 'hidden';
  }

  // 패널 리스트 비우기
  function clearMoreList(els) {
    if (els.$moreList.length) els.$moreList.empty();
  }

  // 링크 1개를 패널용 li로 복제(2줄 케이스 유지: innerHTML 복사)
  function appendMoreItem(els, $a) {
    var href = $a.attr('href') || '#';
    var $li = $('<li/>');
    var $copy = $('<a class="gnb-link" />', {href: href});

    $copy.html($a.html());
    $li.append($copy);
    els.$moreList.append($li);
  }

  // 패널 리스트 채우기(mode=all|hidden)
  function fillMoreList(els, mode) {
    if (!els.$moreList.length) return;

    clearMoreList(els);

    els.$promoLinks.each(function () {
      var $a = $(this);

      // all: 전체 메뉴 그대로
      if (mode === 'all') {
        appendMoreItem(els, $a);
        return;
      }

      // hidden: 접힌 메뉴만
      if ($a.hasClass('is-hidden')) appendMoreItem(els, $a);
    });
  }

  // more 필요 여부: 현재 폭에서 오버플로우가 발생하면 true
  function getNeedMore(els) {
    if (!els.$promoList.length) return false;

    var promoEl = els.$promoList[0];
    return (promoEl.scrollWidth || 0) > (promoEl.clientWidth || 0) + 1; // 1px 오차 보정
  }

  // 클리핑 + more 노출 + 패널 리스트 동기화
  function updatePromoMore(els) {
    if (!els.$promoList.length || !els.$moreBtn.length) return;

    // 측정 왜곡 방지: 먼저 숨김 원복
    resetPromoHidden(els);

    // 패널 모드(마크업 제어)
    var mode = getMoreMode(els);

    // more 노출 여부(접힌 메뉴가 생길 때만)
    var needMore = getNeedMore(els);

    // more 버튼/영역은 needMore일 때만 보임(영역 잡힘 방지)
    setMoreVisible(els.$root, needMore);
    if (els.$moreBox.length) els.$moreBox.toggleClass('is-active', needMore);

    // 접힘 계산은 needMore일 때만 수행
    if (needMore) applyPromoClip(els);
    else resetPromoHidden(els);

    // 패널 리스트 채우기
    // - mode=all  : 접힘 유무와 관계없이 전체 노출(요구사항 케이스)
    // - mode=hidden: 접힌 메뉴가 없으면 비움
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

  // 리사이즈 시 동기화(디바운스)
  function bindResize(els) {
    var t = null;
    $(window).on('resize.headerGnb', function () {
      if (t) window.clearTimeout(t);
      t = window.setTimeout(function () {
        updatePromoMore(els);
      }, 80);
    });
  }

  // 초기 렌더/폰트 지연 대비 재측정
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

  // root 1개 초기화
  function initRoot($root) {
    var els = getEls($root);

    if (els.$promoList.length && els.$moreBtn.length) {
      scheduleInitialMeasure(els);
      bindResize(els);

      // more 클릭 전후로 레이아웃이 바뀌면 재측정
      $root.on('click', '[data-gnb-more]', function () {
        window.setTimeout(function () {
          updatePromoMore(els);
        }, 0);
      });
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
