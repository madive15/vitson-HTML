/* s: 메인 썸네일(큰 이미지)에서 좌우 화살표 사용 안 할 떄, 아래 삭제
  - <button ... data-main-prev></button>
  - <button ... data-main-next></button>
  - var mainPrev = root.querySelector("[data-main-prev]");
  - var mainNext = root.querySelector("[data-main-next]");
  - mainPrev.addEventListener("click", ...);
  - mainNext.addEventListener("click", ...);
  - mainPrev.classList.add("swiper-button-disabled");
  - mainNext.classList.add("swiper-button-disabled");
  - mainPrev.classList.remove("swiper-button-disabled");
  - mainNext.classList.remove("swiper-button-disabled");
  - if (currentIndex <= 0) mainPrev... else ...
  - if (currentIndex >= last) mainNext... else ...
*/

import Swiper from 'swiper/bundle';

(function () {
  'use strict';
  if (typeof Swiper === 'undefined') return;

  var root = document.querySelector('[data-test-gallery]');
  if (!root) return;

  var mainEl = root.querySelector('[data-main-swiper]');
  var thumbsEl = root.querySelector('[data-thumbs-swiper]');
  var mainWrapper = root.querySelector('[data-main-wrapper]');
  var thumbsWrapper = root.querySelector('[data-thumbs-wrapper]');
  if (!mainEl || !thumbsEl || !mainWrapper || !thumbsWrapper) return;

  var mainPrev = root.querySelector('[data-main-prev]');
  var mainNext = root.querySelector('[data-main-next]');
  var thumbsPrev = root.querySelector('[data-thumbs-prev]');
  var thumbsNext = root.querySelector('[data-thumbs-next]');
  if (!thumbsPrev || !thumbsNext) return;

  var zoomBox = root.querySelector('[data-zoom]');
  var zoomImg = root.querySelector('[data-zoom-img]');

  var ZOOM_RATIO = 3;

  // EJS 템플릿에서 렌더링된 슬라이드 기준으로 아이템 구성
  var mainSlides = Array.prototype.slice.call(mainWrapper.querySelectorAll('.swiper-slide'));
  var items = mainSlides.map(function (slide) {
    var img = slide.querySelector('[data-main-img]');
    if (img) {
      return {
        type: 'image',
        src: img.src,
        alt: img.alt || ''
      };
    }
    return {
      type: 'iframe',
      src: '',
      alt: ''
    };
  });

  var thumbBtns = Array.prototype.slice.call(root.querySelectorAll('[data-thumb]'));

  var thumbsSwiper = new Swiper(thumbsEl, {
    loop: false,
    slidesPerView: 'auto',
    spaceBetween: 7,
    centeredSlides: false,
    centeredSlidesBounds: false,
    centerInsufficientSlides: false,
    watchSlidesProgress: true,
    allowTouchMove: false
  });

  var mainSwiper = new Swiper(mainEl, {
    loop: false,
    slidesPerView: 1,
    allowTouchMove: true
  });

  var currentIndex = 0;

  function clampIndex(i) {
    var last = items.length - 1;
    if (i < 0) return 0;
    if (i > last) return last;
    return i;
  }

  function setIndex(nextIndex) {
    currentIndex = clampIndex(nextIndex);

    mainSwiper.slideTo(currentIndex);
    thumbsSwiper.slideTo(currentIndex);

    thumbBtns.forEach(function (btn, i) {
      if (i === currentIndex) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    });

    var last = items.length - 1;

    if (items.length <= 1) {
      thumbsPrev.classList.add('is-hidden');
      thumbsNext.classList.add('is-hidden');
    } else {
      thumbsPrev.classList.remove('is-hidden');
      thumbsNext.classList.remove('is-hidden');
    }

    if (currentIndex <= 0) thumbsPrev.classList.add('is-disabled');
    else thumbsPrev.classList.remove('is-disabled');

    if (currentIndex >= last) thumbsNext.classList.add('is-disabled');
    else thumbsNext.classList.remove('is-disabled');

    if (mainPrev) {
      if (currentIndex <= 0) mainPrev.classList.add('swiper-button-disabled');
      else mainPrev.classList.remove('swiper-button-disabled');
    }

    if (mainNext) {
      if (currentIndex >= last) mainNext.classList.add('swiper-button-disabled');
      else mainNext.classList.remove('swiper-button-disabled');
    }

    if (zoomImg) {
      if (items[currentIndex].src) zoomImg.src = items[currentIndex].src;
      else zoomImg.removeAttribute('src');
    }
    if (!items[currentIndex].src) hideZoom();
  }

  if (mainPrev) {
    mainPrev.addEventListener('click', function () {
      setIndex(currentIndex - 1);
    });
  }
  if (mainNext) {
    mainNext.addEventListener('click', function () {
      setIndex(currentIndex + 1);
    });
  }

  thumbsPrev.addEventListener('click', function () {
    setIndex(currentIndex - 1);
  });
  thumbsNext.addEventListener('click', function () {
    setIndex(currentIndex + 1);
  });

  thumbBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      setIndex(idx);
    });
  });

  function hideZoom() {
    if (!zoomBox) return;
    zoomBox.classList.remove('is-on');
    zoomBox.setAttribute('aria-hidden', 'true');
  }
  function showZoom() {
    if (!zoomBox) return;
    zoomBox.classList.add('is-on');
    zoomBox.setAttribute('aria-hidden', 'false');
  }

  function ensureNatural(img, cb) {
    if (!img) return;
    if (img.complete && img.naturalWidth && img.naturalHeight) {
      cb(img.naturalWidth, img.naturalHeight);
      return;
    }
    img.addEventListener('load', function onLoad() {
      img.removeEventListener('load', onLoad);
      cb(img.naturalWidth, img.naturalHeight);
    });
  }

  function getContainRect(containerW, containerH, naturalW, naturalH) {
    var scale = Math.min(containerW / naturalW, containerH / naturalH);
    var drawW = naturalW * scale;
    var drawH = naturalH * scale;
    var offsetX = (containerW - drawW) / 2;
    var offsetY = (containerH - drawH) / 2;
    return {x: offsetX, y: offsetY, w: drawW, h: drawH};
  }

  function getActiveImgEl() {
    return mainEl.querySelector('.swiper-slide-active [data-main-img]');
  }

  if (zoomBox && zoomImg) {
    mainEl.addEventListener('mouseenter', function () {
      var img = getActiveImgEl();
      if (!img) {
        hideZoom();
        return;
      }
      showZoom();
    });
    mainEl.addEventListener('mouseleave', function () {
      hideZoom();
    });

    mainEl.addEventListener('mousemove', function (e) {
      if (!zoomBox.classList.contains('is-on')) return;

      var img = getActiveImgEl();
      if (!img) {
        hideZoom();
        return;
      }

      var contRect = mainEl.getBoundingClientRect();
      var cx = e.clientX - contRect.left;
      var cy = e.clientY - contRect.top;

      ensureNatural(img, function (nw, nh) {
        var cr = getContainRect(contRect.width, contRect.height, nw, nh);

        if (cx < cr.x || cy < cr.y || cx > cr.x + cr.w || cy > cr.y + cr.h) {
          hideZoom();
          return;
        } else {
          showZoom();
        }

        var rx = (cx - cr.x) / cr.w;
        var ry = (cy - cr.y) / cr.h;

        var baseRatio = Math.max(nw / cr.w, nh / cr.h);
        var ratio = baseRatio * ZOOM_RATIO;

        var zoomW = nw * ratio;
        var zoomH = nh * ratio;

        zoomImg.style.width = zoomW + 'px';
        zoomImg.style.height = zoomH + 'px';

        var zw = zoomBox.clientWidth;
        var zh = zoomBox.clientHeight;

        var left = -(rx * (zoomW - zw));
        var top = -(ry * (zoomH - zh));

        if (left > 0) left = 0;
        if (top > 0) top = 0;
        if (left < -(zoomW - zw)) left = -(zoomW - zw);
        if (top < -(zoomH - zh)) top = -(zoomH - zh);

        zoomImg.style.left = left + 'px';
        zoomImg.style.top = top + 'px';
      });
    });
  }

  setIndex(0);
})();

/**
 * Swiper 타입별 기본 옵션 정의
 * - 여기만 수정하면 전체 Swiper에 반영됨
 */
(function () {
  'use strict';
  if (typeof Swiper === 'undefined') return;

  const DEFAULT_OFFSET = {
    before: 0,
    after: 0
  };
  const SWIPER_PRESETS = {
    test: {
      spaceBetween: 32.5,
      speed: 400,
      breakpoints: {
        1024: {slidesPerView: 2},
        1280: {slidesPerView: 2}
      }
    },
    card: {
      slidesPerView: 5,
      spaceBetween: 27.5,
      speed: 400,
      breakpoints: {
        1024: {slidesPerView: 4},
        1280: {slidesPerView: 5}
      }
    },
    slim: {
      spaceBetween: 17.6,
      speed: 400,
      breakpoints: {
        1024: {slidesPerView: 4},
        1280: {slidesPerView: 6}
      }
    }
  };

  function initSwipers() {
    if (typeof Swiper === 'undefined') {
      setTimeout(initSwipers, 100);
      return;
    }

    document.querySelectorAll('.js-swiper').forEach(function (el) {
      const type = el.dataset.swiperType;
      if (!SWIPER_PRESETS[type]) return;

      // 프리셋 객체를 깊은 복사하여 각 인스턴스가 독립적으로 동작하도록 함
      const preset = JSON.parse(JSON.stringify(SWIPER_PRESETS[type]));

      // offset 개별 제어
      const offsetBeforeAttr = el.getAttribute('data-offset-before');
      const offsetAfterAttr = el.getAttribute('data-offset-after');

      const offsetBefore = offsetBeforeAttr !== null ? Number(offsetBeforeAttr) : DEFAULT_OFFSET.before;
      const offsetAfter = offsetAfterAttr !== null ? Number(offsetAfterAttr) : DEFAULT_OFFSET.after;

      // desktop slidesPerView 오버라이드 (복사된 객체를 수정하므로 원본에 영향 없음)
      const desktopView = el.dataset.desktop;
      if (desktopView && preset.breakpoints && preset.breakpoints[1280]) {
        preset.breakpoints[1280].slidesPerView = Number(desktopView);
      }

      // breakpoints에도 offset 적용 (사용자가 명시적으로 설정한 경우)
      if (preset.breakpoints && (offsetBefore !== DEFAULT_OFFSET.before || offsetAfter !== DEFAULT_OFFSET.after)) {
        Object.keys(preset.breakpoints).forEach(function (breakpoint) {
          // breakpoint에 이미 offset이 설정되어 있지 않은 경우에만 적용
          if (offsetBefore !== DEFAULT_OFFSET.before && !('slidesOffsetBefore' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetBefore = offsetBefore;
          }
          if (offsetAfter !== DEFAULT_OFFSET.after && !('slidesOffsetAfter' in preset.breakpoints[breakpoint])) {
            preset.breakpoints[breakpoint].slidesOffsetAfter = offsetAfter;
          }
        });
      }

      // navigation 버튼 찾기: container 내부 또는 외부의 vits-swiper-navs에서 찾기
      var nextEl = el.querySelector('.swiper-button-next');
      var prevEl = el.querySelector('.swiper-button-prev');

      // container 내부에서 찾지 못한 경우, container 밖의 vits-swiper-navs에서 찾기
      if (!nextEl || !prevEl) {
        // container의 부모 요소에서 vits-swiper-navs 찾기
        const parent = el.parentElement;
        if (parent) {
          const navsContainer = parent.querySelector('.vits-swiper-navs');
          if (navsContainer) {
            if (!nextEl) nextEl = navsContainer.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = navsContainer.querySelector('.swiper-button-prev');
          }
        }

        // 부모에서 찾지 못한 경우, 형제 요소에서 찾기
        if ((!nextEl || !prevEl) && el.nextElementSibling) {
          const nextSibling = el.nextElementSibling;
          if (nextSibling.classList.contains('vits-swiper-navs')) {
            if (!nextEl) nextEl = nextSibling.querySelector('.swiper-button-next');
            if (!prevEl) prevEl = nextSibling.querySelector('.swiper-button-prev');
          }
        }
      }

      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: preset.spaceBetween,
        speed: preset.speed,
        slidesOffsetBefore: offsetBefore,
        slidesOffsetAfter: offsetAfter,
        centeredSlides: false,
        navigation: {
          nextEl: nextEl,
          prevEl: prevEl
        },
        pagination: {
          el: el.querySelector('.swiper-pagination'),
          clickable: true
        },
        breakpoints: preset.breakpoints
      });
    });
  }

  function waitForDependencies() {
    if (typeof Swiper === 'undefined') {
      setTimeout(waitForDependencies, 100);
      return;
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initSwipers);
    } else {
      initSwipers();
    }
  }

  waitForDependencies();
})();

// window.UI.swiper로 등록 (선택적)
(function (window) {
  'use strict';
  window.UI = window.UI || {};
  window.UI.swiper = {
    init: function () {
      // 이미 자동 실행되므로 빈 함수로 유지
      // 필요시 여기에 추가 초기화 로직 작성
    }
  };
})(window);
