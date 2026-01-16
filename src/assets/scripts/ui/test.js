/**
 * pages/test/test-gallery.js
 * - 테스트 전용: 가라 이미지(data URL) 생성 + Swiper(메인/썸네일) 연동 + 우측 확대(커서 추적)
 * - 전제: 이 파일이 해당 테스트 페이지 엔트리에서 import 되어 실행된다
 */

import Swiper from 'swiper/bundle';

(function () {
  'use strict';

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

  var zoomBox = root.querySelector('[data-zoom]');
  var zoomImg = root.querySelector('[data-zoom-img]');

  var ZOOM_RATIO = 3; // 확대 강도(필요하면 2~4 정도로 조절)

  // -----------------------------
  // 1) 가라 이미지(data URL) 생성
  // -----------------------------
  function makeSvgDataUrl(label, c1, c2) {
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200' viewBox='0 0 1200 1200'>" +
      '<defs>' +
      "<linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='" +
      c1 +
      "'/>" +
      "<stop offset='1' stop-color='" +
      c2 +
      "'/>" +
      '</linearGradient>' +
      '</defs>' +
      "<rect width='1200' height='1200' fill='url(#g)'/>" +
      // 격자
      "<path d='M0 0 H1200 M0 100 H1200 M0 200 H1200 M0 300 H1200 M0 400 H1200 M0 500 H1200 M0 600 H1200 M0 700 H1200 M0 800 H1200 M0 900 H1200 M0 1000 H1200 M0 1100 H1200' stroke='rgba(0,0,0,0.18)' stroke-width='2'/>" +
      "<path d='M0 0 V1200 M100 0 V1200 M200 0 V1200 M300 0 V1200 M400 0 V1200 M500 0 V1200 M600 0 V1200 M700 0 V1200 M800 0 V1200 M900 0 V1200 M1000 0 V1200 M1100 0 V1200' stroke='rgba(0,0,0,0.18)' stroke-width='2'/>" +
      // 중앙 십자
      "<line x1='600' y1='60' x2='600' y2='1140' stroke='rgba(255,255,255,0.55)' stroke-width='10'/>" +
      "<line x1='60' y1='600' x2='1140' y2='600' stroke='rgba(255,255,255,0.55)' stroke-width='10'/>" +
      // 모서리 라벨
      "<text x='24' y='70' font-size='44' font-family='Arial' fill='rgba(255,255,255,0.85)'>TL</text>" +
      "<text x='1110' y='70' font-size='44' font-family='Arial' fill='rgba(255,255,255,0.85)'>TR</text>" +
      "<text x='24' y='1170' font-size='44' font-family='Arial' fill='rgba(255,255,255,0.85)'>BL</text>" +
      "<text x='1106' y='1170' font-size='44' font-family='Arial' fill='rgba(255,255,255,0.85)'>BR</text>" +
      // 큰 숫자
      "<text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-size='180' font-family='Arial' fill='rgba(255,255,255,0.85)'>" +
      label +
      '</text>' +
      '</svg>';

    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }

  var palette = [
    ['#3b82f6', '#0ea5e9'],
    ['#a855f7', '#ec4899'],
    ['#22c55e', '#16a34a'],
    ['#f97316', '#ef4444'],
    ['#111827', '#6b7280'],
    ['#0f766e', '#14b8a6'],
    ['#7c3aed', '#22d3ee'],
    ['#b91c1c', '#f59e0b']
  ];

  var items = palette.map(function (c, i) {
    var label = (i + 1 < 10 ? '0' : '') + (i + 1);
    var src = makeSvgDataUrl(label, c[0], c[1]);
    return {src: src, alt: '테스트 이미지 ' + label};
  });

  // -----------------------------
  // 2) DOM 주입(메인/썸네일)
  // -----------------------------
  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  items.forEach(function (it, idx) {
    // 메인 슬라이드
    var s1 = el('div', 'swiper-slide');
    var img1 = el('img');
    img1.src = it.src;
    img1.alt = it.alt;
    img1.setAttribute('data-main-img', '');
    img1.loading = idx === 0 ? 'eager' : 'lazy';
    s1.appendChild(img1);
    mainWrapper.appendChild(s1);

    // 썸네일 슬라이드(버튼)
    var s2 = el('button', 'swiper-slide pd-thumb');
    s2.type = 'button';
    s2.setAttribute('data-thumb', '');
    s2.setAttribute('data-index', String(idx));
    s2.setAttribute('aria-label', '썸네일 ' + (idx + 1) + ' 선택');
    var img2 = el('img');
    img2.src = it.src;
    img2.alt = '';
    img2.loading = 'lazy';
    s2.appendChild(img2);
    thumbsWrapper.appendChild(s2);
  });

  var thumbBtns = Array.prototype.slice.call(root.querySelectorAll('[data-thumb]'));

  // -----------------------------
  // 3) Swiper 2개 생성 + 연동
  // -----------------------------
  var thumbsSwiper = new Swiper(thumbsEl, {
    loop: false,
    slidesPerView: 'auto',
    spaceBetween: 8,
    centeredSlides: true,
    centeredSlidesBounds: true,
    centerInsufficientSlides: true,
    watchSlidesProgress: true,
    navigation: {
      prevEl: thumbsPrev,
      nextEl: thumbsNext
    }
  });

  var mainSwiper = new Swiper(mainEl, {
    loop: false,
    slidesPerView: 1,
    allowTouchMove: false,
    navigation: {
      prevEl: mainPrev,
      nextEl: mainNext
    },
    on: {
      init: function () {
        syncThumb(this.activeIndex, true);
        syncZoomSrc();
      },
      slideChange: function () {
        syncThumb(this.activeIndex, true);
        syncZoomSrc();
      }
    }
  });

  thumbBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (isNaN(idx)) return;
      mainSwiper.slideTo(idx);
    });
  });

  function syncThumb(activeIndex, move) {
    thumbBtns.forEach(function (btn, i) {
      if (i === activeIndex) btn.classList.add('is-active');
      else btn.classList.remove('is-active');
    });
    if (move) thumbsSwiper.slideTo(activeIndex);
  }

  // -----------------------------
  // 4) 확대(커서 추적) - contain 레터박스 보정 포함
  // -----------------------------
  function getActiveImgEl() {
    return mainEl.querySelector('.swiper-slide-active [data-main-img]');
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
    // object-fit: contain 기준으로 실제 이미지가 그려지는 영역 계산
    var scale = Math.min(containerW / naturalW, containerH / naturalH);
    var drawW = naturalW * scale;
    var drawH = naturalH * scale;
    var offsetX = (containerW - drawW) / 2;
    var offsetY = (containerH - drawH) / 2;
    return {x: offsetX, y: offsetY, w: drawW, h: drawH};
  }

  function syncZoomSrc() {
    if (!zoomImg) return;
    var img = getActiveImgEl();
    if (!img) return;
    zoomImg.src = img.src;
  }

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

  if (zoomBox && zoomImg) {
    mainEl.addEventListener('mouseenter', function () {
      syncZoomSrc();
      showZoom();
    });

    mainEl.addEventListener('mouseleave', function () {
      hideZoom();
    });

    mainEl.addEventListener('mousemove', function (e) {
      if (!zoomBox.classList.contains('is-on')) return;

      var img = getActiveImgEl();
      if (!img) return;

      var contRect = mainEl.getBoundingClientRect();
      var cx = e.clientX - contRect.left;
      var cy = e.clientY - contRect.top;

      ensureNatural(img, function (nw, nh) {
        var cr = getContainRect(contRect.width, contRect.height, nw, nh);

        // 이미지 실제 영역 밖이면 확대 숨김(레터박스 영역)
        if (cx < cr.x || cy < cr.y || cx > cr.x + cr.w || cy > cr.y + cr.h) {
          hideZoom();
          return;
        } else {
          showZoom();
        }

        // 마우스가 이미지 영역 내에서 차지하는 비율(0~1)
        var rx = (cx - cr.x) / cr.w;
        var ry = (cy - cr.y) / cr.h;

        // 확대 비율: 원본/표시 비율 * 추가 배율
        var baseRatio = Math.max(nw / cr.w, nh / cr.h);
        var ratio = baseRatio * ZOOM_RATIO;

        var zoomW = nw * ratio;
        var zoomH = nh * ratio;

        // 확대 이미지 크기 적용
        zoomImg.style.width = zoomW + 'px';
        zoomImg.style.height = zoomH + 'px';

        // 확대 컨테이너 크기
        var zw = zoomBox.clientWidth;
        var zh = zoomBox.clientHeight;

        // 확대 이미지 이동(커서가 가리키는 지점이 확대 영역에서 자연스럽게 보이도록)
        var left = -(rx * (zoomW - zw));
        var top = -(ry * (zoomH - zh));

        // 경계 클램프
        if (left > 0) left = 0;
        if (top > 0) top = 0;
        if (left < -(zoomW - zw)) left = -(zoomW - zw);
        if (top < -(zoomH - zh)) top = -(zoomH - zh);

        zoomImg.style.left = left + 'px';
        zoomImg.style.top = top + 'px';
      });
    });
  }
})();
