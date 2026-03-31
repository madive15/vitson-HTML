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

    // 검색 오버레이 키보드 대응
    var applyOverlayHeight = function (source) {
      var overlay = document.getElementById('searchOverlay');
      if (!overlay) return;
      var contentWrap = overlay.querySelector('.vm-content-wrap');

      var diff = window.innerHeight - vv.height;

      // 디버그용 — 확인 후 제거
      var debugEl = document.getElementById('debugOverlay');
      if (!debugEl) {
        debugEl = document.createElement('div');
        debugEl.id = 'debugOverlay';
        debugEl.style.cssText =
          'position:fixed;top:50px;left:0;z-index:99999;background:red;color:#fff;padding:8px 12px;font-size:14px;line-height:1.4';
        document.body.appendChild(debugEl);
      }
      debugEl.innerHTML =
        'source: ' +
        source +
        '<br>diff: ' +
        Math.round(diff) +
        '<br>vv.height: ' +
        Math.round(vv.height) +
        '<br>innerHeight: ' +
        window.innerHeight;

      if (source === 'resize') {
        overlay.style.background = 'rgba(0,255,0,0.3)';
      } else if (source === 'focus') {
        overlay.style.background = 'rgba(0,0,255,0.3)';
      }

      var wrapper = overlay.querySelector('.vm-wrapper');
      var wrap = overlay.querySelector('.vm-wrap');
      var mainContent = overlay.querySelector('.main-content-search');

      if (diff > 50) {
        var h = vv.height + 'px';
        overlay.style.height = h;

        if (wrapper) wrapper.style.height = h;
        if (wrap) wrap.style.height = h;
        if (contentWrap) contentWrap.style.maxHeight = h;

        // 디버그용 — 확인 후 제거
        if (mainContent) {
          mainContent.style.background = 'red';
        }
      } else {
        overlay.style.height = '';

        if (wrapper) wrapper.style.height = '';
        if (wrap) wrap.style.height = '';
        if (contentWrap) contentWrap.style.maxHeight = '';

        // 디버그용 — 확인 후 제거
        if (mainContent) {
          mainContent.style.background = 'blue';
        }
      }
    };

    vv.addEventListener('resize', function () {
      applyOverlayHeight('resize');
    });
    vv.addEventListener('scroll', function () {
      applyOverlayHeight('scroll');
    });

    document.addEventListener('focusin', function () {
      setTimeout(function () {
        applyOverlayHeight('focus');
      }, 500);
    });

    document.addEventListener('focusout', function () {
      setTimeout(function () {
        applyOverlayHeight('blur');
      }, 300);
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
