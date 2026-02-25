/**
 * @file detail-gallery.js
 * @description 상품 상세 썸네일 갤러리 (메인 슬라이더 + 상세이미지 팝업 모달)
 * @scope [data-ui="detail-gallery"]
 * @mapping detail-overview-thumb.ejs
 * @state .is-open — 모달 활성화
 * @a11y hidden/aria-modal, ESC 닫기
 * @note iOS body scroll lock — position:fixed + scrollTop 저장
 * @note Android 물리 백버튼 — history.pushState 활용
 * @example 외부 사용 예시
 *          const gallery = UI.detailGallery.getInstance();
 *          if (gallery) {
 *            const idx = gallery.getActiveIndex();
 *            gallery.slideTo(2);
 *            gallery.openZoom();
 *          }
 */
import Swiper from 'swiper/bundle';

(function () {
  'use strict';

  const SCOPE = '[data-ui="detail-gallery"]';
  const IS_OPEN = 'is-open';
  let savedScrollY = 0;

  // iOS body scroll lock
  function lockScroll() {
    savedScrollY = window.scrollY;
    document.body.style.cssText = 'position:fixed;top:' + -savedScrollY + 'px;left:0;right:0;overflow:hidden;';
  }

  function unlockScroll() {
    document.body.style.cssText = '';
    window.scrollTo(0, savedScrollY);
  }

  function init() {
    const root = document.querySelector(SCOPE);
    if (!root) return;

    // 중복 초기화 방지
    if (root._galleryInstance) return;

    const mainEl = root.querySelector('[data-role="main"]');
    const zoomEl = root.querySelector('[data-role="zoom"]');
    const zoomSwiperEl = root.querySelector('[data-role="zoom-swiper"]');
    const zoomThumbsEl = root.querySelector('[data-role="zoom-thumbs"]');

    if (!mainEl) return;

    const total = mainEl.querySelectorAll('.swiper-slide').length;
    const isSingle = total < 2;

    // 1장이면 모달 썸네일 숨김
    if (isSingle && zoomThumbsEl) zoomThumbsEl.style.display = 'none';

    // 메인 Swiper
    const mainSwiper = new Swiper(mainEl, {
      slidesPerView: 1,
      loop: false,
      allowTouchMove: !isSingle,
      observer: true,
      observeParents: true,
      pagination: isSingle
        ? false
        : {
            el: mainEl.querySelector('.swiper-pagination'),
            clickable: true
          }
    });

    // 모달 Swiper — lazy init
    let zoomSwiper = null;
    let zoomThumbSwiper = null;

    function createZoom(index) {
      if (!zoomSwiper) {
        if (!isSingle && zoomThumbsEl) {
          zoomThumbSwiper = new Swiper(zoomThumbsEl, {
            slidesPerView: 'auto',
            spaceBetween: 7,
            watchSlidesProgress: true
          });
        }

        zoomSwiper = new Swiper(zoomSwiperEl, {
          slidesPerView: 1,
          spaceBetween: 20,
          loop: false,
          autoHeight: true,
          observer: true,
          observeParents: true,
          thumbs: zoomThumbSwiper ? {swiper: zoomThumbSwiper} : undefined,
          on: {
            slideChange: function () {
              // 활성 썸네일이 보이도록 스크롤
              if (zoomThumbSwiper) {
                zoomThumbSwiper.slideTo(this.activeIndex);
              }
            }
          }
        });
      } else {
        zoomSwiper.update();
        if (zoomThumbSwiper) zoomThumbSwiper.update();
      }

      zoomSwiper.slideTo(index, 0);
    }

    // 모달 열기
    function openZoom() {
      if (!zoomEl) return;

      const index = mainSwiper.activeIndex;

      zoomEl.removeAttribute('hidden');
      zoomEl.classList.add(IS_OPEN);
      lockScroll();

      // Android 뒤로가기 대응
      history.pushState({detailGalleryOpen: true}, '');

      requestAnimationFrame(() => {
        createZoom(index);
      });
    }

    // 모달 닫기
    function closeZoom(fromPop) {
      if (!zoomEl || !zoomEl.classList.contains(IS_OPEN)) return;

      const index = zoomSwiper ? zoomSwiper.activeIndex : mainSwiper.activeIndex;

      zoomEl.classList.remove(IS_OPEN);
      zoomEl.setAttribute('hidden', '');
      unlockScroll();

      mainSwiper.slideTo(index, 0);

      if (!fromPop) history.back();
    }

    // 이벤트
    root.addEventListener('click', (e) => {
      const target = e.target.closest('[data-role]');
      if (!target) return;

      const role = target.getAttribute('data-role');
      if (role === 'zoom-open') openZoom();
      if (role === 'zoom-close') closeZoom();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && zoomEl?.classList.contains(IS_OPEN)) {
        closeZoom();
      }
    });

    // Android 물리 백버튼
    window.addEventListener('popstate', () => {
      if (zoomEl?.classList.contains(IS_OPEN)) {
        closeZoom(true);
      }
    });

    // public API
    root._galleryInstance = {
      main: mainSwiper,
      zoom: () => zoomSwiper,
      zoomThumb: () => zoomThumbSwiper,
      // 외부 접근용 API
      getActiveIndex: () => mainSwiper.activeIndex,
      slideTo: (index) => mainSwiper.slideTo(index),
      openZoom,
      closeZoom,
      getTotal: () => total
    };
  }

  function destroy() {
    const root = document.querySelector(SCOPE);
    if (!root || !root._galleryInstance) return;

    const inst = root._galleryInstance;
    inst.main?.destroy(true, true);
    inst.zoom()?.destroy(true, true);
    inst.zoomThumb()?.destroy(true, true);

    delete root._galleryInstance;
  }

  window.UI = window.UI || {};
  window.UI.detailGallery = {
    init,
    destroy,
    // 외부에서 UI.detailGallery.getInstance()로 접근
    getInstance: () => document.querySelector(SCOPE)?._galleryInstance
  };
})();
