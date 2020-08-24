const CDP = require('chrome-remote-interface')
const chalk = require('chalk')

let eventFilter
let recordLogs

let messageLog = [];

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

function debugLog(msg) {
  // suppress with DEBUG=-cypress-log-to-output
  if (process.env.DEBUG && process.env.DEBUG.includes('-cypress-log-to-output')) {
    return
  }

  log(`[cypress-log-to-output] ${msg}`)
}

function log(msg) {
  console.log(msg)
}

function logEntry(params) {
  if (eventFilter && !eventFilter('browser', params.entry)) {
    return
  }

  const { level, source, text, timestamp, url, lineNumber, stackTrace, args } = params.entry
  const color = severityColors[level]
  const icon = severityIcons[level]

  const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `
  const prefixSpacer = ' '.repeat(prefix.length)

  let logMessage = `${prefix}${chalk.bold(level)} (${source}): ${text}`;
  log(color(logMessage));
  recordLogMessage(logMessage);

  const logAdditional = (msg) => {
    let additionalLogMessage = `${prefixSpacer}${msg}`;
    log(color(additionalLogMessage));
    recordLogMessage(additionalLogMessage);
  };

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
  if (eventFilter && !eventFilter('console', params)) {
    return
  }

  const { type, args, timestamp } = params
  const level = type === 'error' ? 'error' : 'verbose'
  const color = severityColors[level]
  const icon = severityIcons[level]

  const prefix = `[${new Date(timestamp).toISOString()}] ${icon} `
  const prefixSpacer = ' '.repeat(prefix.length)

  let logMessage = `${prefix}${chalk.bold(`console.${type}`)} called`;
  log(color(logMessage));
  recordLogMessage(logMessage);

  const logAdditional = (msg) => {
    let logMessage = `${prefixSpacer}${msg}`;
    log(color(logMessage));
    recordLogMessage(logMessage);
  };

  if (args) {
    logAdditional(`Arguments:`)
    logAdditional('  ' + JSON.stringify(args, null, 2).split('\n').join(`\n${prefixSpacer}  `).trimRight())
  }
}

function install(on, filter, options = {}) {
  eventFilter = filter;
  recordLogs = options.recordLogs;
  on('before:browser:launch', browserLaunchHandler)
}

function recordLogMessage(logMessage) {
  if (recordLogs) {
    messageLog.push(logMessage);
  }
}

function getLogs() {
  return messageLog;
}

function clearLogs() {
  messageLog = [];
}

function isChrome(browser) {
  return browser.family === 'chrome' || ['chrome', 'chromium', 'canary'].includes(browser.name) || (browser.family === 'chromium' && browser.name !== 'electron')
}

function ensureRdpPort(args) {
  const existing = args.find(arg => arg.slice(0, 23) === '--remote-debugging-port')

  if (existing) {
    return Number(existing.split('=')[1])
  }

  const port = 40000 + Math.round(Math.random() * 25000)

  args.push(`--remote-debugging-port=${port}`)

  return port
}

function browserLaunchHandler(browser = {}, launchOptions) {
  const args = launchOptions.args || launchOptions

  if (!isChrome(browser)) {
    return debugLog(`Warning: An unsupported browser family was used, output will not be logged to console: ${browser.family}`)
  }

  const rdp = ensureRdpPort(args)

  debugLog('Attempting to connect to Chrome Debugging Protocol')

  const tryConnect = () => {
    new CDP({
      port: rdp
    })
    .then((cdp) => {
      debugLog('Connected to Chrome Debugging Protocol')

      /** captures logs from the browser */
      cdp.Log.enable()
      cdp.Log.entryAdded(logEntry)

      /** captures logs from console.X calls */
      cdp.Runtime.enable()
      cdp.Runtime.consoleAPICalled(logConsole)

      cdp.on('disconnect', () => {
        debugLog('Chrome Debugging Protocol disconnected')
      })
    })
    .catch(() => {
      setTimeout(tryConnect, 100)
    })
  }

  tryConnect()

  return launchOptions
}

module.exports = {
  _ensureRdpPort: ensureRdpPort,
  install,
  browserLaunchHandler,
  getLogs,
  clearLogs
}
