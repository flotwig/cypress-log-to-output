const CDP = require('chrome-remote-interface')
const chalk = require('chalk')

const severityColors = {
  'verbose': (a) => a,
  'info': chalk.blue,
  'warning': chalk.yellow,
  'error': chalk.red
}

const severityIcons = {
  'verbose': ' ',
  'info': '🛈',
  'warning': '⚠',
  'error': '⚠',
}

function log(msg) {
  console.log(msg)
}

function logEntry(params) {
  const { level, source, text, timestamp, url, lineNumber, stackTrace, args } = params.entry
  const color = severityColors[level]
  const icon = severityIcons[level]

  const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `
  const prefixSpacer = ' '.repeat(prefix.length)

  log(color(`${prefix}${chalk.bold(level)} (${source}): ${text}`))

  const logAdditional = (msg) => {
    log(color(`${prefixSpacer}${msg}`))
  }

  if (url) {
    logAdditional(`${chalk.bold('URL')}: ${url}`)
  }

  if (stackTrace && lineNumber) {
    logAdditional(`Stack trace line number: ${lineNumber}`)
    logAdditional(`Stack trace description: ${stackTrace.description}`)
    logAdditional(`Stack call frames: ${stackTrace.callFrames.join(', ')}`)
  }

  if (args) {
    logAdditional(`Arguments:`)
    logAdditional('  ' + JSON.stringify(args, null, 2).split('\n').join(`\n${prefixSpacer}  `).trimRight())
  }
}

function logConsole(params) {
  const { type, args, timestamp } = params
  const level = type === 'error' ? 'error' : 'verbose'
  const color = severityColors[level]
  const icon = severityIcons[level]

  const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `
  const prefixSpacer = ' '.repeat(prefix.length)

  log(color(`${prefix}${chalk.bold(`console.${type}`)} called`))

  const logAdditional = (msg) => {
    log(color(`${prefixSpacer}${msg}`))
  }

  if (args) {
    logAdditional(`Arguments:`)
    logAdditional('  ' + JSON.stringify(args, null, 2).split('\n').join(`\n${prefixSpacer}  `).trimRight())
  }
}

function install(on) {
  on('before:browser:launch', browserLaunchHandler)
}

function browserLaunchHandler(browser = {}, args) {
  if (!['chrome', 'electron'].includes(browser.family)) {
    return log(`Warning: An unrecognized browser family was used, output will not be logged to console: ${browser.family}`)
  }

  const rdp = 40000 + Math.round(Math.random() * 25000)

  if (browser.family === 'chrome') {
    args.push(`--remote-debugging-port=${rdp}`)
  }

  if (browser.family === 'electron') {
    args.additionalArguments = [`--remote-debugging-port=${rdp}`]
  }

  const tryConnect = () => {
    new CDP({
      port: rdp
    })
    .then((cdp) => {
      log('Connected to Chrome Debugging Protocol')

      /** captures logs from the browser */
      cdp.Log.enable()
      cdp.Log.entryAdded(logEntry)

      /** captures logs from console.X calls */
      cdp.Runtime.enable()
      cdp.Runtime.consoleAPICalled(logConsole)

      cdp.on('disconnect', () => {
        log('cdp dced')
      })
    })
    .catch(() => {
      setTimeout(tryConnect, 100)
    })
  }

  tryConnect()

  return args
}

module.exports = {
  install,
  browserLaunchHandler
}
