/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
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

    // initialize requirejs
    WILTON_load(confObj.requireJs.baseUrl + "/wilton-requirejs/require.js");
    require.load = function(context, moduleName, url) {
        WILTON_load(url);
        //Support anonymous modules.
        context.completeLoad(moduleName);
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
        var res = null;
        if ("string" === typeof(cs.func) && "" !== cs.func) {
            func = cs.func;
            var args = "undefined" !== typeof (cs.args) ? cs.args : [];
            if ("function" !== typeof(module[cs.func])) {
                throw new Error("Invalid 'function' specified, name: [" + cs.func + "]");
            }
            // target call
            var res = module[cs.func].apply(module, args);
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
        if ("undefined" === typeof(msg) || null === msg || -1 !== stack.indexOf(msg)) {
            throw new Error("module: [" + modname + "], function: [" + func + "]\n" + stack);
        } else {
            throw new Error("module: [" + modname + "], function: [" + func + "]\nError: " + msg + "\n" + stack);
        }
    }
}

// misc common globals
console = {log: print, error: print, info: print};
global = {console: console};
process.stdout = {
    write: print,
    on: function() {},
    once: function() {},
    emit: function() {}
};
amd = true;

// sync calls for bluebird
setTimeout = function(fun) { fun();};
setInterval = setTimeout;
setImmediate = function(fun, arg) { fun(arg);};

// switch canEvaluate to false for bluebird
navigator = null;

// use compat buffers
Buffer = WILTON_requiresync("buffer").Buffer;

// disable native promises is any
Promise = undefined;
