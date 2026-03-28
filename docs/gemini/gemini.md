# Gemini Documentation Index

이 문서는 프로젝트의 전반적인 구조, 코딩 규칙, 비즈니스 로직 및 API 규격을 관리하는 AI 전용 가이드입니다.

## 📁 문서 구조

1.  **[Conventions](conventions.md)**: 코딩 규칙, 네이밍 컨벤션, 스타일 가이드 및 프로젝트 표준.
2.  **[Business Logic](business-logic.md)**: 프로젝트의 핵심 도메인 지식, UI 구조 및 컴포넌트 동작 방식.
3.  **[API Specs](api-specs.md)**: Mock 데이터 구조 및 프론트엔드-데이터 연동 규격.

## 🛠 Tech Stack

-   **Templating**: EJS (Embedded JavaScript)
-   **Styling**: SCSS (Sass), PostCSS, TailwindCSS
-   **Scripting**: JavaScript (ES6+), TypeScript
-   **UI Libraries**: Swiper, Kendo UI
-   **Build Tool**: Webpack 5, Babel

## 🤖 AI Instructions

-   이 프로젝트는 퍼블리싱 중심의 프로젝트로, EJS 템플릿과 SCSS 스타일링이 핵심입니다.
-   새로운 컴포넌트나 페이지를 추가할 때는 `src/views/components` 및 `src/views/pages` 구조를 따르세요.
-   스타일은 `src/assets/scss` 하위의 적절한 폴더(`layout`, `components`, `pages` 등)에 정의하고 `index.scss`에서 임포트합니다.
-   Linting(ESLint, Stylelint) 및 Formatting(Prettier) 규칙을 엄격히 준수하세요.
