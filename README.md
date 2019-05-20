cypress-log-to-output
===

This is a [Cypress](https://github.com/cypress-io/cypress) plugin that sends all console logs that occur in the browser to stdout in the terminal. This means that you can see any kind of `console.log`, `console.info` or `console.error` that occurs in the browser, even if your tests are running in the terminal.

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

You'll now see all browser console logs in your terminal output. 

```shell
cypress run --browser=chrome
```

<img width="1526" alt="Screen Shot 2019-05-20 at 3 01 12 PM" src="https://user-images.githubusercontent.com/1271364/58007393-35928a00-7b10-11e9-9822-b4c40e63d33f.png">

Works in Chrome, Chromium, or Canary browsers during `cypress run` and `cypress open`.

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
