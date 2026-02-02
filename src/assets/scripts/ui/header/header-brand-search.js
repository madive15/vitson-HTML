/**
 * @file scripts/ui/header/header-brand-search.js
 * @description 브랜드 검색 + 칩 관리
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var SEL = {
    ROOT: '[data-brand-search]',
    SCOPE: '[data-brand-search-scope]',
    INPUT: '[data-brand-search-input]',
    CHIPS: '[data-brand-chips]',
    CHIP: '[data-chip-action="remove"]',
    RESET: '[data-brand-chips-reset]'
  };

  function getChips($root) {
    return $root.closest(SEL.SCOPE).find(SEL.CHIPS);
  }

  function createChipHtml(keyword) {
    var escaped = $('<div>').text(keyword).html();
    return (
      '<button type="button" class="vits-chip-button type-outline" ' +
      'data-chip-action="remove" data-chip-value="' +
      escaped +
      '">' +
      '<span class="text">' +
      escaped +
      '</span>' +
      '<span class="icon" aria-hidden="true"><i class="ic ic-x"></i></span>' +
      '</button>'
    );
  }

  function toggleChipsVisibility($chips) {
    var hasChips = $chips.find('[data-chip-value]').length > 0;
    $chips.attr('hidden', hasChips ? null : '');
  }

  function addChip($root, keyword) {
    var $chips = getChips($root);
    var $reset = $chips.find(SEL.RESET);

    if ($chips.find('[data-chip-value="' + keyword + '"]').length) return;

    $(createChipHtml(keyword)).insertBefore($reset);
    toggleChipsVisibility($chips);
    $root.trigger('brandSearch:add', {keyword: keyword});
  }

  function removeChip($chip) {
    var $chips = $chip.closest(SEL.CHIPS);
    var keyword = $chip.data('chipValue');

    $chip.remove();
    toggleChipsVisibility($chips);
    $chips.trigger('brandSearch:remove', {keyword: keyword});
  }

  function resetAll($chips) {
    $chips.find('[data-chip-value]').remove();
    toggleChipsVisibility($chips);
    $chips.trigger('brandSearch:reset');
  }

  function bindEvents($root) {
    var $input = $root.find(SEL.INPUT);
    var $chips = getChips($root);

    $root.on('submit.brandSearch', function (e) {
      e.preventDefault();
      var keyword = $.trim($input.val());
      if (!keyword) return;

      addChip($root, keyword);
      $input.val('').focus();
    });

    $chips.on('click.brandSearch', SEL.CHIP, function () {
      removeChip($(this));
    });

    $chips.on('click.brandSearch', SEL.RESET, function () {
      resetAll($chips);
    });
  }

  window.UI.BrandSearch = {
    init: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        if ($root.data('brandSearchInit')) return;
        $root.data('brandSearchInit', true);
        bindEvents($root);
      });
      console.log('[brandSearch] init');
    },

    destroy: function ($scope) {
      $($scope || SEL.ROOT).each(function () {
        var $root = $(this);
        getChips($root).off('.brandSearch');
        $root.off('.brandSearch').removeData('brandSearchInit');
      });
    },

    add: function ($root, keyword) {
      addChip($root, keyword);
    },
    reset: function ($root) {
      resetAll(getChips($root));
    }
  };

  console.log('[brandSearch] module loaded');
})(window.jQuery || window.$, window);
