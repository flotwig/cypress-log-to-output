const assert = require('assert')
const logToOutput = require('./log-to-output')

describe('log-to-output', function () {
  context('ensureRdpPort', function () {
    it('returns the existing port if there is one', function () {
      const args = [
        '--foo',
        '--bar',
        '--remote-debugging-port=12345',
        '--baz'
      ]

      const argsCopy = args.slice()

      const actual = logToOutput._ensureRdpPort(args)

      assert(actual === 12345)
      assert(args.length === argsCopy.length)
    })

    it('adds a new arg and returns new port if there is not one', function () {
      const args = [
        '--foo',
        '--bar',
        '--baz'
      ]

      const argsCopy = args.slice()

      const actual = logToOutput._ensureRdpPort(args)

      assert(args.length === argsCopy.length + 1)
      assert(args[args.length - 1] === `--remote-debugging-port=${actual}`)
    })
  })
})
