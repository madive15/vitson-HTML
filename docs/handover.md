# [Vitson-HTML] 파일별 상세 기술 명세 백과사전 (Technical Encyclopedia)

이 문서는 프로젝트의 모든 JS 및 SCSS 파일을 개별적으로 전수 분석하여 정리한 최종 기술 명세서입니다.

---

## 1. JavaScript 기술 명세 (JS Technical Reference)

### 1.1. Mobile Core 및 UI (`src/assets/scripts-mo/`)
-   **core/common.js**: `DOMContentLoaded` 시 `window.UI` 내 모든 모듈의 `init()`을 일괄 실행하는 자동 초기화 엔진.
-   **core/ui.js**: 모바일 모듈 진입점. 모듈 로드 순서 정의 및 `UI.init()` 통합 관리.
-   **core/utils.js**: `is-pc` 기기 판별, iOS `--vh` 보정, `[data-scroll-end]` 자동 스크롤, 검색 오버레이 키보드 보정.
-   **ui/scroll-lock.js**: iOS 대응 `position:fixed` + `top` 보정 방식의 전역 스크롤 잠금 모듈.
-   **ui/brand/brand-sheet.js**: 초성(ㄱ~ㅎ) 필터링, 스냅 스크롤링, 뷰포트 맞춤 버튼 너비 역산(`fitButtons`).
-   **ui/cart-order/cart.js**: 수량 증감 제어 및 텍스트 길이에 따른 인풋 너비 동적 계산(`measure`).
-   **ui/cart-order/order.js**: 배송/결제 탭 연동, 화물 노출 조건부 제어, 결제 전용 Swiper(payment 타입) 관리.
-   **ui/category/category-renderer.js**: 3뎁스 카테고리 계층 렌더링 엔진. AJAX 데이터 로드 및 동적 HTML 빌드.
-   **ui/category/category-sheet.js**: 바텀시트 카테고리 선택기. 브레드크럼 동기화 및 `category:change` 이벤트 발행.
-   **ui/category/category-tree-search.js**: 필터 팝업 내 아코디언 트리 및 검색 결과 더보기(`[data-search-more-btn]`) 제어.
-   **ui/common/pull-refresh.js**: 내부 스크롤 컨테이너 전용 커스텀 Pull-to-refresh. `--pull-distance` 변수 전달.
-   **ui/common/expand.js**: `Range API`를 활용한 실시간 텍스트 넘침 감지 및 더보기 버튼 동적 생성.
-   **ui/common/tab-sticky.js**: 스크롤 위치 연동 탭. 섹션 도달 시 활성 탭 자동 전환 및 중앙 정렬 스크롤.
-   **ui/common/voice-blob.js**: Lottie 라이브러리 동적 로드 및 AI 음성 애니메이션 플레이어 제어.
-   **ui/home/**: `home-recommend-legend.js`(그리드 컬럼 수 제어), `home-swiper-visual/tab/peek.js`(테마별 Swiper).
-   **ui/product/bottom-product-bar.js**: 드래그 핸들 기반 옵션 바. 드래그 닫기 가속도(Velocity) 판정 로직 포함.
-   **ui/product/detail-gallery.js**: 상품 상세 갤러리. 메인-모달 Swiper 연동 및 Android 백버튼(`popstate`) 대응.
-   **ui/search/search-rank.js**: 실시간 검색어 롤링. 2열 순차 Flip 애니메이션 및 데이터 갱신 제어.
-   **ui/search/search-suggest.js**: 입력 상태에 따른 최근검색어/추천검색어 뷰 토글 로직.

### 1.2. PC UI 모듈 (`src/assets/scripts/ui/`)
-   **modal.js**: PC 전역 모달 상태 머신. `open/active/closing` 3단계 관리 및 바디 스크롤 위치 복원.
-   **tab.js**: ARIA 표준 준수 탭 시스템. 키보드 네비게이션(화살표, Home/End) 및 URL Hash 지원.
-   **form/select.js**: 1~3뎁스 계층형 셀렉트. 상위 선택 시 하위 데이터 동적 바인딩 및 Portal 모드 지원.
-   **category/category-tree.js**: PLP 좌측 드릴다운 트리. 브레드크럼 양방향 싱크 및 4뎁스 속성 필터 동적 렌더.
-   **category/plp-chip-sync.js**: 필터 체크박스 상태를 상단 칩 UI와 실시간 동기화 및 전체 해제 기능.
-   **category/plp-titlebar-research.js**: 결과 내 재검색 칩 내비게이션 및 연관검색어 추천 패널 제어.
-   **home-ui.js**: PC 홈 페이지 7종 이상의 Swiper 인스턴스 통합 관리 및 레전드 상품 그리드 재구성.
-   **product/tab-scrollbar.js**: 상품 상세 스티키 탭. `baseline` 계산을 통한 스크롤-탭 active 동기화.
-   **kendo/kendo-dropdown.js**: Kendo Dropdown의 placeholder 및 계층형(Cascading) 데이터 연동 보정.
-   **kendo/kendo-window.js**: Observer 기반 모달 센터 정렬 및 내부 DatePicker 드롭다운 방향 보정.
-   **swiper.js**: 상세 전용 갤러리. 메인-썸네일 동기화 및 마우스 트래킹 기반 이미지 줌(Zoom).

---

## 2. SCSS 스타일 명세 (SCSS Technical Reference)

### 2.1. PC 컴포넌트 (`src/assets/scss/components/`)
-   **_alerts.scss**: 정보형(Blue), 경고형(Red) 등 테마별 알림 박스 및 불렛 리스트 스타일.
-   **_breadcrumb.scss**: 셀렉트 박스 조합형 경로 표시. `disabled` 상태 시 자동 숨김 처리 로직.
-   **_button.scss**: Sass Map 기반 버튼 시스템. `:has()`를 활용한 아이콘/텍스트 간격 동적 제어.
-   **_category-tree.scss**: 드릴다운 트리의 깊이별 인덴트(Indent) 및 토글 아이콘(+/-) 애니메이션.
-   **_datepicker.scss**: Kendo 달력 위젯의 전면 재디자인. 브랜드 컬러 및 둥근 버튼 스타일 적용.
-   **_floating.scss**: 최근 본 상품 썸네일(50% 원형) 및 툴팁형 패널, TOP 버튼 디자인.
-   **_form.scss**: Input, Checkbox, Radio의 표준 디자인. `is-invalid` 시 텍스트/테두리 강조 처리.
-   **_icon.scss**: SVG Mask 기법. `ic-mask` 믹스인으로 50종 이상의 아이콘을 `color`로 통합 제어.
-   **_label.scss**: 상품 플래그(Today, Hot), 칩 버튼(Filled/Outline), 파일 첨부 칩 스타일.
-   **_layer.scss**: 비교 바(Compare)와 슬라이드 패널의 베이스 Transition 및 Z-index 관리.
-   **_modal.scss**: 표준 팝업 레이아웃. 폭 고정값(480/710) 및 스크롤 영역 높이 제한 처리.
-   **_pagination.scss**: 기본 페이징 및 Kendo Pager의 화살표/숫자 버튼 커스텀.
-   **_select.scss**: 커스텀 셀렉트 UI. `is-open` 시 `transform` 애니메이션 및 Portal 전용 스타일.
-   **_swiper.scss**: Swiper 전용 내비게이션(둥근 버튼 + 그림자) 및 상품 카드 슬라이더 스타일.
-   **_toggle.scss**: 범용 아코디언 패널. `clip-path`를 이용해 위에서 아래로 펼쳐지는 효과 구현.
-   **_tooltip.scss**: 툴팁 컨테이너와 화살표 포지셔닝. `aria-hidden` 연동 가시성 제어.

### 2.2. 모바일 전용 컴포넌트 (`src/assets/scss/components-mo/`)
-   **_ai-blob.scss**: AI 음성 인식 전용 오버레이. Lottie 애니메이션 중앙 정렬 레이아웃.
-   **_breadcrumb.scss**: 모바일 특화 칩 형태 브레드크럼. 가로 스크롤 및 현재 위치 강조.
-   **_collapse.scss**: 높이/개수 기반 더보기 항목의 부드러운 노출을 위한 Transition 정의.
-   **_coupon.scss**: 티켓 스타일 쿠폰 카드. 점선 절취선 및 다운로드 완료 상태(0.3 투명도) 처리.
-   **_datepicker.scss**: 모바일 뷰포트 맞춤 달력 크기 보정 및 특정 페이지 내 위치 강제 보정.
-   **_empty-state.scss**: 데이터 없음 페이지 전용 대형 아이콘 및 중앙 정렬 텍스트 레이아웃.
-   **_filter.scss**: 인라인 체크박스 그룹의 가로 스크롤 및 필터 팝업의 섹션별 토글 스타일.
-   **_floating.scss**: 하단 탭바 높이를 감지하여 유동적으로 변하는 모바일 전용 플로팅 세션.
-   **_form.scss**: 모바일 터치에 최적화된 폼 높이(32~48px) 및 비밀번호 눈 토글 전용 스타일.
-   **_kendo-window.scss**: Kendo 팝업을 바텀시트, 풀스크린 슬라이드로 변형하는 **프로젝트 핵심 모바일 스타일**.
-   **_label.scss**: 모바일 상품 뱃지 크기 최적화 및 상태별 색상 맵 적용.
-   **_overflow-menu.scss**: 케밥 버튼 클릭 시 노출되는 모바일 전용 컨텍스트 메뉴 및 딤 처리.
-   **_product.scss**: 리스트/썸네일 뷰 전환 그리드, 품절 블러 효과, 추천 스와이프 통합 스타일.
-   **_step-flow.scss**: 페이지 전환형 다단계 진행 바 및 현재 스텝 시각화 애니메이션.
-   **_tab.scss**: 언더라인형, 라디오 버튼형 등 모바일 특화 탭 디자인 및 애니메이션.
-   **_tooltip.scss**: 모바일 좁은 화면에서의 툴팁 최대 너비 제한 및 레이아웃 보정.

---
**최종 업데이트**: 2026-04-09
**작성자**: Gemini CLI
