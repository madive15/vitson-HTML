/**
 * @file scripts/ui/header/header-brand.js
 * @description 브랜드 탭 + 검색 + 칩 필터링
 * @requires jQuery
 *
 * @fires brand:tabChange - 탭 전환 시 { tabId }
 * @fires brand:subChange - 서브탭 전환 시 { groupId, subId }
 * @fires brand:chipAdd - 칩 추가 시 { keyword }
 * @fires brand:chipRemove - 칩 삭제 시 { keyword }
 * @fires brand:reset - 초기화 시
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  // ── 상수 ──

  var SEL = {
    ROOT: '[data-brand-tab]',
    SCOPE: '[data-brand-search-scope]',
    PANEL: '.gnb-panel-brand',

    // 탭
    TAB_TRIGGER: '[data-tab-trigger]',
    TAB_PANEL: '[data-tab-panel]',
    TAB_GROUP: '[data-tab-group]',
    SUB_TRIGGER: '[data-sub-trigger]',
    SUB_PANEL: '[data-sub-panel]',

    // 검색
    FORM: '[data-brand-search]',
    INPUT: '[data-brand-search-input]',
    CHIPS: '[data-brand-chips]',
    CHIP: '[data-chip-value]',
    CHIP_REMOVE: '[data-chip-action="remove"]',
    RESET: '[data-brand-chips-reset]',

    // 브랜드 목록
    BRAND_LINK: '[data-brand-item]',
    COUNT: '[data-brand-count]'
  };

  var CLS = {
    ACTIVE: 'is-active',
    OPEN: 'is-open',
    SEARCH_MODE: 'is-search-mode'
  };

  var TAB = {
    ALL: 'all',
    KOREAN: 'korean',
    ALPHABET: 'alphabet',
    EMPTY: 'empty'
  };

  // 스크롤 유무 판단 → 클래스 토글
  function checkScroll($root) {
    var el = $root.find('.tab-panels')[0];
    if (!el) return;

    var hasScroll = el.scrollHeight > el.clientHeight;
    $root.toggleClass('has-scroll', hasScroll);
  }

  // 칩 컨테이너 찾기
  function getChips($root) {
    return $root.closest(SEL.PANEL).find(SEL.CHIPS);
  }

  // XSS 방지용 이스케이프
  function escapeHtml(str) {
    return $('<div>').text(str).html();
  }

  // 1차 탭 활성화 (전체/가나다순/알파벳순)
  function activateTab($root, tabId) {
    var $triggers = $root.find(SEL.TAB_TRIGGER);
    var $panels = $root.find(SEL.TAB_PANEL);
    var $groups = $root.find(SEL.TAB_GROUP);
    var $targetTrigger = $root.find('[data-tab-trigger="' + tabId + '"]');
    var $targetPanel = $root.find('[data-tab-panel="' + tabId + '"]');

    if (!$targetPanel.length) return;

    // 전체 비활성
    $triggers.removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $panels.removeClass(CLS.ACTIVE).attr('hidden', '');
    $groups.removeClass(CLS.OPEN);

    // 선택 활성
    $targetTrigger.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    // 그룹 탭이면 서브탭 영역 열기
    var $group = $targetTrigger.closest(SEL.TAB_GROUP);
    if ($group.length) $group.addClass(CLS.OPEN);

    $root.trigger('brand:tabChange', {tabId: tabId});
  }

  // 2차 서브탭 활성화 (ㄱ,ㄴ,ㄷ... / A,B,C...Z)
  function activateSubTab($root, $group, subId) {
    var groupId = $group.data('tabGroup');
    var $parentPanel = $root.find('[data-tab-panel="' + groupId + '"]');
    var $subTriggers = $group.find(SEL.SUB_TRIGGER);
    var $subPanels = $parentPanel.find(SEL.SUB_PANEL);
    var $targetTrigger = $group.find('[data-sub-trigger="' + subId + '"]');
    var $targetPanel = $parentPanel.find('[data-sub-panel="' + subId + '"]');

    if (!$targetPanel.length) return;

    $subTriggers.removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $subPanels.removeClass(CLS.ACTIVE).attr('hidden', '');

    $targetTrigger.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    $root.trigger('brand:subChange', {groupId: groupId, subId: subId});
  }

  // 검색 모드 진입 → 전체 탭으로 고정
  function enterSearchMode($root) {
    $root.addClass(CLS.SEARCH_MODE);
    activateTab($root, TAB.ALL);
    $root.find(SEL.TAB_GROUP).removeClass(CLS.OPEN);
  }

  // 검색 모드 해제 → 기본 탭으로 복원
  function resetTabState($root) {
    var defaultTab = $root.data('defaultTab') || TAB.KOREAN;

    $root.removeClass(CLS.SEARCH_MODE);
    activateTab($root, defaultTab);

    // 서브탭 첫번째로 복원
    var $group = $root.find('[data-tab-group="' + defaultTab + '"]');
    if ($group.length) {
      var $firstSub = $group.find(SEL.SUB_TRIGGER).first();
      if ($firstSub.length) {
        activateSubTab($root, $group, $firstSub.data('subTrigger'));
      }
    }
  }

  // 칩 버튼 HTML 생성
  function createChipHtml(keyword, isActive) {
    var escaped = escapeHtml(keyword);
    return (
      '<button type="button" class="vits-chip-button type-outline' +
      (isActive ? ' ' + CLS.ACTIVE : '') +
      '" data-chip-value="' +
      escaped +
      '">' +
      '<span class="text">' +
      escaped +
      '</span>' +
      '<span class="icon" aria-hidden="true" data-chip-action="remove">' +
      '<i class="ic ic-x"></i></span></button>'
    );
  }

  // 칩 유무에 따라 컨테이너 표시/숨김
  function toggleChipsVisibility($chips) {
    var hasChips = $chips.find(SEL.CHIP).length > 0;
    $chips.attr('hidden', hasChips ? null : '');
  }

  // 현재 활성 칩의 키워드 반환
  function getActiveKeyword($chips) {
    var $active = $chips.find(SEL.CHIP + '.' + CLS.ACTIVE);
    return $active.length ? String($active.data('chipValue')).toLowerCase() : '';
  }

  // 특정 칩 활성화 (나머지 비활성)
  function setActiveChip($chips, keyword) {
    $chips.find(SEL.CHIP).removeClass(CLS.ACTIVE);
    if (keyword) {
      $chips.find('[data-chip-value="' + keyword + '"]').addClass(CLS.ACTIVE);
    }
  }

  // 전체 패널 초기 상태로 복원 (링크 전부 표시 + 카운트 복원)
  function resetAllPanel($root) {
    var $panelAll = $root.find('[data-tab-panel="' + TAB.ALL + '"]');
    var $links = $panelAll.find(SEL.BRAND_LINK);

    $links.removeAttr('hidden');
    $panelAll.find(SEL.COUNT).text($links.length);
  }

  // 활성 칩 키워드로 브랜드 목록 필터링
  function filterBrands($root) {
    var $chips = getChips($root);
    var $panelAll = $root.find('[data-tab-panel="' + TAB.ALL + '"]');
    var $panelEmpty = $root.find('[data-tab-panel="' + TAB.EMPTY + '"]');
    var keyword = getActiveKeyword($chips);

    // 키워드 없으면 초기 상태로
    if (!keyword) {
      resetAllPanel($root);
      $panelEmpty.attr('hidden', '');
      resetTabState($root);
      return;
    }

    enterSearchMode($root);

    // 필터링 실행
    var matchCount = 0;
    $panelAll.find(SEL.BRAND_LINK).each(function () {
      var $link = $(this);
      var isMatch = $link.text().toLowerCase().indexOf(keyword) > -1;
      $link.attr('hidden', isMatch ? null : '');
      if (isMatch) matchCount++;
    });

    // 결과 카운트 업데이트
    $panelAll.find(SEL.COUNT).text(matchCount);

    // 결과 없으면 빈 상태 표시
    if (matchCount === 0) {
      $panelAll.attr('hidden', '');
      $panelEmpty.removeAttr('hidden');
    } else {
      $panelEmpty.attr('hidden', '');
    }
  }

  // 칩 추가 (중복 시 활성화만)
  function addChip($root, keyword) {
    var $chips = getChips($root);
    var $reset = $chips.find(SEL.RESET);
    var trimmed = $.trim(keyword);

    if (!trimmed) return;

    var $existing = $chips.find('[data-chip-value="' + trimmed + '"]');

    // 중복이면 활성화만
    if ($existing.length) {
      setActiveChip($chips, trimmed);
      filterBrands($root);
      return;
    }

    setActiveChip($chips, '');
    $(createChipHtml(trimmed, true)).insertBefore($reset);
    toggleChipsVisibility($chips);
    filterBrands($root);

    $root.trigger('brand:chipAdd', {keyword: trimmed});
  }

  // 칩 삭제 (활성 칩 삭제 시 마지막으로 이동 후 필터링)
  function removeChip($root, $chip) {
    var $chips = getChips($root);
    var wasActive = $chip.hasClass(CLS.ACTIVE);
    var keyword = $chip.data('chipValue');

    $chip.remove();
    toggleChipsVisibility($chips);

    // 활성 칩 삭제 시 남은 마지막 칩 활성화
    if (wasActive) {
      var $last = $chips.find(SEL.CHIP).last();
      if ($last.length) {
        setActiveChip($chips, $last.data('chipValue'));
      }
    }

    filterBrands($root);
    $root.trigger('brand:chipRemove', {keyword: keyword});
  }

  // 전체 초기화 (칩 전부 삭제 + 탭 복원)
  function resetAll($root) {
    var $chips = getChips($root);

    $chips.find(SEL.CHIP).remove();
    toggleChipsVisibility($chips);
    filterBrands($root);

    $root.trigger('brand:reset');
  }

  function bindEvents($root) {
    var $panel = $root.closest(SEL.PANEL);
    var $form = $panel.find(SEL.FORM);
    var $input = $panel.find(SEL.INPUT);
    var $chips = getChips($root);

    // 1차 탭 클릭
    $root.on('click.brand', SEL.TAB_TRIGGER, function (e) {
      e.preventDefault();
      if ($root.hasClass(CLS.SEARCH_MODE)) return;
      activateTab($root, $(this).data('tabTrigger'));
    });

    // 2차 서브탭 클릭
    $root.on('click.brand', SEL.SUB_TRIGGER, function (e) {
      e.preventDefault();
      var $btn = $(this);
      activateSubTab($root, $btn.closest(SEL.TAB_GROUP), $btn.data('subTrigger'));
    });

    // 검색 폼 제출
    $form.on('submit.brand', function (e) {
      e.preventDefault();
      addChip($root, $input.val());
      $input.val('');
    });

    // 칩 클릭 → 해당 칩 활성화 후 필터링
    $chips.on('click.brand', SEL.CHIP, function (e) {
      if ($(e.target).closest(SEL.CHIP_REMOVE).length) return;
      setActiveChip($chips, $(this).data('chipValue'));
      filterBrands($root);
    });

    // 칩 X 버튼 → 삭제
    $chips.on('click.brand', SEL.CHIP_REMOVE, function (e) {
      e.stopPropagation();
      removeChip($root, $(this).closest(SEL.CHIP));
    });

    // 초기화 버튼
    $chips.on('click.brand', SEL.RESET, function () {
      resetAll($root);
    });

    // 초기 스크롤 체크
    checkScroll($root);

    // 탭 전환 시 스크롤 체크
    $root.on('brand:tabChange brand:subChange', function () {
      checkScroll($root);
    });

    // 필터링 후 스크롤 체크
    $root.on('brand:chipAdd brand:chipRemove brand:reset', function () {
      checkScroll($root);
    });
  }

  window.UI.Brand = {
    init: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if ($root.data('brandInit')) return;

        $root.data('brandInit', true);
        bindEvents($root);
      });
    },

    destroy: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        var $panel = $root.closest(SEL.PANEL);

        $root.off('.brand');
        $panel.find(SEL.FORM).off('.brand');
        getChips($root).off('.brand');
        $root.removeData('brandInit');
      });
    },

    // 외부에서 칩 추가
    addChip: function ($root, keyword) {
      addChip($($root), keyword);
    },

    // 외부에서 초기화
    reset: function ($root) {
      resetAll($($root));
    },

    // 외부에서 탭 전환
    showTab: function ($root, tabId) {
      activateTab($($root), tabId);
    }
  };
})(window.jQuery || window.$, window);
