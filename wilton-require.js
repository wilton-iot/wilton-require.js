/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// see: https://github.com/requirejs/r.js/blob/27594a409b3d37427ec33bdc151ae8a9f67d6b2b/build/jslib/rhino.js

WILTON_load(WILTON_REQUIREJS_DIRECTORY + "require.js");

(function() {
    "use strict";
    
    require.load = function(context, moduleName, url) {

        WILTON_load(url);

        //Support anonymous modules.
        context.completeLoad(moduleName);
    };
    
    var cfg = JSON.parse(WILTON_REQUIREJS_CONFIG);
    requirejs.config(cfg);

}());

function WILTON_requiresync(modname) {
    "use strict";
    
    // string ".js" extension
    var jsext = ".js";
    if (modname.indexOf(jsext, modname.length - jsext.length) !== -1) {
        modname = modname.substr(0, modname.length - 3);
    }

    // require is always sync in wilton environment
    var module = null;
    require([modname], function(mod) {
        module = mod;
    });
    return module;
}

function WILTON_run(callbackScriptJson) {
    "use strict";
    
    try {
        var cs = JSON.parse(callbackScriptJson);
        if ("string" !== typeof (cs.module) || "string" !== typeof (cs.func) ||
                "undefined" === typeof (cs.args) || !(cs.args instanceof Array)) {
            throw new Error("Invalid 'callbackScriptJson' specified");
        }
        var module = WILTON_requiresync(cs.module);
        var res = null;
        if ("" !== cs.func) {
            // target call
            var res = module[cs.func].apply(module, cs.args);
        }
        if (null === res) {
            return "";
        }
        if ("string" !== typeof (res)) {
            return JSON.stringify(res);
        }
        return res;
    } catch (e) {
        if ("undefined" !== typeof (WILTON_DUKTAPE)) {
            throw new Error("JS call data: [" + callbackScriptJson + "]" + "\n" + e.stack);
        } else {
            throw new Error(e.message + "\nJS call data: [" + callbackScriptJson + "]" + "\n" + e.stack);
        }
    }
}

// duktape buffers
delete Buffer;
delete ArrayBuffer;
delete DataView;
delete Int8Array;
delete Uint8Array;
delete Uint8ClampedArray;
delete Int16Array;
delete Uint16Array;
delete Int32Array;
delete Uint32Array;
delete Float32Array;
delete Float64Array;

// misc required globals

console = { log: print };
global = { console: console };
process = {env: {}, stdout: {write: print }};
amd = true;

// compat buffers
Buffer = WILTON_requiresync("buffer").Buffer;

// sync call for bluebird
setTimeout = function(fun) { fun(); };
setInterval = setTimeout;
setImmediate = function(fun, arg) { fun(arg); };

assert = WILTON_requiresync('assert');
ok = assert.ok;
equal = assert.equal;
strictEqual = assert.strictEqual;
deepEqual = assert.deepEqual;
notEqual = assert.notEqual;
throws = assert.throws;
notStrictEqual = assert.notStrictEqual;

function test(label, func, func2) {
    "use strict";
    
    if ("function" === typeof(label)) {
        func = label;
        label = "unnamed";
    }
    
    if ("function" !== typeof (func) && "function" === typeof(func2)) {
        func = func2;
    }
    
    print("test: " + label);
    var assert = WILTON_requiresync("assert");
    assert.end = function() {};
    assert.plan = function() {};
    assert.done = function() {};
    assert.same = assert.deepEqual;
    assert.notOk = function(expr, msg) {
        return assert.ok(!expr, msg);
    };
    assert.test = test;
    assert.pass = function() {};
    assert.equals = assert.equal;
    func(assert);
}

define("tape", function() {
    return test;
});

asyncTest = test;

describe = test;

it = test;

after = test;

function suite(label) {
    "use strict";
    print("test: " + label);
}

QUnit = {
    module: function(label) {
        "use strict";
        print("test: " + label);
    },
    
    config: {}
};

function expect(actual) {
    var res = {
        to: {
            equal: function(expected) {
                assert.equal(actual, expected);
            },
            eql: function(expected) {
                assert.deepEqual(actual, expected);
            },
            have: {
                length: function(expectedlen) {
                    assert.equal(actual.length, expectedlen);
                }
            },
            not: {
                be: {
                    ok: function() {
                        assert.ok(!actual);
                    },
                    empty: function() {
                        assert.ok(actual.length > 0);
                    }
                }
            },
            be: function(expected) {
                assert.strictEqual(actual, expected);
            }
        }
    };
    
    res.to.be.ok = function() {
        assert.ok(actual);
    };
    
    res.to.be.a = function(ctor) {
        if ("string" === typeof(ctor)) {
            assert.ok(ctor === typeof(actual));
        } else {
            assert.ok(actual instanceof ctor);
        }
    };

    res.to.be.empty = function() {
        assert.equal(actual.length, 0);
    };
    
    return res;
}


