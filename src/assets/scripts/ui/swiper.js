/**
 * scripts/ui/swiper.js
 * @purpose Swiper 초기화 공통 UI(배너/상품 썸네일 등)
 * @assumption
 *  - Swiper는 npm 의존성(swiper@^11.x)으로 설치되어 번들에 포함된다
 *  - 마크업(data-swiper)로 선언된 영역만 초기화한다
 * @options
 *  - data-swiper-loop="true"        : loop 사용 여부
 *  - data-swiper-autoplay="3000"    : autoplay delay(ms). 값이 없으면 autoplay 비활성
 * @maintenance
 *  - 페이지 의미(main/detail 등) 분기 금지
 *  - 커스터마이징(옵션/규칙)은 이 파일에서만 관리
 */

import Swiper from 'swiper/bundle';

(function ($, window) {
  'use strict';

  if (!$) return;

  window.UI = window.UI || {};

  /**
   * 문자열 값을 boolean으로 변환
   * @param {*} v data- 값
   * @returns {boolean}
   */
  function toBool(v) {
    return String(v) === 'true';
  }

  /**
   * 문자열 값을 number로 변환
   * @param {*} v data- 값
   * @returns {(number|null)}
   */
  function toNum(v) {
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  /**
   * 단일 Swiper 초기화
   * @param {jQuery} $root data-swiper 루트
   * @returns {void}
   */
  function initOne($root) {
    var el = $root.find('.swiper')[0];
    if (!el) return;

    var loop = toBool($root.data('swiperLoop'));
    var autoplayDelay = toNum($root.data('swiperAutoplay'));

    var config = {
      loop: loop,
      pagination: {
        el: $root.find('.swiper-pagination')[0] || null,
        clickable: true
      },
      navigation: {
        nextEl: $root.find('.swiper-button-next')[0] || null,
        prevEl: $root.find('.swiper-button-prev')[0] || null
      }
    };

    if (autoplayDelay) {
      config.autoplay = {delay: autoplayDelay, disableOnInteraction: false};
    }

    new Swiper(el, config);
  }

  /** Deal Gallery : 상품상세페이지 deal_gallery 영역 */
  function initDealGallery() {
    if (typeof Swiper === 'undefined' || typeof $ === 'undefined') return;

    var galleryTop = new Swiper('.gallery-top', {
      spaceBetween: 10,
      loop: false
    });

    var galleryThumbs = new Swiper('.gallery-thumbs', {
      spaceBetween: 10,
      centeredSlides: true,
      slidesPerView: 5,
      slideToClickedSlide: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      }
    });

    galleryTop.controller.control = galleryThumbs;
    galleryThumbs.controller.control = galleryTop;

    /*Zoom State */
    var zoomState = {
      naturalWidth: 0,
      naturalHeight: 0,
      zoomRatio: 3
    };

    function resetZoomState() {
      zoomState.naturalWidth = 0;
      zoomState.naturalHeight = 0;
    }

    /* Utils */
    function loadImageSize($img, cb) {
      if ($img[0].complete) {
        cb($img[0].naturalWidth, $img[0].naturalHeight);
      } else {
        $img.one('load', function () {
          cb(this.naturalWidth, this.naturalHeight);
        });
      }
    }

    function getMousePosition(e, $img) {
      var offset = $img.offset();
      return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
      };
    }

    /* Zoom Logic*/
    function handleZoom(e) {
      var $slide = $('.swiper-slide-active');
      var $img = $slide.find('.original_image');
      var $lens = $slide.find('.zoom_lens');
      var $container = $('.magnified_container');
      var $zoomImg = $('.magnified_image');

      if (!$img.length || $slide.find('iframe').length) {
        $lens.hide();
        $container.hide();
        return;
      }

      var iw = $img.outerWidth();
      var ih = $img.outerHeight();

      var mouse = getMousePosition(e, $img);

      if (mouse.x < 0 || mouse.y < 0 || mouse.x > iw || mouse.y > ih) {
        $lens.hide();
        $container.hide();
        return;
      }

      if (!zoomState.naturalWidth) {
        loadImageSize($img, function (w, h) {
          zoomState.naturalWidth = w;
          zoomState.naturalHeight = h;
        });
        return;
      }

      $lens.show();
      $container.show();

      /* 확대 비율 */
      var baseRatio = Math.max(zoomState.naturalWidth / iw, zoomState.naturalHeight / ih);
      var ratio = baseRatio * zoomState.zoomRatio;

      var zw = zoomState.naturalWidth * ratio;
      var zh = zoomState.naturalHeight * ratio;

      $zoomImg.css({width: zw, height: zh});

      /* lens 이동 */
      var lw = $lens.outerWidth();
      var lh = $lens.outerHeight();

      var px = Math.max(0, Math.min(mouse.x - lw / 2, iw - lw));
      var py = Math.max(0, Math.min(mouse.y - lh / 2, ih - lh));

      $lens.css({
        left: px + $img.position().left,
        top: py + $img.position().top
      });

      /* 확대 이미지 이동 */
      var cw = $container.width();
      var ch = $container.height();

      var rx = (px / (iw - lw)) * (zw - cw);
      var ry = (py / (ih - lh)) * (zh - ch);

      $zoomImg.css({
        left: -rx,
        top: -ry
      });
    }

    /*Events*/
    $('.gallery-top')
      .on('mousemove', handleZoom)
      .on('mouseleave', function () {
        $('.zoom_lens').hide();
        $('.magnified_container').hide();
      });

    galleryTop.on('slideChange', function () {
      resetZoomState();
      var src = $('.swiper-slide-active .original_image').attr('src');
      $('.magnified_image').attr('src', src);
    });

    $('.magnified_image').attr('src', $('.swiper-slide-active .original_image').attr('src'));
  }
  initDealGallery();

  window.UI.swiper = {
    /**
     * Swiper 초기화
     * @returns {void}
     * @example
     * // scripts/core/ui.js의 UI.init()에서 호출
     * UI.swiper.init();
     */
    init: function () {
      $('[data-swiper]').each(function () {
        initOne($(this));
      });

      console.log('[swiper] init');
    }
  };

  console.log('[swiper] module loaded');
})(window.jQuery || window.$, window);
