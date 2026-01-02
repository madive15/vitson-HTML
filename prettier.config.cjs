module.exports = {
  // 세미콜론(;)을 문장의 끝에 추가할지 여부 (true: 추가, false: 추가 안 함)
  semi: true,
  // 작은따옴표(') 대신 큰따옴표(")를 사용할지 여부 (true: 작은따옴표, false: 큰따옴표)
  singleQuote: true,
  // 화살표 함수에서 단일 매개변수일 때 괄호를 항상 사용할지 여부 (always: 항상 사용, avoid: 가능하면 사용 안 함)
  arrowParens: 'always',
  // 객체 리터럴에서 중괄호({})와 내용 사이에 공백을 추가할지 여부 (true: 공백 추가, false: 공백 추가 안 함)
  bracketSpacing: false,
  // 파일의 끝 라인 문자(LF, CRLF, CR) 처리 방식 (auto: 기존 라인 문자 유지)
  endOfLine: 'auto',
  // JSX에서 닫는 꺾쇠 괄호(>)를 같은 라인에 둘지 여부 (true: 같은 라인, false: 다음 라인)
  jsxBracketSameLine: false, // 이 옵션은 Prettier 2.3.0부터 deprecated 되었으며, `bracketSameLine`으로 대체되었습니다.
  // 코드 한 줄의 최대 길이
  printWidth: 120,
  // Markdown 파일에서 텍스트의 줄 바꿈 방식 (preserve: 원본 유지)
  proseWrap: 'preserve',
  // 들여쓰기 시 사용할 공백 수
  tabWidth: 2,
  // 객체나 배열의 마지막 요소 뒤에 후행 쉼표(trailing comma)를 추가할지 여부 (none: 추가 안 함, es5: ES5에서 유효한 곳에 추가, all: 가능한 모든 곳에 추가)
  trailingComma: 'none',
  // 들여쓰기 시 탭 대신 공백을 사용할지 여부 (true: 공백 사용, false: 탭 사용)
  useTabs: false,
  // 특정 파일에 대한 Prettier 옵션을 재정의합니다.
  overrides: [
    {
      // .ejs 확장자를 가진 파일에 적용
      files: ['*.ejs'],
      options: {
        // .ejs 파일을 HTML 파서로 처리
        parser: 'html'
      }
    }
  ]
};
