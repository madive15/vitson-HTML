#!/bin/sh

# 스크립트 실행 중 오류 발생 시 즉시 종료
set -e

# 빌드 결과물이 위치할 기본 디렉토리
DIST_DIR="dist"
# 제거 대상이 될 'public' 폴더의 경로
PUBLIC_DIR="${DIST_DIR}/public"

# dist/public 디렉토리가 존재하지 않으면 아무 작업 없이 스크립트 종료
if [ ! -d "$PUBLIC_DIR" ]; then
  echo "dist/public 디렉토리를 찾을 수 없습니다. 작업을 건너뜝니다."
  exit 0
fi

echo "콘텐츠를 ${PUBLIC_DIR} 에서 ${DIST_DIR} 로 복사 중..."
# `public` 폴더의 모든 내용(숨김 파일 포함)을 `dist` 폴더로 복사합니다.
# `/.`는 디렉토리 자체가 아닌 디렉토리의 내용물을 복사하기 위함입니다.
cp -r "${PUBLIC_DIR}/." "${DIST_DIR}/"

echo "원본 디렉토리 ${PUBLIC_DIR} 삭제 중..."
# 원본 `public` 디렉토리를 삭제합니다.
rm -rf "$PUBLIC_DIR"

echo "'public' 폴더 제거 완료."

echo "HTML 및 CSS 파일 내 경로 및 주석 정리 시작..."

# DIST_DIR 하위의 모든 html, css 파일을 찾는다
find "$DIST_DIR" \( -name "*.html" -o -name "*.css" \) | while read filename; do

  # sed로 파일 내용을 한번에 치환 / 삭제 처리
  sed '
    # ../public/ → ../
    s#\.\./public/#\.\./#g;

    # /public/ → /
    s#/public/#/#g;

    # <!-- prettier-ignore --> 제거
    s#<!--[[:space:]]*prettier-ignore[[:space:]]*-->##g;
  ' "$filename" > "$filename.tmp" && mv "$filename.tmp" "$filename"
done

echo "모든 경로 및 주석 정리 완료."