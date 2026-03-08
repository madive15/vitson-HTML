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
  categoryMenus: [
    {
      title: '사무 · 생활 · 탕비용품',
      desc: '일상과 오피스에 필요한 모든 것',
      items: [
        {href: '#!', img: 'home-category-01-01.png', name: '탕비용품'},
        {href: '#!', img: 'home-category-01-02.png', name: '사무용품'},
        {href: '#!', img: 'home-category-01-03.png', name: '필기도구'},
        {href: '#!', img: 'home-category-01-04.png', name: '선물세트'}
      ]
    },
    {
      title: '전문 장비 · 설비 · 기술자재',
      desc: '전문가를 위한 산업용 제품',
      items: [
        {href: '#!', img: 'home-category-02-01.png', name: '조명'},
        {href: '#!', img: 'home-category-02-02.png', name: '전기자재'},
        {href: '#!', img: 'home-category-02-03.png', name: '안전용품'},
        {href: '#!', img: 'home-category-02-04.png', name: '공구'}
      ]
    }
  ],
  promoBanner: {
    href: '#!',
    img: 'home-promo-banner.png',
    alt: '온종일 따뜻한 핫팩 기획전'
  },
  peekBanners: [
    {href: '#!', img: 'home-peek-event01.png', alt: '공구 베스트 기획전'},
    {href: '#!', img: 'home-peek-event02.png', alt: '생활 용품 할인 기획전'},
    {href: '#!', img: 'home-peek-event03.png', alt: '생활 용품 할인 기획전'}
  ],
  brandExhibition: {
    banners: [
      {
        href: '#!',
        img: 'home-promo-brand-icon01.png',
        title: '법인 추가 할인 혜택',
        desc: '법인이시라면? 추가할인을 받아보세요',
        theme: 'green'
      },
      {
        href: '#!',
        img: 'home-promo-brand-icon02.png',
        title: '대량 구매 견적 문의',
        desc: '문의주시면 친절한 상담 도와드리겠습니다',
        theme: 'blue'
      }
    ],
    brands: (function () {
      var brandList = [
        {
          name: '3M',
          desc: '모든 기업의 발전을 도모하는 3M 기술',
          bgImg: 'home-promo-brand01.png',
          logoImg: 'home-promo-brand01-logo.svg',
          href: '#!'
        },
        {
          name: '디월트',
          desc: '프로가 찾는 공구, 현장 필수템 디월트',
          bgImg: 'home-promo-brand01.png',
          logoImg: 'home-promo-brand01-logo.svg',
          href: '#!'
        },
        {
          name: '케이텔',
          desc: '피난유도등부터 비상조명까지, 현장이 선택한 안전조명',
          bgImg: 'home-promo-brand01.png',
          logoImg: 'home-promo-brand01-logo.svg',
          href: '#!'
        },
        {
          name: '보쉬',
          desc: '전문가가 선택하는 고품질 전동공구 브랜드',
          bgImg: 'home-promo-brand01.png',
          logoImg: 'home-promo-brand01-logo.svg',
          href: '#!'
        }
      ];
      var shuffled = _all.slice().sort(function () {
        return Math.random() - 0.5;
      });
      var pos = 0;

      return brandList.map(function (brand) {
        var items = [];
        for (var j = 0; j < 3; j++) {
          items.push(shuffled[(pos + j) % shuffled.length]);
        }
        pos += 3;

        return Object.assign({}, brand, {
          products: items.map(function (p) {
            return Object.assign({}, p, {showSpec: false, showModel: false});
          })
        });
      });
    })()
  },
  getDealProducts: function (publicPath) {
    const imgs = dealImages.map((img) => `${publicPath}/resources/img/mro/renewal/temp/${img}`);
    return _all.slice(0, 10).map((item, i) => ({
      ...item,
      imageUrl: imgs[Math.floor(Math.random() * imgs.length)],
      stockYn: i === 1 ? 'N' : item.stockYn,
      showSpec: false,
      showModel: false
    }));
  },
  getFrequentProducts: function () {
    // purchaseCount > 0 인 상품만 추출
    return _all
      .filter((item) => item.purchaseCount > 0)
      .map((item, i) => ({
        ...item,
        stockYn: i === 1 ? 'N' : item.stockYn,
        showSpec: false,
        showModel: false
      }));
  },
  getLegendProducts: function () {
    return _all.slice(10, 20).map((item, i) => ({
      ...item,
      stockYn: i === 1 ? 'N' : item.stockYn,
      showSpec: false,
      showModel: false
    }));
  },
  getPopularCategories: function () {
    const categories = [
      {rank: 1, name: '가전/전산용품/컴퓨터 > 겨울용품'},
      {rank: 2, name: '간접/라인조명 > 벽등 > LED'},
      {rank: 3, name: '사무용품 > 문구 > 테이프'},
      {
        rank: 4,
        name: '사무용품/사무기기/제도용품 > 화일/바인더류 > 기능성화일 > 도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일도면화일',
        href: '#!'
      },
      {rank: 5, name: '전선/케이블 > 전원케이블'},
      {rank: 6, name: '공구 > 수공구'},
      {rank: 7, name: '안전용품 > 안전화'},
      {rank: 8, name: '산업자재 > 절연재료'},
      {rank: 9, name: '조명 > LED조명'},
      {rank: 10, name: '패키징 > 포장자재'}
    ];

    return categories.map(function (item, i) {
      var parts = (item.name || '').split(/\s*>\s*/);
      return Object.assign({}, item, {
        tabName: parts[parts.length - 1],
        products: _all.slice(i * 3, i * 3 + 3).map(function (p) {
          return Object.assign({}, p, {showSpec: false, showModel: false});
        })
      });
    });
  },
  getCategoryBestProducts: function () {
    var names = [
      '사무용품',
      '생활용품',
      '조명',
      '전선/케이블',
      '공구',
      '안전용품',
      '배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재배관자재',
      '청소용품'
    ];
    var shuffled = _all.slice().sort(function () {
      return Math.random() - 0.5;
    });
    var pos = 0;

    return names.map(function (name, i) {
      var count = 10;
      if (i === 2) count = 3;
      if (i === 4) count = 7;
      if (i === 5) count = 5;

      // 상품 부족 시 처음부터 순환
      var items = [];
      for (var j = 0; j < count; j++) {
        items.push(shuffled[(pos + j) % shuffled.length]);
      }
      pos += count;

      return {
        tabName: name,
        products: items.map(function (p, j) {
          return Object.assign({}, p, {
            rank: j + 1,
            showSpec: false,
            showModel: false
          });
        })
      };
    });
  },
  getFlashDealProducts: function () {
    // 반짝특가용 썸네일 4종 랜덤 배정
    var flashImages = ['temp-home-hot-04.jpg', 'temp-home-hot-05.jpg', 'temp-home-hot-06.jpg', 'temp-home-hot-07.jpg'];
    var names = ['사무용품', '생활용품', '조명', '전선/케이블'];
    var shuffled = _all.slice().sort(function () {
      return Math.random() - 0.5;
    });
    var pos = 0;

    return names.map(function (name) {
      var count = 5;
      var items = [];
      for (var j = 0; j < count; j++) {
        items.push(shuffled[(pos + j) % shuffled.length]);
      }
      pos += count;

      return {
        tabName: name,
        products: items.map(function (p, j) {
          return Object.assign({}, p, {
            imageUrl: '/resources/img/mro/renewal/temp/' + flashImages[Math.floor(Math.random() * flashImages.length)],
            // 카테고리별 두 번째 상품만 일시품절 처리
            stockYn: j === 1 ? 'N' : 'Y',
            showSpec: false,
            showModel: false
          });
        })
      };
    });
  }
};
