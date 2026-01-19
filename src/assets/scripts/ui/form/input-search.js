/**
 * @file scripts/ui/form/input-search.js
 * @purpose input-search 공통: submit 가로채기 + 검색어 정규화 + validation(aria-invalid/메시지) 토글 + submit 훅 제공
 * @scope input-search.ejs 내부 요소만 제어(페이지별 UI 로직은 onSubmit에서 처리)
 *
 * @hook
 *  - form: [data-search-form]
 *  - input: [data-search-input]
 *  - validation: .vits-input-search.vits-validation 내부 .input-validation (hidden 토글)
 *
 * @contract
 *  - init(root?): 문서/루트 스캔 초기화
 *  - init({$form,$input,$validation}, { onSubmit }): 단일 폼 초기화
 *  - onSubmit(query, ctx) 반환값:
 *    - false => invalid 표시(중복 등)
 *    - 그 외 => invalid 해제(정상)
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.inputSearch = window.UI.inputSearch || {};

  var NS = '.uiInputSearch';
  var FORM = '[data-search-form]';
  var INPUT = '[data-search-input]';

  // 문자열 앞뒤 공백을 제거
  function trimText(str) {
    return String(str || '').replace(/^\s+|\s+$/g, '');
  }

  // 연속 공백을 1칸으로 정규화
  function normalizeSpaces(str) {
    return trimText(str).replace(/\s+/g, ' ');
  }

  // input 기준으로 validation 메시지 엘리먼트를 찾음
  function findValidation($input) {
    var $wrap = $input.closest('.vits-input-search.vits-validation');
    return $wrap.length ? $wrap.find('.input-validation').first() : $();
  }

  // validation UI를 토글(input aria-invalid + 메시지 hidden)
  function setInvalid($input, $validation, on) {
    if ($input && $input.length) $input.attr('aria-invalid', on ? 'true' : null);
    if ($validation && $validation.length) $validation.prop('hidden', !on);
  }

  // 입력 중이면 validation을 해제
  function bindClearOnInput($input, $validation) {
    if (!$input.length) return;

    $input.off('input' + NS).on('input' + NS, function () {
      setInvalid($input, $validation, false);
    });
  }

  // submit 시 query를 정규화하고 onSubmit/이벤트로 전달
  function bindSubmit($form, $input, $validation, opt) {
    if (!$form.length || !$input.length) return;

    var options = opt || {};
    var onSubmit = typeof options.onSubmit === 'function' ? options.onSubmit : null;

    $form.off('submit' + NS).on('submit' + NS, function (e) {
      e.preventDefault();

      var query = normalizeSpaces($input.val());

      // 빈 값은 아무 것도 하지 않음(에러 표시도 하지 않음)
      if (!query) return;

      var ctx = {$form: $form, $input: $input, $validation: $validation};
      var ok = true;

      // 페이지 로직에서 false를 반환하면 invalid 처리
      if (onSubmit) ok = onSubmit(query, ctx) !== false;

      setInvalid($input, $validation, !ok);

      // 공통 이벤트(필요 시 다른 레이어에서도 구독 가능)
      $(document).trigger('ui:input-search-submit', {query: query, form: $form[0], input: $input[0]});
    });
  }

  // 폼 1개 단위를 초기화
  function initOne($form, opt) {
    var $input = $form.find(INPUT).first();
    if (!$input.length) return;

    var $validation = findValidation($input);

    setInvalid($input, $validation, false);
    bindClearOnInput($input, $validation);
    bindSubmit($form, $input, $validation, opt);
  }

  // root 범위에서 폼들을 스캔해 초기화
  function initAll(root, opt) {
    var $scope = root ? $(root) : $(document);

    $scope.find(FORM).each(function () {
      initOne($(this), opt);
    });
  }

  // 검색어 정규화 결과를 반환
  window.UI.inputSearch.normalize = function (str) {
    return normalizeSpaces(str);
  };

  // 특정 input의 validation을 토글(외부 제어용)
  window.UI.inputSearch.setInvalid = function (arg, on) {
    var $input = arg && arg.$input ? arg.$input : $();
    var $validation = arg && arg.$validation ? arg.$validation : $();
    setInvalid($input, $validation, !!on);
  };

  // init 시그니처를 2가지로 지원(스캔형 / 단일형)
  window.UI.inputSearch.init = function (arg, opt) {
    // 단일형: init({$form,$input,$validation}, { onSubmit })
    if (arg && arg.$form && arg.$input) {
      var $validation = arg.$validation && arg.$validation.length ? arg.$validation : findValidation(arg.$input);

      setInvalid(arg.$input, $validation, false);
      bindClearOnInput(arg.$input, $validation);
      bindSubmit(arg.$form, arg.$input, $validation, opt);
      return;
    }

    // 스캔형: init(root) 또는 init()
    initAll(arg, opt);
  };
})(window.jQuery || window.$, window, document);
