// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//

const {checkName, checkPaths, checkKebabCase, checkSnakeCase} = require('../../utils.cjs')

const ejsFlag = '%'
const deviceChoices = ['pc', 'mo']

module.exports = {
  prompt: async ({ prompter, args }) => {
    try {

      // device select
      const taskDevice = await prompter
      .select({
        type: 'input',
        name: 'device',
        message: 'pc, mo 를 선택하세요.',
        choices: deviceChoices
      })

      // file name validate
      const taskPath = await prompter
      .prompt({
        type: 'input',
        name: 'path',
        message: '경로를 입력하세요(ex> /path1, /path1/path2). 없으면 enter'
      })
      checkPaths(taskPath.path)

      // file name validate
      const taskName = await prompter
      .prompt({
        type: 'input',
        name: 'name',
        message: '파일 이름을 입력하세요.'
      })
      checkName(taskName.name)
      // checkSnakeCase(taskName.name)

      // retun result
      return  {
        device: taskDevice,
        path: taskPath.path || '',
        name: taskName.name,
        ejs: ejsFlag,
        args
      }
    } catch (error) {
      throw error.message
    }
  }
}
