/**
 * scripts/index.js
 * @purpose 번들 엔트리(진입점)
 * @assumption
 *  - 빌드 결과(app.bundle.js)가 페이지에 자동 주입됨
 *  - core 모듈은 utils → ui → common 순서로 포함되어야 함
 * @maintenance
 *  - index.js는 짧게 유지한다(엔트리 역할만)
 *  - 기능 추가/삭제는 core/ui.js에서만 관리한다
 *  - 페이지 전용 스크립트가 필요하면 별도 모듈로 분리하고, 공통 초기화와 섞지 않는다
 */

import './core/utils.js';
import './core/ui.js';
import './core/common.js';

console.log('[index] entry 실행');
