/**
 * @file scripts-mo/ui/home/home-swiper-tab.js
 * @description 홈 탭형 배너 Swiper (기본 + 가로 상품)
 * @scope [data-ui="banner-tab"]
 * @option data-autoplay, data-speed, data-loop
 */
import Swiper from 'swiper/bundle';

(function ($) {
  'use strict';

  var SCOPE = '[data-ui="banner-tab"]';

  function getInt(el, name) {
    var val = el.getAttribute('data-' + name);
    return val ? parseInt(val, 10) : null;
  }

  function getBool(el, name) {
    return el.getAttribute('data-' + name) === 'true';
  }

  // 탭 활성 동기화 + 뷰포트 노출
  function syncTabActive(tabSwiper, idx) {
    var slides = tabSwiper.slides;
    for (var i = 0; i < slides.length; i++) {
      if (i === idx) {
        slides[i].classList.add('swiper-slide-thumb-active');
      } else {
        slides[i].classList.remove('swiper-slide-thumb-active');
      }
    }

    var slide = slides[idx];
    if (!slide) return;
    var containerWidth = tabSwiper.el.clientWidth;
    var slideLeft = slide.offsetLeft;
    var slideWidth = slide.offsetWidth;
    var currentTranslate = tabSwiper.getTranslate();

    var slideRight = slideLeft + slideWidth;
    var visibleRight = -currentTranslate + containerWidth;
    if (slideRight > visibleRight) {
      tabSwiper.setTranslate(-(slideRight - containerWidth + 16));
    }

    var visibleLeft = -currentTranslate;
    if (slideLeft < visibleLeft) {
      tabSwiper.setTranslate(-(slideLeft - 16));
    }
  }

  // 탭 Swiper 공통
  function createTabSwiper(el) {
    return new Swiper(el, {
      slidesPerView: 'auto',
      spaceBetween: 8,
      slidesOffsetBefore: 16,
      slidesOffsetAfter: 16,
      watchSlidesProgress: true,
      observer: true,
      observeParents: true
    });
  }

  // 탭 클릭 바인딩
  function bindTabClick(tabSwiper, contentSwiper) {
    $(tabSwiper.slides).each(function (i, slide) {
      $(slide).on('click', function () {
        contentSwiper.slideTo(i);
      });
    });
  }

  // 기본 탭형
  function initTab() {
    $(SCOPE)
      .not('[data-type]')
      .each(function (idx, el) {
        var $root = $(el);
        if ($root.data('init')) return;

        var tabEl = $root.find('.tab-area > .swiper')[0];
        var contentEl = $root.find('.content-area > .swiper')[0];
        if (!tabEl || !contentEl) return;

        var tabSwiper = createTabSwiper(tabEl);

        var contentConfig = {
          slidesPerView: 1,
          observer: true,
          observeParents: true,
          preventClicks: true,
          preventClicksPropagation: true,
          thumbs: {swiper: tabSwiper},
          on: {
            slideChange: function (swiper) {
              syncTabActive(tabSwiper, swiper.activeIndex);
            }
          }
        };

        var speedVal = getInt(el, 'speed');
        if (speedVal) contentConfig.speed = speedVal;
        if (getBool(el, 'loop')) contentConfig.loop = true;
        var autoplayVal = getInt(el, 'autoplay');
        if (autoplayVal) contentConfig.autoplay = {delay: autoplayVal, disableOnInteraction: false};

        var contentSwiper = new Swiper(contentEl, contentConfig);

        bindTabClick(tabSwiper, contentSwiper);
        $root.data('init', true);
      });
  }

  // 가로 상품 탭형
  function initTabHscroll() {
    $(SCOPE)
      .filter('[data-type="hscroll"]')
      .each(function (idx, el) {
        var $root = $(el);
        if ($root.data('init')) return;

        var tabEl = $root.find('.tab-area > .swiper')[0];
        var contentEl = $root.find('.content-area > .swiper')[0];
        if (!tabEl || !contentEl) return;

        var tabSwiper = createTabSwiper(tabEl);
        var innerSwipers = [];

        var contentConfig = {
          slidesPerView: 1,
          allowTouchMove: false,
          observer: true,
          observeParents: true,
          thumbs: {swiper: tabSwiper},
          on: {
            slideChange: function (swiper) {
              syncTabActive(tabSwiper, swiper.activeIndex);
              // 전환된 탭 내부 Swiper 첫 번째로 리셋
              var targetInner = innerSwipers[swiper.activeIndex];
              if (targetInner) targetInner.slideTo(0, 0);
            }
          }
        };

        var speedVal = getInt(el, 'speed');
        if (speedVal) contentConfig.speed = speedVal;
        if (getBool(el, 'loop')) contentConfig.loop = true;
        var autoplayVal = getInt(el, 'autoplay');
        if (autoplayVal) contentConfig.autoplay = {delay: autoplayVal, disableOnInteraction: false};

        var contentSwiper = new Swiper(contentEl, contentConfig);

        bindTabClick(tabSwiper, contentSwiper);

        // 내부 가로 상품 Swiper
        $root.find('[data-role="inner-swiper"] > .swiper').each(function (i, innerEl) {
          var touchStartX = 0;
          var wasAtEnd = false;
          var wasAtBeginning = false;

          var inner = new Swiper(innerEl, {
            slidesPerView: 'auto',
            spaceBetween: 10,
            nested: true,
            observer: true,
            observeParents: true,
            preventClicks: true,
            preventClicksPropagation: true,
            on: {
              touchStart: function (swiper, e) {
                var touch = e.touches ? e.touches[0] : e;
                touchStartX = touch.clientX;
                wasAtEnd = swiper.isEnd;
                wasAtBeginning = swiper.isBeginning;
              },
              touchEnd: function (swiper, e) {
                var touch = e.changedTouches ? e.changedTouches[0] : e;
                var diff = touchStartX - touch.clientX;

                if (diff > 30 && wasAtEnd && swiper.isEnd) {
                  var next = contentSwiper.activeIndex + 1;
                  if (next < contentSwiper.slides.length) contentSwiper.slideTo(next);
                }

                if (diff < -30 && wasAtBeginning && swiper.isBeginning) {
                  var prev = contentSwiper.activeIndex - 1;
                  if (prev >= 0) contentSwiper.slideTo(prev);
                }
              }
            }
          });
          innerSwipers.push(inner);
        });

        $root.data('init', true);
      });
  }

  function init() {
    initTab();
    initTabHscroll();
  }

  function destroy() {
    $(SCOPE).each(function (idx, el) {
      var $root = $(el);
      if (!$root.data('init')) return;
      $root.find('.swiper').each(function (i, swiperEl) {
        if (swiperEl.swiper) swiperEl.swiper.destroy(true, true);
      });
      $root.removeData('init');
    });
  }

  window.UI = window.UI || {};
  window.UI.homeSwiperTab = {init: init, destroy: destroy};
})(window.jQuery);
