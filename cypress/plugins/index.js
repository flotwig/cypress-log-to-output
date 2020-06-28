module.exports = (on) => {
  require('../../src/log-to-output').install(on, () => true, { recordLogs: true})
}
