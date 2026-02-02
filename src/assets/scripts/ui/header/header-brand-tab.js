/**
 * @file scripts/ui/header/header-brand-tab.js
 * @description 브랜드 탭 + 서브탭 슬라이드
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var SEL = {
    ROOT: '[data-brand-tab]',
    TAB_TRIGGER: '[data-tab-trigger]',
    TAB_PANEL: '[data-tab-panel]',
    TAB_GROUP: '[data-tab-group]',
    SUB_TRIGGER: '[data-sub-trigger]',
    SUB_PANEL: '[data-sub-panel]'
  };

  var CLS = {ACTIVE: 'is-active', OPEN: 'is-open'};

  function activateTab($root, tabId) {
    var $triggers = $root.find(SEL.TAB_TRIGGER);
    var $panels = $root.find(SEL.TAB_PANEL);
    var $groups = $root.find(SEL.TAB_GROUP);

    var $targetTrigger = $root.find('[data-tab-trigger="' + tabId + '"]');
    var $targetPanel = $root.find('[data-tab-panel="' + tabId + '"]');

    if (!$targetPanel.length) return;

    // 모든 탭 비활성
    $triggers.removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $panels.removeClass(CLS.ACTIVE).attr('hidden', '');
    $groups.removeClass(CLS.OPEN);

    // 선택 탭 활성
    $targetTrigger.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    // 그룹 탭이면 그룹 열기
    var $group = $targetTrigger.closest(SEL.TAB_GROUP);
    if ($group.length) {
      $group.addClass(CLS.OPEN);
    }

    $root.trigger('brandTab:change', {tabId: tabId});
  }

  function activateSubTab($group, subId) {
    var $subTriggers = $group.find(SEL.SUB_TRIGGER);
    var groupId = $group.data('tabGroup');
    var $root = $group.closest(SEL.ROOT);
    var $parentPanel = $root.find('[data-tab-panel="' + groupId + '"]');
    var $subPanels = $parentPanel.find(SEL.SUB_PANEL);

    var $targetTrigger = $group.find('[data-sub-trigger="' + subId + '"]');
    var $targetPanel = $parentPanel.find('[data-sub-panel="' + subId + '"]');

    if (!$targetPanel.length) return;

    $subTriggers.removeClass(CLS.ACTIVE).attr({'aria-selected': 'false', tabindex: '-1'});
    $subPanels.removeClass(CLS.ACTIVE).attr('hidden', '');

    $targetTrigger.addClass(CLS.ACTIVE).attr({'aria-selected': 'true', tabindex: '0'});
    $targetPanel.addClass(CLS.ACTIVE).removeAttr('hidden');

    $root.trigger('brandTab:subChange', {groupId: groupId, subId: subId});
  }

  function bindEvents($root) {
    // 1차 탭 클릭
    $root.on('click.brandTab', SEL.TAB_TRIGGER, function (e) {
      e.preventDefault();
      var tabId = $(this).data('tabTrigger');
      activateTab($root, tabId);
    });

    // 서브탭 클릭
    $root.on('click.brandTab', SEL.SUB_TRIGGER, function (e) {
      e.preventDefault();
      var $btn = $(this);
      var $group = $btn.closest(SEL.TAB_GROUP);
      var subId = $btn.data('subTrigger');
      activateSubTab($group, subId);
    });
  }

  window.UI.BrandTab = {
    init: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if ($root.data('brandTabInit')) return;
        $root.data('brandTabInit', true);
        bindEvents($root);
      });
      console.log('[brandTab] init');
    },

    destroy: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        $(this).off('.brandTab').removeData('brandTabInit');
      });
    }
  };

  console.log('[brandTab] module loaded');
})(window.jQuery || window.$, window);
