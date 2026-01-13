/**
 * @file scripts/ui/header/header-search.js
 * @purpose 헤더 검색 패널 UI(참고용)
 * @description
 *  - 입력 발생 시에만 패널 오픈(기본 정책)
 *  - 값이 남아있는 상태로 재포커스되면 조건 만족 시 패널 재오픈(운영 UX)
 *  - 최근검색어 삭제/이동, 연관검색어 hover 상품패널 전환/클릭 이동
 *  - 하이라이트: 연관검색어 text만(카테고리 label 제외), 초성 1글자(ㄱ~ㅎ) 입력 지원
 * @requires jQuery
 * @note toggle.js의 is-open 토글과 연동(패널 open/close는 click 트리거)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[header-search] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var SCOPE_SEL = '[data-header-search]';
  var ACTIVE = 'is-active';
  var OPEN = 'is-open';
  var PANEL_TARGET = 'search-panel';

  // escHtml: innerHTML 출력 안전 처리
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 초성 하이라이트(ㄱ~ㅎ 1글자) 지원
  var CHO = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ'
  ];

  // isChoJamo1: 초성 1글자인지 판별
  function isChoJamo1(k) {
    return typeof k === 'string' && k.length === 1 && CHO.indexOf(k) >= 0;
  }

  // getChoseongOfSyllable: 한글 완성형 음절의 초성 추출
  function getChoseongOfSyllable(ch) {
    var code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;
    var sIndex = code - 0xac00;
    var choIndex = Math.floor(sIndex / 588);
    return CHO[choIndex] || null;
  }

  // applyHighlight: text에 keyword 하이라이트 적용(<em> 감싸기)
  function applyHighlight(text, keyword) {
    var t = String(text || '');
    var k = String(keyword || '').trim();

    if (!t) return '';
    if (!k) return escHtml(t);

    // 초성 1글자 입력: 해당 초성 음절(예: 조/자/지)을 통째로 하이라이트
    if (isChoJamo1(k)) {
      var out1 = '';
      for (var i = 0; i < t.length; i++) {
        var ch = t.charAt(i);
        var cho = getChoseongOfSyllable(ch);
        if (cho === k) out1 += '<em>' + escHtml(ch) + '</em>';
        else out1 += escHtml(ch);
      }
      return out1;
    }

    // 일반 문자열 하이라이트
    var safeK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(safeK, 'g');

    var parts = t.split(re);
    if (parts.length === 1) return escHtml(t);

    var matches = t.match(re) || [];
    var out = '';

    for (var j = 0; j < parts.length; j++) {
      out += escHtml(parts[j]);
      if (j < matches.length) out += '<em>' + escHtml(matches[j]) + '</em>';
    }
    return out;
  }

  // bindPreventAutoToggleOpen: focus/click이 toggle.js로 전달되어 패널이 "자동 오픈"되는 케이스 차단
  function bindPreventAutoToggleOpen($scope) {
    var $input = $scope.find('.header-search-input input[type="search"]').first();
    if (!$input.length) return;

    var el = $input[0];
    el.addEventListener(
      'focusin',
      function (e) {
        e.stopPropagation();
      },
      true
    );
    el.addEventListener(
      'click',
      function (e) {
        e.stopPropagation();
      },
      true
    );
  }

  // bindRecentActions: 최근검색어 전체삭제/개별삭제/이동
  function bindRecentActions($scope) {
    $scope.on('click', '[data-recent-clear]', function (e) {
      e.preventDefault();
      $scope.find('[data-recent-list]').empty();
    });

    $scope.on('click', '[data-recent-del]', function (e) {
      e.preventDefault();
      e.stopPropagation();
      $(this).closest('[data-recent-item]').remove();
    });

    $scope.on('click', '[data-recent-item]', function () {
      var href = ($(this).attr('data-href') || '').trim();
      if (!href) return;
      window.location.href = href;
    });
  }

  // updateRelatedHighlightTextOnly: 연관검색어 "text만" 하이라이트(카테고리 label 제외)
  function updateRelatedHighlightTextOnly($scope, keyword) {
    $scope.find('.search-related-item').each(function () {
      var $it = $(this);
      var $text = $it.find('.search-related-text').first();

      if (!$text.length) return; // text 없으면(카테고리만) 아무 처리 안 함

      var rawText = $text.attr('data-raw') || $text.text();
      $text.attr('data-raw', rawText);

      if (!String(rawText || '').trim().length) {
        $text.text(rawText);
        return;
      }

      $text.html(applyHighlight(rawText, keyword));
    });
  }

  // createPanelController: toggle.js(버튼 click) 기반으로 패널 open/close를 제어하는 래퍼
  function createPanelController($scope) {
    var $input = $scope.find('.header-search-input input[type="search"]').first();
    var $panel = $scope.find('[data-toggle-box="' + PANEL_TARGET + '"]').first();

    // toggle.js 단일화: 패널 제어는 클래스 직접 제어 대신 click 트리거로 위임
    var $toggleBtn = $scope.find('.btn-search[data-toggle-btn][data-toggle-target="' + PANEL_TARGET + '"]').first();
    if (!$toggleBtn.length) $toggleBtn = $input;

    function isOpen() {
      return $panel.length && $panel.hasClass(OPEN);
    }

    function openPanel() {
      if (isOpen()) return;
      $toggleBtn.trigger('click');
    }

    function closePanel() {
      if (!isOpen()) return;
      $toggleBtn.trigger('click');
    }

    return {
      $input: $input,
      $panel: $panel,
      isOpen: isOpen,
      open: openPanel,
      close: closePanel
    };
  }

  // data-search-test-key가 있으면 테스트 모드(해당 글자 입력 시에만 오픈)
  // isAllowedToOpen: (테스트키 등) 현재 입력값이 패널 오픈 조건을 만족하는지
  function isAllowedToOpen($scope, value) {
    var testKey = String($scope.attr('data-search-test-key') || '').trim();
    var vt = String(value || '').trim();

    if (!vt.length) return false;
    if (!testKey) return true; // 운영 모드: 한 글자라도 있으면 OK
    return vt === testKey; // 테스트 모드: 지정 글자와 정확히 일치할 때만 OK
  }

  // syncPanelByValue: 현재 input 값 기준으로 패널/하이라이트를 동기화(입력/재포커스 공용)
  function syncPanelByValue($scope, panelCtrl) {
    var v = panelCtrl.$input.val();
    var vt = String(v || '').trim();

    if (!isAllowedToOpen($scope, vt)) {
      panelCtrl.close();
      updateRelatedHighlightTextOnly($scope, '');
      return;
    }

    panelCtrl.open();
    updateRelatedHighlightTextOnly($scope, vt);
  }

  // bindInputOpenPolicy: input 시에만 오픈(기본) + 값 유지된 재포커스 시 재오픈(요구사항)
  function bindInputOpenPolicy($scope, panelCtrl) {
    // 입력 발생 시 동기화
    $scope.on('input', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });

    // 재포커스 시(값이 남아있으면) 동일하게 동기화
    $scope.on('focusin', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });

    // 클릭으로 다시 커서 찍는 케이스도 동일 처리
    $scope.on('click', '.header-search-input input[type="search"]', function () {
      syncPanelByValue($scope, panelCtrl);
    });
  }

  // bindRelatedProducts: 연관검색어 hover -> 우측 상품목록 전환 / 클릭 이동 / 패널 닫힐 때만 초기화
  function bindRelatedProducts($scope, panelCtrl) {
    var ITEM_SEL = '.search-related-item[data-related-item]';
    var $rightCol = $scope.find('.search-panel-right').first();

    function resetProducts() {
      if ($rightCol.length) $rightCol.removeClass(ACTIVE);
      $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
    }

    function showProducts(key) {
      if (!key) return;
      if (!panelCtrl.isOpen()) return;

      if ($rightCol.length) $rightCol.addClass(ACTIVE);

      $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
      var $p = $scope.find('.related-products-panel[data-related-products="' + key + '"]');
      if (!$p.length) return;

      $p.addClass(ACTIVE);
    }

    $scope.on('mouseenter', ITEM_SEL, function () {
      showProducts($(this).attr('data-related-item'));
    });

    $scope.on('click', ITEM_SEL, function () {
      var href = ($(this).attr('data-related-href') || '').trim();
      if (!href) return;
      window.location.href = href;
    });

    // toggle.js가 class만 토글하므로, 닫힘 시점 감지는 class 변경 관찰로 처리
    // 패널이 닫힐 때만 우측 초기화(요구사항: 패널 열린 동안은 마지막 hover 유지)
    if (panelCtrl.$panel.length && window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if (!panelCtrl.$panel.hasClass(OPEN)) {
          resetProducts();
        }
      });
      obs.observe(panelCtrl.$panel[0], {attributes: true, attributeFilter: ['class']});
    }
  }

  function initScope($scope) {
    var panelCtrl = createPanelController($scope);

    bindPreventAutoToggleOpen($scope);
    bindRecentActions($scope);
    bindInputOpenPolicy($scope, panelCtrl);
    bindRelatedProducts($scope, panelCtrl);

    // 초기 상태: 우측 상품목록 숨김 + 하이라이트 제거
    $scope.find('.search-panel-right').removeClass(ACTIVE);
    $scope.find('.related-products-panel.' + ACTIVE).removeClass(ACTIVE);
    updateRelatedHighlightTextOnly($scope, '');
  }

  window.UI.headerSearch = {
    init: function () {
      $(SCOPE_SEL).each(function () {
        initScope($(this));
      });
      console.log('[header-search] init');
    }
  };

  console.log('[header-search] module loaded');
})(window.jQuery || window.$, window);
