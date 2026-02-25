/**
 * @file scripts-mo/ui/common/survey-detail.js
 * @description 설문 상세 - 별점 입력 및 평균 총점 갱신 (모바일)
 * @scope [data-survey-detail]
 *
 * @mapping
 *  [data-survey-question]   : 개별 문항 래퍼
 *  [data-survey-star-input] : 별점 입력 컴포넌트
 *  [data-survey-avg-score]  : 상단 평균 점수 텍스트
 *  [data-survey-avg-fill]   : 상단 별점 채움 레이어 (width %)
 *
 * @state
 *  is-filled : 별점 버튼 채움 상태
 *
 * @note
 *  - 평균 = (입력된 문항 점수 합) / (점수가 등록된 문항 수)
 *  - 미입력 시 상단 총점: '-' 표시
 *  - 터치 디바이스: touchend 사용, 호버 이벤트 제외
 */
(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  var NS = '.uiSurveyDetail';
  var ROOT = '[data-survey-detail]';
  var QUESTION = '[data-survey-question]';
  var STAR_INPUT = '[data-survey-star-input]';
  var STAR_BTN = '.star-rating-input-star';
  var SCORE_TEXT = '.star-score';
  var AVG_SCORE = '[data-survey-avg-score]';
  var AVG_FILL = '[data-survey-avg-fill]';
  var CLASS_FILLED = 'is-filled';
  var MAX_STARS = 5;

  // 터치 디바이스 여부 - 이벤트 분기 기준
  var TOUCH_SUPPORTED = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var CLICK_EVENT = TOUCH_SUPPORTED ? 'touchend' : 'click';

  // 문항 현재 점수 반환
  function getScore($starInput) {
    var v = $starInput.data('starCurrent');
    var n = parseInt(v, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > MAX_STARS) return MAX_STARS;
    return n;
  }

  // 별점 채움 + 점수 텍스트 갱신
  function applyScore($starInput, score) {
    $starInput.data('starCurrent', score);

    $starInput.find(STAR_BTN).each(function (idx) {
      $(this).toggleClass(CLASS_FILLED, idx + 1 <= score);
    });

    // 모바일: 항상 노출, 미입력 시 '-'
    $starInput.find(SCORE_TEXT).text(score > 0 ? score : '-');
  }

  // 상단 평균 총점 갱신
  function updateAvg($root) {
    var total = 0;
    var count = 0;

    $root.find(QUESTION).each(function () {
      var score = getScore($(this).find(STAR_INPUT));
      if (score > 0) {
        total += score;
        count++;
      }
    });

    var $avgScore = $root.find(AVG_SCORE);
    var $avgFill = $root.find(AVG_FILL);

    if (count === 0) {
      // 미입력 상태
      $avgScore.text('-');
      $avgFill.css('width', '0%');
    } else {
      var avg = (total / count).toFixed(2);
      var fillPct = ((avg / MAX_STARS) * 100).toFixed(2);
      $avgScore.text(avg);
      $avgFill.css('width', fillPct + '%');
    }
  }

  // 별점 이벤트 바인딩
  function bindStarEvents($root) {
    // 클릭/터치 - 점수 선택/해제
    $root.on(CLICK_EVENT + NS, STAR_BTN, function (e) {
      e.preventDefault();

      var $btn = $(this);
      var $starInput = $btn.closest(STAR_INPUT);
      var value = parseInt($btn.attr('data-star-value'), 10);
      if (isNaN(value) || value < 1 || value > MAX_STARS) return;

      var current = getScore($starInput);
      // 같은 별 재클릭 시 해당 단계 제거, 다른 별은 해당 점수로 설정
      var next = value === current ? value - 1 : value;

      applyScore($starInput, next);
      updateAvg($root);
    });

    // 호버 미리보기 - 마우스 환경에서만 바인딩
    if (!TOUCH_SUPPORTED) {
      $root.on('mouseenter' + NS, STAR_BTN, function () {
        var value = parseInt($(this).attr('data-star-value'), 10);
        if (isNaN(value)) return;

        $(this)
          .closest(STAR_INPUT)
          .find(STAR_BTN)
          .each(function (idx) {
            $(this).toggleClass('is-hover', idx + 1 <= value);
          });
      });

      $root.on('mouseleave' + NS, STAR_INPUT, function () {
        $(this).find(STAR_BTN).removeClass('is-hover');
      });
    }
  }

  function init(ctx) {
    var $root = ctx ? $(ctx).find(ROOT).addBack(ROOT) : $(ROOT);
    if (!$root.length) return;

    $root.each(function () {
      var $el = $(this);
      if ($el.data('surveyDetailBound')) return;
      $el.data('surveyDetailBound', true);

      bindStarEvents($el);

      // 초기 점수 적용
      $el.find(STAR_INPUT).each(function () {
        var defaultScore = parseInt($(this).attr('data-star-default'), 10);
        if (!isNaN(defaultScore) && defaultScore > 0) {
          applyScore($(this), defaultScore);
        }
      });

      // 초기 평균 갱신
      updateAvg($el);
    });
  }

  function destroy() {
    $(ROOT).off(NS).removeData('surveyDetailBound');
  }

  window.UI.surveyDetail = {
    init: init,
    destroy: destroy
  };
})(window.jQuery, window);
