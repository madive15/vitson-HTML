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

  /**
   * @description pre-wrap 요소의 선행 공백·줄바꿈 제거
   * @scope [data-pre-trim]
   * @note 서버 렌더링 시 태그와 텍스트 사이 줄바꿈이 그대로 노출되는 현상 보정
   */
  function trimPreContent() {
    var targets = document.querySelectorAll('[data-pre-trim]');
    targets.forEach(function (el) {
      el.textContent = el.textContent.replace(/^\s+/, '');
    });
  }

  setDeviceClass();

  setVh();
  var rafId = null;
  function onViewportChange() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      setVh();
      rafId = null;
    });
  }

  var vv = window.visualViewport;
  if (vv) {
    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);

    // 검색 오버레이 키보드 대응 — iOS Safari fixed 요소 키보드 밀림 방지
    var isKeyboardOpen = false;
    var touchMoveHandler = null;

    var applyOverlayHeight = function () {
      var overlay = document.getElementById('searchOverlay');
      if (!overlay) return;
      var contentWrap = overlay.querySelector('.vm-content-wrap');
      var wrapper = overlay.querySelector('.vm-wrapper');
      var wrap = overlay.querySelector('.vm-wrap');
      var header = overlay.querySelector('.vm-header');

      if (isKeyboardOpen) {
        var h = vv.height + 'px';
        overlay.style.height = h;
        overlay.style.overflow = 'hidden';

        if (header) {
          header.style.position = 'fixed';
          header.style.top = '0';
          header.style.left = '0';
          header.style.right = '0';
          header.style.zIndex = '300';
        }

        if (wrapper) wrapper.style.height = h;
        if (wrap) {
          wrap.style.height = h;
          wrap.style.overflow = 'hidden';
        }
        if (contentWrap) {
          contentWrap.style.height = h;
          contentWrap.style.maxHeight = h;
          contentWrap.style.flex = 'none';
          contentWrap.style.paddingTop = header ? header.offsetHeight + 'px' : '';
          contentWrap.style.overscrollBehavior = 'none';

          // 스크롤 끝 바운스 방지
          if (!touchMoveHandler) {
            touchMoveHandler = function () {
              var top = contentWrap.scrollTop;
              var max = contentWrap.scrollHeight - contentWrap.clientHeight;
              if (top >= max) contentWrap.scrollTop = max - 1;
              if (top <= 0) contentWrap.scrollTop = 1;
            };
            contentWrap.addEventListener('touchmove', touchMoveHandler, {passive: false});
          }
        }
      } else {
        overlay.style.height = '';
        overlay.style.overflow = '';

        if (header) {
          header.style.position = '';
          header.style.top = '';
          header.style.left = '';
          header.style.right = '';
          header.style.zIndex = '';
        }

        if (wrapper) wrapper.style.height = '';
        if (wrap) {
          wrap.style.height = '';
          wrap.style.overflow = '';
        }
        if (contentWrap) {
          contentWrap.style.height = '';
          contentWrap.style.maxHeight = '';
          contentWrap.style.flex = '';
          contentWrap.style.paddingTop = '';
          contentWrap.style.overscrollBehavior = '';

          if (touchMoveHandler) {
            contentWrap.removeEventListener('touchmove', touchMoveHandler);
            touchMoveHandler = null;
          }
        }
      }
    };

    vv.addEventListener('resize', applyOverlayHeight);

    vv.addEventListener('scroll', function () {
      if (isKeyboardOpen) {
        applyOverlayHeight();
      }
    });

    document.addEventListener('focusin', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        isKeyboardOpen = true;
        setTimeout(applyOverlayHeight, 500);
      }
    });

    document.addEventListener('focusout', function () {
      isKeyboardOpen = false;
      setTimeout(applyOverlayHeight, 300);
    });
  } else {
    window.addEventListener('resize', onViewportChange);
  }

  // [TODO] iPad Chrome safe-area 초기 렌더링 지연 이슈
  // 스크롤 시 즉시 정상. 실서비스 확인 후 필요시 아래 코드 활성화
  // ---
  // window.addEventListener('pageshow', function () {
  //   setTimeout(function () {
  //     window.dispatchEvent(new Event('resize'));
  //   }, 100);
  // });
  // ---

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initScrollEnd();
      trimPreContent();
    });
  } else {
    initScrollEnd();
    trimPreContent();
  }
})(window, document);
