/**
 * @file scripts/ui/tooltip.js
 * @purpose data-tooltip 기반 툴팁 공통
 * @description
 *  - 버튼 클릭 시 툴팁 토글
 *  - 외부 클릭 시 자동 닫기
 *  - ESC 키로 닫기
 *  - 툴팁 내부 닫기 버튼 지원
 * @option
 *  - data-tooltip="right|left|top|bottom" : 툴팁 위치 (CSS에서 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[tooltip] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var ACTIVE = 'is-open';

  // 툴팁 열기
  function openTooltip($trigger, $content) {
    $content.addClass(ACTIVE).attr('aria-hidden', 'false');
    $trigger.attr('aria-expanded', 'true');
  }

  // 툴팁 닫기
  function closeTooltip($trigger, $content) {
    $content.removeClass(ACTIVE).attr('aria-hidden', 'true');
    $trigger.attr('aria-expanded', 'false');
  }

  // 모든 열린 툴팁 닫기
  function closeAllTooltips() {
    $('.vits-tooltip-content.' + ACTIVE).each(function () {
      var $content = $(this);
      var $tooltip = $content.closest('[data-tooltip]');
      var $trigger = $tooltip.find('.vits-tooltip-trigger');
      closeTooltip($trigger, $content);
    });
  }

  // 툴팁 초기화
  function bindTooltip($tooltip) {
    var $trigger = $tooltip.find('.vits-tooltip-trigger');
    var $content = $tooltip.find('.vits-tooltip-content');
    var $closeBtn = $content.find('.vits-tooltip-heading .button');

    if (!$trigger.length || !$content.length) return;

    // 트리거 버튼 클릭
    $trigger.on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var isOpen = $content.hasClass(ACTIVE);

      // 다른 툴팁 모두 닫기
      closeAllTooltips();

      // 현재 툴팁 토글
      if (isOpen) {
        closeTooltip($trigger, $content);
      } else {
        openTooltip($trigger, $content);
      }
    });

    // 툴팁 내부 닫기 버튼
    if ($closeBtn.length) {
      $closeBtn.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeTooltip($trigger, $content);
        $trigger.focus();
      });
    }

    // 툴팁 내부 클릭 시 전파 방지 (툴팁이 닫히지 않도록)
    $content.on('click', function (e) {
      e.stopPropagation();
    });
  }

  // 외부 클릭 시 모든 툴팁 닫기
  function bindOutsideClick() {
    $(document).on('click.uiTooltip', function (e) {
      if (!$(e.target).closest('[data-tooltip]').length) {
        closeAllTooltips();
      }
    });
  }

  // ESC 키로 툴팁 닫기
  function bindEscKey() {
    $(document).on('keydown.uiTooltip', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        var $openContent = $('.vits-tooltip-content.' + ACTIVE);
        if ($openContent.length) {
          var $tooltip = $openContent.closest('[data-tooltip]');
          var $trigger = $tooltip.find('.vits-tooltip-trigger');
          closeTooltip($trigger, $openContent);
          $trigger.focus();
        }
      }
    });
  }

  window.UI.tooltip = {
    init: function () {
      $('[data-tooltip]').each(function () {
        bindTooltip($(this));
      });

      bindOutsideClick();
      bindEscKey();

      console.log('[tooltip] init');
    }
  };

  console.log('[tooltip] module loaded');
})(window.jQuery || window.$, window);
