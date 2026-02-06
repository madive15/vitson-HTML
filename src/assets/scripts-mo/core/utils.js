/**
 * @file scripts-mo/core/utils.js
 * @description 모바일 공통 유틸
 * @note IIFE — 외부 init 호출 없이 로드 시 즉시 실행
 */
(function (window, document) {
  'use strict';

  /**
   * @description PC 기기 판별 클래스 부착 (UA + touchPoints 기반)
   * @note html.is-pc 기준으로 PC 전용 스타일 분기
   *       iPadOS 13+는 UA에 iPad 미포함 → maxTouchPoints로 보완
   */
  function setDeviceClass() {
    var ua = window.navigator.userAgent;
    var isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    var isTouchDevice = navigator.maxTouchPoints > 1;

    if (!isMobileUA && !isTouchDevice) {
      document.documentElement.classList.add('is-pc');
    }
  }

  /**
   * @description 뷰포트 높이 보정 (iOS/Android 주소창 변화 대응)
   * @note CSS: min-height: calc(var(--vh, 1vh) * 100)
   */
  function setVh() {
    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }

  /**
   * @description 수평 스크롤 요소를 끝(오른쪽)으로 이동
   * @scope [data-scroll-end]
   * @note 초기 실행 + 자식 변경 시 자동 재실행 (동적 렌더링 대응)
   */
  function initScrollEnd() {
    var targets = document.querySelectorAll('[data-scroll-end]');

    function scrollToEnd(el) {
      requestAnimationFrame(function () {
        el.scrollLeft = el.scrollWidth;
      });
    }

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        scrollToEnd(m.target);
      });
    });

    targets.forEach(function (el) {
      scrollToEnd(el);
      observer.observe(el, {childList: true});
    });
  }

  setDeviceClass();

  setVh();
  var rafId = null;
  (window.visualViewport || window).addEventListener('resize', function () {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      setVh();
      rafId = null;
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollEnd);
  } else {
    initScrollEnd();
  }
})(window, document);
