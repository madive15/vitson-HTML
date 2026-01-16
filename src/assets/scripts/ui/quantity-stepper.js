/**
 * @file scripts/ui/quantity-stepper.js
 * @purpose
 * @description
 * @maintenance
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[quantity-stepper] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var EVENT_NS = '.uiQuantityStepper';
  var ROOT_SEL = '.quantity-control';
  var INPUT_SEL = '.quantity-input';
  var MEASURE_SEL = '.quantity-input-measure';
  var BTN_MINUS_SEL = '.btn-step.vits-minus-icon';
  var BTN_PLUS_SEL = '.btn-step.vits-plus-icon';
  var INIT_KEY = 'uiQuantityStepperInit';

  function toNumber(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function onlyDigits(str) {
    return String(str || '').replace(/\D+/g, '');
  }

  function clamp(n, min, max) {
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  function getOptions($input) {
    return {
      step: toNumber($input.data('step'), 1),
      min: toNumber($input.data('min'), 1),
      max: toNumber($input.data('max'), Infinity),
      minW: 40
    };
  }

  function syncMeasureFont($input, $measure) {
    if (!$measure || !$measure.length) return;

    var font = $input.css('font');
    $measure.css({
      font: font,
      letterSpacing: $input.css('letter-spacing')
    });
  }

  function resizeInput($input, $measure, minW) {
    if (!$measure || !$measure.length) return;

    var v = $input.val();
    var text = v && String(v).length ? String(v) : '0';
    $measure.text(text);

    // 커서 여유
    var extra = 16;
    var w = $measure[0].offsetWidth + extra;

    if (w < minW) w = minW;
    $input.css('width', w + 'px');
  }

  function getValue($input, min, max) {
    var digits = onlyDigits($input.val());
    if ($input.val() !== digits) $input.val(digits);
    var n = digits === '' ? 0 : toNumber(digits, 0);
    return clamp(n, min, max);
  }

  function setValue($input, n, min, max) {
    $input.val(String(clamp(n, min, max)));
  }

  function syncDisabled($root, v, step, min, max, isDisabled) {
    var disabled = !!isDisabled;
    $root.find(BTN_MINUS_SEL).prop('disabled', disabled || v - step < min);
    $root.find(BTN_PLUS_SEL).prop('disabled', disabled || v + step > max);
  }

  function refresh($root) {
    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;

    var opts = getOptions($input);
    var v = getValue($input, opts.min, opts.max);
    setValue($input, v, opts.min, opts.max);
    resizeInput($input, $measure, opts.minW);
    syncDisabled($root, v, opts.step, opts.min, opts.max, $input.prop('disabled'));
  }

  function bindRoot($root) {
    if ($root.data(INIT_KEY)) return;
    $root.data(INIT_KEY, true);

    var $input = $root.find(INPUT_SEL);
    var $measure = $root.find(MEASURE_SEL);
    if (!$input.length) return;

    syncMeasureFont($input, $measure);

    $root.off('click' + EVENT_NS, BTN_MINUS_SEL);
    $root.off('click' + EVENT_NS, BTN_PLUS_SEL);
    $root.off('input' + EVENT_NS, INPUT_SEL);

    $root.on('click' + EVENT_NS, BTN_MINUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v - opts.step, opts.min, opts.max);
      refresh($root);
    });

    $root.on('click' + EVENT_NS, BTN_PLUS_SEL, function () {
      var opts = getOptions($input);
      var v = getValue($input, opts.min, opts.max);
      setValue($input, v + opts.step, opts.min, opts.max);
      refresh($root);
    });

    $root.on('input' + EVENT_NS, INPUT_SEL, function () {
      refresh($root);
    });

    refresh($root);
  }

  function bindResize() {
    $(window).off('resize' + EVENT_NS);
    $(window).on('resize' + EVENT_NS, function () {
      $(ROOT_SEL).each(function () {
        var $root = $(this);
        if (!$root.data(INIT_KEY)) return;
        var $input = $root.find(INPUT_SEL);
        var $measure = $root.find(MEASURE_SEL);
        if (!$input.length) return;
        syncMeasureFont($input, $measure);
        resizeInput($input, $measure, getOptions($input).minW);
      });
    });
  }

  window.UI.quantityStepper = {
    init: function (root) {
      var $scope = root ? $(root) : $(document);
      $scope.find(ROOT_SEL).each(function () {
        bindRoot($(this));
      });
      bindResize();
      console.log('[quantity-stepper] init');
    }
  };

  console.log('[quantity-stepper] module loaded');
})(window.jQuery || window.$, window);
