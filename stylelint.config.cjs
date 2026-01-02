module.exports = {
  extends: [
    // 다른 Stylelint 설정 파일들을 상속받아 사용합니다.
    // 이는 여러 규칙 집합을 편리하게 재사용하고 확장하는 방법입니다.
    'stylelint-config-standard', // 표준 CSS 구문 규칙을 강제하는 기본적인 설정
    'stylelint-config-standard-scss', // SCSS(Sass) 구문에 대한 표준 규칙 추가
    'stylelint-config-prettier-scss', // Prettier와 충돌하는 규칙 비활성화 (포맷팅은 Prettier에 위임)
    'stylelint-config-recess-order' // CSS 속성 순서를 Recess 프로젝트에서 권장하는 순서로 강제
  ],
  rules: {
    // `@` 규칙(예: `@media`) 앞에 빈 줄 삽입을 강제합니다.
    // `except`: 특정 조건일 때는 규칙을 적용하지 않습니다.
    //   - `blockless-after-same-name-blockless`: 이름이 같은 블록이 없는 @규칙 뒤에는 빈 줄을 허용합니다.
    //   - `first-nested`: 중첩된 @규칙의 첫 번째인 경우에는 빈 줄을 허용합니다.
    // `ignore`: 특정 조건일 때는 규칙을 무시합니다. (린트 검사에서 제외)
    //   - `after-comment`: 주석 뒤에는 빈 줄을 무시합니다.
    'at-rule-empty-line-before': [
      'always',
      {
        except: ['blockless-after-same-name-blockless', 'first-nested'],
        ignore: ['after-comment']
      }
    ],
    // 일반 CSS 규칙(예: `body { ... }`) 앞에 빈 줄 삽입을 강제합니다. (여러 줄 규칙에만 해당)
    // `except`: 특정 조건일 때는 규칙을 적용하지 않습니다.
    //   - `first-nested`: 중첩된 규칙의 첫 번째인 경우에는 빈 줄을 허용합니다.
    // `ignore`: 특정 조건일 때는 규칙을 무시합니다. (린트 검사에서 제외)
    //   - `after-comment`: 주석 뒤에는 빈 줄을 무시합니다.
    'rule-empty-line-before': [
      'always-multi-line',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    // 주석 앞에 빈 줄 삽입을 강제합니다.
    'comment-empty-line-before': [
      'always',
      {
        ignore: ['after-comment', 'stylelint-commands']
      }
    ],
    // 알 수 없는 `@` 규칙 사용 금지 (SCSS의 `@include` 등을 위해 비활성화)
    'at-rule-no-unknown': null,
    // 빈 블록(예: `div {}`) 금지
    'block-no-empty': true,
    // CSS 속성 선언 앞에 빈 줄 금지 (예: `color: red;` 앞)
    'declaration-empty-line-before': 'never',
    // `font-family` 속성에 중복된 폰트 이름 사용 금지
    'font-family-no-duplicate-names': true,
    // CSS 함수 이름(예: `rgb()`)은 소문자로 강제
    'function-name-case': 'lower',
    // 값이 0일 때 단위 사용 금지 (예: `margin: 0px` 대신 `margin: 0` 사용)
    'length-zero-no-unit': true,
    // 알 수 없는 미디어 기능 이름 사용 금지
    'media-feature-name-no-unknown': true,
    // `@import` 규칙 중복 금지
    'no-duplicate-at-import-rules': true,
    // 내용이 없는 빈 스타일시트 파일 금지
    'no-empty-source': true,
    // 정의되지 않은 @keyframe  애니메이션 이름 사용 금지
    'no-unknown-animations': true,
    // 알 수 없는 CSS 속성 사용 금지
    'property-no-unknown': true,
    // 속성 선택자(예: `[type="text"]`)에서 값에 항상 따옴표 사용 강제
    'selector-attribute-quotes': 'always',
    // 클래스 선택자 이름을 kebab-case로 강제 (예: `my-class`)
    'selector-class-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$'],
    // 가상 요소(pseudo-element)에 이중 콜론 사용 강제 (예: `::before`)
    'selector-pseudo-element-colon-notation': 'double',
    // 알 수 없는 가상 요소 사용 금지
    'selector-pseudo-element-no-unknown': true,
    // HTML 태그 선택자를 소문자로 강제 (예: `div` 사용, `DIV` 금지)
    'selector-type-case': 'lower',
    // 문자열 내 줄 바꿈 금지
    'string-no-newline': true,
    // 알 수 없는 단위 사용 금지
    'unit-no-unknown': true,
    // 허용되는 CSS 단위 목록 지정
    'unit-allowed-list': ['px', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'deg', 's', '%', 'fr'],
    // CSS 값 키워드(예: `solid`, `auto`)를 소문자로 강제
    'value-keyword-case': 'lower',
    // 사용자 정의 미디어 쿼리 이름 패턴을 kebab-case로 강제
    'custom-media-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$'],
    // 사용자 정의 속성(CSS 변수) 이름 패턴을 kebab-case로 강제
    'custom-property-pattern': ['^([a-z][a-z0-9]*)(-[a-z0-9]+)*$'],
    // @keyframes 이름 패턴을 kebab-case로 강제
    'keyframes-name-pattern': [
      '^([a-z][a-z0-9]*)(-[a-z0-9]+)*$',
      {
        message: 'Expected keyframe name to be kebab-case'
      }
    ],
    // 알 수 없는 가상 클래스 금지. 단, 특정 프레임워크에서 사용하는 가상 클래스는 무시
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global'] // Vue 등에서 사용하는 가상 클래스 예외 처리
      }
    ]
  }
};
