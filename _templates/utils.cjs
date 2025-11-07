module.exports = {
  checkName: (target) => {
    if (!target) {
      throw new Error('파일 이름을 입력하세요!')
    }
  },
  checkKebabCase: (target) => {
    if (new RegExp(/[^a-z\-]/).test(target)) {
      throw new Error('파일 이름은 kebab-case 이어야 합니다.')
    }
  },
  checkSnakeCase: (target) => {
    if (new RegExp(/[^a-z\_]/).test(target)) {
      throw new Error('파일 이름은 Snake_case 이어야 합니다.')
    }
  },
  checkPaths: (target) => {
    if (!target) return
    if (new RegExp(/^.*\/$/).test(target)) {
      throw new Error('경로 입력은 / 로 끝나면 안됩니다')
    }
    else {
      if (!(new RegExp(/^\/.*/).test(target))) {
        throw new Error('경로 입력은 / 로 시작해야됩니다')
      }
    }
  }
}