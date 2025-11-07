/* eslint-disable no-unused-vars */
import Swiper from 'swiper';
import {Navigation, Pagination} from 'swiper/modules';
window.addEventListener('DOMContentLoaded', (event) => {
  const swiper1 = new Swiper('.swiper-page-nav', {
    modules: [Navigation, Pagination],
    pagination: {
      el: '.swiper-pagination',
      type: 'fraction'
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
  });
  const swiper2 = new Swiper('.swiper-page', {
    modules: [Pagination],
    pagination: {
      el: '.swiper-pagination'
    }
  });
});
