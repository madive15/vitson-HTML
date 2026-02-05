/**
 * @file scripts/ui/form/input-search.js
 * @description input-search 공통 — submit 정규화 + 클리어 + validation
 * @scope [data-search-form]
 *
 * @events (인풋에서 버블링)
 *  inputSearch:submit { query } — 성공 시만
 *  inputSearch:clear
 *
 * @events ($(document))
 *  ui:input-search-submit { query, form, input } — 성공 시만
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

  // 앞뒤 공백 제거
  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  // trim + 연속 공백 → 1칸
  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }

  // input 기준 validation 래퍼 탐색
  function findValidation($input) {
    if (!$input || !$input.length) return $();
    var $wrap = $input.closest(VALID_WRAP);
    return $wrap.length ? $wrap.find(VALID_MSG).first() : $();
  }

  // aria-invalid + validation hidden 토글
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

  // $form 기준 내부 요소 수집
  function resolveFromForm($form) {
    var $input = $form.find(INPUT).first();
    return {
      $form: $form,
      $input: $input,
      $clear: $form.find(CLEAR),
      $validation: $input.length ? findValidation($input) : $()
    };
  }

  // 외부 전달 인자에서 요소 정규화
  function resolveFromArg(arg) {
    if (!arg || !arg.$form || !arg.$input) return null;
    return {
      $form: arg.$form,
      $input: arg.$input,
      $clear: arg.$clear && arg.$clear.length ? arg.$clear : arg.$form.find(CLEAR),
      $validation: arg.$validation && arg.$validation.length ? arg.$validation : findValidation(arg.$input)
    };
  }

  // target → 저장된 el 객체 반환
  function getEl(target) {
    var $t = $(target);
    var $form = $t.is(FORM) ? $t : $t.closest(FORM);
    if (!$form.length) $form = $t.find(FORM).first();
    return $form.data(DATA_KEY) || null;
  }

  // 클리어 버튼 표시/숨김 동기화
  function syncClearBtn(el) {
    if (!el.$clear.length) return;
    if (trimText(el.$input.val())) {
      el.$clear.removeAttr('hidden');
    } else {
      el.$clear.attr('hidden', '');
    }
  }

  // 인풋 초기화 + 이벤트 발생
  function doClear(el) {
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    setInvalid(el.$input, el.$validation, false);

    el.$input.trigger('inputSearch:clear');
    $(document).trigger('ui:input-search-clear', {
      form: el.$form[0],
      input: el.$input[0]
    });
  }

  // 이벤트 바인딩
  function bindEvents(el, opt) {
    var onSubmit = opt && typeof opt.onSubmit === 'function' ? opt.onSubmit : null;

    // 입력 → validation 해제 + 클리어 버튼 토글
    el.$input.off('input' + NS).on('input' + NS, function () {
      setInvalid(el.$input, el.$validation, false);
      syncClearBtn(el);
    });

    // 클리어(X) 버튼
    if (el.$clear.length) {
      el.$clear.off('click' + NS).on('click' + NS, function () {
        doClear(el);
        el.$input.focus();
      });
    }

    // submit → 정규화 + onSubmit 훅 + 이벤트 (성공 시만)
    el.$form.off('submit' + NS).on('submit' + NS, function (e) {
      e.preventDefault();

      var query = normalizeSpaces(el.$input.val());
      if (!query) return;

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

      el.$input.focus();
    });
  }

  // 이벤트 해제
  function unbindEvents(el) {
    el.$input.off(NS);
    el.$form.off(NS);
    if (el.$clear.length) el.$clear.off(NS);
  }

  // 단일 폼 초기화 — SSR 상태 존중
  function initOne($form, opt) {
    if ($form.data(DATA_KEY)) return;

    var el = resolveFromForm($form);
    if (!el.$input.length) return;

    bindEvents(el, opt);
    $form.data(DATA_KEY, el);
  }

  // 단일 폼 해제
  function destroyOne($form) {
    var el = $form.data(DATA_KEY);
    if (!el) return;

    unbindEvents(el);
    setInvalid(el.$input, el.$validation, false);
    el.$input.val('');
    if (el.$clear.length) el.$clear.attr('hidden', '');
    $form.removeData(DATA_KEY);
  }

  // root 범위에서 form 순회
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

  // validation 메시지 텍스트 변경 + invalid 자동 토글
  window.UI.inputSearch.setMessage = function (target, message) {
    var el = getEl(target);
    if (!el || !el.$validation.length) return;

    el.$validation.find(MSG_TEXT).text(message || '');
    setInvalid(el.$input, el.$validation, !!message);
  };

  // 인풋 값 세팅 + 클리어 동기화 (이벤트 미발생)
  window.UI.inputSearch.setValue = function (target, value) {
    var el = getEl(target);
    if (!el) return;

    el.$input.val(value);
    syncClearBtn(el);
  };

  // 인풋 초기화 + 이벤트 발생
  window.UI.inputSearch.clear = function (target) {
    var el = getEl(target);
    if (el) doClear(el);
  };

  window.UI.inputSearch.init = function (arg, opt) {
    // 단일형: init({ $form, $input }, { onSubmit })
    var el = resolveFromArg(arg);
    if (el) {
      if (el.$form.data(DATA_KEY)) return;
      bindEvents(el, opt);
      el.$form.data(DATA_KEY, el);
      return;
    }

    // 스캔형: init(), init(root), init(opt), init(root, opt)
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
