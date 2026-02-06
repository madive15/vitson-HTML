/**
 * @file scripts/ui/support-ui.js
 * @purpose 마이페이지·설문 지원 UI (별점 입력 등)
 * @description
 *  - 별점 입력: .star-rating-input 내부 .star-rating-input-star 클릭
 *  - 동작: 1~5 누르면 해당 점수까지 채움(3 클릭 시 1,2,3 채움)
 *  - 같은 별 다시 클릭 시 해제(해당 단계 제거), 다른 별 클릭 시 해당 점수로 재설정
 * @scope .star-rating-input 만 대상, 기존 .star-rating(조회용) 미영향
 * @maintenance
 *  - 아이콘 클래스: ic-star (components/_icon.scss)
 */

(function ($, window) {
  'use strict';

  if (!$) {
    console.log('[support-ui] jQuery not found');
    return;
  }

  window.UI = window.UI || {};

  var ROOT_SEL = '.star-rating-input';
  var STAR_SEL = '.star-rating-input-star';
  var SCORE_SEL = '.star-score';
  var DATA_CURRENT = 'starCurrent';
  var CLASS_FILLED = 'is-filled';
  var CLASS_HOVER = 'is-hover';
  var VALUE_SEL = '.star-value';
  var MAX_STARS = 5;
  var EVENT_NS = '.uiMypageSupportStar';

  /**
   * 해당 컨테이너의 현재 점수 반환 (0 ~ MAX_STARS)
   * @param {jQuery} $root
   * @returns {number}
   */
  function getCurrentScore($root) {
    var v = $root.data(DATA_CURRENT);
    var n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 0) return 0;
    if (n > MAX_STARS) return MAX_STARS;
    return n;
  }

  /**
   * 점수에 맞춰 별 채움/텍스트 갱신
   * @param {jQuery} $root
   * @param {number} score 0~5
   */
  function applyScore($root, score) {
    $root.data(DATA_CURRENT, score);
    $root.find(STAR_SEL).each(function (idx) {
      var value = idx + 1;
      var $star = $(this);
      if (value <= score) {
        $star.addClass(CLASS_FILLED);
      } else {
        $star.removeClass(CLASS_FILLED);
      }
    });
    $root.find(SCORE_SEL).text(score);
    if (score > 0) {
      $root.find(VALUE_SEL).removeAttr('hidden');
    } else {
      $root.find(VALUE_SEL).attr('hidden', 'hidden');
    }
  }

  /**
   * 호버 시 해당 점수까지 별에 is-hover 적용 (색상 미리보기)
   * @param {jQuery} $root
   * @param {number} hoverUpTo 0이면 호버 해제
   */
  function applyHover($root, hoverUpTo) {
    $root.find(STAR_SEL).each(function (idx) {
      var value = idx + 1;
      var $star = $(this);
      if (hoverUpTo > 0 && value <= hoverUpTo) {
        $star.addClass(CLASS_HOVER);
      } else {
        $star.removeClass(CLASS_HOVER);
      }
    });
  }

  /**
   * 한 개의 .star-rating-input에 클릭·호버 바인딩
   * - 클릭: N번째 별 클릭 시 1~N까지 선택(3 클릭 시 1,2,3 모두 선택). 같은 별 재클릭 시 해제.
   * - 호버: 별 위 마우스오버 시 해당 별까지 색상 미리보기
   * @param {jQuery} $root
   */
  function bindStarRating($root) {
    if ($root.data('starRatingBound')) return;
    $root.data('starRatingBound', true);

    $root.on('click' + EVENT_NS, STAR_SEL, function (e) {
      e.preventDefault();
      var $btn = $(e.currentTarget);
      var value = parseInt($btn.attr('data-star-value'), 10);
      if (Number.isNaN(value) || value < 1 || value > MAX_STARS) return;

      var current = getCurrentScore($root);
      var next;

      if (value === current) {
        // 같은 자리 한 번 더 클릭 → 해제(해당 단계 제거)
        next = value - 1;
        if (next < 0) next = 0;
      } else {
        // 다른 별 클릭 → 해당 점수로 설정 (예: 3번째 클릭 시 1,2,3 모두 선택)
        next = value;
      }

      applyScore($root, next);
    });

    $root.on('mouseenter' + EVENT_NS, STAR_SEL, function (e) {
      var value = parseInt($(e.currentTarget).attr('data-star-value'), 10);
      if (!Number.isNaN(value) && value >= 1 && value <= MAX_STARS) {
        applyHover($root, value);
      }
    });

    $root.on('mouseleave' + EVENT_NS, function () {
      applyHover($root, 0);
    });
  }

  function init(ctx) {
    var scope = ctx && (ctx instanceof Element || ctx.nodeType === 1) ? ctx : document;
    // prettier-ignore
    $(scope).find(ROOT_SEL).each(function () {
      bindStarRating($(this));
    });
  }

  window.UI.mypageSupport = {
    init: init,
    applyScore: applyScore,
    getCurrentScore: getCurrentScore
  };
})(window.jQuery || window.$ || window.Zepto, window);
