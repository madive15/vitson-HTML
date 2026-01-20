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
 *
 * @maintenance
 *  - 콘솔 출력 제거(운영 품질)
 *  - 문서 위임 이벤트는 1회만 바인딩(__bound)하여 init 재호출에도 안전하게 유지
 *  - 스코프 인스턴스(data)로 observer/스코프 이벤트를 관리(destroy로 정리)
 *  - 패널 닫힘 감지는 MutationObserver 사용(미지원 환경은 reset 생략: UX 영향만)
 *  - 최근검색어가 0개면 "전체삭제" 버튼도 숨김 처리(syncRecentClearBtn)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var MODULE_KEY = 'headerSearch';

  var SCOPE_SEL = '[data-header-search]';

  var CLS = {
    ACTIVE: 'is-active',
    OPEN: 'is-open',
    HIDDEN: 'is-hidden'
  };

  var PANEL_TARGET = 'search-panel';

  var SEL = {
    INPUT: '.header-search-input input[type="search"]',
    RIGHT: '.search-panel-right',
    RELATED_ITEM: '.search-related-item[data-related-item]',
    RELATED_TEXT: '.search-related-text',
    PRODUCTS_PANEL: '.related-products-panel',

    RECENT_WRAP: '.search-recent',
    RECENT_CLEAR: '[data-recent-clear]',
    RECENT_LIST: '[data-recent-list]',
    RECENT_ITEM: '[data-recent-item]',

    TOGGLE_BOX: '[data-toggle-box="' + PANEL_TARGET + '"]',
    TOGGLE_BTN: '.btn-search[data-toggle-btn][data-toggle-target="' + PANEL_TARGET + '"]'
  };

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

  // innerHTML 출력 안전 처리
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 초성 1글자인지 판별
  function isChoJamo1(k) {
    return typeof k === 'string' && k.length === 1 && CHO.indexOf(k) >= 0;
  }

  // 한글 완성형 음절의 초성 추출
  function getChoseongOfSyllable(ch) {
    var code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return null;

    var sIndex = code - 0xac00;
    var choIndex = Math.floor(sIndex / 588);

    return CHO[choIndex] || null;
  }

  // text에 keyword 하이라이트 적용(<em> 감싸기)
  function applyHighlight(text, keyword) {
    var t = String(text || '');
    var k = String(keyword || '').trim();

    if (!t) return '';
    if (!k) return escHtml(t);

    // 초성 1글자 입력: 해당 초성 음절을 통째로 하이라이트
    if (isChoJamo1(k)) {
      var out1 = '';
      for (var i = 0; i < t.length; i += 1) {
        var ch = t.charAt(i);
        var cho = getChoseongOfSyllable(ch);
        out1 += cho === k ? '<em>' + escHtml(ch) + '</em>' : escHtml(ch);
      }
      return out1;
    }

    // 일반 문자열 하이라이트(정규식 escape)
    var safeK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(safeK, 'g');

    var parts = t.split(re);
    if (parts.length === 1) return escHtml(t);

    var matches = t.match(re) || [];
    var out = '';

    for (var j = 0; j < parts.length; j += 1) {
      out += escHtml(parts[j]);
      if (j < matches.length) out += '<em>' + escHtml(matches[j]) + '</em>';
    }

    return out;
  }

  // toggle.js로 전달되는 focus/click 전파를 차단(자동 오픈 방지)
  function bindPreventAutoToggleOpen($input) {
    if (!$input || !$input.length) return;

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

  // 최근검색어 개수에 따라 "전체삭제" 버튼 노출 동기화
  function syncRecentClearBtn($ctx) {
    if (!$ctx || !$ctx.length) return;

    var $wrap = $ctx.is(SEL.RECENT_WRAP) ? $ctx : $ctx.closest(SEL.RECENT_WRAP);
    if (!$wrap.length) $wrap = $ctx.find(SEL.RECENT_WRAP).first();
    if (!$wrap.length) return;

    var hasAny = $wrap.find(SEL.RECENT_ITEM).length > 0;
    $wrap.find(SEL.RECENT_CLEAR).first().toggleClass(CLS.HIDDEN, !hasAny);
  }

  // 연관검색어 text만 하이라이트(카테고리 label 제외)
  function updateRelatedHighlightTextOnly($scope, keyword) {
    $scope.find(SEL.RELATED_ITEM).each(function () {
      var $it = $(this);
      var $text = $it.find(SEL.RELATED_TEXT).first();
      if (!$text.length) return;

      var rawText = $text.attr('data-raw') || $text.text();
      $text.attr('data-raw', rawText);

      if (!String(rawText || '').trim().length) {
        $text.text(rawText);
        return;
      }

      $text.html(applyHighlight(rawText, keyword));
    });
  }

  // toggle.js(버튼 click) 기반으로 패널 open/close를 제어하는 래퍼
  function createPanelController($scope) {
    var $input = $scope.find(SEL.INPUT).first();
    var $panel = $scope.find(SEL.TOGGLE_BOX).first();

    var $toggleBtn = $scope.find(SEL.TOGGLE_BTN).first();
    if (!$toggleBtn.length) $toggleBtn = $input;

    function isOpen() {
      return $panel.length && $panel.hasClass(CLS.OPEN);
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

  // (테스트키 등) 현재 입력값이 패널 오픈 조건을 만족하는지
  function isAllowedToOpen($scope, value) {
    var testKey = String($scope.attr('data-search-test-key') || '').trim();
    var vt = String(value || '').trim();

    if (!vt.length) return false;
    if (!testKey) return true;
    return vt === testKey;
  }

  // 현재 input 값 기준으로 패널/하이라이트를 동기화(입력/재포커스 공용)
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

  // input 시 오픈 + 값 유지된 재포커스 시 재오픈
  function bindInputOpenPolicy($scope, panelCtrl) {
    $scope.on('input', SEL.INPUT, function () {
      syncPanelByValue($scope, panelCtrl);
    });

    $scope.on('focusin', SEL.INPUT, function () {
      syncPanelByValue($scope, panelCtrl);
    });

    $scope.on('click', SEL.INPUT, function () {
      syncPanelByValue($scope, panelCtrl);
    });
  }

  // 연관검색어 hover -> 우측 상품목록 전환 / 클릭 이동 / 패널 닫힐 때만 초기화
  function bindRelatedProducts($scope, panelCtrl) {
    var $rightCol = $scope.find(SEL.RIGHT).first();

    function resetProducts() {
      if ($rightCol.length) $rightCol.removeClass(CLS.ACTIVE);
      $scope.find(SEL.PRODUCTS_PANEL + '.' + CLS.ACTIVE).removeClass(CLS.ACTIVE);
    }

    function showProducts(key) {
      if (!key) return;
      if (!panelCtrl.isOpen()) return;

      if ($rightCol.length) $rightCol.addClass(CLS.ACTIVE);

      $scope.find(SEL.PRODUCTS_PANEL + '.' + CLS.ACTIVE).removeClass(CLS.ACTIVE);
      var $p = $scope.find(SEL.PRODUCTS_PANEL + '[data-related-products="' + key + '"]');
      if (!$p.length) return;

      $p.addClass(CLS.ACTIVE);
    }

    $scope.on('mouseenter', SEL.RELATED_ITEM, function () {
      showProducts($(this).attr('data-related-item'));
    });

    $scope.on('click', SEL.RELATED_ITEM, function () {
      var href = ($(this).attr('data-related-href') || '').trim();
      if (!href) return;
      window.location.href = href;
    });

    if (panelCtrl.$panel.length && window.MutationObserver) {
      var obs = new MutationObserver(function () {
        if (!panelCtrl.$panel.hasClass(CLS.OPEN)) {
          resetProducts();
        }
      });

      obs.observe(panelCtrl.$panel[0], {attributes: true, attributeFilter: ['class']});
      $scope.data('headerSearchObserver', obs);
    }
  }

  // 최근검색어 전체삭제/개별삭제/이동(문서 위임 1회)
  function bindRecentActionsOnce() {
    if (window.UI.headerSearch && window.UI.headerSearch.__recentBound) return;

    // 전체삭제
    $(document).on('click', SEL.RECENT_CLEAR, function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $wrap = $(this).closest(SEL.RECENT_WRAP);
      if (!$wrap.length) {
        var $scope0 = $(this).closest(SCOPE_SEL);
        if ($scope0.length) $wrap = $scope0.find(SEL.RECENT_WRAP).first();
      }
      if (!$wrap.length) return;

      $wrap.find(SEL.RECENT_LIST).first().empty();
      syncRecentClearBtn($wrap);
    });

    // 개별삭제
    $(document).on('click', '[data-recent-del]', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $wrap = $(this).closest(SEL.RECENT_WRAP);
      $(this).closest(SEL.RECENT_ITEM).remove();
      syncRecentClearBtn($wrap);
    });

    // 항목 클릭 이동
    $(document).on('click', SEL.RECENT_ITEM, function () {
      var href = ($(this).attr('data-href') || '').trim();
      if (!href) return;

      window.location.href = href;
    });

    window.UI.headerSearch = window.UI.headerSearch || {};
    window.UI.headerSearch.__recentBound = true;
  }

  // 스코프 1개 초기화
  function initScope($scope) {
    var prev = $scope.data(MODULE_KEY);
    if (prev && typeof prev.destroy === 'function') prev.destroy();

    var panelCtrl = createPanelController($scope);

    bindPreventAutoToggleOpen(panelCtrl.$input);
    bindInputOpenPolicy($scope, panelCtrl);
    bindRelatedProducts($scope, panelCtrl);

    $scope.find(SEL.RIGHT).removeClass(CLS.ACTIVE);
    $scope.find(SEL.PRODUCTS_PANEL + '.' + CLS.ACTIVE).removeClass(CLS.ACTIVE);
    updateRelatedHighlightTextOnly($scope, '');

    // 초기 UI: 최근검색어 0개면 전체삭제 숨김
    syncRecentClearBtn($scope);

    var api = {
      destroy: function () {
        $scope.off();

        var obs = $scope.data('headerSearchObserver');
        if (obs && typeof obs.disconnect === 'function') obs.disconnect();
        $scope.removeData('headerSearchObserver');

        $scope.removeData(MODULE_KEY);
      }
    };

    $scope.data(MODULE_KEY, api);
  }

  window.UI.headerSearch = window.UI.headerSearch || {};

  window.UI.headerSearch.init = function (root) {
    bindRecentActionsOnce();

    var $root = root ? $(root) : $(document);

    $root.find(SCOPE_SEL).each(function () {
      initScope($(this));
    });
  };

  window.UI.headerSearch.destroy = function (root) {
    var $root = root ? $(root) : $(document);

    $root.find(SCOPE_SEL).each(function () {
      var $scope = $(this);
      var api = $scope.data(MODULE_KEY);

      if (api && typeof api.destroy === 'function') api.destroy();
      else $scope.removeData(MODULE_KEY);
    });
  };
})(window.jQuery || window.$, window, document);
