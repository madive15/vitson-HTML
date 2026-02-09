/**
 * @file scripts-mo/ui/common/tooltip.js
 * @description data-tooltip 기반 툴팁 공통 (모바일)
 * @option data-tooltip="right|left|top|bottom" : 툴팁 위치 (CSS에서 처리)
 */

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiTooltip';
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

  // 개별 툴팁 이벤트 바인딩
  function bindTooltip($tooltip) {
    if ($tooltip.data('tooltip-bound')) return;
    $tooltip.data('tooltip-bound', true);

    var $trigger = $tooltip.find('.vits-tooltip-trigger');
    var $content = $tooltip.find('.vits-tooltip-content');
    var $closeBtn = $content.find('.vits-tooltip-heading .button');

    if (!$trigger.length || !$content.length) return;

    // 초기 접근성 상태 보장
    $trigger.attr('aria-expanded', 'false');

    $trigger.on('click' + NS, function (e) {
      e.preventDefault();
      e.stopPropagation();

      var isOpen = $content.hasClass(ACTIVE);

      closeAllTooltips();

      if (!isOpen) {
        openTooltip($trigger, $content);
      }
    });

    if ($closeBtn.length) {
      $closeBtn.on('click' + NS, function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeTooltip($trigger, $content);
        $trigger.focus();
      });
    }

    // 툴팁 내부 클릭 시 전파 방지
    $content.on('click' + NS, function (e) {
      e.stopPropagation();
    });
  }

  // 전역 이벤트 바인딩 (외부 클릭, ESC)
  function bind() {
    // 외부 탭/클릭 시 닫기
    $(document).on('click' + NS + ' touchstart' + NS, function (e) {
      if (!$(e.target).closest('[data-tooltip]').length) {
        closeAllTooltips();
      }
    });

    // ESC 키로 닫기
    $(document).on('keydown' + NS, function (e) {
      if (e.key === 'Escape') {
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
      // 전역 이벤트 1회 바인딩
      if (!window.UI.tooltip._initialized) {
        bind();
        window.UI.tooltip._initialized = true;
      }

      $('[data-tooltip]').each(function () {
        bindTooltip($(this));
      });
    }
  };
})(window.jQuery, window);
