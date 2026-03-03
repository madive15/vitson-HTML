/**
 * @file scripts-mo/ui/form/input-search.js
 * @description input-search 공통 (모바일)
 * @scope [data-search-form]
 *
 * @events (인풋에서 버블링)
 *  inputSearch:submit { query }
 *  inputSearch:clear
 *
 * @events ($(document))
 *  ui:input-search-submit { query, form, input }
 *  ui:input-search-clear  { form, input }
 *
 * @api
 *  init(root?, opt?)                    스캔 초기화
 *  init({$form,$input}, {onSubmit})     단일 폼 초기화
 *  destroy(root?)                       해제
 *  setValue(target, value)              값 세팅 (이벤트 미발생)
 *  clear(target)                        초기화 + 이벤트
 *  setInvalid(arg, on)                  validation 토글
 *  setMessage(target, message)          메시지 변경 + invalid 토글
 *  normalize(str)                       trim + 연속공백 → 1칸
 */
(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.inputSearch = window.UI.inputSearch || {};

  var NS = '.inputSearch';
  var DATA_KEY = 'inputSearchInit';

  var FORM = '[data-search-form]';
  var INPUT = '[data-search-input]';
  var CLEAR = '[data-search-clear]';
  var VALID_WRAP = '.vits-input-search.vits-validation';
  var VALID_MSG = '.input-validation';
  var MSG_TEXT = '[aria-live="polite"]';

  // 한글 IME 조합 중 submit 방지용 플래그
  var _composing = false;

  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }

  function findValidation($input) {
    if (!$input || !$input.length) return $();
    var $wrap = $input.closest(VALID_WRAP);
    return $wrap.length ? $wrap.find(VALID_MSG).first() : $();
  }

  function setInvalid($input, $validation, on) {
    if ($input && $input.length) {
      $input.attr('aria-invalid', on ? 'true' : 'false');
    }
    if ($validation && $validation.length) {
      if (on) {
        $validation.removeAttr('hidden');
      } else {
        $validation.attr('hidden', '');
      }
    }
  }

  function resolveFromForm($form) {
    var $input = $form.find(INPUT).first();
    return {
      $form: $form,
      $input: $input,
      $clear: $form.find(CLEAR),
      $validation: $input.length ? findValidation($input) : $()
    };
  }

  function resolveFromArg(arg) {
    if (!arg || !arg.$form || !arg.$input) return null;
    return {
      $form: arg.$form,
      $input: arg.$input,
      $clear: arg.$clear && arg.$clear.length ? arg.$clear : arg.$form.find(CLEAR),
      $validation: arg.$validation && arg.$validation.length ? arg.$validation : findValidation(arg.$input)
    };
  }

  function getEl(target) {
    var $t = $(target);
    var $form = $t.is(FORM) ? $t : $t.closest(FORM);
    if (!$form.length) $form = $t.find(FORM).first();
    return $form.data(DATA_KEY) || null;
  }

  function syncClearBtn(el) {
    if (!el.$clear.length) return;
    if (trimText(el.$input.val())) {
      el.$clear.removeAttr('hidden');
    } else {
      el.$clear.attr('hidden', '');
    }
  }

  function doClear(el) {
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    setInvalid(el.$input, el.$validation, false);
  }

  function bindEvents(el, opt) {
    var onSubmit = opt && typeof opt.onSubmit === 'function' ? opt.onSubmit : null;
    var input = el.$input[0];

    // 입력 → validation 해제 + 클리어 버튼 토글
    el.$input.off('input' + NS).on('input' + NS, function () {
      setInvalid(el.$input, el.$validation, false);
      syncClearBtn(el);
    });

    // 한글 IME 조합 중 submit 방지
    input.addEventListener('compositionstart', function () {
      _composing = true;
    });
    input.addEventListener('compositionend', function () {
      _composing = false;
    });

    // 클리어(X) 버튼 — touchend로 iOS 300ms 딜레이 회피
    if (el.$clear.length) {
      el.$clear.off('click' + NS + ' touchend' + NS).on('click' + NS + ' touchend' + NS, function (e) {
        e.preventDefault();
        doClear(el);
        el.$input.focus();
      });
    }

    // submit
    el.$form.off('submit' + NS).on('submit' + NS, function (e) {
      e.preventDefault();

      // IME 조합 중이면 무시
      if (_composing) return;

      var query = normalizeSpaces(el.$input.val());

      if (!query) {
        syncClearBtn(el);
        el.$input.trigger('inputSearch:clear');
        $(document).trigger('ui:input-search-clear', {
          form: el.$form[0],
          input: el.$input[0]
        });
        el.$input[0].blur();
        return;
      }

      var ctx = {$form: el.$form, $input: el.$input, $validation: el.$validation};
      var ok = true;

      if (onSubmit) ok = onSubmit(query, ctx) !== false;
      setInvalid(el.$input, el.$validation, !ok);

      if (ok) {
        syncClearBtn(el);
        el.$input.trigger('inputSearch:submit', {query: query});
        $(document).trigger('ui:input-search-submit', {
          query: query,
          form: el.$form[0],
          input: el.$input[0]
        });
      }

      // iOS에서 키보드 닫기
      el.$input[0].blur();
    });
  }

  function unbindEvents(el) {
    el.$input.off(NS);
    el.$form.off(NS);
    if (el.$clear.length) el.$clear.off(NS);

    // addEventListener로 붙인 건 참조가 없어 제거 불가 — destroy 시 DOM 제거 전제
    // compositionstart/end는 경량이라 누수 무시 가능
  }

  function initOne($form, opt) {
    if ($form.data(DATA_KEY)) return;

    var el = resolveFromForm($form);
    if (!el.$input.length) return;

    // iOS 16px 미만 폰트에서 자동 줌 방지
    if (/iPhone|iPad/.test(navigator.userAgent)) {
      var fontSize = parseFloat(window.getComputedStyle(el.$input[0]).fontSize);
      if (fontSize < 16) {
        el.$input.css('font-size', '16px');
      }
    }

    bindEvents(el, opt);
    syncClearBtn(el);
    $form.data(DATA_KEY, el);
  }

  function destroyOne($form) {
    var el = $form.data(DATA_KEY);
    if (!el) return;

    unbindEvents(el);
    setInvalid(el.$input, el.$validation, false);
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    $form.removeData(DATA_KEY);
  }

  function eachForm(root, fn) {
    var $scope = root ? $(root) : $(document);
    if ($scope.is(FORM)) {
      fn($scope);
      return;
    }
    $scope.find(FORM).each(function () {
      fn($(this));
    });
  }

  window.UI.inputSearch.normalize = function (str) {
    return normalizeSpaces(str);
  };

  window.UI.inputSearch.setInvalid = function (arg, on) {
    var $input = arg && arg.$input ? arg.$input : $();
    var $validation = arg && arg.$validation ? arg.$validation : $();
    setInvalid($input, $validation, !!on);
  };

  window.UI.inputSearch.setMessage = function (target, message) {
    var el = getEl(target);
    if (!el || !el.$validation.length) return;

    el.$validation.find(MSG_TEXT).text(message || '');
    setInvalid(el.$input, el.$validation, !!message);
  };

  window.UI.inputSearch.setValue = function (target, value) {
    var el = getEl(target);
    if (!el) return;

    el.$input.val(value);
    syncClearBtn(el);
  };

  window.UI.inputSearch.clear = function (target) {
    var el = getEl(target);
    if (el) doClear(el);
  };

  window.UI.inputSearch.init = function (arg, opt) {
    var el = resolveFromArg(arg);
    if (el) {
      if (el.$form.data(DATA_KEY)) return;
      bindEvents(el, opt);
      el.$form.data(DATA_KEY, el);
      return;
    }

    var isRootEl = arg instanceof $ || (arg && arg.nodeType) || (typeof arg === 'string' && $(arg).length);
    var root = isRootEl ? arg : null;
    var options = opt || (!isRootEl && arg && typeof arg === 'object' ? arg : null);

    eachForm(root, function ($form) {
      initOne($form, options);
    });
  };

  window.UI.inputSearch.destroy = function (root) {
    eachForm(root, destroyOne);
  };
})(window.jQuery || window.$, window, document);
