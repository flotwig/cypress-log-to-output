cypress-log-to-output
===

This is a [Cypress](https://github.com/cypress-io/cypress) plugin that sends all logs that occur in the browser to stdout in the terminal. This means that you can see any kind of error that occurs in the browser, even if your test is running headlessly.

# Installation

```
npm install --save-dev cypress-log-to-output
```

# Usage

In your `cypress/plugins/index.js`, add this to your `module.exports`:

```js
module.exports = (on, config) => {
  /** the rest of your plugins... **/
  require('cypress-log-to-output').install(on)
}
```

You'll now see all browser logs in your console output.

Works in Chrome browser in run and in open mode.

**Electron is not currently supported.** I can't find a way to attach the Chrome Debugging Protocol to the Electron browser spawned by Cypress.

## Filtering Events

If you want to filter events, you can use a custom filtering callback:

```js
module.exports = (on, config) => {
  /** the rest of your plugins... **/
  require('cypress-log-to-output').install(on, (type, event) => {
    // return true or false from this plugin to control if the event is logged
    // `type` is either `console` or `browser`
    // if `type` is `browser`, `event` is an object of the type `LogEntry`:
    //  https://chromedevtools.github.io/devtools-protocol/tot/Log#type-LogEntry
    // if `type` is `console`, `event` is an object of the type passed to `Runtime.consoleAPICalled`:
    //  https://chromedevtools.github.io/devtools-protocol/tot/Runtime#event-consoleAPICalled

    // for example, to only show error events:

    if (event.level === 'error' || event.type === 'error') {
      return true
    }

    return false
  })
}
```
