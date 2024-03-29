'use strict'

// Set BABEL_ENV to use proper env config
process.env.BABEL_ENV = 'test'

// Enable use of ES6+ on required files
require('babel-register')({
  ignore: /node_modules/,
})

// Attach Chai APIs to global scope
const { expect, should, assert, use } = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
global.expect = expect
global.should = should
global.assert = assert
global.sinon = sinon
use(sinonChai)

// Require all JS files in `./specs` for Mocha to consume
require('require-dir')('./specs')
