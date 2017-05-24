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

function WILTON_run(callbackScriptJson) {
    try {
        var cs = JSON.parse(callbackScriptJson);
        if ("string" !== typeof (cs.module) || "string" !== typeof (cs.func) ||
                "undefined" === typeof (cs.args) || !(cs.args instanceof Array)) {
            throw new Error("Invalid 'callbackScriptJson' specified");
        }
        var module;
        // require is always sync in wilton environment
        require([cs.module], function(mod) {
            module = mod;
        });
        // target call
        var res = module[cs.func].apply(module, cs.args);
        if ("undefined" === typeof (res) || null === res) {
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




