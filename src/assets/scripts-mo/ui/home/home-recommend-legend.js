/**
 * @file scripts-mo/ui/home/home-recommend-legend.js
 * @description 홈 레전드 추천상품 2줄 균등 분배용 CSS 변수(--legend-cols) 컬럼 수 제어
 * @contract
 * - SCSS 레이아웃은 .recommend-list 기준
 * - JS 타겟은 [data-ui='recommend-legend'] 기준
 * - [data-ui='recommend-legend'] 직계 자식 요소 개수를 기준으로 컬럼 수 계산
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  var ROOT_SELECTOR = '.vm-home-recommend.product-legend';
  var LIST_SELECTOR = "[data-ui='recommend-legend']";
  var DATA_INIT_KEY = 'homeRecommendLegendInit';
  var GRID_ROW_COUNT = 2;

  // 레전드 섹션 내 실제 리스트 요소 조회
  function getList($root) {
    return $root.find(LIST_SELECTOR).first();
  }

  // 레전드 리스트의 직계 상품 아이템 조회
  function getItems($list) {
    return $list.children();
  }

  // 상품 개수 기준으로 2줄 균등 분배용 컬럼 수 적용
  function applyCols($list, $items) {
    if (!$list.length) return;

    var cols = Math.ceil($items.length / GRID_ROW_COUNT);
    $list[0].style.setProperty('--legend-cols', cols);
  }

  // JS에서 주입한 동적 컬럼 수 제거
  function resetCols($list) {
    if (!$list.length) return;
    $list[0].style.removeProperty('--legend-cols');
  }

  // 현재 레전드 리스트 상태 기준으로 컬럼 수 갱신
  function update($root) {
    var $list = getList($root);
    if (!$list.length) return;

    var $items = getItems($list);

    if (!$items.length) {
      resetCols($list);
      return;
    }

    applyCols($list, $items);
  }

  // DOM이 이미 있으면 즉시 처리, 없으면 MutationObserver로 삽입 감지
  var observer = null;

  function initExisting() {
    var found = false;

    $(ROOT_SELECTOR).each(function (_, el) {
      var $root = $(el);

      update($root);

      if (!$root.data(DATA_INIT_KEY)) {
        $root.data(DATA_INIT_KEY, true);
      }

      found = true;
    });

    return found;
  }

  // 루트 + 자식까지 모두 준비됐는지 확인
  function isReady() {
    var ready = false;

    $(ROOT_SELECTOR).each(function (_, el) {
      var $list = getList($(el));
      if (getItems($list).length) ready = true;
    });

    return ready;
  }

  function init() {
    // DOM + 자식까지 있으면 즉시 처리
    if (initExisting() && isReady()) {
      disconnectObserver();
      return;
    }

    // body가 아직 없으면 DOMContentLoaded 후 재시도
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function handler() {
        document.removeEventListener('DOMContentLoaded', handler);
        init();
      });
      return;
    }

    // ROOT 없거나 자식 미삽입 → observer로 감지
    if (observer) return;

    observer = new MutationObserver(function () {
      if (initExisting() && isReady()) {
        disconnectObserver();
      }
    });

    observer.observe(document.body, {childList: true, subtree: true});
  }

  function disconnectObserver() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  // 레전드 섹션 destroy 시 동적 컬럼 수 초기화
  function destroy() {
    // observer 정리
    disconnectObserver();

    $(ROOT_SELECTOR).each(function (_, el) {
      var $root = $(el);
      if (!$root.data(DATA_INIT_KEY)) return;

      resetCols(getList($root));
      $root.removeData(DATA_INIT_KEY);
    });
  }

  window.UI = window.UI || {};
  window.UI.homeRecommendLegend = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
