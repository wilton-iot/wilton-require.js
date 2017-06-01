/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

// see: https://github.com/requirejs/r.js/blob/27594a409b3d37427ec33bdc151ae8a9f67d6b2b/build/jslib/rhino.js

WILTON_load(WILTON_REQUIREJS_DIRECTORY + "require.js");

// path to modules dir as an anchor for fs operations
WILTON_MODULES_DIRECTORY = JSON.parse(WILTON_REQUIREJS_CONFIG).baseUrl;

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

function WILTON_requiresync_lenient(modname) {
    "use strict";
    try {
        return WILTON_requiresync(modname);
    } catch (e) {
        return {};
    }
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

// misc common globals
console = {log: print};
global = {console: console};
process = {
    env: {},
    stdout: {
        write: print,
        on: function() {},
        once: function() {},
        emit: function() {}
    }
};
amd = true;

// sync calls for bluebird
setTimeout = function(fun) { fun();};
setInterval = setTimeout;
setImmediate = function(fun, arg) { fun(arg);};

// disable native arrays with
// inconsistent cross-engine support
ArrayBuffer = undefined;
DataView = undefined;
Int8Array = undefined;
Uint8Array = undefined;
Uint8ClampedArray = undefined;
Int16Array = undefined;
Uint16Array = undefined;
Int32Array = undefined;
Uint32Array = undefined;
Float32Array = undefined;
Float64Array = undefined;

// use compat buffers, may be not available in current modules set
Buffer = WILTON_requiresync_lenient("buffer").Buffer;

// Nashorn Array.splice fix
// https://bugs.openjdk.java.net/browse/JDK-8068972
WILTON_Array_prototype_splice_orig = Array.prototype.splice;
Array.prototype.splice = function() {
    if (1 === arguments.length) {
        var args = Array.prototype.slice.call(arguments);
        args.push(this.length - args[0]);
        return WILTON_Array_prototype_splice_orig.apply(this, args);
    }
    return WILTON_Array_prototype_splice_orig.apply(this, arguments);
};

// Rhino Object.keys fix
// "new String(...)" is not iterable with "for key in .." in Rhino
WILTON_Object_keys_orig = Object.keys;
Object.keys = function(obj) {
    if ("object" === typeof (obj) && obj instanceof String) {
        var res = WILTON_Object_keys_orig(obj);
        if (res.length !== obj.length) {
            res = [];
            for (var i = 0; i < obj.length; i++) {
                res.push(String(i));
            }
        }
        return res;
    }
    return WILTON_Object_keys_orig(obj);
};
