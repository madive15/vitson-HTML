'use strict';

const products = require('./products.json');
const _all = products.products.slice();

const dealImages = ['temp-home-hot-01.png', 'temp-home-hot-02.png', 'temp-home-hot-03.png'];

module.exports = {
  slides: [
    {img: 'home-swiper-visual01.png', alt: '제설 필수품 염화칼슘 기획전', href: '#!'},
    {img: 'home-swiper-visual02.png', alt: '겨울철 난방용품 특가', href: '#!'},
    {img: 'home-swiper-visual03.png', alt: '사무용품 신년 할인전', href: '#!'}
  ],
  menus: [
    {href: '#!', img: 'vm-home-frequent-menu01.png', name: '주문배송조회'},
    {href: '#!', img: 'vm-home-frequent-menu02.png', name: '견적신청'},
    {href: '#!', img: 'vm-home-frequent-menu03.png', name: '좋아요 상품'},
    {href: '#!', img: 'vm-home-frequent-menu04.png', name: '비츠온페이 관리'},
    {href: 'https://vitsonmro.com/ebook', img: 'vm-home-frequent-menu05.png', name: 'E카탈로그', target: '_blank'},
    {href: '#!', img: 'vm-home-frequent-menu06.png', name: '견적함'},
    {href: '#!', img: 'vm-home-frequent-menu07.png', name: '자주 주문한 상품'},
    {href: '#!', img: 'vm-home-frequent-menu08.png', name: '할인쿠폰'},
    {href: '#!', img: 'vm-home-frequent-menu09.png', name: '이벤트'}
  ],
  getDealProducts: function (publicPath) {
    const imgs = dealImages.map((img) => `${publicPath}/resources/img/mro/renewal/temp/${img}`);
    return _all.slice(0, 10).map((item, i) => ({
      ...item,
      imageUrl: imgs[Math.floor(Math.random() * imgs.length)],
      stockYn: i === 1 ? 'N' : item.stockYn,
      showSpec: false
    }));
  }
};
