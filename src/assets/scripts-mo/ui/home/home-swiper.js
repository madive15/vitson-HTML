// /**
//  * @file scripts-mo/ui/home/home-swiper.js
//  * @description 홈 배너 Swiper - 비주얼 / 탭형 / peek형
//  * @scope [data-ui="banner-visual"], [data-ui="banner-tab"], [data-ui="banner-peek"]
//  * @option data-autoplay, data-speed, data-space-between, data-slides-per-view,
//  *         data-loop, data-centered-slides
//  */
// import Swiper from 'swiper/bundle';

// (function () {
//   'use strict';

//   function getInt(root, name) {
//     var val = root.getAttribute('data-' + name);
//     return val ? parseInt(val, 10) : null;
//   }

//   function getFloat(root, name) {
//     var val = root.getAttribute('data-' + name);
//     return val ? parseFloat(val) : null;
//   }

//   function getBool(root, name) {
//     return root.getAttribute('data-' + name) === 'true';
//   }

//   // 탭 활성 동기화 + 뷰포트 노출
//   function syncTabActive(tabSwiper, idx) {
//     tabSwiper.slides.forEach(function (slide, i) {
//       if (i === idx) {
//         slide.classList.add('swiper-slide-thumb-active');
//       } else {
//         slide.classList.remove('swiper-slide-thumb-active');
//       }
//     });

//     var slide = tabSwiper.slides[idx];
//     if (!slide) return;
//     var containerWidth = tabSwiper.el.clientWidth;
//     var slideLeft = slide.offsetLeft;
//     var slideWidth = slide.offsetWidth;
//     var currentTranslate = tabSwiper.getTranslate();

//     var slideRight = slideLeft + slideWidth;
//     var visibleRight = -currentTranslate + containerWidth;
//     if (slideRight > visibleRight) {
//       tabSwiper.setTranslate(-(slideRight - containerWidth + 16));
//     }

//     var visibleLeft = -currentTranslate;
//     if (slideLeft < visibleLeft) {
//       tabSwiper.setTranslate(-(slideLeft - 16));
//     }
//   }

//   function bindTabClick(tabSwiper, contentSwiper) {
//     tabSwiper.slides.forEach(function (slide, i) {
//       slide.addEventListener('click', function () {
//         contentSwiper.slideTo(i);
//       });
//     });
//   }

//   // 비주얼 배너
//   function initVisual() {
//     document.querySelectorAll('[data-ui="banner-visual"]').forEach(function (root) {
//       if (root._bannerInstance) return;

//       var swiperEl = root.querySelector(':scope > .swiper');
//       if (!swiperEl) return;

//       var config = {
//         slidesPerView: 1.3,
//         centeredSlides: true,
//         loop: true,
//         spaceBetween: getInt(root, 'space-between') || 0,
//         watchSlidesProgress: true,
//         observer: true,
//         observeParents: true,
//         preventClicks: true,
//         preventClicksPropagation: true,
//         speed: getInt(root, 'speed') || 300
//       };

//       var autoplayVal = getInt(root, 'autoplay');
//       if (autoplayVal) {
//         config.autoplay = {delay: autoplayVal, disableOnInteraction: false};
//       }

//       var swiper = new Swiper(swiperEl, config);

//       root.addEventListener('click', function (e) {
//         var target = e.target.closest('[data-role]');
//         if (!target) return;
//         var role = target.getAttribute('data-role');
//         if (role === 'prev') swiper.slidePrev();
//         if (role === 'next') swiper.slideNext();
//         if (role === 'toggle-play') {
//           if (swiper.autoplay.running) {
//             swiper.autoplay.stop();
//             target.textContent = 'play';
//           } else {
//             swiper.autoplay.start();
//             target.textContent = 'II';
//           }
//         }
//       });

//       root._bannerInstance = swiper;
//     });
//   }

//   // 탭형 배너 (기본)
//   function initTab() {
//     document.querySelectorAll('[data-ui="banner-tab"]:not([data-type])').forEach(function (root) {
//       if (root._bannerInstance) return;

//       var tabEl = root.querySelector('.tab-area > .swiper');
//       var contentEl = root.querySelector('.content-area > .swiper');
//       if (!tabEl || !contentEl) return;

//       var tabSwiper = new Swiper(tabEl, {
//         slidesPerView: 'auto',
//         spaceBetween: 8,
//         slidesOffsetBefore: 16,
//         slidesOffsetAfter: 16,
//         watchSlidesProgress: true,
//         observer: true,
//         observeParents: true
//       });

//       var contentConfig = {
//         slidesPerView: 1,
//         // autoHeight: true,
//         observer: true,
//         observeParents: true,
//         preventClicks: true,
//         preventClicksPropagation: true,
//         thumbs: {swiper: tabSwiper},
//         on: {
//           slideChange: function () {
//             syncTabActive(tabSwiper, this.activeIndex);
//           }
//         }
//       };

//       var speedVal = getInt(root, 'speed');
//       if (speedVal) contentConfig.speed = speedVal;
//       if (getBool(root, 'loop')) contentConfig.loop = true;
//       var autoplayVal = getInt(root, 'autoplay');
//       if (autoplayVal) contentConfig.autoplay = {delay: autoplayVal, disableOnInteraction: false};

//       var contentSwiper = new Swiper(contentEl, contentConfig);

//       bindTabClick(tabSwiper, contentSwiper);
//       root._bannerInstance = {tab: tabSwiper, content: contentSwiper};
//     });
//   }

//   // 탭형 배너 (가로 상품)
//   function initTabHscroll() {
//     document.querySelectorAll('[data-ui="banner-tab"][data-type="hscroll"]').forEach(function (root) {
//       if (root._bannerInstance) return;

//       var tabEl = root.querySelector('.tab-area > .swiper');
//       var contentEl = root.querySelector('.content-area > .swiper');
//       if (!tabEl || !contentEl) return;

//       var tabSwiper = new Swiper(tabEl, {
//         slidesPerView: 'auto',
//         spaceBetween: 8,
//         slidesOffsetBefore: 16,
//         slidesOffsetAfter: 16,
//         watchSlidesProgress: true,
//         observer: true,
//         observeParents: true
//       });

//       var innerSwipers = [];

//       var contentConfig = {
//         slidesPerView: 1,
//         // autoHeight: true,
//         allowTouchMove: false,
//         observer: true,
//         observeParents: true,
//         thumbs: {swiper: tabSwiper},
//         on: {
//           slideChange: function () {
//             syncTabActive(tabSwiper, this.activeIndex);
//             var targetInner = innerSwipers[this.activeIndex];
//             if (targetInner) targetInner.slideTo(0, 0);
//           }
//         }
//       };

//       var speedVal = getInt(root, 'speed');
//       if (speedVal) contentConfig.speed = speedVal;
//       if (getBool(root, 'loop')) contentConfig.loop = true;
//       var autoplayVal = getInt(root, 'autoplay');
//       if (autoplayVal) contentConfig.autoplay = {delay: autoplayVal, disableOnInteraction: false};

//       var contentSwiper = new Swiper(contentEl, contentConfig);

//       bindTabClick(tabSwiper, contentSwiper);

//       root.querySelectorAll('[data-role="inner-swiper"] > .swiper').forEach(function (el) {
//         var touchStartX = 0;
//         var wasAtEnd = false;
//         var wasAtBeginning = false;

//         var inner = new Swiper(el, {
//           slidesPerView: 'auto',
//           spaceBetween: 10,
//           nested: true,
//           observer: true,
//           observeParents: true,
//           preventClicks: true,
//           preventClicksPropagation: true,
//           on: {
//             touchStart: function (swiper, e) {
//               var touch = e.touches ? e.touches[0] : e;
//               touchStartX = touch.clientX;
//               wasAtEnd = this.isEnd;
//               wasAtBeginning = this.isBeginning;
//             },
//             touchEnd: function (swiper, e) {
//               var touch = e.changedTouches ? e.changedTouches[0] : e;
//               var diff = touchStartX - touch.clientX;

//               if (diff > 30 && wasAtEnd && this.isEnd) {
//                 var next = contentSwiper.activeIndex + 1;
//                 if (next < contentSwiper.slides.length) contentSwiper.slideTo(next);
//               }

//               if (diff < -30 && wasAtBeginning && this.isBeginning) {
//                 var prev = contentSwiper.activeIndex - 1;
//                 if (prev >= 0) contentSwiper.slideTo(prev);
//               }
//             }
//           }
//         });
//         innerSwipers.push(inner);
//       });

//       root._bannerInstance = {tab: tabSwiper, content: contentSwiper, inner: innerSwipers};
//     });
//   }

//   // peek형 배너
//   function initPeek() {
//     document.querySelectorAll('[data-ui="banner-peek"]').forEach(function (root) {
//       if (root._bannerInstance) return;

//       var swiperEl = root.querySelector(':scope > .swiper');
//       if (!swiperEl) return;

//       var config = {
//         slidesPerView: getFloat(root, 'slides-per-view') || 1.2,
//         spaceBetween: getInt(root, 'space-between') || 12,
//         observer: true,
//         observeParents: true,
//         preventClicks: true,
//         preventClicksPropagation: true
//       };

//       if (getBool(root, 'loop')) config.loop = true;
//       if (getBool(root, 'centered-slides')) config.centeredSlides = true;
//       var autoplayVal = getInt(root, 'autoplay');
//       if (autoplayVal) config.autoplay = {delay: autoplayVal, disableOnInteraction: false};
//       var speedVal = getInt(root, 'speed');
//       if (speedVal) config.speed = speedVal;

//       var swiper = new Swiper(swiperEl, config);
//       root._bannerInstance = swiper;
//     });
//   }

//   function init() {
//     initVisual();
//     initTab();
//     initTabHscroll();
//     initPeek();
//   }

//   function destroy() {
//     document.querySelectorAll('[data-ui="banner-visual"]').forEach(function (root) {
//       if (!root._bannerInstance) return;
//       root._bannerInstance.destroy(true, true);
//       delete root._bannerInstance;
//     });
//     document.querySelectorAll('[data-ui="banner-tab"]').forEach(function (root) {
//       if (!root._bannerInstance) return;
//       var inst = root._bannerInstance;
//       if (inst.tab) inst.tab.destroy(true, true);
//       if (inst.content) inst.content.destroy(true, true);
//       if (inst.inner)
//         inst.inner.forEach(function (s) {
//           s.destroy(true, true);
//         });
//       delete root._bannerInstance;
//     });
//     document.querySelectorAll('[data-ui="banner-peek"]').forEach(function (root) {
//       if (!root._bannerInstance) return;
//       root._bannerInstance.destroy(true, true);
//       delete root._bannerInstance;
//     });
//   }

//   window.UI = window.UI || {};
//   window.UI.homeSwiper = {init, destroy};
// })();
