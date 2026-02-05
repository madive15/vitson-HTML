/**
 * @file mobile/index.js
 * @description 모바일 번들 엔트리(진입점)
 * @note
 *  - core 모듈은 utils → ui → common 순서로 포함
 *  - index.js는 짧게 유지(엔트리 역할만)
 *  - 기능 추가/삭제는 core/ui.js에서 관리
 */
import './core/utils.js';
import './core/ui.js';
import './core/common.js';

console.log('[mobile/index] entry 실행');
