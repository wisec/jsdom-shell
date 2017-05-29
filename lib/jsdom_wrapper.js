'use strict';

const fs = require("fs");
const vm = require("vm");
const jsdom = require("jsdom");



//////////////////////////////////////////////////////////////////////////////////////////////////////////
function deepCopy(obj) {
  const newObj = {};
  let value;
  for (const key in obj) {
    value = obj[key];
    if (typeof value === 'object' && value !== null) {
      value = deepCopy(value);
    }
    newObj[key] = value;
  }
  return newObj;
}

var installCommonGlobals = (global, globals) => {
  // Forward some APIs
  global.Buffer = Buffer;

  // `global.process` is mutated by FakeTimers. Make a copy of the
  // object for the jsdom environment to prevent memory leaks.
  // Overwrite toString to make it look like the real process object
  let toStringOverwrite;
  if (Symbol && Symbol.toStringTag) {
    // $FlowFixMe
    toStringOverwrite = {
      [Symbol.toStringTag]: 'process'
    };

  }
  global.process = Object.assign({}, process, toStringOverwrite);
  global.process.setMaxListeners = process.setMaxListeners.bind(process);
  global.process.getMaxListeners = process.getMaxListeners.bind(process);
  global.process.emit = process.emit.bind(process);
  global.process.addListener = process.addListener.bind(process);
  global.process.on = process.on.bind(process);
  global.process.once = process.once.bind(process);
  global.process.removeListener = process.removeListener.bind(process);
  global.process.removeAllListeners = process.removeAllListeners.bind(process);
  global.process.listeners = process.listeners.bind(process);
  global.process.listenerCount = process.listenerCount.bind(process);

  global.setImmediate = setImmediate;
  global.clearImmediate = clearImmediate;

  Object.assign(global, deepCopy(globals));
};

class JSDOMEnvironment {

  constructor(config) {
    this.document = require('jsdom').jsdom( /* markup */ undefined, {
      url: config.url
    });

    const global = this.global = this.document.defaultView;
    installCommonGlobals(global, config.globals);
  }
  runScript(script) {
    if (this.global) {
      return require('jsdom').evalVMScript(this.global, script);
    }
    return null;
  }
}
;

var wrapper;
module.exports.launch = function(config) {
  return wrapper = new JSDOMEnvironment(config);
}

module.exports.eval = function(script, name) {
  var myScript = new vm.Script(script, {
    displayErrors: true,
    filename: name || "__CLI__"
  });
  return wrapper.runScript(myScript);

};
