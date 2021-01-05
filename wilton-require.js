/*
 * Copyright 2017, alex at staticlibs.net
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// see: https://github.com/requirejs/r.js/blob/27594a409b3d37427ec33bdc151ae8a9f67d6b2b/build/jslib/rhino.js

// global var for node libs
process = {};

(function() {
    "use strict";

    // load config, specified by launcher to wiltoncall_initialize
    var confJson = WILTON_wiltoncall("get_wiltoncall_config", "{}");
    var confObj = JSON.parse(confJson);
    if ("string" !== typeof(confObj.defaultScriptEngine) || 
            "object" !== typeof(confObj.environmentVariables) ||
            "object" !== typeof(confObj.requireJs) ||
            "string" !== typeof(confObj.requireJs.baseUrl)) {
        throw new Error("Invalid incomplete wiltoncall config: [" + confJson + "]");
    }
    // node compat
    process.env = confObj.environmentVariables;

    var modstack = [];
    // initialize requirejs
    WILTON_load(confObj.requireJs.baseUrl + "/wilton-requirejs/require.js");
    require.load = function(context, moduleName, url) {
        modstack.push(moduleName);
        try {
            WILTON_load(url);
        } catch(e) {
            throw new Error("Module load error: [" + moduleName + "]," +
                    " dependencies: [" + JSON.stringify(modstack, null, 4)  + "]\n" + e.message);
        }
        //Support anonymous modules.
        context.completeLoad(moduleName);
        modstack.pop();
    };
    requirejs.config(confObj.requireJs);

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

    var modname = "";
    var func = "";
    try {
        var cs = JSON.parse(callbackScriptJson);
        if ("string" !== typeof (cs.module) ||
                ("undefined" !== typeof (cs.func) && "string" !== typeof(cs.func)) ||
                ("undefined" !== typeof (cs.args) && !(cs.args instanceof Array))) {
            throw new Error("Invalid 'callbackScriptJson' specified");
        }
        modname = cs.module;
        var module = WILTON_requiresync(cs.module);
        if (null === module) {
            throw new Error("Module cannot be loaded, id: [" + cs.module +"]");
        }
        var args = "undefined" !== typeof (cs.args) ? cs.args : [];
        var res = null;
        if ("string" === typeof(cs.func) && "" !== cs.func) {
            func = cs.func;
            if ("function" !== typeof(module[cs.func])) {
                if ("main" === cs.func && "function" === typeof(module)) {
                    // target call, special case for startup script
                    res = module.apply(null, args);
                } else {
                    throw new Error("Invalid 'function' specified, name: [" + cs.func + "]");
                }
            } else {
                // target call
                res = module[cs.func].apply(module, args);
            }
        } else if ("function" === typeof(module)) {
            // target call
            res = module.apply(null, args);
        } else {
            throw new Error("Function name not specified, call desc: [" + callbackScriptJson + "]");
        }
        if (null === res) {
            return "";
        }
        if ("string" !== typeof (res)) {
            return JSON.stringify(res);
        }
        return res;
    } catch (e) {
        var stack = e.stack;
        var msg = e.message;
        if (("undefined" === typeof(msg) || null === msg) &&
                ("object" === typeof(stack) && "function" === typeof(stack.indexOf) && -1 !== stack.indexOf(msg))) {
            throw new Error("module: [" + modname + "], function: [" + func + "]\n" + stack);
        } else if ("undefined" !== typeof(msg) && "undefined" !== typeof(stack)) {
            throw new Error("module: [" + modname + "], function: [" + func + "]\nError: " + msg + "\n" + stack);
        } else {
            throw new Error("module: [" + modname + "], function: [" + func + "]\nError: " + String(e));
        }
    }
}

// misc common globals
console = {log: print, error: print, info: print};
process.stdout = {
    write: print,
    on: function() {},
    once: function() {},
    emit: function() {}
};
process.nextTick = require.nextTick;
amd = true;

// sync calls for bluebird
setTimeout = function(fun) { fun();};
setInterval = setTimeout;
setImmediate = function(fun, arg) { fun(arg);};

// switch canEvaluate to false for bluebird
navigator = null;

// global object for es6-shim
global = {
    console: console,
    isFinite: isFinite,
    parseFloat: parseFloat,
    parseInt: parseInt,
    setImmediate: setImmediate,
    setTimeout: setTimeout,
    Number: "undefined" !== typeof(Number) ? Number : undefined,
    RegExp: "undefined" !== typeof(RegExp) ? RegExp : undefined
};
if ("undefined" !== typeof(Reflect)) {
    global.Reflect = Reflect;
}
if ("undefined" !== typeof(Symbol)) {
    global.Symbol = Symbol;
}
if ("undefined" !== typeof(Set)) {
    global.Set = Set;
}
if ("undefined" !== typeof(Map)) {
    global.Map = Map;
}

// use compat buffers
WILTON_requiresync("base64-js");
WILTON_requiresync("ieee754");
Buffer = WILTON_requiresync("buffer").Buffer;
global.Buffer = Buffer;
// htmlparser2 requirement
WILTON_requiresync("events");

// disable native promises if any
Promise = undefined;
