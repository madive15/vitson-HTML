/**
 * scripts/core/utils.js
 * @purpose 공통 유틸 모음(항상 로드)
 * @assumption
 *  - 전역 오염 최소화(필요 시 window.Utils 네임스페이스로만 제공)
 *  - UI 기능이 아닌 "범용/반복 로직"만 둔다
 * @maintenance
 *  - 실행 트리거(DOMReady/이벤트 바인딩) 금지
 *  - 특정 페이지/컴포넌트 전용 로직 금지
 *  - 프로젝트 공통으로 쓰이는 유틸만, 실제 반복이 확인될 때만 추가한다
 */

(function (window, document) {
  'use strict';

  // 모바일 환경 100vh 보정용 --vh CSS 변수 계산
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }

  setVh();
  window.addEventListener('resize', setVh);

  // 초기 로딩 transition 방지
  document.body.classList.add('is-loading');
  requestAnimationFrame(function () {
    document.body.classList.remove('is-loading');
  });
})(window, document);
