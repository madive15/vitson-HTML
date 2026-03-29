# Coding Conventions & Styles

이 문서는 프로젝트의 코딩 표준, 명명 규칙 및 스타일 가이드를 정의합니다.

## 📁 Directory Structure

-   `src/views`: EJS 템플릿 파일
-   `src/assets/scss`: SCSS 스타일 파일
-   `src/assets/scripts`: JavaScript/TypeScript 로직
-   `public/resources`: 정적 리소스 (이미지, 폰트, Mock 데이터 등)

## 🎨 Styling (SCSS/CSS)

-   **Class Naming**: `kebab-case`를 사용합니다. (예: `.vits-header`, `.btn-favorite`)
-   **Structure**: `abstracts` -> `base` -> `layout` -> `components` -> `pages` -> `vendors` 순으로 정의합니다.
-   **Units**: `px`, `rem`, `vh`, `dvh`, `vw`, `%` 등을 사용합니다.
-   **Property Order**: `stylelint-config-recess-order`에 따라 논리적 순서로 속성을 배치합니다.
-   **Comments**: 주석 전후의 빈 줄 삽입을 준수하며, `/* S: name */` ... `/* E: name */` 스타일을 지향합니다.

## 💻 Scripting (JS/TS)

-   **Naming**: 변수 및 함수는 `camelCase`를 사용합니다.
-   **Linting**: ESLint (`eslint-config-prettier`, `@typescript-eslint/recommended`)를 따릅니다.
-   **Formatting**: Prettier 규칙을 준수합니다.

## 📄 Templating (EJS)

-   **Includes**: `<%- include('path/to/file.ejs', { data }) %>` 형식을 사용합니다.
-   **Mock Data**: `mockData` 객체를 통해 페이지와 컴포넌트 간 데이터를 전달합니다.
-   **Clean Code**: `prettier-ignore` 주석을 활용하여 복잡한 EJS 로직의 포맷팅을 제어할 수 있습니다.
