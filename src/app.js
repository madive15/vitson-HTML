import '@/assets/scripts';
import '@/assets/scss/abstracts/root.scss';
import '@/assets/scss/vendors/index.scss';
import '@/assets/scss/base/index.scss';
import '@/assets/scss/layout/index.scss';
import '@/assets/scss/components/index.scss';
import '@/assets/scss/pages/index.scss';

if (document.body?.dataset?.guide === 'true') {
  // 가이드 페이지 전용 스타일(정렬/린트 영향 최소화하려면 이 파일에만 예외 설정을 몰아넣기 좋음)
  import('@/assets/scss/pages/guide.scss');
}

// console.log(`%c ==== ${APP_ENV_ROOT}.${APP_ENV_TYPE} run ====`, 'color: green');
// console.log('%c APP_ENV_URL :', 'color: green', APP_ENV_URL);
// console.log('%c APP_ENV_TYPE :', 'color: green', APP_ENV_TYPE);
// console.log('%c ====================', 'color: green');
