/**
 * @file scripts/ui/form/input.js
 * @description input 공통: 값 유무에 따른 상태 클래스 토글
 * @scope .vits-input 컴포넌트 내부 input만 적용(전역 영향 없음)
 *
 * @state
 *  - root.is-filled: input에 값이 있을 때 토글
 *
 * @maintenance
 *  - init 재호출을 고려해 바인딩은 네임스페이스로 off/on 처리(중복 방지)
 *  - compositionend 직후 input 중복 발생 방지(debounce flag)
 *
 * @note 모바일 대응
 *  - compositionend 직후 input 중복 발생 방지(삼성키보드 등)
 *  - 브라우저 자동완성(autofill) 시 input/change 미발생 대응(CSS animation 트리거)
 *  - 자동완성 감지용 CSS 필요:
 *    @keyframes onAutoFillStart { from { opacity: 1; } to { opacity: 1; } }
 *    input:-webkit-autofill { animation-name: onAutoFillStart; }
 */

(function ($, window, document) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};
  window.UI.input = window.UI.input || {};

  var MODULE_KEY = 'input';
  var NS = '.' + MODULE_KEY;

  var ROOT = '.vits-input';
  var INPUT = ROOT + ' input';

  // compositionend 직후 input 무시 간격(ms)
  var COMPOSE_DEBOUNCE = 50;

  // is-filled 토글
  function syncFilled($root, $input) {
    $root.toggleClass('is-filled', $input.val().length > 0);
  }

  // 단일 input 초기 동기화
  function initOne($input) {
    if (!$input || !$input.length) return;
    var $root = $input.closest(ROOT);
    if (!$root.length) return;

    syncFilled($root, $input);
  }

  // 이벤트 바인딩(위임 1회, init 재호출 대비)
  function bindOnce() {
    $(document).off(NS);

    // IME 조합 시작
    $(document).on('compositionstart' + NS, INPUT, function () {
      $(this).data('isComposing', true);
    });

    // IME 조합 완료
    $(document).on('compositionend' + NS, INPUT, function () {
      var $input = $(this);
      $input.data('isComposing', false);
      $input.data('compEndAt', Date.now());

      initOne($input);
    });

    // 입력 이벤트
    $(document).on('input' + NS, INPUT, function () {
      var $input = $(this);

      // compositionend 직후 중복 input 무시
      var compEndAt = $input.data('compEndAt') || 0;
      if (compEndAt && Date.now() - compEndAt < COMPOSE_DEBOUNCE) return;

      if ($input.data('isComposing')) return;

      var $root = $input.closest(ROOT);
      if (!$root.length) return;

      syncFilled($root, $input);
    });

    // JS 값 변경, 자동완성 후 동기화
    $(document).on('change' + NS, INPUT, function () {
      initOne($(this));
    });

    // 자동완성 감지 — autofill 시 input/change가 안 발생하는 브라우저 대응
    $(document).on('animationstart' + NS, INPUT, function (e) {
      if (e.originalEvent.animationName === 'onAutoFillStart') {
        initOne($(this));
      }
    });
  }

  // root 범위 초기화(부분 렌더 지원)
  function initAll(root) {
    var $scope = root ? $(root) : $(document);
    $scope.find(INPUT).each(function () {
      initOne($(this));
    });
  }

  window.UI.input = {
    init: function (root) {
      if (!window.UI.input.__bound) {
        bindOnce();
        window.UI.input.__bound = true;
      }
      initAll(root);
    },
    destroy: function () {
      $(document).off(NS);
      window.UI.input.__bound = false;
    }
  };
})(window.jQuery || window.$, window, document);
